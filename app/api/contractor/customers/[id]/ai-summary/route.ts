import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";
import { regenerateAiSummary } from "@/lib/ai-summary";

/**
 * POST /api/contractor/customers/[id]/ai-summary
 *
 * Regenerates and caches the AI one-liner for a lead. The shared
 * regenerateAiSummary helper handles facts gathering, stage-aware
 * prompting, Claude call, and the leads.ai_summary write.
 *
 * Client calls this lazily for leads where ai_summary is null — a
 * refresh path on top of the automatic regeneration that already
 * happens after notes and status changes.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const supabase = getSupabaseAdmin();

  const summary = await regenerateAiSummary({
    supabase,
    leadId: params.id,
    businessId,
  });

  if (!summary) {
    return NextResponse.json(
      { error: "Summary generation failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ id: params.id, ai_summary: summary });
}
