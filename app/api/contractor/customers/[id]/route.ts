import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

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

  // Verify lead belongs to this business
  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, status, business_id, employee_id, appointment_at, first_response_at"
    )
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
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

  return NextResponse.json({ success: true });
}
