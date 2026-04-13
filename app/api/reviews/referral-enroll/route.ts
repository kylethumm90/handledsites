import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateUniqueReferralCode } from "@/lib/referral-code";

/**
 * Public endpoint: enroll a happy reviewer as a referral partner.
 *
 * Called from the review funnel thank-you page (/r/[slug]) after the customer
 * leaves a positive review and taps the "Count me in" CTA.
 *
 * Two entry paths:
 *   1. lead_id supplied → reviewer came from a link that already identified
 *      the customer (e.g. contractor sent via the "Send Review Request"
 *      button). Enroll the existing lead directly; idempotent on re-tap.
 *   2. name + phone supplied → fallback flow for direct/QR visits. Create a
 *      new lead row first, then enroll.
 *
 * Returns the unique referral URL for the customer to copy / share from
 * their own device.
 *
 * No auth — requires a valid site_id keyed to an active review_funnel site.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const siteId = typeof body.site_id === "string" ? body.site_id.trim() : "";
  const leadIdInput = typeof body.lead_id === "string" ? body.lead_id.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!siteId) {
    return NextResponse.json({ error: "site_id is required" }, { status: 400 });
  }

  const hasLeadId = leadIdInput.length > 0;
  const hasNamePhone = name.length > 0 && phone.length > 0;
  if (!hasLeadId && !hasNamePhone) {
    return NextResponse.json(
      { error: "lead_id or (name + phone) is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Resolve the site + business
  const { data: site } = await supabase
    .from("sites")
    .select("id, business_id, type, is_active")
    .eq("id", siteId)
    .eq("type", "review_funnel")
    .eq("is_active", true)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, referral_enabled")
    .eq("id", site.business_id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  if (business.referral_enabled === false) {
    return NextResponse.json({ error: "Referrals disabled" }, { status: 403 });
  }

  // Resolve the customer_id to use for referral_partners
  let customerId: string;

  if (hasLeadId) {
    // Verify the lead belongs to this business (cross-tenant safety)
    const { data: lead } = await supabase
      .from("leads")
      .select("id, business_id")
      .eq("id", leadIdInput)
      .eq("business_id", business.id)
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Idempotent: if this lead is already a referral partner, return the
    // existing code so re-tapping "Count me in" doesn't create duplicates.
    const { data: existingPartner } = await supabase
      .from("referral_partners")
      .select("referral_code")
      .eq("customer_id", lead.id)
      .single();

    if (existingPartner) {
      const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "";
      const referralUrl = base
        ? `${base}/refer/${existingPartner.referral_code}`
        : `/refer/${existingPartner.referral_code}`;
      return NextResponse.json({
        referral_code: existingPartner.referral_code,
        referral_url: referralUrl,
      });
    }

    customerId = lead.id;
  } else {
    // Fallback: no lead_id → create a new lead from the on-page form
    const { data: newLead, error: leadError } = await supabase
      .from("leads")
      .insert({
        business_id: business.id,
        site_id: site.id,
        source: "review_referral",
        name,
        phone,
        status: "customer",
        is_demo: false,
      })
      .select("id")
      .single();

    if (leadError || !newLead) {
      return NextResponse.json(
        { error: leadError?.message || "Failed to create lead" },
        { status: 500 }
      );
    }

    customerId = newLead.id;
  }

  // Generate a unique code and insert the referral partner row
  const code = await generateUniqueReferralCode(supabase);

  const { data: partner, error: partnerError } = await supabase
    .from("referral_partners")
    .insert({
      business_id: business.id,
      customer_id: customerId,
      referral_code: code,
    })
    .select("referral_code")
    .single();

  if (partnerError || !partner) {
    return NextResponse.json(
      { error: partnerError?.message || "Failed to create referral partner" },
      { status: 500 }
    );
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "";
  const referralUrl = base
    ? `${base}/refer/${partner.referral_code}`
    : `/refer/${partner.referral_code}`;

  return NextResponse.json({
    referral_code: partner.referral_code,
    referral_url: referralUrl,
  });
}
