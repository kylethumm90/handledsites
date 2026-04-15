import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";
import {
  regenerateAiSummary,
  applyExtractedFields,
  formatFilledKeys,
} from "@/lib/ai-summary";

export async function POST(
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
    .select("id")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = await request.json();

  if (!body.summary?.trim()) {
    return NextResponse.json({ error: "Note text is required" }, { status: 400 });
  }

  const { data: entry, error } = await supabase
    .from("activity_log")
    .insert({
      business_id: businessId,
      lead_id: params.id,
      type: "user_note",
      summary: body.summary.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Regenerate the AI summary so it picks up this note. Best-effort —
  // the helper returns nulls on failure (no API key, model error, etc.)
  // and we just omit the fields from the response. The note save itself
  // never fails because of a summary regen problem.
  //
  // The same call also returns any structured fields the model pulled
  // from the free-text note (service name, estimated value, tags). We
  // apply them fill-empty-only and never overwrite contractor-entered
  // data. If anything landed, we log a second "AI filled: ..." activity
  // row so the contractor can see what changed in the timeline.
  const { summary: ai_summary, extracted } = await regenerateAiSummary({
    supabase,
    leadId: params.id,
    businessId,
  });

  const applied = await applyExtractedFields({
    supabase,
    leadId: params.id,
    businessId,
    extracted,
  });

  if (applied && applied.filledKeys.length > 0) {
    await supabase.from("activity_log").insert({
      business_id: businessId,
      lead_id: params.id,
      type: "ai_extract",
      summary: formatFilledKeys(applied.filledKeys),
      agent: "ai",
    });
  }

  return NextResponse.json({
    ...entry,
    ai_summary,
    lead_patch: applied?.patch ?? null,
  });
}
