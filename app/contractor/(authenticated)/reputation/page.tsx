import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import ReputationGrowthClient, {
  type GrowthData,
  type PendingRewardCard,
} from "./ReputationGrowthClient";

// Reputation "Growth" landing page. Three tabs across the top
// (Feedback / Reviews / Referrals) and a referrer-payout list driven
// by the referral_rewards table that auto-fills when a referred lead
// closes (see app/api/contractor/customers/[id]/route.ts). The whole
// page reads real data — no mocks.

export const dynamic = "force-dynamic";

export default async function ContractorReputationPage() {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  const { businessId } = auth;
  const supabase = getSupabaseAdmin();

  // Tab counts + weekly summary, all in parallel.
  const [
    { count: feedbackCount },
    { data: business },
    { count: referrerCount },
    { count: weeklyClosedCount },
    { data: pendingRewardsRaw },
    { data: sentRewardsRaw },
  ] = await Promise.all([
    supabase
      .from("review_responses")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("businesses")
      .select("google_review_count, referral_reward_amount_cents")
      .eq("id", businessId)
      .single(),
    supabase
      .from("referral_partners")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("referral_rewards")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      ),
    supabase
      .from("referral_rewards")
      .select(
        "id, referrer_lead_id, referred_lead_id, amount_cents, created_at"
      )
      .eq("business_id", businessId)
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("referral_rewards")
      .select("id, referrer_lead_id, referred_lead_id, amount_cents")
      .eq("business_id", businessId)
      .eq("status", "sent"),
  ]);

  // Build the pending-rewards list grouped by referrer. Each card needs:
  //   - referrer name (from the referrer's lead row)
  //   - aggregate stats across ALL their referred customers (closed count,
  //     total $ value, total $ already earned)
  //   - the latest referred customer's notes/ai_summary as the description
  //   - an array of pending reward IDs so the Send button can pay them all
  const pending = pendingRewardsRaw ?? [];
  const sent = sentRewardsRaw ?? [];

  const referrerIds = Array.from(
    new Set(pending.map((r) => r.referrer_lead_id))
  );

  type ReferredInfo = {
    id: string;
    name: string;
    notes: string | null;
    ai_summary: string | null;
    estimated_value_cents: number | null;
    closed_at: string | null;
  };

  let cards: PendingRewardCard[] = [];
  if (referrerIds.length > 0) {
    const allReferredIds = Array.from(
      new Set([
        ...pending.map((r) => r.referred_lead_id),
        ...sent.map((r) => r.referred_lead_id),
      ])
    );

    const [{ data: referrerLeads }, { data: referredCustomers }] =
      await Promise.all([
        supabase
          .from("leads")
          .select("id, name")
          .eq("business_id", businessId)
          .in("id", referrerIds),
        allReferredIds.length > 0
          ? supabase
              .from("leads")
              .select(
                "id, name, notes, ai_summary, estimated_value_cents, closed_at"
              )
              .eq("business_id", businessId)
              .in("id", allReferredIds)
          : Promise.resolve({ data: [] as ReferredInfo[] }),
      ]);

    const referrerNameById = new Map<string, string>();
    (referrerLeads ?? []).forEach((l) => referrerNameById.set(l.id, l.name));

    const referredById = new Map<string, ReferredInfo>();
    ((referredCustomers ?? []) as ReferredInfo[]).forEach((l) => {
      referredById.set(l.id, l);
    });

    // Group pending rewards by referrer.
    const byReferrer = new Map<
      string,
      {
        rewardIds: string[];
        pendingCents: number;
        oldestCreatedAt: string;
        latestReferred: ReferredInfo | null;
      }
    >();
    for (const reward of pending) {
      const existing = byReferrer.get(reward.referrer_lead_id);
      const referred = referredById.get(reward.referred_lead_id) ?? null;
      if (existing) {
        existing.rewardIds.push(reward.id);
        existing.pendingCents += reward.amount_cents;
        if (reward.created_at < existing.oldestCreatedAt) {
          existing.oldestCreatedAt = reward.created_at;
        }
        if (
          referred &&
          (!existing.latestReferred ||
            (referred.closed_at ?? "") >
              (existing.latestReferred.closed_at ?? ""))
        ) {
          existing.latestReferred = referred;
        }
      } else {
        byReferrer.set(reward.referrer_lead_id, {
          rewardIds: [reward.id],
          pendingCents: reward.amount_cents,
          oldestCreatedAt: reward.created_at,
          latestReferred: referred,
        });
      }
    }

    // Compute earned $ totals per referrer from already-sent rewards.
    const earnedByReferrer = new Map<string, number>();
    for (const r of sent) {
      earnedByReferrer.set(
        r.referrer_lead_id,
        (earnedByReferrer.get(r.referrer_lead_id) ?? 0) + r.amount_cents
      );
    }

    // Closed count + total value per referrer: derive from the union of
    // all pending+sent reward referred_lead_ids whose lead row we have.
    const allRewardsByReferrer = new Map<string, Set<string>>();
    for (const r of [...pending, ...sent]) {
      const set =
        allRewardsByReferrer.get(r.referrer_lead_id) ?? new Set<string>();
      if ("referred_lead_id" in r) set.add(r.referred_lead_id);
      allRewardsByReferrer.set(r.referrer_lead_id, set);
    }

    cards = Array.from(byReferrer.entries()).map(([referrerId, agg]) => {
      const closedSet = allRewardsByReferrer.get(referrerId) ?? new Set();
      let totalValueCents = 0;
      closedSet.forEach((leadId) => {
        const r = referredById.get(leadId);
        if (r?.estimated_value_cents) totalValueCents += r.estimated_value_cents;
      });
      const earnedCents = earnedByReferrer.get(referrerId) ?? 0;
      const description =
        agg.latestReferred?.ai_summary ||
        agg.latestReferred?.notes ||
        (agg.latestReferred
          ? `Referred ${agg.latestReferred.name}`
          : "Referral closed");
      return {
        referrerLeadId: referrerId,
        referrerName: referrerNameById.get(referrerId) ?? "Customer",
        closedCount: closedSet.size,
        totalValueCents,
        earnedCents,
        pendingCents: agg.pendingCents,
        rewardIds: agg.rewardIds,
        oldestPendingAt: agg.oldestCreatedAt,
        description,
        totalReferralCount: closedSet.size,
      };
    });
    // Stable sort: oldest pending first.
    cards.sort((a, b) =>
      a.oldestPendingAt < b.oldestPendingAt ? -1 : 1
    );
  }

  const data: GrowthData = {
    feedbackCount: feedbackCount ?? 0,
    reviewsCount: business?.google_review_count ?? 0,
    referralsCount: referrerCount ?? 0,
    weeklyClosedReferrals: weeklyClosedCount ?? 0,
    pendingRewardCards: cards,
  };

  return <ReputationGrowthClient data={data} />;
}
