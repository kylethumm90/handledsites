import { redirect, notFound } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Lead, ActivityLogEntry } from "@/lib/supabase";
import CustomerDetailClient from "@/components/CustomerDetailClient";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  const { businessId } = auth;
  const supabase = getSupabaseAdmin();

  // Fetch lead, verify ownership
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (!lead) notFound();

  // Fetch activity log and pipeline counts in parallel
  const [{ data: timeline }, leadCount, contactedCount, bookedCount, customerCount] = await Promise.all([
    supabase
      .from("activity_log")
      .select("*")
      .eq("lead_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "lead")
      .eq("is_demo", false)
      .then(({ count }) => count ?? 0),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "contacted")
      .eq("is_demo", false)
      .then(({ count }) => count ?? 0),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "booked")
      .eq("is_demo", false)
      .then(({ count }) => count ?? 0),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "customer")
      .eq("is_demo", false)
      .then(({ count }) => count ?? 0),
  ]);

  // Check if customer is already a referral partner
  const { data: referralPartner } = await supabase
    .from("referral_partners")
    .select("referral_code")
    .eq("customer_id", params.id)
    .single();

  // Look up who referred this lead (if referral source)
  let referrerName: string | null = null;
  let referrerId: string | null = null;
  if (lead.referral_code) {
    const { data: rp } = await supabase
      .from("referral_partners")
      .select("customer_id")
      .eq("referral_code", lead.referral_code)
      .single();
    if (rp) {
      const { data: referrer } = await supabase
        .from("leads")
        .select("id, name")
        .eq("id", rp.customer_id)
        .single();
      referrerName = referrer?.name || null;
      referrerId = referrer?.id || null;
    }
  }

  // Fetch employees for assignment dropdown
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name");

  // Fetch review funnel slug
  const { data: reviewSite } = await supabase
    .from("sites")
    .select("slug")
    .eq("business_id", businessId)
    .eq("type", "review_funnel")
    .eq("is_active", true)
    .limit(1)
    .single();

  return (
    <CustomerDetailClient
      lead={lead as Lead}
      timeline={(timeline || []) as ActivityLogEntry[]}
      counts={{ lead: leadCount, contacted: contactedCount, booked: bookedCount, customer: customerCount }}
      existingReferralCode={referralPartner?.referral_code || null}
      referrerName={referrerName}
      referrerId={referrerId}
      employees={(employees || []).map(e => ({ id: e.id, name: e.name }))}
      reviewFunnelSlug={reviewSite?.slug || null}
    />
  );
}
