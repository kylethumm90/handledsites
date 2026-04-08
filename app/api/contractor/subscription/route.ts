import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

export async function GET(request: NextRequest) {
  const siteId = await validateSessionFromRequest(request);
  if (!siteId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", siteId)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, stripe_customer_id, current_period_end")
    .eq("business_id", site.business_id)
    .single();

  if (!sub) {
    return NextResponse.json({ plan: "free", status: "active", stripe_customer_id: null, current_period_end: null });
  }

  return NextResponse.json(sub);
}
