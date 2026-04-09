import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

/**
 * DELETE /api/contractor/demo-leads
 * Removes all demo leads for the authenticated contractor's business.
 */
export async function DELETE(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const supabase = getSupabaseAdmin();

  const { error, count } = await supabase
    .from("leads")
    .delete({ count: "exact" })
    .eq("business_id", businessId)
    .eq("is_demo", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: count ?? 0 });
}
