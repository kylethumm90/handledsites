"use client";

/**
 * handled. — ContactDetailModal
 *
 * Centered overlay modal that opens when a contact card on the Pipeline
 * screen is tapped. Body sections are filled in subsequent passes; this
 * file is currently the shell only (backdrop + animation + close).
 *
 * See docs/PRODUCT_SPEC.md "Contact Detail Modal" section and the
 * reference mockup at docs/mockups/pipeline-contact-modal.png.
 */

import { useEffect, useMemo } from "react";
import type { Lead } from "@/lib/supabase";
import { colors, fonts, stageColors, type StageKey } from "@/lib/design-system";
import { pipelineStageFor, postSaleStageFor } from "@/lib/pipeline-v2";

type Props = {
  lead: Lead;
  /**
   * Optional explicit stage override. If omitted we derive from the lead:
   * post-sale stage for customers, pipeline stage otherwise.
   */
  stage?: StageKey;
  onClose: () => void;
};

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

export default function ContactDetailModal({ lead, stage, onClose }: Props) {
  const resolvedStage = useMemo<StageKey>(
    () => stage ?? deriveStage(lead),
    [stage, lead],
  );
  const stageColor = stageColors[resolvedStage].fg;
  const stageLabel = STAGE_LABELS[resolvedStage];
  const initials = useMemo(() => getInitials(lead.name), [lead.name]);
  const jobType =
    lead.service_needed?.trim() || defaultJobTypeFor(resolvedStage);
  const contractValue = formatContractValue(
    lead.job_value_cents ?? lead.estimated_value_cents,
  );

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
            overflowY: "auto",
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

          {/* Name section — avatar + name + job type / contract value */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "20px 20px 18px",
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
        </div>
      </div>
    </>
  );
}
