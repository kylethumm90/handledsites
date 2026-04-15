import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";
import { regenerateAiSummary } from "@/lib/ai-summary";

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
  // the helper returns null on failure (no API key, model error, etc.)
  // and we just omit the ai_summary field from the response. The note
  // save itself never fails because of a summary regen problem.
  const ai_summary = await regenerateAiSummary({
    supabase,
    leadId: params.id,
    businessId,
  });

  return NextResponse.json({ ...entry, ai_summary });
}
