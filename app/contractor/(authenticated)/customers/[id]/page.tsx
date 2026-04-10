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
  const [{ data: timeline }, leadCount, bookedCount, customerCount] = await Promise.all([
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

  return (
    <CustomerDetailClient
      lead={lead as Lead}
      timeline={(timeline || []) as ActivityLogEntry[]}
      counts={{ lead: leadCount, booked: bookedCount, customer: customerCount }}
      existingReferralCode={referralPartner?.referral_code || null}
    />
  );
}
