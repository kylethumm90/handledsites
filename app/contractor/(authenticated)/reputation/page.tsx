import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import ReputationClient, {
  type FeedbackItem,
  type FunnelStep,
  type ReferralItem,
  type ReferralStatus,
  type ReputationData,
  type ReviewItem,
  type ReviewStatus,
  type TimeRange,
} from "./ReputationClient";

/**
 * handled. reputation dashboard.
 *
 * Server component. Reads the post-sale funnel for the logged-in
 * business straight from Supabase:
 *   - business name (businesses.name)
 *   - feedback + reviews (review_responses joined to leads)
 *   - advocates + revenue (leads.referred_by_lead_id + referral_partners)
 *   - Stella funnel counts (denormalized timestamps on leads)
 *
 * Time range comes from ?range=7d|30d|90d|All (defaults to 30d).
 * Clicking a range pill in the client pushes a new querystring and
 * Next re-runs this component — no client-side Supabase calls.
 */

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const ALLOWED_RANGES: TimeRange[] = ["7d", "30d", "90d", "All"];

function parseRange(raw: string | string[] | undefined): TimeRange {
  if (typeof raw === "string" && (ALLOWED_RANGES as string[]).includes(raw)) {
    return raw as TimeRange;
  }
  return "30d";
}

function cutoffIso(range: TimeRange): string | null {
  switch (range) {
    case "7d":
      return new Date(Date.now() - 7 * DAY_MS).toISOString();
    case "30d":
      return new Date(Date.now() - 30 * DAY_MS).toISOString();
    case "90d":
      return new Date(Date.now() - 90 * DAY_MS).toISOString();
    case "All":
      return null;
  }
}

type ReviewResponseRow = {
  id: string;
  created_at: string;
  rating: number | null;
  feedback: string | null;
  is_positive: boolean | null;
  lead_id: string | null;
};

type LeadLookupRow = {
  id: string;
  name: string;
  service_needed: string | null;
  status: string;
  created_at: string;
  closed_at: string | null;
  estimated_value_cents: number | null;
  sentiment_score: number | null;
  review_submitted_at: string | null;
  feedback_submitted_at: string | null;
  referral_opted_in_at: string | null;
  job_completed_at: string | null;
  referred_by_lead_id: string | null;
};

export default async function ContractorReputationPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");
  const { businessId } = auth;

  const range = parseRange(searchParams.range);
  const cutoff = cutoffIso(range);
  const thirtyDayCutoff = new Date(Date.now() - 30 * DAY_MS).toISOString();

  const supabase = getSupabaseAdmin();

  // -----------------------------------------------------------------
  // Parallel reads. Time-scoped tabs use `cutoff` (or no filter for "All");
  // the Stella funnel + advocate revenue are always last-30-days.
  // -----------------------------------------------------------------
  const buildReviewsQuery = () => {
    let q = supabase
      .from("review_responses")
      .select("id, created_at, rating, feedback, is_positive, lead_id")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (cutoff) q = q.gte("created_at", cutoff);
    return q;
  };

  const buildReferralsQuery = () => {
    let q = supabase
      .from("leads")
      .select(
        "id, name, service_needed, status, created_at, closed_at, estimated_value_cents, sentiment_score, review_submitted_at, feedback_submitted_at, referral_opted_in_at, job_completed_at, referred_by_lead_id"
      )
      .eq("business_id", businessId)
      .not("referred_by_lead_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(30);
    if (cutoff) q = q.gte("created_at", cutoff);
    return q;
  };

  const [
    businessRes,
    reviewResponsesRes,
    advocatesCountRes,
    referralsRes,
    // Funnel (always last 30d)
    funnelJobsRes,
    funnelFeedbackRes,
    funnelReviewsRes,
    funnelAdvocatesRes,
    // Revenue (last 30d closed referred-in customers)
    revenueRes,
    conversionTotalRes,
    conversionClosedRes,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("name, google_rating, google_review_count")
      .eq("id", businessId)
      .single(),
    buildReviewsQuery(),
    supabase
      .from("referral_partners")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    buildReferralsQuery(),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("job_completed_at", thirtyDayCutoff),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("feedback_submitted_at", thirtyDayCutoff),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("review_submitted_at", thirtyDayCutoff),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("referral_opted_in_at", thirtyDayCutoff),
    supabase
      .from("leads")
      .select("estimated_value_cents")
      .eq("business_id", businessId)
      .eq("status", "customer")
      .not("referred_by_lead_id", "is", null)
      .gte("closed_at", thirtyDayCutoff),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .not("referred_by_lead_id", "is", null)
      .gte("created_at", thirtyDayCutoff),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "customer")
      .not("referred_by_lead_id", "is", null)
      .gte("closed_at", thirtyDayCutoff),
  ]);

  const business = businessRes.data;
  const reviewRows: ReviewResponseRow[] = reviewResponsesRes.data ?? [];
  const referralRows: LeadLookupRow[] = (referralsRes.data ??
    []) as LeadLookupRow[];

  // -----------------------------------------------------------------
  // Secondary lookup: the leads referenced by review_responses +
  // the referrers for each referred lead. One batched .in(...) each.
  // -----------------------------------------------------------------
  const leadIdsFromReviews = Array.from(
    new Set(reviewRows.map((r) => r.lead_id).filter(Boolean) as string[])
  );
  const referrerIds = Array.from(
    new Set(
      referralRows
        .map((r) => r.referred_by_lead_id)
        .filter(Boolean) as string[]
    )
  );
  const lookupIds = Array.from(
    new Set([...leadIdsFromReviews, ...referrerIds])
  );

  let leadLookup = new Map<string, LeadLookupRow>();
  if (lookupIds.length > 0) {
    const { data: leads } = await supabase
      .from("leads")
      .select(
        "id, name, service_needed, status, created_at, closed_at, estimated_value_cents, sentiment_score, review_submitted_at, feedback_submitted_at, referral_opted_in_at, job_completed_at, referred_by_lead_id"
      )
      .eq("business_id", businessId)
      .in("id", lookupIds);
    leadLookup = new Map(
      ((leads ?? []) as LeadLookupRow[]).map((l) => [l.id, l])
    );
  }

  // -----------------------------------------------------------------
  // Shape rows → view models
  // -----------------------------------------------------------------
  const feedback: FeedbackItem[] = reviewRows.map((r) =>
    toFeedbackItem(r, r.lead_id ? leadLookup.get(r.lead_id) : undefined)
  );

  const reviews: ReviewItem[] = reviewRows.map((r) =>
    toReviewItem(r, r.lead_id ? leadLookup.get(r.lead_id) : undefined)
  );

  const referrals: ReferralItem[] = referralRows.map((lead) => {
    const referrer = lead.referred_by_lead_id
      ? leadLookup.get(lead.referred_by_lead_id)
      : undefined;
    return toReferralItem(lead, referrer);
  });

  // Stats
  const ratedRows = reviewRows.filter(
    (r) => typeof r.rating === "number" && r.rating !== null
  );
  const avgRatingInWindow =
    ratedRows.length > 0
      ? ratedRows.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
        ratedRows.length
      : 0;

  const stats = {
    feedback: reviewRows.length,
    reviews: reviewRows.filter((r) => r.is_positive === true).length,
    avgRating:
      avgRatingInWindow > 0
        ? avgRatingInWindow
        : (business?.google_rating ?? 0),
    advocates: advocatesCountRes.count ?? 0,
  };

  // Advocate revenue (30d) + conversion
  const revenueCents = (revenueRes.data ?? []).reduce(
    (sum, row: { estimated_value_cents: number | null }) =>
      sum + (row.estimated_value_cents ?? 0),
    0
  );
  const conversionTotal = conversionTotalRes.count ?? 0;
  const conversionClosed = conversionClosedRes.count ?? 0;
  const conversionPct =
    conversionTotal > 0
      ? Math.round((conversionClosed / conversionTotal) * 100)
      : 0;

  // Funnel (last 30 days)
  const funnel: FunnelStep[] = [
    { label: "Jobs", value: funnelJobsRes.count ?? 0, colorKey: "navy" },
    {
      label: "Feedback",
      value: funnelFeedbackRes.count ?? 0,
      colorKey: "blue",
    },
    {
      label: "Reviews",
      value: funnelReviewsRes.count ?? 0,
      colorKey: "amber",
    },
    {
      label: "Advocates",
      value: funnelAdvocatesRes.count ?? 0,
      colorKey: "green",
    },
  ];

  const data: ReputationData = {
    companyName: business?.name ?? "Your Business",
    range,
    stats,
    advocateRevenue: {
      amount: formatMoneyCompact(revenueCents),
      conversionPct,
    },
    funnel,
    feedback,
    reviews,
    referrals,
  };

  return <ReputationClient data={data} />;
}

// ---------------------------------------------------------------------------
// Row → view model helpers
// ---------------------------------------------------------------------------

function toFeedbackItem(
  row: ReviewResponseRow,
  lead: LeadLookupRow | undefined
): FeedbackItem {
  const name = lead?.name?.trim() || "Customer";
  const rating = row.rating ?? 0;
  const sentiment =
    typeof lead?.sentiment_score === "number"
      ? lead.sentiment_score
      : ratingToSentiment(rating);
  const reviewSent =
    !!lead?.review_submitted_at ||
    (row.is_positive === true && sentiment >= 60);

  return {
    id: row.id,
    name,
    initials: getInitials(name),
    job: lead?.service_needed?.trim() || "Job complete",
    time: formatRelative(row.created_at),
    emoji: emojiForRating(rating),
    label: labelForRating(rating),
    comment: row.feedback?.trim() ?? "",
    sentiment,
    reviewSent,
  };
}

function toReviewItem(
  row: ReviewResponseRow,
  lead: LeadLookupRow | undefined
): ReviewItem {
  const name = lead?.name?.trim() || "Customer";
  const rating = row.rating ?? 0;
  const sentiment =
    typeof lead?.sentiment_score === "number"
      ? lead.sentiment_score
      : ratingToSentiment(rating);

  let status: ReviewStatus;
  let source: string;
  let alert: string | undefined;

  if (sentiment < 60) {
    status = "needs attention";
    source = "Feedback";
    alert = "Low sentiment — recovery recommended";
  } else if (row.is_positive === true && lead?.review_submitted_at) {
    status = "posted";
    source = "Google";
  } else if (row.is_positive === true) {
    status = "awaiting review";
    source = "Pending";
    alert = `Review link sent ${formatRelative(row.created_at)}`;
  } else {
    status = "awaiting review";
    source = "Pending";
  }

  const showStars = status === "posted";
  const text = buildReviewText(row, status);

  return {
    id: row.id,
    name,
    initials: getInitials(name),
    job: lead?.service_needed?.trim() || "Job complete",
    source,
    time: formatRelative(row.created_at),
    rating: showStars ? rating : null,
    status,
    text,
    sentiment,
    alert,
  };
}

function toReferralItem(
  lead: LeadLookupRow,
  referrer: LeadLookupRow | undefined
): ReferralItem {
  const referrerName = referrer?.name?.trim() || "Customer";
  const referredName = lead.name?.trim() || "Referral";
  const referredJob = lead.service_needed?.trim() || "a job";
  const { status, value } = referralStatusAndValue(lead);

  return {
    id: lead.id,
    name: referrerName,
    initials: getInitials(referrerName),
    referredName,
    referredJob,
    time: formatRelative(lead.created_at),
    status,
    value,
  };
}

function referralStatusAndValue(lead: LeadLookupRow): {
  status: ReferralStatus;
  value: string | null;
} {
  if (lead.status === "customer") {
    return {
      status: "booked",
      value: lead.estimated_value_cents
        ? formatMoneyCompact(lead.estimated_value_cents)
        : null,
    };
  }
  if (lead.status === "booked" || lead.status === "contacted") {
    return { status: "contacted", value: null };
  }
  return { status: "new lead", value: null };
}

function buildReviewText(row: ReviewResponseRow, status: ReviewStatus): string {
  const feedback = row.feedback?.trim();
  if (feedback) return feedback;
  if (status === "awaiting review") {
    return "Feedback collected. Stella sent a review link — waiting for the customer to submit on Google.";
  }
  if (status === "needs attention") {
    return "Low-sentiment feedback collected. Recovery call recommended before a public review lands.";
  }
  return "Review on file.";
}

function emojiForRating(rating: number): string {
  if (rating >= 5) return "😍";
  if (rating >= 4) return "😊";
  if (rating >= 3) return "🙂";
  if (rating >= 2) return "😕";
  return "😠";
}

function labelForRating(rating: number): string {
  if (rating >= 5) return "Loved it";
  if (rating >= 4) return "Really good";
  if (rating >= 3) return "It was okay";
  if (rating >= 2) return "Not great";
  return "Frustrated";
}

function ratingToSentiment(rating: number): number {
  if (!rating) return 0;
  return Math.min(100, Math.max(0, Math.round(rating * 20)));
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "—";
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatMoneyCompact(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (dollars >= 10_000) {
    return `$${Math.round(dollars).toLocaleString()}`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `$${Math.round(dollars)}`;
}
