import { redirect, notFound } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ActivityLogEntry, Lead } from "@/lib/supabase";
import ContactProfileClient from "@/components/contacts/ContactProfileClient";

export const dynamic = "force-dynamic";

type SearchParams = {
  tab?: string;
  q?: string;
  page?: string;
};

export default async function ContactProfilePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SearchParams;
}) {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  const { businessId } = auth;
  const supabase = getSupabaseAdmin();

  // Ownership is enforced by the business_id filter, not a post-hoc check.
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (!lead) notFound();

  const [{ data: timeline }, { data: partner }, { data: employees }, { data: reviewSite }] =
    await Promise.all([
      supabase
        .from("activity_log")
        .select("*")
        .eq("business_id", businessId)
        .eq("lead_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("referral_partners")
        .select("referral_code")
        .eq("business_id", businessId)
        .eq("customer_id", params.id)
        .maybeSingle(),
      supabase
        .from("employees")
        .select("id, name")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("sites")
        .select("slug")
        .eq("business_id", businessId)
        .eq("type", "review_funnel")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);

  // Who referred this contact, if they arrived through a partner's link.
  let referrer: { id: string; name: string } | null = null;
  if (lead.referral_code) {
    const { data: rp } = await supabase
      .from("referral_partners")
      .select("customer_id")
      .eq("business_id", businessId)
      .eq("referral_code", lead.referral_code)
      .maybeSingle();

    if (rp?.customer_id) {
      const { data: source } = await supabase
        .from("leads")
        .select("id, name")
        .eq("id", rp.customer_id)
        .eq("business_id", businessId)
        .maybeSingle();
      if (source) referrer = { id: source.id, name: source.name };
    }
  }

  // Preserve the list's tab/search/page so the back link returns the user
  // to the view they left rather than the top of an unfiltered list.
  const backParams = new URLSearchParams();
  if (searchParams.tab) backParams.set("tab", searchParams.tab);
  if (searchParams.q) backParams.set("q", searchParams.q);
  if (searchParams.page) backParams.set("page", searchParams.page);
  const backQs = backParams.toString();

  return (
    <ContactProfileClient
      lead={lead as Lead}
      timeline={(timeline ?? []) as ActivityLogEntry[]}
      referralCode={partner?.referral_code ?? null}
      referrer={referrer}
      employees={employees ?? []}
      reviewFunnelSlug={reviewSite?.slug ?? null}
      backHref={`/contractor/contacts${backQs ? `?${backQs}` : ""}`}
    />
  );
}
