import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

/**
 * GET /api/contractor/customers/[id]/activities
 *
 * Returns the activity_log entries for a single lead, scoped to the
 * authenticated contractor's business. Used by the Pipeline v2 contact
 * detail modal — it fetches on demand when a contact card is tapped so
 * the initial `/contractor/customers` payload stays small.
 *
 * Order: oldest first (ascending created_at), so the "What Happened"
 * timeline reads top-to-bottom as a chronological story.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const supabase = getSupabaseAdmin();

  // Verify the lead belongs to this business before returning any rows.
  const { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const { data: activities, error } = await supabase
    .from("activity_log")
    .select("id, created_at, business_id, lead_id, type, summary, agent")
    .eq("business_id", businessId)
    .eq("lead_id", params.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ activities: activities ?? [] });
}
