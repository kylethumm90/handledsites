"use client";

/**
 * handled. — ContactCard
 *
 * A single contact card used on the Pipeline screen (both Pipeline and
 * Post-Sale views). Base tier shows wait times + CALL/TEXT. AI Team tier
 * shows an agent action line + a single contextual CTA.
 *
 * See docs/PRODUCT_SPEC.md "Contact Cards" section.
 */

import type { CSSProperties } from "react";
import { colors, fonts, stageColors, type StageKey } from "@/lib/design-system";
import { AiHint, Dot, StageBadge } from "@/components/ui/primitives";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Tier = "base" | "ai_team";

export type AgentKey = "ava" | "stella";

export type Contact = {
  id: string;
  name: string;
  stage: StageKey;
  /** e.g. "Roofing estimate" / "Solar install · Completed Apr 3" */
  jobType: string;
  /** e.g. "Website form", "Missed call" */
  source: string;
  /** Display string, e.g. "8:42 am", "Apr 9", "2 days ago" */
  time: string;
  /** One-sentence AI context hint (amber banner). Present on both tiers. */
  aiHint: string;

  // Base tier (pipeline) — red wait banner
  waitHours?: number;

  // AI Team tier — agent action line + contextual CTA
  agentAction?: { agent: AgentKey; text: string };
  contextualCta?: string;

  // Recovery specifics (Post-Sale)
  sentiment?: number;
  recovery?: boolean;

  // Reviewed specifics
  reviewBadge?: { stars: number; platform: string };

  // Referrer specifics
  referralName?: string;
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

// ---------------------------------------------------------------------------
// ContactCard
// ---------------------------------------------------------------------------

export function ContactCard({
  contact,
  tier = "base",
  onSelect,
}: {
  contact: Contact;
  tier?: Tier;
  /** Fired when the card body is tapped. CTA buttons stopPropagation so
   *  CALL / TEXT / contextual actions don't trigger navigation. */
  onSelect?: (id: string) => void;
}) {
  const stage = stageColors[contact.stage];
  const isRecovery = contact.recovery === true || contact.stage === "recovery";
  const accent = isRecovery ? colors.red : stage.fg;
  const clickable = typeof onSelect === "function";

  return (
    <article
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onSelect!(contact.id) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect!(contact.id);
              }
            }
          : undefined
      }
      style={{
        backgroundColor: colors.white,
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${accent}`,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        cursor: clickable ? "pointer" : "default",
      }}
    >
      {/* Header row — avatar, name + info, stage badge */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Avatar name={contact.name} recovery={isRecovery} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontFamily: fonts.body,
                fontWeight: 700,
                fontSize: 16,
                lineHeight: 1.2,
                color: colors.navy,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {contact.name}
            </h3>
            <StageBadge
              label={STAGE_LABELS[contact.stage]}
              color={stage.fg}
              bg={stage.bg}
            />
          </div>

          <p
            style={{
              margin: "4px 0 0",
              fontFamily: fonts.body,
              fontSize: 13,
              color: colors.muted,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {contact.jobType} · {contact.source} · {contact.time}
          </p>
        </div>
      </div>

      {/* AI context hint — both tiers */}
      <AiHint>{contact.aiHint}</AiHint>

      {/* Recovery sentiment callout */}
      {isRecovery && typeof contact.sentiment === "number" ? (
        <SentimentRow sentiment={contact.sentiment} />
      ) : null}

      {/* Base tier: red wait banner */}
      {tier === "base" && typeof contact.waitHours === "number" ? (
        <WaitBanner hours={contact.waitHours} />
      ) : null}

      {/* AI Team tier: agent action line */}
      {tier === "ai_team" && contact.agentAction ? (
        <AgentActionLine
          agent={contact.agentAction.agent}
          text={contact.agentAction.text}
        />
      ) : null}

      {/* Reviewed: review badge */}
      {contact.reviewBadge ? (
        <ReviewBadge
          stars={contact.reviewBadge.stars}
          platform={contact.reviewBadge.platform}
        />
      ) : null}

      {/* Referrer: referred-name line */}
      {contact.referralName ? (
        <ReferralLine name={contact.referralName} />
      ) : null}

      {/* CTAs */}
      {tier === "ai_team" && contact.contextualCta ? (
        <PrimaryButton
          label={contact.contextualCta}
          color={isRecovery ? colors.red : colors.navy}
        />
      ) : (
        <DualCta recovery={isRecovery} />
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Sub-pieces
// ---------------------------------------------------------------------------

function Avatar({ name, recovery }: { name: string; recovery: boolean }) {
  const initials = getInitials(name);
  return (
    <div
      aria-hidden
      style={{
        width: 40,
        height: 40,
        flexShrink: 0,
        backgroundColor: colors.borderLight,
        border: `2px solid ${recovery ? colors.red : colors.border}`,
        color: colors.navy,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.body,
        fontWeight: 600,
        fontSize: 13,
        borderRadius: "50%",
      }}
    >
      {initials}
    </div>
  );
}

function WaitBanner({ hours }: { hours: number }) {
  const label =
    hours >= 24
      ? `Waiting ${Math.round(hours / 24)} days for a response`
      : `Waiting ${hours} ${hours === 1 ? "hour" : "hours"} for a response`;
  return (
    <div
      style={{
        backgroundColor: colors.redBg,
        borderLeft: `2px solid ${colors.red}`,
        color: colors.red,
        fontFamily: fonts.body,
        fontSize: 13,
        fontWeight: 600,
        padding: "8px 10px",
      }}
    >
      {label}
    </div>
  );
}

function AgentActionLine({ agent, text }: { agent: AgentKey; text: string }) {
  const agentColor = agent === "ava" ? colors.amber : colors.green;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: fonts.body,
        fontSize: 13,
        color: colors.navy,
      }}
    >
      <Dot color={colors.green} size={8} />
      <span>
        <span style={{ fontWeight: 600, color: agentColor }}>
          {agent === "ava" ? "Ava" : "Stella"}
        </span>{" "}
        {text}
      </span>
    </div>
  );
}

function SentimentRow({ sentiment }: { sentiment: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: fonts.body,
        fontSize: 12,
        color: colors.muted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      <span style={{ fontWeight: 600 }}>Sentiment</span>
      <span
        style={{
          fontFamily: fonts.mono,
          fontSize: 14,
          fontWeight: 700,
          color: colors.red,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {sentiment.toFixed(1)}
      </span>
    </div>
  );
}

function ReviewBadge({ stars, platform }: { stars: number; platform: string }) {
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 12,
        fontWeight: 600,
        color: colors.green,
        letterSpacing: "0.02em",
      }}
    >
      ★ {stars}★ {platform}
    </div>
  );
}

function ReferralLine({ name }: { name: string }) {
  return (
    <div
      style={{
        fontFamily: fonts.body,
        fontSize: 13,
        color: colors.purple,
        fontWeight: 600,
      }}
    >
      Referred: {name}
    </div>
  );
}

function DualCta({ recovery }: { recovery: boolean }) {
  // Recovery on Base tier still wants a single prominent red CALL.
  if (recovery) {
    return <PrimaryButton label="CALL" color={colors.red} />;
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
      }}
    >
      <PrimaryButton label="CALL" color={colors.navy} />
      <SecondaryButton label="TEXT" color={colors.navy} />
    </div>
  );
}

function PrimaryButton({
  label,
  color,
  style,
}: {
  label: string;
  color: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      style={{
        minHeight: 44,
        padding: "12px 16px",
        backgroundColor: color,
        color: colors.white,
        border: "none",
        borderRadius: 0,
        cursor: "pointer",
        fontFamily: fonts.body,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {label}
    </button>
  );
}

function SecondaryButton({ label, color }: { label: string; color: string }) {
  return (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      style={{
        minHeight: 44,
        padding: "12px 16px",
        backgroundColor: colors.white,
        color,
        border: `1px solid ${color}`,
        borderRadius: 0,
        cursor: "pointer",
        fontFamily: fonts.body,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
