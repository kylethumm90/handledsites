/**
 * handled. Pipeline v2 — lead → ContactCard mapping helpers.
 *
 * Pure functions. No React. Safe to call from server or client.
 * Used by the `/contractor/customers` route (server component) and
 * the PipelineV2 client component.
 */

import type { Lead } from "@/lib/supabase";
import type { StageKey } from "@/lib/design-system";
import type { Contact } from "@/components/pipeline/contact-card";
import { formatElapsed, waitingElapsedSeconds } from "@/lib/pipeline";

// ---------------------------------------------------------------------------
// Status / stage mapping
// ---------------------------------------------------------------------------

/** Which of the 4 pipeline stages a lead falls into, or null if post-sale. */
export function pipelineStageFor(lead: Lead): StageKey | null {
  switch (lead.status) {
    case "lead":
      return "new";
    case "contacted":
      return "contacted";
    case "booked":
      return "appt_set";
    case "customer":
      return "job_done";
    default:
      return null;
  }
}

/**
 * Derive which post-sale stage a customer is currently in. Returns null
 * for leads that aren't customers yet.
 *
 * Rules (first match wins):
 *   1. sentiment_score < 60            → recovery  (≤2-star, unhappy)
 *   2. referral_opted_in_at present    → referrer  (most advanced state)
 *   3. review_submitted_at present     → reviewed  (public review on file)
 *   4. feedback_submitted_at present   → reviewed  (went through funnel)
 *   5. default customer                → feedback  (job done, not asked yet)
 */
export function postSaleStageFor(lead: Lead): StageKey | null {
  if (lead.status !== "customer") return null;

  if (lead.sentiment_score != null && lead.sentiment_score < 60) {
    return "recovery";
  }
  if (lead.referral_opted_in_at) return "referrer";
  if (lead.review_submitted_at) return "reviewed";
  if (lead.feedback_submitted_at) return "reviewed";
  return "feedback";
}

// ---------------------------------------------------------------------------
// Lead → Contact adapter
// ---------------------------------------------------------------------------

type BuildContactOpts = {
  /** Which view the card is being rendered in. Determines stage + extras. */
  view: "pipeline" | "post_sale";
  /** Is the AI team (Ava + Stella) live on this business? */
  aiTeamLive: boolean;
  /** Current time for computing wait times. */
  nowMs?: number;
};

export function leadToContact(
  lead: Lead,
  opts: BuildContactOpts,
): Contact | null {
  const stage =
    opts.view === "pipeline" ? pipelineStageFor(lead) : postSaleStageFor(lead);
  if (!stage) return null;

  const isRecovery = stage === "recovery";
  const source = humanizeSource(lead.source);
  const time = formatLeadTime(lead, stage);
  const jobType = lead.service_needed?.trim() || defaultJobType(stage);

  const aiHint =
    lead.ai_summary?.trim() || fallbackHint(stage, lead, isRecovery);

  // Base tier wait banner — pipeline view only, and only for leads
  // who are actually waiting on a response.
  const waitHours =
    opts.view === "pipeline" && !lead.first_response_at
      ? hoursSinceCreated(lead, opts.nowMs ?? Date.now())
      : undefined;

  // AI Team action line + contextual CTA. Only populated when the AI
  // team is live; the card component shows them only on that tier.
  const agentAction = opts.aiTeamLive
    ? agentActionFor(lead, stage)
    : undefined;
  const contextualCta = opts.aiTeamLive
    ? contextualCtaFor(lead, stage)
    : undefined;

  const contact: Contact = {
    id: lead.id,
    name: lead.name || "Unknown",
    stage,
    jobType,
    source,
    time,
    aiHint,
    waitHours,
    agentAction,
    contextualCta,
    recovery: isRecovery,
  };

  if (isRecovery && lead.sentiment_score != null) {
    // Display scale is 0-5 stars (see PRODUCT_SPEC.md). DB stores 0-100.
    contact.sentiment = Math.round((lead.sentiment_score / 20) * 10) / 10;
  }

  return contact;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function humanizeSource(source: string): string {
  if (!source) return "Direct";
  const clean = source.replace(/[_-]+/g, " ").trim();
  return clean
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function hoursSinceCreated(lead: Lead, nowMs: number): number {
  const seconds = waitingElapsedSeconds(lead, nowMs);
  return Math.max(0, Math.round(seconds / 3600));
}

function defaultJobType(stage: StageKey): string {
  switch (stage) {
    case "recovery":
    case "feedback":
    case "reviewed":
    case "referrer":
      return "Job complete";
    default:
      return "New inquiry";
  }
}

function fallbackHint(
  stage: StageKey,
  lead: Lead,
  isRecovery: boolean,
): string {
  if (isRecovery) {
    return "Sentiment score flagged low. Reach out today before a public review lands.";
  }
  switch (stage) {
    case "new":
      return `New lead from ${humanizeSource(lead.source)}. No response yet.`;
    case "contacted":
      return "Contacted but not yet booked. Follow up to keep momentum.";
    case "appt_set":
      return lead.appointment_at
        ? `Appointment on ${formatDate(lead.appointment_at)}.`
        : "Appointment booked.";
    case "job_done":
      return "Job complete. Feedback window is open.";
    case "feedback":
      return "Job complete. No feedback yet — a quick ask often converts.";
    case "reviewed":
      return "Positive review on file. Good candidate for a referral ask.";
    case "referrer":
      return "Enrolled in the referral program. Keep them warm.";
    default:
      return "";
  }
}

function agentActionFor(
  lead: Lead,
  stage: StageKey,
): Contact["agentAction"] {
  if (stage === "new" || stage === "contacted" || stage === "appt_set") {
    if (lead.speed_to_lead_seconds != null) {
      return {
        agent: "ava",
        text: `responded in ${formatElapsed(lead.speed_to_lead_seconds)}`,
      };
    }
    return { agent: "ava", text: "is drafting a response" };
  }
  if (stage === "job_done" || stage === "feedback") {
    return { agent: "stella", text: "will send a feedback request next" };
  }
  if (stage === "reviewed") {
    return { agent: "stella", text: "logged the review" };
  }
  if (stage === "referrer") {
    return { agent: "stella", text: "enrolled them in the referral program" };
  }
  if (stage === "recovery") {
    return { agent: "stella", text: "holding review request until you call" };
  }
  return undefined;
}

function contextualCtaFor(lead: Lead, stage: StageKey): string {
  const first = lead.name?.split(/\s+/)[0]?.toUpperCase() || "CUSTOMER";
  switch (stage) {
    case "new":
    case "contacted":
      return `CALL ${first}`;
    case "appt_set":
      return "VIEW APPOINTMENT";
    case "job_done":
    case "feedback":
      return "SEND FEEDBACK REQUEST";
    case "reviewed":
      return "ASK FOR REFERRAL";
    case "referrer":
      return "FOLLOW UP ON REFERRAL";
    case "recovery":
      return `CALL ${first}`;
    default:
      return `CALL ${first}`;
  }
}

function formatLeadTime(lead: Lead, stage: StageKey): string {
  // Pick the most meaningful timestamp for the given stage.
  let iso: string | null = null;
  switch (stage) {
    case "appt_set":
      iso = lead.appointment_at;
      break;
    case "job_done":
    case "feedback":
    case "reviewed":
    case "referrer":
    case "recovery":
      iso = lead.job_completed_at ?? lead.closed_at ?? lead.last_activity_at;
      break;
    default:
      iso = lead.created_at;
  }
  iso = iso || lead.created_at;
  return formatRelativeDate(iso);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
