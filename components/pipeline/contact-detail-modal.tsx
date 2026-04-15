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

import { useEffect, useMemo, useState } from "react";
import type { ActivityLogEntry, Lead, LeadStatus } from "@/lib/supabase";
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
  onClose: () => void;
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

function secondaryActionFor(stage: StageKey): string {
  switch (stage) {
    case "job_done":
    case "feedback":
      return "SEND FEEDBACK REQUEST";
    case "reviewed":
      return "ASK FOR REFERRAL";
    case "referrer":
      return "FOLLOW UP";
    case "recovery":
      return "EMAIL";
    default:
      return "EMAIL";
  }
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
  useEffect(() => {
    setCurrentStatus(lead.status);
    setAdvanceError(null);
    setCurrentAiSummary(lead.ai_summary ?? null);
  }, [lead.id, lead.status, lead.ai_summary]);

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
    lead.service_needed?.trim() || defaultJobTypeFor(resolvedStage);
  const contractValue = formatContractValue(
    lead.job_value_cents ?? lead.estimated_value_cents,
  );
  const aiContext = fallbackAiContext(lead, resolvedStage, currentAiSummary);
  // Primary CTA flips once the job is done: the contractor's next move is
  // no longer "pick up the phone" but "ask for a review". Keeps the modal's
  // top action aligned with where the lead is in the post-sale funnel.
  const primaryCtaLabel =
    resolvedStage === "job_done"
      ? "SEND FEEDBACK REQUEST"
      : `CALL ${firstNameUpper(lead.name)}`;
  const secondaryActionLabel = secondaryActionFor(resolvedStage);

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
        // stage the moment the button is pressed.
        try {
          const data = (await res.json()) as { ai_summary?: string | null };
          if (data.ai_summary) setCurrentAiSummary(data.ai_summary);
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
              {secondaryActionLabel}
            </button>
          </div>

          {/* Contact info card — quiet rows of metadata */}
          <ContactInfoCard lead={lead} />

          {/* AI Details — expandable structured fields the AI extracted */}
          <AiDetailsSection lead={lead} />

          {/* What Happened — quiet activity timeline */}
          <WhatHappenedTimeline
            leadId={lead.id}
            activities={activities ?? []}
            onNoteAdded={onNoteAdded}
            onAiSummaryUpdated={(summary) => setCurrentAiSummary(summary)}
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
// AI Details — discreet expandable block of raw extracted fields
// ---------------------------------------------------------------------------

function AiDetailsSection({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);

  // Merge all the structured metadata the AI has on this lead. `answers`
  // covers quiz-funnel responses; `raw_import_data` covers CSV import rows.
  // Duplicate keys from answers win (funnel data is the freshest signal).
  const fields = useMemo<Array<[string, string]>>(() => {
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
    return Object.entries(merged);
  }, [lead.answers, lead.raw_import_data]);

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

function WhatHappenedTimeline({
  leadId,
  activities,
  onNoteAdded,
  onAiSummaryUpdated,
}: {
  leadId: string;
  activities: ActivityLogEntry[];
  onNoteAdded?: (entry: ActivityLogEntry) => void;
  onAiSummaryUpdated?: (summary: string) => void;
}) {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // API returns oldest → newest for the chronological "story" read. The modal
  // inverts that so the contractor lands on the most recent activity first —
  // they care about "what just happened" more than "how this lead started".
  const ordered = useMemo(() => [...activities].reverse(), [activities]);

  const handleSave = async () => {
    const summary = draft.trim();
    if (!summary || saving) return;
    setSaving(true);
    setSaveError(null);
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
        setSaveError(msg);
        return;
      }
      const entry = (await res.json()) as ActivityLogEntry & {
        ai_summary?: string | null;
      };
      onNoteAdded?.(entry);
      if (entry.ai_summary) onAiSummaryUpdated?.(entry.ai_summary);
      setDraft("");
      setComposing(false);
    } catch (err) {
      console.error("add note threw:", err);
      setSaveError("Network error — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft("");
    setSaveError(null);
    setComposing(false);
  };

  return (
    <div style={{ padding: "0 20px 24px" }}>
      {/* Section header with an inline "+ Add Note" action on the right. */}
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
        {!composing ? (
          <button
            type="button"
            onClick={() => setComposing(true)}
            style={{
              minHeight: 28,
              padding: "4px 10px",
              backgroundColor: "transparent",
              color: colors.navy,
              border: `1px solid ${colors.border}`,
              borderRadius: 0,
              cursor: "pointer",
              fontFamily: fonts.body,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            + Add Note
          </button>
        ) : null}
      </div>

      {/* Inline composer — appears above the timeline when "Add Note" is
          tapped. Submitting calls the /notes endpoint which inserts a
          user_note activity_log row; we then bubble the new entry up so
          the parent can merge it into its activity cache without a full
          page refresh. */}
      {composing ? (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: colors.amberBgSoft,
            borderLeft: `3px solid ${colors.navy}`,
          }}
        >
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                void handleSave();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                handleCancel();
              }
            }}
            placeholder="Add a note about this customer..."
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 10px",
              backgroundColor: colors.white,
              border: `1px solid ${colors.border}`,
              borderRadius: 0,
              fontFamily: fonts.body,
              fontSize: 13,
              lineHeight: 1.4,
              color: colors.navy,
              resize: "vertical",
              outline: "none",
            }}
          />
          {saveError ? (
            <div
              style={{
                marginTop: 6,
                fontFamily: fonts.body,
                fontSize: 11,
                color: colors.alertMuted,
              }}
            >
              {saveError}
            </div>
          ) : null}
          <div
            style={{
              marginTop: 8,
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              style={{
                minHeight: 32,
                padding: "6px 12px",
                backgroundColor: "transparent",
                color: colors.muted,
                border: `1px solid ${colors.border}`,
                borderRadius: 0,
                cursor: saving ? "default" : "pointer",
                fontFamily: fonts.body,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !draft.trim()}
              style={{
                minHeight: 32,
                padding: "6px 12px",
                backgroundColor: colors.navy,
                color: colors.white,
                border: "none",
                borderRadius: 0,
                cursor: saving || !draft.trim() ? "default" : "pointer",
                opacity: saving || !draft.trim() ? 0.55 : 1,
                fontFamily: fonts.body,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {saving ? "Saving…" : "Save Note"}
            </button>
          </div>
        </div>
      ) : null}

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
