import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import ReputationClient, {
  type AdvocatePartner,
  type AdvocatesData,
  type FeedbackItem,
  type FunnelStep,
  type ReputationData,
  type ReviewItem,
  type TimeRange,
} from "./ReputationClient";

/**
 * handled. reputation dashboard.
 *
 * Server component. Reads the post-sale funnel for the logged-in
 * business straight from Supabase:
 *   - business name + Google My Business data (businesses.name,
 *     .google_review_count, .google_rating, .google_reviews)
 *   - Feedback tab from review_responses joined to leads
 *   - Reviews tab from the scraped GMB reviews on businesses.google_reviews
 *     merged with any curated rows in the `reviews` table
 *   - Advocates + revenue from leads.referred_by_lead_id and
 *     referral_partners
 *   - Stella funnel counts from the denormalized post-sale timestamps
 *     on leads
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
  tech_name: string | null;
  professionalism: string | null;
  communication: string | null;
};

type CuratedReviewRow = {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  review_date: string;
  source: string;
};

type GoogleReviewRow = {
  author: string;
  rating: number;
  text: string;
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

type ReferralPartnerRow = {
  id: string;
  customer_id: string | null;
  referral_code: string | null;
  created_at: string;
};

type PartnerReferralRow = {
  id: string;
  referred_by_lead_id: string | null;
  status: string;
  estimated_value_cents: number | null;
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
      .select(
        "id, created_at, rating, feedback, is_positive, lead_id, tech_name, professionalism, communication"
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (cutoff) q = q.gte("created_at", cutoff);
    return q;
  };

  // Curated rows in the `reviews` table (manual/featured reviews). These
  // have real timestamps, so they honor the time filter. Scraped GMB reviews
  // (businesses.google_reviews JSONB) don't carry per-review dates, so they
  // pass through regardless of range.
  const buildCuratedReviewsQuery = () => {
    let q = supabase
      .from("reviews")
      .select("id, reviewer_name, rating, review_text, review_date, source")
      .eq("business_id", businessId)
      .order("review_date", { ascending: false })
      .limit(30);
    if (cutoff) q = q.gte("review_date", cutoff);
    return q;
  };

  const [
    businessRes,
    reviewResponsesRes,
    curatedReviewsRes,
    advocatesCountRes,
    partnerRowsRes,
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
      .select(
        "name, google_rating, google_review_count, google_reviews, google_review_url, google_place_id"
      )
      .eq("id", businessId)
      .single(),
    buildReviewsQuery(),
    buildCuratedReviewsQuery(),
    supabase
      .from("referral_partners")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    // All referral_partners for this business — drives the Advocates tab.
    // We resolve names/stats in a second pass below.
    supabase
      .from("referral_partners")
      .select("id, customer_id, referral_code, created_at")
      .eq("business_id", businessId),
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
  const curatedReviewRows: CuratedReviewRow[] =
    (curatedReviewsRes.data ?? []) as CuratedReviewRow[];
  const googleReviewRows: GoogleReviewRow[] = Array.isArray(
    business?.google_reviews
  )
    ? (business.google_reviews as GoogleReviewRow[])
    : [];
  const partnerRows: ReferralPartnerRow[] =
    (partnerRowsRes.data ?? []) as ReferralPartnerRow[];

  // -----------------------------------------------------------------
  // Secondary lookups:
  //   1. leads referenced by review_responses (for the Feedback tab)
  //   2. partner leads themselves (for name/initials on the Advocates tab)
  //   3. referred-in leads that attribute to these partners (for
  //      submitted/successful/revenue counts)
  // -----------------------------------------------------------------
  const leadIdsFromReviews = Array.from(
    new Set(reviewRows.map((r) => r.lead_id).filter(Boolean) as string[])
  );
  const partnerLeadIds = Array.from(
    new Set(
      partnerRows.map((p) => p.customer_id).filter(Boolean) as string[]
    )
  );
  const lookupIds = Array.from(
    new Set([...leadIdsFromReviews, ...partnerLeadIds])
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

  // Fetch every lead referred by any partner. Status + estimated value let
  // us count submitted/successful and sum revenue per partner.
  let partnerReferralRows: PartnerReferralRow[] = [];
  if (partnerLeadIds.length > 0) {
    const { data } = await supabase
      .from("leads")
      .select("id, referred_by_lead_id, status, estimated_value_cents")
      .eq("business_id", businessId)
      .in("referred_by_lead_id", partnerLeadIds);
    partnerReferralRows = (data ?? []) as PartnerReferralRow[];
  }

  // -----------------------------------------------------------------
  // Shape rows → view models
  // -----------------------------------------------------------------
  const feedback: FeedbackItem[] = reviewRows.map((r) =>
    toFeedbackItem(r, r.lead_id ? leadLookup.get(r.lead_id) : undefined)
  );

  // Reviews tab: actual posted reviews.
  //  - Google My Business reviews scraped onto businesses.google_reviews
  //    come first (no timestamps, so they always appear regardless of range).
  //  - Curated rows from the `reviews` table fill in any manually added or
  //    featured reviews (time-filtered by review_date).
  //  - Dedupe by author+rating+text so GMB rows that were copied into the
  //    reviews table don't render twice.
  // Prefer a "see all reviews" link built from the place_id so the VIEW
  // button opens the reviews listing; fall back to the write-review URL
  // if a place_id isn't set. The scraped google_reviews rows don't carry
  // per-review URLs, so deep-linking to the specific review isn't possible
  // without a data migration (e.g. switching to the Places API).
  const googleReviewsListUrl = business?.google_place_id
    ? `https://search.google.com/local/reviews?placeid=${encodeURIComponent(
        business.google_place_id
      )}`
    : business?.google_review_url ?? null;

  const reviews: ReviewItem[] = buildReviewsFromGoogleAndCurated(
    googleReviewRows,
    curatedReviewRows,
    googleReviewsListUrl
  );

  const advocates: AdvocatesData = buildAdvocates(
    partnerRows,
    partnerReferralRows,
    leadLookup
  );

  // Stats
  const ratedRows = reviewRows.filter(
    (r) => typeof r.rating === "number" && r.rating !== null
  );
  const avgRatingInWindow =
    ratedRows.length > 0
      ? ratedRows.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
        ratedRows.length
      : 0;

  // Reviews count prefers the live GMB count from the business record so it
  // matches what the contractor sees on Google. Falls back to however many
  // reviews we've actually shaped for the tab.
  const reviewsCount =
    business?.google_review_count ??
    (googleReviewRows.length + curatedReviewRows.length);

  const stats = {
    feedback: reviewRows.length,
    reviews: reviewsCount,
    avgRating:
      business?.google_rating ??
      (avgRatingInWindow > 0 ? avgRatingInWindow : 0),
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
    advocates,
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
    leadId: row.lead_id,
    name,
    initials: getInitials(name),
    job: lead?.service_needed?.trim() || "Job complete",
    time: formatRelative(row.created_at),
    emoji: emojiForRating(rating),
    label: labelForRating(rating),
    comment: row.feedback?.trim() ?? "",
    sentiment,
    reviewSent,
    survey: {
      rating,
      feedback: row.feedback?.trim() ?? "",
      techName: row.tech_name,
      professionalism: row.professionalism,
      communication: row.communication,
    },
  };
}

function buildReviewsFromGoogleAndCurated(
  googleRows: GoogleReviewRow[],
  curatedRows: CuratedReviewRow[],
  googleReviewUrl: string | null
): ReviewItem[] {
  const out: ReviewItem[] = [];
  const seen = new Set<string>();

  // Google My Business scraped reviews first — they're the canonical "posted"
  // public reviews. No per-review timestamp, so surface them as "Posted".
  // No per-review URL is stored; link all to the business-wide GMB profile.
  googleRows.forEach((g, i) => {
    const name = g.author?.trim() || "Google reviewer";
    const rating = typeof g.rating === "number" ? g.rating : 0;
    const text = g.text?.trim() || "";
    const key = dedupeKey(name, rating, text);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      id: `gmb-${i}-${hashShort(key)}`,
      name,
      initials: getInitials(name),
      job: "Google review",
      source: "Google",
      time: "Posted",
      rating,
      status: "posted",
      text: text || "Left a Google review.",
      sentiment: ratingToSentiment(rating),
      externalUrl: googleReviewUrl,
    });
  });

  curatedRows.forEach((r) => {
    const name = r.reviewer_name?.trim() || "Customer";
    const rating = typeof r.rating === "number" ? r.rating : 0;
    const text = r.review_text?.trim() || "";
    const key = dedupeKey(name, rating, text);
    if (seen.has(key)) return;
    seen.add(key);
    const isGoogleSource = /google/i.test(r.source || "");
    out.push({
      id: `curated-${r.id}`,
      name,
      initials: getInitials(name),
      job: humanizeSource(r.source),
      source: humanizeSource(r.source) || "Review",
      time: formatReviewDate(r.review_date),
      rating,
      status: "posted",
      text: text || "Left a review.",
      sentiment: ratingToSentiment(rating),
      externalUrl: isGoogleSource ? googleReviewUrl : null,
    });
  });

  return out;
}

function dedupeKey(name: string, rating: number, text: string): string {
  return `${name.toLowerCase()}|${rating}|${text.slice(0, 80).toLowerCase()}`;
}

function hashShort(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

function humanizeSource(source: string | null | undefined): string {
  if (!source) return "";
  if (/google/i.test(source)) return "Google";
  if (/yelp/i.test(source)) return "Yelp";
  if (/facebook/i.test(source)) return "Facebook";
  return source
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatReviewDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function buildAdvocates(
  partnerRows: ReferralPartnerRow[],
  partnerReferralRows: PartnerReferralRow[],
  leadLookup: Map<string, LeadLookupRow>
): AdvocatesData {
  // Aggregate referral counts + revenue per partner.
  const statsByPartnerLead = new Map<
    string,
    { submitted: number; successful: number; revenueCents: number }
  >();
  for (const r of partnerReferralRows) {
    if (!r.referred_by_lead_id) continue;
    const acc = statsByPartnerLead.get(r.referred_by_lead_id) ?? {
      submitted: 0,
      successful: 0,
      revenueCents: 0,
    };
    acc.submitted += 1;
    if (r.status === "customer") {
      acc.successful += 1;
      acc.revenueCents += r.estimated_value_cents ?? 0;
    }
    statsByPartnerLead.set(r.referred_by_lead_id, acc);
  }

  const newCutoffMs = Date.now() - 7 * DAY_MS;

  const shaped: AdvocatePartner[] = partnerRows.map((p) => {
    const lead = p.customer_id ? leadLookup.get(p.customer_id) : undefined;
    const name = lead?.name?.trim() || "Advocate";
    const stats = p.customer_id
      ? (statsByPartnerLead.get(p.customer_id) ?? {
          submitted: 0,
          successful: 0,
          revenueCents: 0,
        })
      : { submitted: 0, successful: 0, revenueCents: 0 };
    return {
      id: p.id,
      leadId: p.customer_id,
      name,
      initials: getInitials(name),
      joinedAt: p.created_at,
      joinedLabel: formatRelative(p.created_at),
      submitted: stats.submitted,
      successful: stats.successful,
      revenueLabel:
        stats.revenueCents > 0 ? formatMoneyCompact(stats.revenueCents) : null,
    };
  });

  const newAdvocates: AdvocatePartner[] = [];
  const rest: AdvocatePartner[] = [];
  for (const a of shaped) {
    const joinedMs = Date.parse(a.joinedAt);
    if (Number.isFinite(joinedMs) && joinedMs >= newCutoffMs) {
      newAdvocates.push(a);
    } else {
      rest.push(a);
    }
  }

  newAdvocates.sort((a, b) => (a.joinedAt < b.joinedAt ? 1 : -1));

  rest.sort((a, b) => {
    if (b.successful !== a.successful) return b.successful - a.successful;
    if (b.submitted !== a.submitted) return b.submitted - a.submitted;
    const aRev = a.revenueLabel ? 1 : 0;
    const bRev = b.revenueLabel ? 1 : 0;
    if (bRev !== aRev) return bRev - aRev;
    return a.name.localeCompare(b.name);
  });

  return { newAdvocates, rankedAdvocates: rest };
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
