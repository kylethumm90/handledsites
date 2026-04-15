// Pipeline helpers: stage counts, pipeline value, speed-to-lead math, and
// the shared formatters that drive both the live "waiting on you" timers
// on uncontacted lead cards and the static speed-to-lead display on
// already-contacted ones. Pure functions only — no React, no JSX, so the
// same helpers can be used in server components and unit tests.

import type { Lead, LeadStatus, PostSaleStatus } from "@/lib/supabase";

// ── View mode ─────────────────────────────────────────────────────────
// The Pipeline screen has two modes per docs/PRODUCT_SPEC.md Screen 2:
// pre-sale ("pipeline") and post-sale. Same contacts table, same cards,
// different four-stage rails.
export type PipelineView = "pipeline" | "post_sale";

// ── Pipeline (pre-sale) stage colors — source of truth for tiles ──────
// Per docs/PRODUCT_SPEC.md: New amber → Contacted blue → Appt Set navy
// → Job Done green.
export const STAGE_COLORS = {
  new: "#E8922A",
  contacted: "#2563EB",
  apptSet: "#1E2A3A",
  done: "#16A34A",
} as const;

// ── Post-sale stage colors ────────────────────────────────────────────
// Per docs/PRODUCT_SPEC.md: Recovery red → Feedback amber → Reviewed
// green → Referrer purple. Recovery is always red because it's the
// "customer is unhappy" bucket; Referrer is purple to visually separate
// it from the pre-sale pipeline entirely.
export const POST_SALE_STAGE_COLORS = {
  recovery: "#DC2626",
  feedback: "#E8922A",
  reviewed: "#16A34A",
  referrer: "#7C3AED",
} as const;

export type StageCounts = {
  new: number;
  contacted: number;
  apptSet: number;
  done: number;
};

export type PostSaleCounts = {
  recovery: number;
  feedback: number;
  reviewed: number;
  referrer: number;
};

export function computeStageCounts(leads: Lead[]): StageCounts {
  const counts: StageCounts = { new: 0, contacted: 0, apptSet: 0, done: 0 };
  for (const lead of leads) {
    if (lead.status === "lead") counts.new++;
    else if (lead.status === "contacted") counts.contacted++;
    else if (lead.status === "booked") counts.apptSet++;
    else if (lead.status === "customer") counts.done++;
  }
  return counts;
}

// Roll the six post-sale statuses into the four visible buckets on the
// Post-Sale rail. `review_asked` counts as still in the "feedback"
// column (we've asked, we haven't heard back yet); `referral_asked`
// rolls up with "referrer" (we've teed up the ask, awaiting response).
export function computePostSaleStageCounts(leads: Lead[]): PostSaleCounts {
  const counts: PostSaleCounts = { recovery: 0, feedback: 0, reviewed: 0, referrer: 0 };
  for (const lead of leads) {
    switch (lead.status) {
      case "recovery":
        counts.recovery++;
        break;
      case "feedback":
      case "review_asked":
        counts.feedback++;
        break;
      case "reviewed":
        counts.reviewed++;
        break;
      case "referrer":
      case "referral_asked":
        counts.referrer++;
        break;
    }
  }
  return counts;
}

// All the statuses that belong to the Post-Sale rail. Used to filter
// the lead list when the Post-Sale view is active.
export const POST_SALE_STATUSES: readonly PostSaleStatus[] = [
  "recovery",
  "feedback",
  "review_asked",
  "reviewed",
  "referral_asked",
  "referrer",
] as const;

export function isPostSaleStatus(status: LeadStatus): status is PostSaleStatus {
  return (POST_SALE_STATUSES as readonly string[]).includes(status);
}

// ── Pipeline $ value ───────────────────────────────────────────────────
// "Total" sums estimated_value_cents across every lead that isn't done-
// and-lost; "this week" is the subset whose created_at falls in the
// current rolling 7-day window. The weekly delta compares to the prior
// 7 days so the mockup's "+15% / -8%" chip has something to render.

export type PipelineValue = {
  totalCents: number;
  thisWeekCents: number;
  priorWeekCents: number;
  weekDeltaPct: number | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

export function computePipelineValue(leads: Lead[], nowMs: number = Date.now()): PipelineValue {
  const weekStart = nowMs - MS_PER_WEEK;
  const priorStart = nowMs - 2 * MS_PER_WEEK;

  let totalCents = 0;
  let thisWeekCents = 0;
  let priorWeekCents = 0;

  for (const lead of leads) {
    const v = lead.estimated_value_cents || 0;
    totalCents += v;
    const createdMs = Date.parse(lead.created_at);
    if (Number.isNaN(createdMs)) continue;
    if (createdMs >= weekStart) thisWeekCents += v;
    else if (createdMs >= priorStart) priorWeekCents += v;
  }

  let weekDeltaPct: number | null = null;
  if (priorWeekCents > 0) {
    weekDeltaPct = Math.round(((thisWeekCents - priorWeekCents) / priorWeekCents) * 100);
  } else if (thisWeekCents > 0) {
    weekDeltaPct = 100; // "up from zero"
  }

  return { totalCents, thisWeekCents, priorWeekCents, weekDeltaPct };
}

// Formats cents into the compact dollar string shown in the mockup:
// $72.1k, $4.8k, $125.4k, $900. Always rounded; never truncated to 0.
export function formatMoneyCompact(cents: number): string {
  if (cents === 0) return "$0";
  const dollars = cents / 100;
  if (dollars >= 1000) {
    const k = dollars / 1000;
    // One decimal if < 100k, whole number otherwise.
    const formatted = k >= 100 ? Math.round(k).toString() : k.toFixed(1);
    return `$${formatted}k`;
  }
  return `$${Math.round(dollars)}`;
}

// ── Response-time logic ────────────────────────────────────────────────

export function isWaitingOnYou(lead: Lead): boolean {
  return lead.status === "lead" && !lead.first_response_at;
}

// Stale = still in-flight (no final Done/Customer) AND either never
// responded to OR last_activity_at is older than `hours`. Used for the
// Ava-mode "can't move forward" alert — we don't surface this in manual
// mode because the "waiting on you" card already covers it.
// Post-sale statuses (recovery, feedback, reviewed, referrer, …) are
// not "pipeline stale" — they belong to the Post-Sale rail and have
// their own attention triggers.
export function isStale(lead: Lead, nowMs: number = Date.now(), hours = 48): boolean {
  if (lead.status === "customer") return false;
  if (isPostSaleStatus(lead.status)) return false;
  const cutoff = nowMs - hours * 60 * 60 * 1000;
  const last = lead.last_activity_at ? Date.parse(lead.last_activity_at) : Date.parse(lead.created_at);
  return !Number.isNaN(last) && last < cutoff;
}

// Live timer. For a lead that hasn't been contacted yet, how many
// seconds has the contractor been sitting on it? Drives the "34m" /
// "1h" countup on uncontacted cards. Caller supplies `nowMs` so a
// single 1Hz heartbeat can re-render every card without each card
// running its own interval.
export function waitingElapsedSeconds(lead: Lead, nowMs: number): number {
  const createdMs = Date.parse(lead.created_at);
  if (Number.isNaN(createdMs)) return 0;
  return Math.max(0, Math.floor((nowMs - createdMs) / 1000));
}

// ── Aggregate speed-to-lead ───────────────────────────────────────────
// Average time (in seconds) it took to first-contact leads whose first
// response happened on or after `sinceMs`. Reads speed_to_lead_seconds
// directly — it's a generated column, so there's no on-the-fly math.
// Returns null when the window has no contacted leads (nothing to
// average), so the caller can render a sensible empty state.
export function avgSpeedToLead(leads: Lead[], sinceMs: number): number | null {
  let total = 0;
  let n = 0;
  for (const lead of leads) {
    if (lead.speed_to_lead_seconds == null) continue;
    if (!lead.first_response_at) continue;
    const respMs = Date.parse(lead.first_response_at);
    if (Number.isNaN(respMs) || respMs < sinceMs) continue;
    total += lead.speed_to_lead_seconds;
    n++;
  }
  return n === 0 ? null : Math.round(total / n);
}

export function leadsHandledSince(leads: Lead[], sinceMs: number): number {
  let n = 0;
  for (const lead of leads) {
    if (!lead.first_response_at) continue;
    const respMs = Date.parse(lead.first_response_at);
    if (!Number.isNaN(respMs) && respMs >= sinceMs) n++;
  }
  return n;
}

export function startOfTodayMs(nowMs: number = Date.now()): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ── Shared elapsed formatter ───────────────────────────────────────────
// Used by both the live waiting timer ("34m", "1h 14m") and the static
// speed-to-lead display ("in 8s"). Single formatter so the two read
// consistent everywhere in the UI.
export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h < 24) return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
