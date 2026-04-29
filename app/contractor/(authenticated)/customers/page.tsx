import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import PipelineV2, { type ReferralStats } from "@/components/PipelineV2";
import DemoBanner from "@/components/DemoBanner";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  const { businessId } = auth;
  const supabase = getSupabaseAdmin();

  // Parallel fetch: business identity + reward amount, the full lead list,
  // the demo-lead count for the seed-data banner, the referral_partners
  // for this business, and every referral_event so the modal can roll up
  // per-partner click counts and "last activity" without a per-open round
  // trip. Lead counts per partner are derived from the leads list (which
  // we already have in scope) by matching leads.referral_code.
  const [
    { data: business },
    { data: leads },
    { count: demoLeadCount },
    { data: partners },
    { data: events },
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("name, ava_enabled, referral_reward_amount_cents")
      .eq("id", businessId)
      .single(),
    supabase
      .from("leads")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("is_demo", true),
    supabase
      .from("referral_partners")
      .select("id, customer_id, referral_code, created_at")
      .eq("business_id", businessId),
    supabase
      .from("referral_events")
      .select("referral_partner_id, event_type, created_at")
      .eq("business_id", businessId),
  ]);

  if (!business) redirect("/contractor/login");

  const hasDemoLeads = (demoLeadCount ?? 0) > 0;

  // Build the per-partner stats map keyed by customer_id (the modal's
  // selected lead id). Walking events / leads once each keeps this O(N+E+L).
  const partnerList = partners ?? [];
  const eventList = events ?? [];
  const leadList = (leads ?? []) as Lead[];

  const clicksByPartnerId = new Map<string, number>();
  const lastEventByPartnerId = new Map<string, string>();
  for (const e of eventList) {
    if (e.event_type !== "click") continue;
    clicksByPartnerId.set(
      e.referral_partner_id,
      (clicksByPartnerId.get(e.referral_partner_id) ?? 0) + 1,
    );
    const prev = lastEventByPartnerId.get(e.referral_partner_id);
    if (!prev || e.created_at > prev) {
      lastEventByPartnerId.set(e.referral_partner_id, e.created_at);
    }
  }

  // Lead count per partner = count of leads.referral_code matches, plus the
  // most recent such lead's created_at (feeds the "Last activity" stamp).
  const leadsByCode = new Map<string, { count: number; latest: string }>();
  for (const l of leadList) {
    if (!l.referral_code) continue;
    const cur = leadsByCode.get(l.referral_code);
    if (cur) {
      cur.count += 1;
      if (l.created_at > cur.latest) cur.latest = l.created_at;
    } else {
      leadsByCode.set(l.referral_code, { count: 1, latest: l.created_at });
    }
  }

  const referralStatsByLead: Record<string, ReferralStats> = {};
  for (const p of partnerList) {
    if (!p.customer_id || !p.referral_code) continue;
    const clicks = clicksByPartnerId.get(p.id) ?? 0;
    const leadAgg = leadsByCode.get(p.referral_code);
    const lastEvent = lastEventByPartnerId.get(p.id);
    // Last activity = newest of (most recent click, most recent lead, the
    // partner's enrollment timestamp). Always falls back to created_at so
    // we never render an empty "Last activity" line.
    const candidates = [p.created_at, lastEvent, leadAgg?.latest].filter(
      (s): s is string => typeof s === "string" && s.length > 0,
    );
    const lastActivityAt = candidates.reduce((a, b) => (a > b ? a : b));
    referralStatsByLead[p.customer_id] = {
      referralCode: p.referral_code,
      partnerSince: p.created_at,
      clicks,
      leads: leadAgg?.count ?? 0,
      lastActivityAt,
    };
  }

  return (
    <>
      <PipelineV2
        leads={leadList}
        businessName={business.name || "Your Business"}
        avaEnabled={business.ava_enabled ?? false}
        referralStatsByLead={referralStatsByLead}
        referralRewardCents={business.referral_reward_amount_cents ?? null}
      />
      {hasDemoLeads && <DemoBanner />}
    </>
  );
}
