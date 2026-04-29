"use client";

/**
 * handled. — ContactDetailModal
 *
 * Centered overlay modal that opens when a contact card on the Pipeline
 * screen is tapped. Soft, paper-like, mobile-first. Square corners,
 * DM Sans body + IBM Plex Mono for data, colors from design-system.ts.
 *
 * Sections (top → bottom):
 *   1. Top bar        — back, stage label, handled. watermark
 *   2. Name section   — avatar + name + job type / contract value
 *   3. AI context hint
 *   4. Primary CTA    — CALL [FIRST NAME]
 *   5. Secondary CTAs — TEXT + contextual action
 *   6. Contact info card
 *   7. AI Details     — expandable raw fields
 *   8. What Happened  — activity timeline
 *
 * The modal is presentation-only. The caller fetches activity_log entries
 * and passes them via `activities`.
 *
 * See docs/PRODUCT_SPEC.md "Contact Detail Modal" section and the
 * reference mockup at docs/mockups/pipeline-contact-modal.png.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { ActivityLogEntry, Employee, Lead, LeadStatus } from "@/lib/supabase";
import { colors, fonts, stageColors, type StageKey } from "@/lib/design-system";
import { pipelineStageFor, postSaleStageFor } from "@/lib/pipeline-v2";

type Props = {
  lead: Lead;
  /**
   * Optional explicit stage override. If omitted we derive from the lead:
   * post-sale stage for customers, pipeline stage otherwise.
   */
  stage?: StageKey;
  /**
   * Ordered activity_log entries for this lead (newest first or oldest first;
   * either is fine — the renderer displays in the order given). The modal is
   * presentation-only; the caller fetches these and passes them in.
   */
  activities?: ActivityLogEntry[];
  /**
   * Optional — called after a successful status advance so the parent can
   * refresh its data (e.g. router.refresh()). The modal already updates its
   * own local state so the top bar and footer reflect the change immediately.
   */
  onUpdate?: () => void;
  /**
   * Optional — called with the newly created activity_log row after the user
   * adds a note from the What Happened panel. The parent is expected to merge
   * it into whatever activity cache it's keeping so the modal stays in sync
   * without a full refresh.
   */
  onNoteAdded?: (entry: ActivityLogEntry) => void;
  /**
   * Per-partner stats (referral_code + counts + last activity) for this
   * lead, or null if the customer hasn't been enrolled. The parent rolls
   * this up server-side so the modal can render the activity card without
   * a per-open round trip.
   */
  referralStats?: ReferralStats | null;
  /**
   * Per-business reward amount in cents, used to personalize the nudge
   * template. Optional — the message degrades gracefully when null.
   */
  referralRewardCents?: number | null;
  /**
   * Used in the nudge template ("Hey Jess — share your link with anyone
   * who could use {businessName}"). Falls back to a generic line.
   */
  businessName?: string | null;
  /**
   * Optional — fired after the contractor taps "Make referral partner" and
   * the POST returns a code. Lets the parent seed a fresh stats row so a
   * close/reopen still shows the activity card (zero clicks/leads).
   */
  onReferralCodeChange?: (
    leadId: string,
    code: string,
    createdAt: string,
  ) => void;
  onClose: () => void;
};

/**
 * Mirror of the parent's ReferralStats shape — duplicated here to avoid a
 * circular dep between the pipeline module and this generic modal.
 */
export type ReferralStats = {
  referralCode: string;
  partnerSince: string;
  clicks: number;
  leads: number;
  lastActivityAt: string;
};

// Pipeline-only: status → next status (post-sale advancement is driven by
// customer-side events, not a manual flip, so it intentionally stops here).
const NEXT_STATUS: Record<LeadStatus, LeadStatus | null> = {
  lead: "contacted",
  contacted: "booked",
  booked: "customer",
  customer: null,
};

const NEXT_ADVANCE_LABEL: Record<LeadStatus, string> = {
  lead: "MARK CONTACTED",
  contacted: "MARK APPT SET",
  booked: "MARK JOB DONE",
  customer: "",
};

const PIPELINE_ORDER: StageKey[] = ["new", "contacted", "appt_set", "job_done"];

function isPipelineStage(stage: StageKey): boolean {
  return PIPELINE_ORDER.includes(stage);
}

const STAGE_LABELS: Record<StageKey, string> = {
  new: "NEW",
  contacted: "CONTACTED",
  appt_set: "APPT SET",
  job_done: "JOB DONE",
  recovery: "RECOVERY",
  feedback: "FEEDBACK",
  reviewed: "REVIEWED",
  referrer: "REFERRER",
};

function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function deriveStage(lead: Lead): StageKey {
  if (lead.status === "customer") {
    return postSaleStageFor(lead) ?? "job_done";
  }
  return pipelineStageFor(lead) ?? "new";
}

function formatContractValue(cents: number | null | undefined): string | null {
  if (cents == null || !Number.isFinite(cents) || cents <= 0) return null;
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

function humanizeSource(source: string | null | undefined): string {
  if (!source) return "Direct";
  const clean = source.replace(/[_-]+/g, " ").trim();
  return clean
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTimeLong(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function firstNameUpper(name: string): string {
  const first = (name || "").trim().split(/\s+/)[0];
  return first ? first.toUpperCase() : "CUSTOMER";
}

function fallbackAiContext(
  lead: Lead,
  stage: StageKey,
  liveSummary?: string | null,
): string {
  const summary = (liveSummary ?? lead.ai_summary)?.trim();
  if (summary) return summary;
  switch (stage) {
    case "new":
      return "New lead. No outreach yet — first response wins the job.";
    case "contacted":
      return "Contacted but not booked. Follow up to keep momentum.";
    case "appt_set":
      return lead.appointment_at
        ? "Appointment on the calendar. Confirm day-of to reduce no-shows."
        : "Appointment booked. Keep them warm until the visit.";
    case "job_done":
    case "feedback":
      return "Job complete. Good window for a feedback request.";
    case "reviewed":
      return "Left a positive review. Strong candidate for a referral ask.";
    case "referrer":
      return "Enrolled as a referral partner. Keep them engaged.";
    case "recovery":
      return "Sentiment flagged low. Call before a public review lands.";
    default:
      return "";
  }
}

function defaultJobTypeFor(stage: StageKey): string {
  if (
    stage === "recovery" ||
    stage === "feedback" ||
    stage === "reviewed" ||
    stage === "referrer" ||
    stage === "job_done"
  ) {
    return "Job complete";
  }
  return "New inquiry";
}

/**
 * Append an alpha byte to a 6-digit hex color. 10% ≈ 1A, 30% ≈ 4D.
 * Returns the original string if it's not in the expected shape.
 */
function withAlpha(hex: string, alpha: "1A" | "4D"): string {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return `${hex}${alpha}`;
  return hex;
}

export default function ContactDetailModal({
  lead,
  stage,
  activities,
  onUpdate,
  onNoteAdded,
  referralStats,
  referralRewardCents,
  businessName,
  onReferralCodeChange,
  onClose,
}: Props) {
  // Local status that we can optimistically advance without waiting on a
  // parent re-render. Initialized from the incoming lead, and reset if the
  // caller opens the modal on a different lead.
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>(lead.status);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  // Local mirror of the AI one-liner so the amber banner can update
  // instantly when a note or status change regenerates it server-side.
  // Resets whenever a different lead is opened or the underlying cached
  // summary changes on the lead prop (e.g. after router.refresh()).
  const [currentAiSummary, setCurrentAiSummary] = useState<string | null>(
    lead.ai_summary ?? null,
  );
  // Local patch for structured fields the AI extracted from a free-text
  // note (service name, estimated value, tags). Merged over the incoming
  // lead so the name section and AI Details refresh without a full reload.
  // Reset on lead change so we don't leak one customer's patch into
  // another's render.
  const [leadPatch, setLeadPatch] = useState<Partial<Lead>>({});
  // Local mirror of the parent-supplied stats. Lets the modal flip from
  // "Make referral partner" CTA → activity card the moment the POST
  // returns, without waiting for the parent to refetch. Reset whenever the
  // parent prop or the open lead changes so the right partner's numbers
  // win on reopen.
  const [stats, setStats] = useState<ReferralStats | null>(
    referralStats ?? null,
  );
  const [referralLoading, setReferralLoading] = useState(false);
  // "view" | "nudge" → shows the inline disclosure beneath the activity
  // card. Only one open at a time; tapping the active button collapses it.
  const [referralPanel, setReferralPanel] = useState<
    "view" | "nudge" | null
  >(null);
  const [referralCopied, setReferralCopied] = useState(false);
  // Note composer is a bottom-sheet now (AddNoteSheet); this just gates
  // its mount/unmount.
  const [composing, setComposing] = useState(false);
  const handleStartNote = () => setComposing(true);
  useEffect(() => {
    setCurrentStatus(lead.status);
    setAdvanceError(null);
    setCurrentAiSummary(lead.ai_summary ?? null);
    setLeadPatch({});
    setStats(referralStats ?? null);
    setReferralPanel(null);
    setReferralCopied(false);
  }, [lead.id, lead.status, lead.ai_summary, referralStats]);

  const effectiveLead = useMemo<Lead>(
    () => ({ ...lead, ...leadPatch }),
    [lead, leadPatch],
  );

  const resolvedStage = useMemo<StageKey>(() => {
    // Post-sale stages (recovery/feedback/reviewed/referrer) stick when the
    // caller explicitly passed one and we're still a customer — post-sale
    // advancement isn't status-driven, so we shouldn't flip back to "job_done".
    if (stage && !isPipelineStage(stage) && currentStatus === "customer") {
      return stage;
    }
    // Otherwise derive the pipeline stage live from the current status so
    // the top bar / footer reflect advancements the moment they happen.
    return (
      pipelineStageFor({ ...lead, status: currentStatus }) ??
      stage ??
      deriveStage(lead)
    );
  }, [stage, lead, currentStatus]);

  const stageColor = stageColors[resolvedStage].fg;
  const stageLabel = STAGE_LABELS[resolvedStage];
  const initials = useMemo(() => getInitials(lead.name), [lead.name]);
  const jobType =
    effectiveLead.service_needed?.trim() || defaultJobTypeFor(resolvedStage);
  const contractValue = formatContractValue(
    effectiveLead.job_value_cents ?? effectiveLead.estimated_value_cents,
  );
  const aiContext = fallbackAiContext(
    effectiveLead,
    resolvedStage,
    currentAiSummary,
  );
  // Primary CTA flips once the job is done: the contractor's next move is
  // no longer "pick up the phone" but "ask for a review". Keeps the modal's
  // top action aligned with where the lead is in the post-sale funnel.
  const primaryCtaLabel =
    resolvedStage === "job_done"
      ? "SEND FEEDBACK REQUEST"
      : `CALL ${firstNameUpper(lead.name)}`;

  const handleAdvance = async () => {
    const next = NEXT_STATUS[currentStatus];
    if (!next || advancing) return;
    setAdvancing(true);
    setAdvanceError(null);
    // Log the exact id we're about to send so we can eyeball it in devtools
    // when something goes wrong. Keeps the bug chase tight.
    console.log("[advance] PUT", {
      leadId: lead.id,
      leadBusinessId: lead.business_id,
      from: currentStatus,
      to: next,
    });
    try {
      const res = await fetch(`/api/contractor/customers/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setCurrentStatus(next);
        // Pick up the freshly-regenerated AI summary if the server
        // returned one. It's stage-aware, so the banner now reads
        // "next move" copy tailored to `next` instead of the previous
        // stage the moment the button is pressed. Also merge any
        // structured fields the AI pulled from notes (service name,
        // estimated value, tags) so the name section updates in place.
        try {
          const data = (await res.json()) as {
            ai_summary?: string | null;
            lead_patch?: Partial<Lead> | null;
          };
          if (data.ai_summary) setCurrentAiSummary(data.ai_summary);
          if (data.lead_patch) {
            setLeadPatch((prev) => ({ ...prev, ...data.lead_patch }));
          }
        } catch {
          /* body wasn't JSON — that's fine, just don't update the summary */
        }
        onUpdate?.();
      } else {
        // Surface the API's error message so failures aren't silent.
        let msg = `Couldn't advance (HTTP ${res.status})`;
        let debug: unknown = null;
        try {
          const data = (await res.json()) as {
            error?: string;
            code?: string;
            debug?: unknown;
          };
          if (data.error) msg = data.error;
          if (data.code) msg = `${msg} [${data.code}]`;
          debug = data.debug ?? null;
        } catch {
          /* body wasn't JSON */
        }
        console.error("advance failed:", msg, { debug, leadId: lead.id });
        setAdvanceError(msg);
      }
    } catch (err) {
      console.error("advance threw:", err);
      setAdvanceError("Network error — check your connection and try again.");
    } finally {
      setAdvancing(false);
    }
  };

  // Enroll the customer as a referral partner. Idempotent on the server:
  // re-tapping returns the same code, so a stale local state doesn't create
  // duplicate rows. On success we seed a fresh local stats row (zero
  // clicks/leads, "just now" last activity) and bubble the new code up so
  // the parent's cache stays in sync across closes/reopens.
  const handleMakeReferralPartner = async () => {
    if (referralLoading || stats) return;
    setReferralLoading(true);
    try {
      const res = await fetch("/api/contractor/referral-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ customer_id: lead.id }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { referral_code?: string };
      if (data.referral_code) {
        const nowIso = new Date().toISOString();
        const fresh: ReferralStats = {
          referralCode: data.referral_code,
          partnerSince: nowIso,
          clicks: 0,
          leads: 0,
          lastActivityAt: nowIso,
        };
        setStats(fresh);
        onReferralCodeChange?.(lead.id, data.referral_code, nowIso);
      }
    } catch {
      // Silent — the button stays so the contractor can retry.
    } finally {
      setReferralLoading(false);
    }
  };

  // Close on Escape + lock body scroll while the modal is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <>
      {/*
        Scoped keyframes for the fade/scale entrance. Kept inline so the
        modal is fully self-contained — no global CSS edit needed.
      */}
      <style>{`
        @keyframes handled-modal-fade-in {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes handled-modal-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${lead.name} — contact details`}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          animation: "handled-modal-backdrop-in 140ms ease-out",
        }}
      >
        <div
          // Clicks inside the panel must not bubble up to the backdrop.
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 640,
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: 0,
            fontFamily: fonts.body,
            color: colors.navy,
            animation: "handled-modal-fade-in 160ms ease-out",
            transformOrigin: "center center",
          }}
        >
          {/* Top bar — soft, white, with a thin stage-colored bottom rule */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "14px 20px",
              backgroundColor: colors.white,
              borderBottom: `1px solid ${stageColor}`,
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              style={{
                minWidth: 32,
                minHeight: 32,
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: fonts.body,
                fontSize: 20,
                lineHeight: 1,
                color: colors.muted,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              ←
            </button>

            <span
              style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: stageColor,
              }}
            >
              {stageLabel}
            </span>

            <span
              aria-hidden
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.01em",
                color: colors.mutedLight,
              }}
            >
              handled.
            </span>
          </div>

          {/* Scrollable body — everything between the fixed top bar and
              the fixed footer. flex:1 lets the footer pin to the bottom. */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >

          {/* Name section — avatar + name + job type / contract value */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "20px 20px 20px",
              backgroundColor: colors.white,
            }}
          >
            <div
              aria-hidden
              style={{
                width: 52,
                height: 52,
                flexShrink: 0,
                borderRadius: "50%",
                backgroundColor: withAlpha(stageColor, "1A"),
                border: `1px solid ${withAlpha(stageColor, "4D")}`,
                color: colors.navy,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.body,
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              {initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: fonts.body,
                  fontWeight: 700,
                  fontSize: 22,
                  lineHeight: 1.2,
                  color: colors.navy,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {lead.name || "Unknown"}
              </h2>
              <p
                style={{
                  margin: "4px 0 0",
                  fontFamily: fonts.body,
                  fontSize: 13,
                  lineHeight: 1.35,
                  color: colors.muted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {jobType}
                {contractValue ? (
                  <>
                    {" · "}
                    <span
                      style={{
                        fontFamily: fonts.mono,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {contractValue}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          {/* AI context hint — barely-warm panel, amber left rule */}
          {aiContext ? (
            <div
              style={{
                margin: "0 20px",
                padding: "10px 12px",
                backgroundColor: colors.amberBgSoft,
                borderLeft: `2px solid ${colors.amber}`,
                color: colors.muted,
                fontFamily: fonts.body,
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              {aiContext}
            </div>
          ) : null}

          {/* Primary CTA — full-width navy "CALL [FIRST NAME]" */}
          <div style={{ padding: "20px 20px 0" }}>
            <button
              type="button"
              style={{
                width: "100%",
                minHeight: 48,
                padding: "12px 16px",
                backgroundColor: colors.navy,
                color: colors.white,
                border: "none",
                borderRadius: 0,
                cursor: "pointer",
                fontFamily: fonts.body,
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {primaryCtaLabel}
            </button>
          </div>

          {/* Secondary CTAs — two half-width muted buttons */}
          <div
            style={{
              padding: "8px 20px 20px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <button
              type="button"
              style={{
                minHeight: 44,
                padding: "12px 16px",
                backgroundColor: colors.white,
                color: colors.muted,
                border: `1px solid ${colors.border}`,
                borderRadius: 0,
                cursor: "pointer",
                fontFamily: fonts.body,
                fontWeight: 500,
                fontSize: 13,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              TEXT
            </button>
            <button
              type="button"
              onClick={handleStartNote}
              style={{
                minHeight: 44,
                padding: "12px 16px",
                backgroundColor: colors.navy,
                color: colors.white,
                border: "none",
                borderRadius: 0,
                cursor: "pointer",
                fontFamily: fonts.body,
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              + Add Note
            </button>
          </div>

          {/* Contact info card — quiet rows of metadata */}
          <ContactInfoCard lead={lead} />

          {/* Rep assignment dropdown (independent of referral). */}
          <AssignSection
            lead={effectiveLead}
            onEmployeeChanged={(employeeId) =>
              setLeadPatch((prev) => ({ ...prev, employee_id: employeeId }))
            }
          />

          {/* Referral partner — activity card once enrolled (clicks, leads,
              last activity, View link / Send nudge), otherwise the "Make
              referral partner" CTA. Only shown post-sale. */}
          {currentStatus === "customer" ? (
            <ReferralPartnerSection
              stats={stats}
              loading={referralLoading}
              copied={referralCopied}
              activePanel={referralPanel}
              firstName={(lead.name || "").trim().split(/\s+/)[0] || "there"}
              businessName={businessName ?? null}
              rewardCents={referralRewardCents ?? null}
              onMakePartner={handleMakeReferralPartner}
              onTogglePanel={(panel) =>
                setReferralPanel((prev) => (prev === panel ? null : panel))
              }
              onCopy={(text) => {
                navigator.clipboard.writeText(text);
                setReferralCopied(true);
                window.setTimeout(() => setReferralCopied(false), 1500);
              }}
            />
          ) : null}

          {/* AI Details — expandable structured fields the AI extracted.
              Pass `effectiveLead` so fields the note-time extractor just
              filled show up immediately without a reload. */}
          <AiDetailsSection lead={effectiveLead} />

          {/* What Happened — quiet activity timeline */}
          <WhatHappenedTimeline
            activities={activities ?? []}
            onStartComposing={handleStartNote}
          />

          </div>
          {/* /scrollable body */}

          {/* Pipeline progress footer — sticks to the bottom of the panel */}
          <PipelineFooter
            currentStatus={currentStatus}
            resolvedStage={resolvedStage}
            advancing={advancing}
            advanceError={advanceError}
            onAdvance={handleAdvance}
          />
        </div>
      </div>

      {/* Bottom-sheet note composer — floats above the modal panel. */}
      {composing && (
        <AddNoteSheet
          leadId={lead.id}
          contactName={lead.name}
          stage={resolvedStage}
          onClose={() => setComposing(false)}
          onNoteAdded={onNoteAdded}
          onAiSummaryUpdated={(summary) => setCurrentAiSummary(summary)}
          onLeadPatched={(patch) =>
            setLeadPatch((prev) => ({ ...prev, ...patch }))
          }
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Pipeline footer — 4-stage progress strip + advance button
// ---------------------------------------------------------------------------

function PipelineFooter({
  currentStatus,
  resolvedStage,
  advancing,
  advanceError,
  onAdvance,
}: {
  currentStatus: LeadStatus;
  resolvedStage: StageKey;
  advancing: boolean;
  advanceError: string | null;
  onAdvance: () => void;
}) {
  const inPipeline = isPipelineStage(resolvedStage);
  const currentIndex = inPipeline
    ? PIPELINE_ORDER.indexOf(resolvedStage)
    : PIPELINE_ORDER.length; // post-sale = "past the end"
  const nextLabel = NEXT_ADVANCE_LABEL[currentStatus];
  const nextStatus = NEXT_STATUS[currentStatus];
  const showAdvance = inPipeline && nextStatus !== null;

  return (
    <div
      style={{
        flexShrink: 0,
        padding: "14px 20px 16px",
        backgroundColor: colors.bg,
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: colors.mutedLight,
          marginBottom: 10,
        }}
      >
        Pipeline Stage
      </div>

      {/* 4-dot progress strip */}
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          alignItems: "start",
          marginBottom: showAdvance ? 14 : 4,
        }}
      >
        {/* Connector track behind the dots */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 5,
            left: `calc(${100 / 8}% + 6px)`,
            right: `calc(${100 / 8}% + 6px)`,
            height: 1.5,
            backgroundColor: colors.borderLight,
          }}
        />

        {PIPELINE_ORDER.map((key, i) => {
          const past = i < currentIndex;
          const active = i === currentIndex;
          const color = stageColors[key].fg;
          return (
            <div
              key={key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                position: "relative",
                zIndex: 1,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: active
                    ? color
                    : past
                      ? colors.mutedLight
                      : colors.white,
                  border: `1.5px solid ${
                    active ? color : past ? colors.mutedLight : colors.border
                  }`,
                }}
              />
              <span
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: active
                    ? color
                    : past
                      ? colors.muted
                      : colors.mutedLight,
                  textAlign: "center",
                  lineHeight: 1.1,
                }}
              >
                {STAGE_LABELS[key]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Advance button — pipeline only */}
      {showAdvance ? (
        <button
          type="button"
          onClick={onAdvance}
          disabled={advancing}
          style={{
            width: "100%",
            minHeight: 44,
            padding: "12px 16px",
            backgroundColor: advancing ? colors.mutedLight : colors.navy,
            color: colors.white,
            border: "none",
            borderRadius: 0,
            cursor: advancing ? "default" : "pointer",
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {advancing ? "SAVING…" : `${nextLabel} →`}
        </button>
      ) : null}

      {/* Error surface — quiet, muted red line under the button */}
      {advanceError ? (
        <div
          style={{
            marginTop: 10,
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.alertMuted,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          {advanceError}
        </div>
      ) : null}

      {/* Post-sale / terminal state — quiet informational line */}
      {!showAdvance ? (
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.muted,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          {inPipeline
            ? "Customer. Advancement is driven by post-sale activity."
            : "Post-sale — advancement happens as the customer responds."}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Referral partner — when enrolled, renders the activity card (Active since
// · Sharing pill · Clicks · Leads · Last activity · View link · Send nudge).
// Otherwise renders the "Make referral partner" CTA. Render decision is
// driven entirely by the `stats` prop, so both a fresh server fetch and a
// just-finished POST flow through the same path.
// ---------------------------------------------------------------------------

function ReferralPartnerSection({
  stats,
  loading,
  copied,
  activePanel,
  firstName,
  businessName,
  rewardCents,
  onMakePartner,
  onTogglePanel,
  onCopy,
}: {
  stats: ReferralStats | null;
  loading: boolean;
  copied: boolean;
  activePanel: "view" | "nudge" | null;
  firstName: string;
  businessName: string | null;
  rewardCents: number | null;
  onMakePartner: () => void;
  onTogglePanel: (panel: "view" | "nudge") => void;
  onCopy: (text: string) => void;
}) {
  if (!stats) {
    return (
      <div style={{ padding: "0 20px 20px" }}>
        <button
          type="button"
          onClick={onMakePartner}
          disabled={loading}
          style={{
            width: "100%",
            minHeight: 44,
            padding: "12px 16px",
            backgroundColor: colors.white,
            color: colors.muted,
            border: `1px solid ${colors.border}`,
            borderRadius: 0,
            cursor: loading ? "default" : "pointer",
            fontFamily: fonts.body,
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Creating…" : "Make referral partner"}
        </button>
      </div>
    );
  }

  // Build the share URL only on the client — window is unavailable during
  // the initial server render the modal still gets bundled into.
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/refer/${stats.referralCode}`
      : `/refer/${stats.referralCode}`;

  // Nudge template — degrades gracefully when reward / business name are
  // missing. Once Twilio is wired this becomes the SMS body; today the
  // contractor copies it and texts manually.
  const rewardDollars =
    typeof rewardCents === "number" && rewardCents > 0
      ? Math.round(rewardCents / 100)
      : null;
  const businessLabel = businessName?.trim() || "us";
  const nudgeMessage = rewardDollars
    ? `Hey ${firstName} — quick reminder: every friend you send our way earns you $${rewardDollars}. Your link: ${shareUrl}`
    : `Hey ${firstName} — friendly nudge to share your referral link with anyone who could use ${businessLabel}. Your link: ${shareUrl}`;

  return (
    <div style={{ padding: "0 20px 20px" }}>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: colors.mutedLight,
          marginBottom: 10,
        }}
      >
        Referral Activity
      </div>

      <div
        style={{
          backgroundColor: colors.white,
          border: `1px solid ${colors.borderLight}`,
          padding: "14px 16px",
        }}
      >
        {/* Header row: "Active partner since X"  +  Sharing pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 13,
              fontWeight: 700,
              color: colors.navy,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Active partner since {formatShortDate(stats.partnerSince)}
          </div>
          <div
            aria-label="Sharing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 8px",
              border: `1px solid ${colors.greenBg}`,
              backgroundColor: colors.greenBg,
              color: colors.green,
              fontFamily: fonts.body,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.02em",
              flexShrink: 0,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: colors.green,
              }}
            />
            Sharing
          </div>
        </div>

        {/* Stats grid: Clicks · Leads. Shares dropped — no tracking yet. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <StatTile label="Clicks" value={stats.clicks} />
          <StatTile label="Leads" value={stats.leads} />
        </div>

        {/* Footer row: last activity (left) · View link / Send nudge (right) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              color: colors.muted,
            }}
          >
            Last activity {formatRelativeShort(stats.lastActivityAt)}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <ActivityButton
              label="View link"
              active={activePanel === "view"}
              onClick={() => onTogglePanel("view")}
            />
            <ActivityButton
              label="Send nudge"
              active={activePanel === "nudge"}
              onClick={() => onTogglePanel("nudge")}
            />
          </div>
        </div>
      </div>

      {/* Inline disclosure — copy-pastable URL or nudge message. Stays
          inside the same section so the contractor doesn't lose context. */}
      {activePanel ? (
        <DisclosurePanel
          label={activePanel === "view" ? "Referral link" : "Nudge message"}
          body={activePanel === "view" ? shareUrl : nudgeMessage}
          mono={activePanel === "view"}
          copied={copied}
          onCopy={() =>
            onCopy(activePanel === "view" ? shareUrl : nudgeMessage)
          }
        />
      ) : null}
    </div>
  );
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.borderLight}`,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: 22,
          lineHeight: 1,
          color: colors.navy,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ActivityButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: "6px 12px",
        backgroundColor: active ? colors.navy : "transparent",
        color: active ? colors.white : colors.navy,
        border: `1px solid ${active ? colors.navy : colors.border}`,
        borderRadius: 0,
        cursor: "pointer",
        fontFamily: fonts.body,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </button>
  );
}

function DisclosurePanel({
  label,
  body,
  mono,
  copied,
  onCopy,
}: {
  label: string;
  body: string;
  mono: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div
      style={{
        marginTop: 8,
        backgroundColor: colors.white,
        border: `1px solid ${colors.borderLight}`,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: colors.mutedLight,
          }}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={onCopy}
          style={{
            padding: "2px 8px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: fonts.body,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: copied ? colors.green : colors.muted,
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div
        style={{
          fontFamily: mono ? fonts.mono : fonts.body,
          fontSize: mono ? 12 : 13,
          lineHeight: 1.45,
          color: colors.navy,
          whiteSpace: mono ? "nowrap" : "normal",
          overflowWrap: mono ? "normal" : "break-word",
          overflow: mono ? "hidden" : "visible",
          textOverflow: mono ? "ellipsis" : "clip",
          userSelect: "text",
        }}
      >
        {body}
      </div>
    </div>
  );
}

// "Apr 24" — small chip label on the activity card header. Uses local time
// since the contractor is the audience.
function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// "just now" / "5h ago" / "3d ago" / "Apr 12". Avoids the heavier intl
// relative formatter — the activity card just needs a glanceable stamp.
function formatRelativeShort(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = Date.now() - then;
  if (diffMs < 60_000) return "just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// AI Details — discreet expandable block of raw extracted fields
// ---------------------------------------------------------------------------

function AiDetailsSection({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);

  // Merge all the structured metadata the AI has on this lead. The core
  // extracted fields (service / value / tags / notes) come first so they
  // always read cleanly at the top — these are the fields the note-time
  // extractor fills in from free-text notes, and the contractor needs a
  // stable place to find them. Then `raw_import_data` (CSV import rows)
  // and `answers` (quiz-funnel responses) fill in the rest. Duplicate
  // keys from answers win (funnel data is the freshest signal).
  const fields = useMemo<Array<[string, string]>>(() => {
    const ordered: Array<[string, string]> = [];
    const usedKeys = new Set<string>();

    const pushCore = (label: string, value: string | null | undefined) => {
      if (value == null) return;
      const str = String(value).trim();
      if (!str) return;
      ordered.push([label, str]);
      usedKeys.add(label.toLowerCase());
    };

    if (lead.service_needed) pushCore("Service needed", lead.service_needed);
    if (
      lead.estimated_value_cents != null &&
      Number.isFinite(lead.estimated_value_cents) &&
      lead.estimated_value_cents > 0
    ) {
      const dollars = (lead.estimated_value_cents / 100).toLocaleString(
        "en-US",
        {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        },
      );
      pushCore("Estimated value", dollars);
    }
    if (lead.tags && lead.tags.length > 0) {
      pushCore("Tags", lead.tags.join(", "));
    }
    if (lead.notes) pushCore("Notes", lead.notes);

    const merged: Record<string, string> = {};
    if (lead.raw_import_data) {
      for (const [k, v] of Object.entries(lead.raw_import_data)) {
        if (v != null && String(v).trim() !== "") merged[k] = String(v);
      }
    }
    if (lead.answers) {
      for (const [k, v] of Object.entries(lead.answers)) {
        if (v != null && String(v).trim() !== "") merged[k] = String(v);
      }
    }
    for (const [k, v] of Object.entries(merged)) {
      // Skip anything that would duplicate a core field (e.g. a CSV column
      // literally named "Service needed").
      if (usedKeys.has(k.toLowerCase())) continue;
      ordered.push([k, v]);
    }

    return ordered;
  }, [
    lead.service_needed,
    lead.estimated_value_cents,
    lead.tags,
    lead.notes,
    lead.answers,
    lead.raw_import_data,
  ]);

  if (fields.length === 0) return null;

  return (
    <div style={{ padding: "0 20px 20px" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "10px 12px",
          backgroundColor: colors.white,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: 0,
          cursor: "pointer",
          fontFamily: fonts.body,
          fontSize: 12,
          fontWeight: 600,
          color: colors.muted,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden style={{ color: colors.amber, fontSize: 13 }}>
            ⚡
          </span>
          AI Details — {fields.length}{" "}
          {fields.length === 1 ? "field" : "fields"}
        </span>
        <span
          aria-hidden
          style={{
            display: "inline-block",
            color: colors.mutedLight,
            fontSize: 12,
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 120ms ease",
          }}
        >
          ›
        </span>
      </button>

      {open ? (
        <div
          style={{
            marginTop: -1,
            backgroundColor: colors.white,
            border: `1px solid ${colors.borderLight}`,
            borderTop: "none",
            padding: "4px 12px",
          }}
        >
          {fields.map(([key, value], i) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "8px 0",
                borderBottom:
                  i === fields.length - 1
                    ? "none"
                    : `1px solid ${colors.borderLight}`,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  minWidth: 110,
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: colors.mutedLight,
                  lineHeight: 1.4,
                  paddingTop: 1,
                }}
              >
                {key}
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: colors.muted,
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact info card
// ---------------------------------------------------------------------------

type InfoRowData = {
  icon: string;
  label: string;
  pill?: string;
  mono?: boolean;
};

function ContactInfoCard({ lead }: { lead: Lead }) {
  const phone = formatPhone(lead.phone);
  const email = lead.email?.trim() || "";
  const sourceLabel = humanizeSource(lead.source);
  const createdLabel = formatDateLong(lead.created_at);
  const appointmentLabel = formatDateTimeLong(lead.appointment_at);
  const isReferral =
    !!lead.referred_by_lead_id ||
    /referr|refer_/i.test(lead.source || "");

  // Review status line — pick the strongest signal we have.
  let reviewLine: string | null = null;
  if (lead.review_submitted_at) {
    reviewLine = `Review submitted · ${formatDateLong(lead.review_submitted_at)}`;
  } else if (lead.feedback_submitted_at) {
    const sentimentBit =
      lead.sentiment_score != null
        ? ` · sentiment ${(lead.sentiment_score / 20).toFixed(1)}/5`
        : "";
    reviewLine = `Feedback submitted${sentimentBit}`;
  } else if (lead.sentiment_score != null && lead.sentiment_score < 60) {
    reviewLine = `Sentiment flagged · ${(lead.sentiment_score / 20).toFixed(1)}/5`;
  }

  // Build the row list once so we can cleanly drop the last divider.
  const rows: InfoRowData[] = [];
  if (phone) rows.push({ icon: "☏", label: phone, pill: "CALL", mono: true });
  if (email) rows.push({ icon: "✉", label: email, pill: "EMAIL" });
  if (sourceLabel || createdLabel) {
    rows.push({
      icon: "◎",
      label: [sourceLabel, createdLabel].filter(Boolean).join(" · "),
    });
  }
  if (isReferral) {
    rows.push({ icon: "↗", label: "Referred by a previous customer" });
  }
  if (appointmentLabel) {
    rows.push({ icon: "◷", label: `Appointment · ${appointmentLabel}` });
  }
  if (reviewLine) rows.push({ icon: "★", label: reviewLine });

  if (rows.length === 0) return null;

  return (
    <div style={{ padding: "0 20px 20px" }}>
      <div
        style={{
          backgroundColor: colors.white,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: 0,
          padding: "4px 14px",
        }}
      >
        {rows.map((row, i) => (
          <InfoRow
            key={`${row.icon}-${row.label}`}
            {...row}
            isLast={i === rows.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assigned-to select + Make referral partner
// ---------------------------------------------------------------------------

function AssignSection({
  lead,
  onEmployeeChanged,
}: {
  lead: Lead;
  onEmployeeChanged: (employeeId: string | null) => void;
}) {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [assigned, setAssigned] = useState<string | null>(
    lead.employee_id ?? null,
  );
  const [savingAssign, setSavingAssign] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/contractor/employees", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as Employee[];
        if (!cancelled) setEmployees(data ?? []);
      } catch {
        /* modal still renders without the dropdown */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setAssigned(lead.employee_id ?? null);
  }, [lead.employee_id]);

  if (employees === null || employees.length === 0) return null;

  const handleAssign = async (empId: string | null) => {
    setSavingAssign(true);
    setAssignError(null);
    const prev = assigned;
    setAssigned(empId);
    try {
      const res = await fetch(`/api/contractor/customers/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ employee_id: empId }),
      });
      if (!res.ok) {
        setAssigned(prev);
        setAssignError("Couldn't save assignment.");
        return;
      }
      onEmployeeChanged(empId);
    } catch {
      setAssigned(prev);
      setAssignError("Couldn't save assignment.");
    } finally {
      setSavingAssign(false);
    }
  };

  return (
    <div style={{ padding: "8px 20px 4px" }}>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: colors.mutedLight,
          marginBottom: 8,
        }}
      >
        Assigned To
      </div>
      <select
        value={assigned ?? ""}
        disabled={savingAssign}
        onChange={(e) => handleAssign(e.target.value || null)}
        style={{
          width: "100%",
          padding: "12px 14px",
          border: `1px solid ${colors.border}`,
          background: colors.white,
          fontSize: 14,
          fontWeight: 600,
          color: assigned ? colors.navy : colors.muted,
          fontFamily: fonts.body,
          borderRadius: 0,
          cursor: savingAssign ? "wait" : "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 14px center",
        }}
      >
        <option value="">Unassigned</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </select>
      {assignError && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: colors.red,
            fontFamily: fonts.body,
          }}
        >
          {assignError}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  pill,
  mono,
  isLast,
}: InfoRowData & { isLast?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        borderBottom: isLast ? "none" : `1px solid ${colors.borderLight}`,
        fontFamily: fonts.body,
        fontSize: 13,
        color: colors.muted,
        lineHeight: 1.35,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 16,
          flexShrink: 0,
          color: colors.mutedLight,
          fontSize: 13,
          textAlign: "center",
        }}
      >
        {icon}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontFamily: mono ? fonts.mono : fonts.body,
          fontVariantNumeric: mono ? "tabular-nums" : "normal",
          color: colors.muted,
        }}
      >
        {label}
      </span>
      {pill ? (
        <span
          style={{
            flexShrink: 0,
            padding: "3px 7px",
            backgroundColor: colors.bg,
            color: colors.mutedLight,
            fontFamily: fonts.mono,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            border: `1px solid ${colors.borderLight}`,
          }}
        >
          {pill}
        </span>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// What Happened — activity timeline
// ---------------------------------------------------------------------------

/**
 * Is this entry an "alert" — something the contractor should feel, not just
 * a log line? These are rendered in a muted alert color (red-ish) instead of
 * the normal muted gray.
 */
function isAlertEntry(entry: ActivityLogEntry): boolean {
  const type = entry.type?.toLowerCase() || "";
  if (
    type.includes("alert") ||
    type.includes("warning") ||
    type.includes("recovery") ||
    type === "no_response"
  ) {
    return true;
  }
  const summary = entry.summary?.toLowerCase() || "";
  return (
    summary.startsWith("no response") ||
    summary.includes("waiting ") ||
    summary.includes("flagged")
  );
}

/**
 * Map an activity type / agent to a base dot color. Kept in sync with the
 * palette used by the old CustomerDetailClient so existing entries look
 * consistent when a lead is opened in the new modal.
 */
function entryBaseColor(entry: ActivityLogEntry): string {
  if (isAlertEntry(entry)) return colors.red;
  if (entry.agent) return colors.green; // Ava / Stella actions
  const type = entry.type?.toLowerCase() || "";
  if (type === "review_request_sent") return colors.amber;
  if (type === "review_received") return colors.green;
  if (type === "referral_opt_in") return colors.purple;
  if (type === "referral_partner_created") return colors.purple;
  if (type === "employee_assigned") return colors.blue;
  if (type === "status_change") return colors.blue;
  if (type === "lead_created") return colors.amber;
  const summary = entry.summary?.toLowerCase() || "";
  if (summary.includes("intent") || summary.includes("wants")) return colors.amber;
  return colors.blue;
}

function formatTimelineStamp(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** User-authored note from the Add Note composer (vs Ava/Stella/system). */
function isUserNote(entry: ActivityLogEntry): boolean {
  return entry.type === "user_note";
}

// ---------------------------------------------------------------------------
// Add Note bottom sheet
// ---------------------------------------------------------------------------

const ADD_NOTE_PLACEHOLDERS: Partial<Record<StageKey, string>> = {
  new: "What's the context on this lead?",
  contacted: "How'd the call go?",
  appt_set: "What's planned for the appointment?",
  job_done: "What happened on the job?",
  feedback: "What did they say?",
  reviewed: "Any review follow-up notes?",
  referrer: "What's the referral update?",
  recovery: "What's going on with the customer?",
};

// Minimal subset of the Web Speech API we actually call.
type SpeechRecognitionResultShape = {
  readonly isFinal: boolean;
  readonly length: number;
  readonly 0: { readonly transcript: string };
};
type SpeechRecognitionEventShape = {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechRecognitionResultShape>;
};
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventShape) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function AddNoteSheet({
  leadId,
  contactName,
  stage,
  onClose,
  onNoteAdded,
  onAiSummaryUpdated,
  onLeadPatched,
}: {
  leadId: string;
  contactName: string;
  stage: StageKey;
  onClose: () => void;
  onNoteAdded?: (entry: ActivityLogEntry) => void;
  onAiSummaryUpdated?: (summary: string) => void;
  onLeadPatched?: (patch: Partial<Lead>) => void;
}) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const draftBeforeRecordRef = useRef<string>("");

  const placeholder = ADD_NOTE_PLACEHOLDERS[stage] ?? "What do you want to remember?";
  const stageLabel = STAGE_LABELS[stage];

  useEffect(() => {
    setSpeechSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  // Lock body scroll while the sheet is open. The modal already does this;
  // we layer ours so closing the sheet doesn't accidentally release it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const handleSave = async () => {
    const summary = draft.trim();
    if (!summary || saving) return;
    setSaving(true);
    setError(null);
    // Stop any active dictation so its final result isn't racing with save.
    recognitionRef.current?.stop();
    try {
      const res = await fetch(`/api/contractor/customers/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ summary }),
      });
      if (!res.ok) {
        let msg = `Couldn't save note (HTTP ${res.status})`;
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) msg = data.error;
        } catch {
          /* not JSON */
        }
        setError(msg);
        return;
      }
      const entry = (await res.json()) as ActivityLogEntry & {
        ai_summary?: string | null;
        lead_patch?: Partial<Lead> | null;
      };
      onNoteAdded?.(entry);
      if (entry.ai_summary) onAiSummaryUpdated?.(entry.ai_summary);
      if (entry.lead_patch) onLeadPatched?.(entry.lead_patch);
      onClose();
    } catch (err) {
      console.error("add note threw:", err);
      setError("Network error — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    draftBeforeRecordRef.current = draft;
    recognition.onresult = (event) => {
      let interim = "";
      let finalAdd = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const r = event.results[i];
        const chunk = r[0].transcript;
        if (r.isFinal) finalAdd += chunk;
        else interim += chunk;
      }
      const base = draftBeforeRecordRef.current;
      const combined = `${base}${base && (finalAdd || interim) ? " " : ""}${finalAdd}${
        finalAdd && interim ? " " : ""
      }${interim}`;
      setDraft(combined);
      if (finalAdd) {
        draftBeforeRecordRef.current = `${base}${base ? " " : ""}${finalAdd}`.trimEnd();
      }
    };
    recognition.onend = () => {
      setRecording(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setRecording(false);
      recognitionRef.current = null;
    };
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes handled-sheet-in {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes handled-sheet-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes handled-mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.45); }
          50% { box-shadow: 0 0 0 10px rgba(220,38,38,0); }
        }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add note"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1100,
          backgroundColor: "rgba(15,23,42,0.45)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          animation: "handled-sheet-backdrop-in 140ms ease-out",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 640,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: colors.white,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            boxShadow: "0 -8px 32px rgba(15,23,42,0.18)",
            fontFamily: fonts.body,
            color: colors.navy,
            animation: "handled-sheet-in 220ms cubic-bezier(0.2,0.9,0.25,1)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* Drag handle */}
          <div
            aria-hidden
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "8px 0 0",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: colors.borderLight,
              }}
            />
          </div>

          {/* Header */}
          <div
            style={{
              padding: "10px 20px 8px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: 15,
                  fontWeight: 700,
                  color: colors.navy,
                  lineHeight: 1.2,
                }}
              >
                Add note
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontFamily: fonts.body,
                  fontSize: 12,
                  color: colors.muted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {contactName} · {stageLabel}
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                padding: 4,
                cursor: "pointer",
                fontSize: 20,
                lineHeight: 1,
                color: colors.muted,
              }}
            >
              ×
            </button>
          </div>

          {/* Textarea */}
          <div style={{ padding: "6px 20px 0" }}>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                draftBeforeRecordRef.current = e.target.value;
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void handleSave();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  onClose();
                }
              }}
              placeholder={placeholder}
              rows={5}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                fontFamily: fonts.body,
                fontSize: 15,
                lineHeight: 1.5,
                color: colors.navy,
                resize: "none",
                outline: "none",
                minHeight: 140,
              }}
            />
            {error ? (
              <div
                style={{
                  marginTop: 8,
                  fontFamily: fonts.body,
                  fontSize: 12,
                  color: colors.red,
                }}
              >
                {error}
              </div>
            ) : null}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: fonts.body,
                fontSize: 11,
                color: colors.mutedLight,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: recording ? colors.red : colors.mutedLight,
                }}
              />
              <span>
                {recording
                  ? "Listening… tap the mic to stop."
                  : "AI will extract tags & next step."}
              </span>
            </div>
          </div>

          {/* Footer: mic left, save right */}
          <div
            style={{
              padding: "14px 20px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={toggleRecording}
              disabled={!speechSupported || saving}
              aria-pressed={recording}
              aria-label={recording ? "Stop dictation" : "Dictate note"}
              title={
                speechSupported
                  ? recording
                    ? "Stop dictation"
                    : "Dictate note"
                  : "Voice input isn't supported in this browser"
              }
              style={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 999,
                border: `1px solid ${recording ? colors.red : colors.border}`,
                background: recording ? colors.red : colors.white,
                color: recording ? colors.white : colors.navy,
                cursor: !speechSupported ? "not-allowed" : "pointer",
                opacity: !speechSupported ? 0.4 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: recording
                  ? "handled-mic-pulse 1.4s ease-in-out infinite"
                  : "none",
                transition: "background 160ms ease, color 160ms ease, border-color 160ms ease",
              }}
            >
              <MicIcon size={18} />
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !draft.trim()}
              style={{
                flex: 1,
                minHeight: 44,
                padding: "12px 16px",
                backgroundColor: colors.navy,
                color: colors.white,
                border: "none",
                borderRadius: 999,
                cursor: saving || !draft.trim() ? "default" : "pointer",
                opacity: saving || !draft.trim() ? 0.55 : 1,
                fontFamily: fonts.body,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              {saving ? "Saving…" : "Save note"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function MicIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// What Happened — quiet activity timeline
// ---------------------------------------------------------------------------

function WhatHappenedTimeline({
  activities,
  onStartComposing,
}: {
  activities: ActivityLogEntry[];
  onStartComposing: () => void;
}) {
  // API returns oldest → newest for the chronological "story" read. The modal
  // inverts that so the contractor lands on the most recent activity first —
  // they care about "what just happened" more than "how this lead started".
  const ordered = useMemo(() => [...activities].reverse(), [activities]);

  return (
    <div style={{ padding: "0 20px 24px" }}>
      {/* Section header with a quiet "+ Add note" text link on the right.
          The prominent add-note CTA lives in the modal's secondary action
          row; this is just a convenience repeat in context. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: colors.mutedLight,
          }}
        >
          What Happened
        </div>
        <button
          type="button"
          onClick={onStartComposing}
          style={{
            background: "transparent",
            color: colors.muted,
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: fonts.body,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: 0,
            textTransform: "none",
          }}
        >
          + Add note
        </button>
      </div>

      {ordered.length === 0 ? (
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.mutedLight,
            lineHeight: 1.4,
          }}
        >
          Nothing yet. Add a note to start tracking this customer.
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          {/* Vertical connector line running through the dots.
              Line center at x=5.75 aligns with dot center at x=6. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 5,
              top: 6,
              bottom: 6,
              width: 1.5,
              backgroundColor: colors.borderLight,
            }}
          />

          {ordered.map((entry, i) => {
            const userNote = isUserNote(entry);
            const alert = isAlertEntry(entry);
            const dotColor = userNote ? colors.navy : entryBaseColor(entry);
            // User notes read at full navy strength to signal "this is YOU
            // talking, not the system". Alerts stay in muted red. Everything
            // else stays in the quiet gray it was before.
            const textColor = userNote
              ? colors.navy
              : alert
                ? colors.alertMuted
                : colors.muted;
            return (
              <div
                key={entry.id || `${entry.type}-${i}`}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  paddingLeft: 0,
                  paddingBottom: i === ordered.length - 1 ? 0 : 14,
                }}
              >
                {/* Dot — a white "donut" wrapper masks the connector line so
                    the softened colored dot reads cleanly. No shadows.
                    User notes render at full opacity so they pop. */}
                <span
                  aria-hidden
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: 12,
                    height: 12,
                    flexShrink: 0,
                    marginTop: 2,
                    backgroundColor: colors.white,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: dotColor,
                      opacity: userNote ? 1 : alert ? 0.4 : 0.35,
                      borderRadius: "50%",
                    }}
                  />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {userNote ? (
                    <span
                      style={{
                        display: "inline-block",
                        marginRight: 6,
                        padding: "1px 6px",
                        backgroundColor: colors.navy,
                        color: colors.white,
                        fontFamily: fonts.body,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        verticalAlign: "2px",
                      }}
                    >
                      Note
                    </span>
                  ) : null}
                  <span
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 13,
                      lineHeight: 1.4,
                      fontWeight: userNote ? 500 : 400,
                      color: textColor,
                      wordBreak: "break-word",
                    }}
                  >
                    {entry.summary}
                  </span>
                  <div
                    style={{
                      marginTop: 2,
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      letterSpacing: "0.02em",
                      color: colors.mutedLight,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatTimelineStamp(entry.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
