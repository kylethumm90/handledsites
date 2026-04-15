import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";
import {
  regenerateAiSummary,
  applyExtractedFields,
  formatFilledKeys,
} from "@/lib/ai-summary";
import type { Lead } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const supabase = getSupabaseAdmin();

  // Verify lead belongs to this business.
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select(
      "id, status, business_id, employee_id, appointment_at, first_response_at, closed_at, referral_code, job_completed_at"
    )
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (!lead) {
    // Self-diagnosis: does the lead exist at all? If yes, it belongs to a
    // different business than the session — almost always a stale page
    // (logged in as business A, clicked into a row that was fetched by a
    // prior session). Tell the client to refresh instead of silently 404'ing.
    const { data: anyLead, error: anyLeadErr } = await supabase
      .from("leads")
      .select("id, business_id")
      .eq("id", params.id)
      .maybeSingle();

    console.warn("[customers PUT] 404 diagnostic", {
      leadId: params.id,
      sessionBusiness: businessId,
      firstQueryErr: leadErr?.message ?? null,
      anyLeadFound: !!anyLead,
      anyLeadBusiness: anyLead?.business_id ?? null,
      anyLeadErr: anyLeadErr?.message ?? null,
    });

    if (anyLead && anyLead.business_id !== businessId) {
      return NextResponse.json(
        {
          error:
            "This lead belongs to a different business. Refresh the page and try again.",
          code: "business_mismatch",
          debug: {
            leadBusiness: anyLead.business_id,
            sessionBusiness: businessId,
          },
        },
        { status: 404 },
      );
    }
    if (anyLead && anyLead.business_id === businessId) {
      // Should not happen — first query already filtered on this pair.
      return NextResponse.json(
        {
          error: "Lead found but first query missed — possible replica lag.",
          code: "ghost_lead",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      {
        error: "Lead not found",
        code: "not_in_table",
        debug: { leadId: params.id, sessionBusiness: businessId },
      },
      { status: 404 },
    );
  }

  const body = await request.json();

  const ALLOWED = new Set([
    "status",
    "service_needed",
    "notes",
    "tags",
    "employee_id",
    "appointment_at",
    "estimated_value_cents",
  ]);
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED.has(key)) updates[key] = value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  // Speed-to-lead: the very first time this lead moves out of "lead" (into
  // contacted / booked / customer), stamp first_response_at = now(). The
  // generated column `speed_to_lead_seconds` computes off of it atomically.
  // We never overwrite an existing value — the first contact is the one
  // that counts, even if the lead is later moved back to "lead".
  if (
    typeof updates.status === "string" &&
    updates.status !== "lead" &&
    lead.status === "lead" &&
    !lead.first_response_at
  ) {
    updates.first_response_at = new Date().toISOString();
  }

  // Graduation to Reputation: stamp closed_at the first time a lead
  // transitions to "customer". The Pipeline "Done" tile filters on this
  // (last 30 days) and the Reputation Growth view reads the same column.
  // Never overwritten on subsequent edits. Also stamp job_completed_at so
  // the Post-Sale view has a clean "job completed at" timestamp for card
  // info lines and the reputation funnel counts.
  const becomingCustomer =
    typeof updates.status === "string" &&
    updates.status === "customer" &&
    lead.status !== "customer" &&
    !lead.closed_at;
  if (becomingCustomer) {
    const now = new Date().toISOString();
    updates.closed_at = now;
    if (!lead.job_completed_at) {
      updates.job_completed_at = now;
    }
  }

  const { error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Log status change. When moving to "booked" with an appointment_at in the
  // same update, inline the formatted date/time so The Story reads
  // "Appointment booked for Apr 18 at 2:30 PM" rather than a bare status flip.
  const STATUS_LABELS: Record<string, string> = {
    lead: "New",
    contacted: "Contacted",
    booked: "Appt Set",
    customer: "Sold",
  };
  if (updates.status && updates.status !== lead.status) {
    const label =
      STATUS_LABELS[updates.status as string] ?? (updates.status as string);
    let summary = `Status changed to ${label}`;
    if (updates.status === "booked" && typeof updates.appointment_at === "string") {
      const d = new Date(updates.appointment_at);
      if (!isNaN(d.getTime())) {
        const when = d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        summary = `Appointment booked for ${when}`;
      }
    }
    await supabase.from("activity_log").insert({
      business_id: businessId,
      lead_id: params.id,
      type: "status_change",
      summary,
    });
  } else if (
    // Standalone reschedule: appointment_at changed but status stayed "booked".
    typeof updates.appointment_at === "string" &&
    updates.appointment_at !== lead.appointment_at
  ) {
    const d = new Date(updates.appointment_at);
    if (!isNaN(d.getTime())) {
      const when = d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      await supabase.from("activity_log").insert({
        business_id: businessId,
        lead_id: params.id,
        type: "status_change",
        summary: `Appointment rescheduled to ${when}`,
      });
    }
  }

  // Log employee (re)assignment. "employee_id" in updates can be a string or
  // null (unassign); we only log when the value actually changed.
  if (
    Object.prototype.hasOwnProperty.call(updates, "employee_id") &&
    updates.employee_id !== lead.employee_id
  ) {
    const newEmpId = updates.employee_id as string | null;
    let summary = "Unassigned";
    if (newEmpId) {
      const { data: emp } = await supabase
        .from("employees")
        .select("name")
        .eq("id", newEmpId)
        .eq("business_id", businessId)
        .single();
      const firstName = emp?.name?.split(" ")[0] || null;
      summary = firstName ? `Assigned to ${firstName}` : "Assigned to rep";
    }
    await supabase.from("activity_log").insert({
      business_id: businessId,
      lead_id: params.id,
      type: "employee_assigned",
      summary,
    });
  }

  // Referral payout: when a lead that came in via a referral code closes,
  // resolve the referrer (referral_partners.referral_code -> customer_id)
  // and create a pending referral_rewards row at the business's configured
  // reward amount. The UNIQUE(referred_lead_id) constraint makes this
  // idempotent — re-flipping status to customer does nothing.
  if (becomingCustomer && lead.referral_code) {
    const { data: business } = await supabase
      .from("businesses")
      .select("referral_enabled, referral_reward_amount_cents, referral_reward_type")
      .eq("id", businessId)
      .single();
    if (
      business?.referral_enabled &&
      business.referral_reward_amount_cents &&
      business.referral_reward_type
    ) {
      const { data: partner } = await supabase
        .from("referral_partners")
        .select("customer_id")
        .eq("business_id", businessId)
        .eq("referral_code", lead.referral_code)
        .maybeSingle();
      if (partner?.customer_id) {
        await supabase.from("referral_rewards").insert({
          business_id: businessId,
          referrer_lead_id: partner.customer_id,
          referred_lead_id: params.id,
          amount_cents: business.referral_reward_amount_cents,
          reward_type: business.referral_reward_type,
          status: "pending",
        });
      }
    }
  }

  // Status changes meaningfully shift "what should the contractor do next",
  // so regenerate the AI one-liner to match the new stage. Cheap edits like
  // notes/tags-only updates don't — skip the model call in those cases to
  // keep the endpoint fast and the Anthropic bill honest.
  //
  // The same regen call also returns any structured fields the model pulled
  // from free-text notes / activity that we hadn't captured yet (service
  // name, estimated value, tags). We apply them fill-empty-only so the
  // contractor never gets their typed values overwritten.
  let ai_summary: string | null = null;
  let lead_patch: Partial<Lead> | null = null;
  if (updates.status && updates.status !== lead.status) {
    const result = await regenerateAiSummary({
      supabase,
      leadId: params.id,
      businessId,
    });
    ai_summary = result.summary;

    const applied = await applyExtractedFields({
      supabase,
      leadId: params.id,
      businessId,
      extracted: result.extracted,
    });
    if (applied && applied.filledKeys.length > 0) {
      lead_patch = applied.patch;
      await supabase.from("activity_log").insert({
        business_id: businessId,
        lead_id: params.id,
        type: "ai_extract",
        summary: formatFilledKeys(applied.filledKeys),
        agent: "ai",
      });
    }
  }

  return NextResponse.json({ success: true, ai_summary, lead_patch });
}
