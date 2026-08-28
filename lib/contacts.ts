/**
 * handled. — Contacts page helpers.
 *
 * Pure functions plus Supabase query shaping for /contractor/contacts.
 * No React. Safe to call from server or client.
 *
 * The status ladder extends the post-sale derivation in lib/pipeline-v2.ts.
 * The one state not derivable from a leads column is "asked" — a review
 * request is recorded only as an activity_log row of type
 * `review_request_sent` (written by the review-request-sent API route), so
 * the caller rolls that up per page and passes it in.
 */

import type { Lead } from "@/lib/supabase";
import { pipelineStageFor } from "@/lib/pipeline-v2";
import { colors } from "@/lib/design-system";

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export type ContactStatus =
  // post-sale ladder (mirrors the mockup)
  | "referring"
  | "reviewed"
  | "asked"
  | "not_asked"
  | "unhappy"
  // pre-sale fallback, so the table can show every contact
  | "new"
  | "contacted"
  | "appt_set"
  | "job_done";

export const STATUS_LABELS: Record<ContactStatus, string> = {
  referring: "REFERRING",
  reviewed: "REVIEWED",
  asked: "ASKED",
  not_asked: "NOT ASKED",
  unhappy: "UNHAPPY",
  new: "NEW",
  contacted: "CONTACTED",
  appt_set: "APPT SET",
  job_done: "JOB DONE",
};

export const STATUS_COLORS: Record<ContactStatus, { fg: string; bg: string }> = {
  referring: { fg: colors.green, bg: colors.greenBg },
  reviewed: { fg: colors.green, bg: colors.greenBg },
  asked: { fg: colors.muted, bg: colors.navyBg },
  not_asked: { fg: colors.muted, bg: colors.navyBg },
  unhappy: { fg: colors.red, bg: colors.redBg },
  new: { fg: colors.amber, bg: colors.amberBg },
  contacted: { fg: colors.blue, bg: colors.blueBg },
  appt_set: { fg: colors.navy, bg: colors.navyBg },
  job_done: { fg: colors.green, bg: colors.greenBg },
};

/**
 * Which status badge a contact shows. First match wins, mirroring the
 * ordering already used by postSaleStageFor().
 *
 * `hasReviewAsk` — whether an activity_log `review_request_sent` row exists
 * for this lead. Only consulted once the earlier states are ruled out.
 */
export function contactStatusFor(lead: Lead, hasReviewAsk: boolean): ContactStatus {
  if (lead.status !== "customer") {
    return (pipelineStageFor(lead) ?? "new") as ContactStatus;
  }

  if (lead.sentiment_score != null && lead.sentiment_score < 60) return "unhappy";
  if (lead.referral_opted_in_at) return "referring";
  if (lead.review_submitted_at || lead.feedback_submitted_at) return "reviewed";
  if (hasReviewAsk) return "asked";
  return "not_asked";
}

// ---------------------------------------------------------------------------
// Sentiment
// ---------------------------------------------------------------------------

export type Sentiment = "happy" | "neutral" | "unhappy";

/**
 * Sentiment is read strictly from sentiment_score (0-100) and is null when
 * unscored. We deliberately do NOT infer it from "has a review" — that would
 * put a face on a row we know nothing about. Only 3 of 1,635 leads are scored
 * today, so most rows render as "—" until scoring is wired up.
 */
export function sentimentFor(lead: Lead): Sentiment | null {
  const score = lead.sentiment_score;
  if (score == null) return null;
  if (score < 60) return "unhappy";
  if (score < 80) return "neutral";
  return "happy";
}

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  happy: "Happy",
  neutral: "Neutral",
  unhappy: "Unhappy",
};

export const SENTIMENT_COLORS: Record<Sentiment, string> = {
  happy: colors.green,
  neutral: colors.muted,
  unhappy: colors.red,
};

// ---------------------------------------------------------------------------
// Next action
// ---------------------------------------------------------------------------

export type NextAction = {
  label: string;
  /**
   * `review_ask` POSTs to the review-request-sent route.
   * `profile`    navigates to the full profile page.
   * `open`       opens the side panel for a quick look.
   */
  kind: "review_ask" | "profile" | "open";
};

export function nextActionFor(status: ContactStatus): NextAction {
  switch (status) {
    case "not_asked":
      return { label: "Send Review Ask", kind: "review_ask" };
    case "reviewed":
      return { label: "Send Thank You", kind: "open" };
    case "asked":
    case "unhappy":
      return { label: "Follow Up", kind: "open" };
    default:
      return { label: "View Profile", kind: "profile" };
  }
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export type TabKey = "all" | "needs_review" | "happy" | "at_risk" | "referral";

export const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All Contacts" },
  { key: "needs_review", label: "Needs Review" },
  { key: "happy", label: "Happy" },
  { key: "at_risk", label: "At Risk" },
  { key: "referral", label: "Referral Potential" },
];

export function isTabKey(value: unknown): value is TabKey {
  return TABS.some((t) => t.key === value);
}

/**
 * Minimal shape of the PostgREST query builder methods we chain here. Typed
 * structurally so both a `select(...)` builder and a `count`-only builder
 * satisfy it without importing Supabase's internal generics.
 */
type Filterable<T> = {
  eq: (column: string, value: unknown) => T;
  lt: (column: string, value: unknown) => T;
  is: (column: string, value: unknown) => T;
  not: (column: string, operator: string, value: unknown) => T;
  or: (filters: string) => T;
};

/**
 * Apply a tab's filter to a query. Used for both the page query and the tab
 * count queries so the number on the tab always matches the rows behind it.
 */
export function applyTabFilter<T extends Filterable<T>>(query: T, tab: TabKey): T {
  switch (tab) {
    case "needs_review":
      return query
        .eq("status", "customer")
        .is("review_submitted_at", null)
        .is("feedback_submitted_at", null);
    case "happy":
      return query.or("sentiment_score.gte.80,review_submitted_at.not.is.null");
    case "at_risk":
      return query.lt("sentiment_score", 60);
    case "referral":
      return query
        .not("review_submitted_at", "is", null)
        .is("referral_opted_in_at", null);
    case "all":
    default:
      return query;
  }
}

/**
 * PostgREST `or=` takes a comma-separated list, so a raw search term
 * containing a comma, paren, or wildcard would change the filter's meaning.
 * Strip those rather than escaping — search is a convenience, not a query
 * language.
 */
export function sanitizeSearch(raw: string | undefined): string {
  if (!raw) return "";
  return raw.replace(/[,()%*\\]/g, " ").trim().slice(0, 80);
}

export function applySearchFilter<T extends Filterable<T>>(query: T, search: string): T {
  if (!search) return query;
  const term = `%${search}%`;
  return query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 25;

/** Inclusive [from, to] bounds for a Supabase .range() call. */
export function pageRange(page: number, size: number = PAGE_SIZE): [number, number] {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const from = (safePage - 1) * size;
  return [from, from + size - 1];
}

export function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}
