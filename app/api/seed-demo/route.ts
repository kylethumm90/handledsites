import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateSeedLeads } from "@/lib/seed-leads";

/**
 * POST /api/seed-demo
 * Body: { business_id: string }
 *
 * Called after signup to insert 16 demo leads for a new business.
 * Idempotent — skips if demo leads already exist.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const businessId = body.business_id;

  if (!businessId || typeof businessId !== "string") {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Verify the business exists
  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .single();

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Idempotency check — skip if demo leads already exist
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("is_demo", true);

  if (count && count > 0) {
    return NextResponse.json({ seeded: 0, message: "Demo leads already exist" });
  }

  const rows = generateSeedLeads(businessId);

  const { error } = await supabase.from("leads").insert(rows);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ seeded: rows.length });
}
