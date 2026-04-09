import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

export async function GET(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const supabase = getSupabaseAdmin();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, stripe_customer_id, current_period_end")
    .eq("business_id", businessId)
    .single();

  if (!sub) {
    return NextResponse.json({ plan: "free", status: "active", stripe_customer_id: null, current_period_end: null });
  }

  return NextResponse.json(sub);
}
