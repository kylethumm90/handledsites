"use client";

/**
 * handled. — Reputation screen
 *
 * Post-sale reputation dashboard powered by Stella. Shows feedback,
 * Google reviews, and customer advocates alongside the Stella funnel
 * (Jobs → Feedback → Reviews → Advocates).
 *
 * Mock data flows through `REPUTATION_SAMPLE` today; swap for a
 * Supabase-backed hook once the post-sale pipeline is live.
 */

import { useState } from "react";
import { colors, fonts } from "@/lib/design-system";
import {
  REPUTATION_SAMPLE,
  type FeedbackItem,
  type FunnelStep,
  type ReferralItem,
  type ReviewItem,
  type ReviewStatus,
  type ReferralStatus,
} from "@/components/reputation/sample-data";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type TabKey = "feedback" | "reviews" | "advocates";
type TimeRange = "7d" | "30d" | "90d" | "All";

const TIME_RANGES: TimeRange[] = ["7d", "30d", "90d", "All"];

const REVIEW_STATUS_COLOR: Record<ReviewStatus, string> = {
  posted: colors.green,
  "awaiting review": colors.amber,
  "needs attention": colors.red,
};

const REFERRAL_STATUS_COLOR: Record<ReferralStatus, string> = {
  booked: colors.green,
  contacted: colors.blue,
  "new lead": colors.amber,
};

const FUNNEL_COLOR: Record<FunnelStep["colorKey"], string> = {
  navy: colors.navy,
  blue: colors.blue,
  amber: colors.amber,
  green: colors.green,
};

const STELLA_BAR_HEIGHT = 84;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReputationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("reviews");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const data = REPUTATION_SAMPLE;

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        background: "#FAFAFA",
        minHeight: "100vh",
        fontFamily: fonts.body,
        color: colors.navy,
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: colors.blue,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 2,
            fontFamily: fonts.body,
          }}
        >
          Reputation
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#1C1B18",
            lineHeight: 1.2,
            fontFamily: fonts.body,
          }}
        >
          {data.companyName}
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          margin: "14px 20px 0",
          background: colors.white,
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
        }}
      >
        <StatBox value={String(data.stats.feedback)} label="Feedback" color={colors.green} border />
        <StatBox value={String(data.stats.reviews)} label="Reviews" color="#1C1B18" border />
        <StatBox value={data.stats.avgRating.toFixed(1)} label="Avg Rating" color={colors.amber} border />
        <StatBox value={String(data.stats.advocates)} label="Advocates" color={colors.green} />
      </div>

      {/* Time filter */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "12px 20px 0",
          justifyContent: "flex-end",
        }}
      >
        {TIME_RANGES.map((t) => {
          const active = timeRange === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTimeRange(t)}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                border: `1px solid ${active ? colors.navy : colors.border}`,
                borderRadius: 4,
                background: active ? colors.navy : colors.white,
                color: active ? colors.white : colors.muted,
                cursor: "pointer",
                fontFamily: fonts.body,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          margin: "12px 20px 0",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <SubTab
          label="Feedback"
          active={activeTab === "feedback"}
          count={data.feedback.length}
          onClick={() => setActiveTab("feedback")}
        />
        <SubTab
          label="Reviews"
          active={activeTab === "reviews"}
          count={data.reviews.length}
          onClick={() => setActiveTab("reviews")}
        />
        <SubTab
          label="Advocates"
          active={activeTab === "advocates"}
          count={data.referrals.length}
          onClick={() => setActiveTab("advocates")}
        />
      </div>

      {/* Content */}
      <div style={{ padding: `12px 20px ${STELLA_BAR_HEIGHT + 24}px` }}>
        {activeTab === "reviews" &&
          data.reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
        {activeTab === "feedback" &&
          data.feedback.map((f) => <FeedbackCard key={f.id} item={f} />)}
        {activeTab === "advocates" && (
          <>
            <RevenueSummary
              amount={data.advocateRevenue.amount}
              conversionPct={data.advocateRevenue.conversionPct}
            />
            {data.referrals.map((r) => (
              <ReferralCard key={r.id} referral={r} />
            ))}
          </>
        )}
      </div>

      <StellaFunnel steps={data.funnel} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats row
// ---------------------------------------------------------------------------

function StatBox({
  value,
  label,
  color,
  border,
}: {
  value: string;
  label: string;
  color: string;
  border?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: "center",
        padding: "12px 4px",
        borderRight: border ? `1px solid ${colors.border}` : "none",
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color,
          fontFamily: fonts.body,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: colors.muted,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginTop: 4,
          fontFamily: fonts.body,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab
// ---------------------------------------------------------------------------

function SubTab({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 0",
        background: active ? colors.white : "transparent",
        border: "none",
        borderBottom: active
          ? `2px solid ${colors.navy}`
          : "2px solid transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        transition: "all 0.15s ease",
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: active ? 700 : 500,
          color: active ? colors.navy : colors.muted,
          fontFamily: fonts.body,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: active ? colors.white : colors.mutedLight,
          background: active ? colors.navy : "#F8F8F8",
          borderRadius: 10,
          padding: "1px 7px",
          minWidth: 20,
          textAlign: "center",
          fontFamily: fonts.body,
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Shared card pieces
// ---------------------------------------------------------------------------

function Card({
  children,
  accentColor,
}: {
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        background: colors.white,
        borderRadius: 10,
        border: `1px solid ${colors.border}`,
        borderLeft: accentColor
          ? `3px solid ${accentColor}`
          : `1px solid ${colors.border}`,
        padding: "16px 18px",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#F1F5F9",
        border: `1px solid ${colors.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.32,
        fontWeight: 700,
        color: colors.muted,
        flexShrink: 0,
        fontFamily: fonts.body,
      }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontFamily: fonts.body,
      }}
    >
      {label}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: 14, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{ color: i <= rating ? "#FBBF24" : colors.border }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function SentimentBar({ score }: { score: number }) {
  const color =
    score >= 80 ? colors.green : score >= 60 ? colors.amber : colors.red;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 4,
          background: "#F8F8F8",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color,
          minWidth: 28,
          fontFamily: fonts.body,
        }}
      >
        {score}
      </span>
    </div>
  );
}

function ActionButtons({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <button
        type="button"
        style={{
          flex: 1,
          padding: "12px 0",
          background: colors.navy,
          color: colors.white,
          border: "none",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.05em",
          fontFamily: fonts.body,
        }}
      >
        {primary}
      </button>
      <button
        type="button"
        style={{
          flex: 1,
          padding: "12px 0",
          background: colors.white,
          color: colors.navy,
          border: `1px solid ${colors.border}`,
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.05em",
          fontFamily: fonts.body,
        }}
      >
        {secondary}
      </button>
    </div>
  );
}

const bodyRowMeta: React.CSSProperties = {
  fontSize: 12,
  color: colors.muted,
  marginTop: 1,
  fontFamily: fonts.body,
};

const bodyRowName: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "#1C1B18",
  fontFamily: fonts.body,
};

const greyContentBox: React.CSSProperties = {
  marginTop: 8,
  padding: "10px 12px",
  background: "#F8F8F8",
  borderRadius: 6,
  fontSize: 13,
  lineHeight: 1.5,
  color: "#374151",
  fontFamily: fonts.body,
};

// ---------------------------------------------------------------------------
// Review card
// ---------------------------------------------------------------------------

function ReviewCard({ review }: { review: ReviewItem }) {
  const statusColor = REVIEW_STATUS_COLOR[review.status];
  const isAttention = review.status === "needs attention";
  return (
    <Card accentColor={statusColor}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Avatar initials={review.initials} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={bodyRowName}>{review.name}</div>
              <div style={bodyRowMeta}>
                {review.job} · {review.source} · {review.time}
              </div>
            </div>
            <StatusBadge label={review.status} color={statusColor} />
          </div>
          {review.rating !== null && (
            <div style={{ marginTop: 8 }}>
              <Stars rating={review.rating} />
            </div>
          )}
          <div style={greyContentBox}>{review.text}</div>
          {review.alert && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 12px",
                background:
                  statusColor === colors.red
                    ? "rgba(220,38,38,0.06)"
                    : "rgba(232,146,13,0.08)",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: statusColor,
                fontFamily: fonts.body,
              }}
            >
              {review.alert}
            </div>
          )}
          <SentimentBar score={review.sentiment} />
          <ActionButtons
            primary={isAttention ? "CALL" : "VIEW"}
            secondary={isAttention ? "ASSIGN REP" : "SHARE"}
          />
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Feedback card
// ---------------------------------------------------------------------------

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const sentColor =
    item.sentiment >= 80
      ? colors.green
      : item.sentiment >= 60
        ? colors.amber
        : colors.red;
  return (
    <Card accentColor={sentColor}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Avatar initials={item.initials} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={bodyRowName}>{item.name}</div>
              <div style={bodyRowMeta}>
                {item.job} · {item.time}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 20,
              }}
            >
              <span>{item.emoji}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.muted,
                  fontFamily: fonts.body,
                }}
              >
                {item.label}
              </span>
            </div>
          </div>
          <div style={greyContentBox}>&ldquo;{item.comment}&rdquo;</div>
          <SentimentBar score={item.sentiment} />
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: item.reviewSent ? colors.green : colors.mutedLight,
              fontWeight: 600,
              fontFamily: fonts.body,
            }}
          >
            {item.reviewSent
              ? "✓ Review link sent"
              : "Review link not sent — sentiment too low"}
          </div>
          <ActionButtons
            primary={item.sentiment < 60 ? "CALL" : "NUDGE REVIEW"}
            secondary={item.sentiment < 60 ? "ASSIGN REP" : "VIEW SURVEY"}
          />
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Referral card + Revenue summary
// ---------------------------------------------------------------------------

function RevenueSummary({
  amount,
  conversionPct,
}: {
  amount: string;
  conversionPct: number;
}) {
  return (
    <div
      style={{
        background: colors.white,
        borderRadius: 10,
        border: `1px solid ${colors.border}`,
        padding: "14px 16px",
        marginBottom: 14,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: colors.muted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontFamily: fonts.body,
          }}
        >
          Advocate Revenue (30d)
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: colors.green,
            marginTop: 2,
            fontFamily: fonts.body,
          }}
        >
          {amount}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: colors.muted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontFamily: fonts.body,
          }}
        >
          Conversion
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#1C1B18",
            marginTop: 2,
            fontFamily: fonts.body,
          }}
        >
          {conversionPct}%
        </div>
      </div>
    </div>
  );
}

function ReferralCard({ referral }: { referral: ReferralItem }) {
  const statusColor = REFERRAL_STATUS_COLOR[referral.status];
  return (
    <Card accentColor={statusColor}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Avatar initials={referral.initials} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={bodyRowName}>{referral.name}</div>
              <div style={bodyRowMeta}>
                referred {referral.referredName} · {referral.time}
              </div>
            </div>
            <StatusBadge label={referral.status} color={statusColor} />
          </div>
          <div style={greyContentBox}>
            <span style={{ fontWeight: 600 }}>{referral.referredName}</span>{" "}
            needs {referral.referredJob}.{" "}
            {referral.value
              ? `Estimated value: ${referral.value}`
              : "Follow up to qualify."}
          </div>
          {referral.value && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: colors.muted,
                  fontWeight: 500,
                  fontFamily: fonts.body,
                }}
              >
                Revenue:
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: colors.green,
                  fontFamily: fonts.body,
                }}
              >
                {referral.value}
              </span>
            </div>
          )}
          <ActionButtons primary="CALL LEAD" secondary="VIEW DETAILS" />
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Stella funnel (sticky bottom)
// ---------------------------------------------------------------------------

function StellaFunnel({ steps }: { steps: FunnelStep[] }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 480,
        maxWidth: "100%",
        background: colors.white,
        borderTop: `1px solid ${colors.border}`,
        padding: "10px 20px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          fontWeight: 600,
          color: colors.muted,
          fontFamily: fonts.body,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 6,
        }}
      >
        <span>Stella Funnel</span>
        <span
          style={{
            color: colors.mutedLight,
            fontWeight: 500,
            fontSize: 10,
          }}
        >
          Last 30 days
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {steps.map((step, i) => (
          <div
            key={step.label}
            style={{ display: "flex", alignItems: "center", flex: 1 }}
          >
            <div style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: FUNNEL_COLOR[step.colorKey],
                  lineHeight: 1,
                  fontFamily: fonts.body,
                }}
              >
                {step.value}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: colors.muted,
                  marginTop: 2,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontFamily: fonts.body,
                }}
              >
                {step.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  color: colors.mutedLight,
                  fontSize: 12,
                  fontWeight: 300,
                  padding: "0 2px",
                }}
              >
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
