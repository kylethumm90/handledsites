import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";
import { generateUniqueReferralCode } from "@/lib/referral-code";

export async function POST(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { customer_id } = body;

  if (!customer_id) {
    return NextResponse.json({ error: "customer_id required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Verify the customer belongs to this business
  const { data: customer } = await supabase
    .from("leads")
    .select("id, business_id")
    .eq("id", customer_id)
    .eq("business_id", auth.businessId)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Check if already a referral partner
  const { data: existing } = await supabase
    .from("referral_partners")
    .select("id, referral_code")
    .eq("customer_id", customer_id)
    .single();

  if (existing) {
    return NextResponse.json({ referral_code: existing.referral_code });
  }

  const code = await generateUniqueReferralCode(supabase);

  const { data, error } = await supabase
    .from("referral_partners")
    .insert({
      business_id: auth.businessId,
      customer_id,
      referral_code: code,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ referral_code: data.referral_code });
}
