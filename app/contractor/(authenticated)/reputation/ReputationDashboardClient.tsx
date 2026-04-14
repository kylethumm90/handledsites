"use client";

import {
  AlertTriangle,
  Archive,
  Handshake,
  MessageSquare,
  Megaphone,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import type {
  ActivityItem,
  FunnelStage,
  RecoveryAlert,
  ReputationDashboardData,
} from "./types";
import { DISPLAY, HAIRLINE, LABEL, METRIC_VALUE } from "./tokens";

// =============================================================================
// Helpers
// =============================================================================
function formatUsd(cents: number): string {
  const dollars = Math.round(cents / 100);
  return "$" + dollars.toLocaleString("en-US");
}
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "JUST NOW";
  if (mins < 60) return `${mins} MIN AGO`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} HOUR${hours === 1 ? "" : "S"} AGO`;
  const days = Math.round(hours / 24);
  return `${days} DAY${days === 1 ? "" : "S"} AGO`;
}
function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// =============================================================================
// Main
// =============================================================================
export default function ReputationDashboardClient({
  data,
}: {
  data: ReputationDashboardData;
}) {
  const { metrics, criticalRecovery, recentActivity, funnel, overallConversionPct } = data;

  // The outer token/column wrapper and the bottom tab bar are both provided
  // by the reputation layout (layout.tsx). This component renders only the
  // dashboard body content.
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* METRICS GRID ---------------------------------------------- */}
      <MetricsGrid metrics={metrics} />

      {/* CRITICAL RECOVERY ---------------------------------------- */}
      <section>
        <SectionHeader
          dotColor="var(--alert)"
          label={`CRITICAL RECOVERY (${metrics.recoveryAlertCount})`}
        />
        {criticalRecovery.map((alert) => (
          <RecoveryCard key={alert.id} alert={alert} />
        ))}
      </section>

      {/* RECENT ACTIVITY ------------------------------------------ */}
      <section>
        <SectionHeader dotColor="var(--on-surface)" label="RECENT ACTIVITY" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "var(--outline-variant)",
            gap: "0.5px",
            border: HAIRLINE,
          }}
        >
          {recentActivity.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* GROWTH FUNNEL -------------------------------------------- */}
      <section>
        <SectionHeader dotColor="var(--on-surface)" label="GROWTH FUNNEL EFFICIENCY" />
        <FunnelView stages={funnel} overallConversionPct={overallConversionPct} />
      </section>
    </div>
  );
}

// =============================================================================
// Section header (square bullet + mono label)
// =============================================================================
function SectionHeader({ dotColor, label }: { dotColor: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ width: 8, height: 8, background: dotColor, display: "inline-block" }} />
      <span style={{ ...LABEL, fontSize: 10, color: "var(--on-surface)" }}>{label}</span>
    </div>
  );
}

// =============================================================================
// Metrics grid (2x2 + full-width alerts cell)
// =============================================================================
function MetricsGrid({ metrics }: { metrics: ReputationDashboardData["metrics"] }) {
  return (
    <div
      style={{
        border: HAIRLINE,
        background: "var(--outline-variant)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0.5px",
      }}
    >
      <MetricCell label="Sentiment Score">
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={METRIC_VALUE}>{metrics.sentimentScore}%</span>
          <TrendingUp size={14} strokeWidth={1.8} color="var(--on-surface-variant)" />
        </div>
      </MetricCell>

      <MetricCell label="Review Rate">
        <span style={METRIC_VALUE}>
          {metrics.reviewsReceived}
          <span style={{ color: "var(--on-surface-variant)", fontWeight: 500 }}>
            /{metrics.reviewsRequested}
          </span>
        </span>
      </MetricCell>

      <MetricCell label="Avg Rating">
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={METRIC_VALUE}>{metrics.avgRating.toFixed(1)}</span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              color: "var(--on-surface)",
            }}
          >
            ★
          </span>
        </div>
      </MetricCell>

      <MetricCell label="Referral Revenue">
        <span style={METRIC_VALUE}>{formatUsd(metrics.referralRevenueCents)}</span>
      </MetricCell>

      {/* Full-width recovery alerts cell */}
      <div
        style={{
          gridColumn: "1 / -1",
          background: "var(--alert-soft)",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <span style={{ ...LABEL, color: "var(--alert)" }}>Recovery Alerts</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              ...METRIC_VALUE,
              color: "var(--alert)",
            }}
          >
            {metrics.recoveryAlertCount}
          </span>
          <AlertTriangle size={18} strokeWidth={1.8} color="var(--alert)" />
        </div>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--surface-lowest)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 72,
      }}
    >
      <span style={LABEL}>{label}</span>
      {children}
    </div>
  );
}

// =============================================================================
// Critical recovery card
// =============================================================================
function RecoveryCard({ alert }: { alert: RecoveryAlert }) {
  return (
    <article
      style={{
        position: "relative",
        background: "var(--surface-lowest)",
        border: HAIRLINE,
        padding: 16,
        paddingTop: 20,
      }}
    >
      {/* IMMEDIATE ACTION REQUIRED badge pinned top-right */}
      {alert.severity === "immediate" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: "var(--alert)",
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "6px 10px",
          }}
        >
          Immediate Action Required
        </div>
      )}

      {/* Customer header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <Avatar name={alert.customerName} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ ...DISPLAY, fontSize: 16, fontWeight: 600 }}>
            {alert.customerName}
          </span>
          <span style={{ ...LABEL, fontSize: 9 }}>{alert.projectLabel}</span>
        </div>
      </div>

      {/* Quote */}
      <blockquote
        style={{
          margin: 0,
          padding: "4px 0 4px 12px",
          borderLeft: "2px solid var(--alert)",
          fontFamily: "var(--font-body)",
          fontStyle: "italic",
          fontSize: 13,
          lineHeight: 1.55,
          color: "var(--on-surface-variant)",
          marginBottom: 18,
        }}
      >
        &ldquo;{alert.quote}&rdquo;
      </blockquote>

      {/* Sentiment callout */}
      <div
        style={{
          border: HAIRLINE,
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginBottom: 14,
        }}
      >
        <span style={LABEL}>Sentiment</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              color: "var(--alert)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {alert.sentimentScore}
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "var(--alert)",
            }}
          >
            SNT
          </span>
        </div>
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        style={{
          display: "block",
          width: "100%",
          padding: "14px 16px",
          background: "linear-gradient(15deg, #012D1D 0%, #1B4332 100%)",
          color: "#fff",
          fontFamily: "var(--font-display)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          border: "0.5px solid var(--primary-fixed-dim)",
          borderRadius: 0,
          cursor: "pointer",
          marginBottom: 8,
        }}
      >
        Call {alert.customerName.split(" ")[0]}
      </button>

      {/* Secondary CTA */}
      <button
        type="button"
        style={{
          display: "block",
          width: "100%",
          padding: "14px 16px",
          background: "var(--surface-lowest)",
          color: "var(--on-surface)",
          fontFamily: "var(--font-display)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          border: "0.5px solid var(--on-surface)",
          borderRadius: 0,
          cursor: "pointer",
        }}
      >
        Assign Rep
      </button>
    </article>
  );
}

// =============================================================================
// Activity row
// =============================================================================
function ActivityRow({ item }: { item: ActivityItem }) {
  const statusLabel =
    item.status === "reviewed"
      ? "REVIEWED"
      : item.status === "pending"
        ? "PENDING"
        : "DECLINED";

  return (
    <div
      style={{
        background: "var(--surface-lowest)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Top row: identity + timing */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={item.customerName} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          <span style={{ ...DISPLAY, fontSize: 14, fontWeight: 600 }}>
            {item.customerName}
          </span>
          <span style={LABEL}>
            {statusLabel} &middot; {relativeTime(item.timestamp)}
          </span>
        </div>
      </div>

      {/* Bottom row: metrics aligned right */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingLeft: 52,
        }}
      >
        {item.requestSent ? (
          <DispatchChip label="REQUEST SENT" />
        ) : item.rating !== undefined ? (
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 14,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              color: "var(--on-surface)",
            }}
          >
            {item.rating.toFixed(1)} ★★★★★
          </span>
        ) : (
          <span />
        )}

        {(item.sentimentScore !== undefined || item.predictedSentiment !== undefined) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 2,
            }}
          >
            <span style={LABEL}>
              {item.sentimentScore !== undefined ? "SENTIMENT" : "PREDICTED"}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 14,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: "var(--on-surface)",
              }}
            >
              {item.sentimentScore ?? item.predictedSentiment}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DispatchChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "#DCEBE1",
        color: "var(--primary)",
        fontFamily: "var(--font-display)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "5px 10px",
        border: 0,
        borderRadius: 0,
      }}
    >
      {label}
    </span>
  );
}

// =============================================================================
// Funnel
// =============================================================================
const STAGE_STYLES: Record<
  FunnelStage["key"],
  { bg: string; fg: string; widthPct: number }
> = {
  jobs: { bg: "var(--primary)", fg: "#FFFFFF", widthPct: 100 },
  feedback: { bg: "var(--primary-container)", fg: "#FFFFFF", widthPct: 94 },
  reviews: { bg: "#B7D4C0", fg: "var(--primary)", widthPct: 88 },
  partners: { bg: "#D0E2D5", fg: "var(--primary)", widthPct: 82 },
  referrals: { bg: "#E4ECE5", fg: "var(--on-surface)", widthPct: 76 },
};

const STAGE_ICON: Record<FunnelStage["key"], React.ReactNode> = {
  jobs: <Archive size={18} strokeWidth={1.5} />,
  feedback: <MessageSquare size={18} strokeWidth={1.5} />,
  reviews: <Megaphone size={18} strokeWidth={1.5} />,
  partners: <Handshake size={18} strokeWidth={1.5} />,
  referrals: <UserPlus size={18} strokeWidth={1.5} />,
};

function FunnelView({
  stages,
  overallConversionPct,
}: {
  stages: FunnelStage[];
  overallConversionPct: number;
}) {
  return (
    <div
      style={{
        background: "var(--surface-lowest)",
        border: HAIRLINE,
        padding: 16,
      }}
    >
      {stages.map((stage, idx) => {
        const style = STAGE_STYLES[stage.key];
        const prev = stages[idx - 1];
        const dropOff = prev ? prev.count - stage.count : null;
        return (
          <div key={stage.key}>
            {dropOff !== null && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: "6px 0",
                  fontFamily: "var(--font-display)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--on-surface-variant)",
                }}
              >
                <span>↓</span>
                <span>-{dropOff} DROP OFF</span>
              </div>
            )}
            <div
              style={{
                width: `${style.widthPct}%`,
                margin: "0 auto",
                background: style.bg,
                color: style.fg,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                border: "0.5px solid var(--outline-variant)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    opacity: 0.85,
                  }}
                >
                  {String(stage.index).padStart(2, "0")}. {stage.label}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 26,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}
                  >
                    {stage.count}
                  </span>
                  {stage.conversionPct !== undefined && (
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 11,
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        opacity: 0.85,
                      }}
                    >
                      {stage.conversionPct}%
                    </span>
                  )}
                </div>
              </div>
              <div style={{ opacity: 0.7 }}>{STAGE_ICON[stage.key]}</div>
            </div>
          </div>
        );
      })}

      {/* Overall conversion footer */}
      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: HAIRLINE,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={LABEL}>Overall Conversion</span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: "var(--on-surface)",
          }}
        >
          {overallConversionPct.toFixed(1)}%
        </span>
      </div>
      <div style={{ marginTop: 10, height: 3, background: "var(--surface-high)" }}>
        <div
          style={{
            width: `${Math.min(overallConversionPct * 4, 100)}%`,
            height: "100%",
            background: "var(--primary)",
          }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Avatar primitive
// =============================================================================
function Avatar({ name }: { name: string }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        border: HAIRLINE,
        background: "var(--surface-low)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--on-surface-variant)",
        letterSpacing: "0.02em",
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

