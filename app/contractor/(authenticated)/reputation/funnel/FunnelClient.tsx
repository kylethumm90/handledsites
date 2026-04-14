"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ClipboardList,
  Handshake,
  MessageSquare,
  Share2,
  Star,
  type LucideIcon,
} from "lucide-react";
import type {
  FunnelData,
  FunnelPeriod,
  FunnelStageKey,
  FunnelStageSnapshot,
  StageBreakdownEntry,
  ConversionTrendPoint,
} from "../types";
import { DISPLAY, HAIRLINE, LABEL } from "../tokens";

// =============================================================================
// Main
// =============================================================================
export default function FunnelClient({ data }: { data: FunnelData }) {
  const [period, setPeriod] = useState<FunnelPeriod>("30d");
  const snapshot = data.periods[period];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <TitleBlock />
      <PeriodTabs active={period} onChange={setPeriod} />

      <FunnelVisualization stages={snapshot.stages} />

      <TotalConversion
        pct={snapshot.totalConversionPct}
        delta={snapshot.deltaFromPrevPct}
      />

      <StageBreakdown entries={data.breakdown} />

      <ConversionOverTime
        points={snapshot.trendPoints}
        insight={snapshot.trendInsight}
      />
    </div>
  );
}

// =============================================================================
// Title block
// =============================================================================
function TitleBlock() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--on-surface)",
            lineHeight: 1,
          }}
        >
          Funnel
        </h1>
        <span
          aria-hidden
          style={{
            width: 14,
            height: 14,
            border: "0.5px solid var(--outline-variant)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontSize: 9,
            fontWeight: 600,
            color: "var(--on-surface-variant)",
          }}
          title="Where customers move through your post-sale pipeline"
        >
          i
        </span>
      </div>
      <p
        style={{
          margin: "6px 0 0",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--on-surface-variant)",
        }}
      >
        Your post-sale conversion pipeline.
      </p>
    </div>
  );
}

// =============================================================================
// Period tabs
// =============================================================================
const PERIODS: { key: FunnelPeriod; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "all", label: "All" },
];

function PeriodTabs({
  active,
  onChange,
}: {
  active: FunnelPeriod;
  onChange: (key: FunnelPeriod) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        borderBottom: HAIRLINE,
      }}
    >
      {PERIODS.map((p) => {
        const isActive = p.key === active;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.key)}
            style={{
              background: "transparent",
              border: "none",
              padding: "2px 0 10px",
              marginBottom: "-0.5px",
              borderBottom: isActive
                ? "2px solid var(--on-surface)"
                : "2px solid transparent",
              fontFamily: "var(--font-display)",
              fontSize: 11,
              fontWeight: isActive ? 700 : 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: isActive ? "var(--on-surface)" : "var(--on-surface-variant)",
              cursor: "pointer",
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// Funnel visualization
// =============================================================================
type StageTheme = {
  bg: string;
  fg: string;
  labelFg: string;
  iconColor: string;
  iconOpacity: number;
};

const STAGE_THEMES: Record<FunnelStageKey, StageTheme> = {
  jobs: {
    bg: "var(--primary)",
    fg: "#FFFFFF",
    labelFg: "rgba(255,255,255,0.65)",
    iconColor: "#FFFFFF",
    iconOpacity: 0.22,
  },
  feedback: {
    bg: "var(--primary-container)",
    fg: "#FFFFFF",
    labelFg: "rgba(255,255,255,0.65)",
    iconColor: "#FFFFFF",
    iconOpacity: 0.22,
  },
  reviews: {
    bg: "var(--primary-fixed-dim)",
    fg: "#FFFFFF",
    labelFg: "rgba(255,255,255,0.65)",
    iconColor: "#FFFFFF",
    iconOpacity: 0.22,
  },
  partners: {
    bg: "var(--surface-high)",
    fg: "var(--on-surface)",
    labelFg: "var(--on-surface-variant)",
    iconColor: "var(--on-surface-variant)",
    iconOpacity: 0.35,
  },
  referrals: {
    bg: "var(--rust)",
    fg: "#FFFFFF",
    labelFg: "rgba(255,255,255,0.7)",
    iconColor: "#FFFFFF",
    iconOpacity: 0.28,
  },
};

const STAGE_ICONS: Record<FunnelStageKey, LucideIcon> = {
  jobs: ClipboardList,
  feedback: MessageSquare,
  reviews: Star,
  partners: Handshake,
  referrals: Share2,
};

function FunnelVisualization({ stages }: { stages: FunnelStageSnapshot[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {stages.map((stage, idx) => {
        // Progressive indent to make it read as a funnel shape.
        const indent = idx * 8;
        const isLast = idx === stages.length - 1;
        return (
          <div key={stage.key}>
            <div style={{ marginLeft: indent, marginRight: indent }}>
              <StageCard stage={stage} />
            </div>
            {!isLast && stages[idx + 1]?.dropOff != null && (
              <DropOffIndicator count={stages[idx + 1]!.dropOff!} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StageCard({ stage }: { stage: FunnelStageSnapshot }) {
  const theme = STAGE_THEMES[stage.key];
  const Icon = STAGE_ICONS[stage.key];
  const pctLabel =
    stage.index === 1 ? "100%" : `${stage.conversionPct ?? 0}%`;

  return (
    <div
      style={{
        background: theme.bg,
        color: theme.fg,
        padding: "16px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        border:
          stage.key === "partners" ? HAIRLINE : "0.5px solid transparent",
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: theme.labelFg,
          }}
        >
          {String(stage.index).padStart(2, "0")} / {stage.label}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 30,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: theme.fg,
            }}
          >
            {stage.count}
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontVariantNumeric: "tabular-nums",
              color: theme.labelFg,
            }}
          >
            {pctLabel}
          </span>
        </div>
      </div>
      <div style={{ opacity: theme.iconOpacity, flexShrink: 0 }}>
        <Icon size={36} strokeWidth={1} color={theme.iconColor} />
      </div>
    </div>
  );
}

function DropOffIndicator({ count }: { count: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "8px 0",
      }}
    >
      <ArrowDown
        size={11}
        strokeWidth={1.5}
        color="var(--on-surface-variant)"
      />
      <span
        style={{
          ...LABEL,
          fontVariantNumeric: "tabular-nums",
          color: "var(--on-surface-variant)",
        }}
      >
        -{count} DROP OFF
      </span>
    </div>
  );
}

// =============================================================================
// Total conversion summary
// =============================================================================
function TotalConversion({ pct, delta }: { pct: number; delta: number }) {
  // Progress bar is scaled to 20% max so small conversion numbers still read.
  const barWidth = Math.max(0, Math.min((pct / 20) * 100, 100));

  return (
    <div
      style={{
        borderTop: HAIRLINE,
        paddingTop: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={LABEL}>Total Conversion</span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 30,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.03em",
            color: "var(--on-surface)",
            lineHeight: 1,
          }}
        >
          {pct.toFixed(1)}%
        </span>
      </div>
      <div
        style={{
          marginTop: 8,
          height: 3,
          background: "var(--surface-high)",
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: "100%",
            background: "var(--rust)",
          }}
        />
      </div>
      {delta !== 0 && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {delta > 0 ? (
            <ArrowUp size={10} strokeWidth={2} color="var(--success)" />
          ) : (
            <ArrowDown size={10} strokeWidth={2} color="var(--alert)" />
          )}
          <span
            style={{
              ...LABEL,
              color: delta > 0 ? "var(--success)" : "var(--alert)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}% FROM LAST PERIOD
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Stage breakdown
// =============================================================================
function StageBreakdown({ entries }: { entries: StageBreakdownEntry[] }) {
  const [openKey, setOpenKey] = useState<FunnelStageKey | null>(null);

  return (
    <section>
      <div style={{ marginBottom: 10 }}>
        <span style={LABEL}>Stage Breakdown</span>
      </div>
      <div
        style={{
          background: "var(--surface-lowest)",
          border: HAIRLINE,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {entries.map((entry, idx) => {
          const isOpen = entry.key === openKey;
          const isLast = idx === entries.length - 1;
          return (
            <BreakdownRow
              key={entry.key}
              entry={entry}
              isOpen={isOpen}
              isLast={isLast}
              onToggle={() => setOpenKey(isOpen ? null : entry.key)}
            />
          );
        })}
      </div>
    </section>
  );
}

function BreakdownRow({
  entry,
  isOpen,
  isLast,
  onToggle,
}: {
  entry: StageBreakdownEntry;
  isOpen: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderBottom: isLast ? "none" : HAIRLINE,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            background: "var(--on-surface)",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--on-surface)",
            }}
          >
            {entry.label}
          </div>
        </div>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: "var(--on-surface)",
          }}
        >
          {entry.count}
        </span>
        <ChevronRight
          size={14}
          strokeWidth={1.5}
          color="var(--on-surface-variant)"
          style={{
            transform: isOpen ? "rotate(90deg)" : "rotate(0)",
            transition: "transform 0.15s",
          }}
        />
      </button>
      {isOpen && (
        <div
          style={{
            borderTop: HAIRLINE,
            background: "var(--surface-low)",
            padding: "10px 14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {entry.groups.map((group) => (
            <div
              key={group.label}
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span style={LABEL}>{group.label}</span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 11,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  ({group.count})
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {group.customers.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: "var(--surface-lowest)",
                      border: HAIRLINE,
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          ...DISPLAY,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--on-surface)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {c.name}
                      </span>
                      <span
                        style={{
                          ...LABEL,
                          fontVariantNumeric: "tabular-nums",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.daysAtStage}D
                      </span>
                    </div>
                    <div style={{ ...LABEL, color: "var(--on-surface-variant)" }}>
                      JOB: {c.jobLabel}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        color: "var(--on-surface-variant)",
                        marginTop: 2,
                      }}
                    >
                      {c.nextAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Conversion over time
// =============================================================================
function ConversionOverTime({
  points,
  insight,
}: {
  points: ConversionTrendPoint[];
  insight: string;
}) {
  const max = Math.max(...points.map((p) => p.pct), 1);
  const chartHeight = 120;

  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span style={LABEL}>Conversion Over Time</span>
        <button
          type="button"
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--on-surface-variant)",
          }}
        >
          View Details
        </button>
      </div>

      <div
        style={{
          background: "var(--surface-lowest)",
          border: HAIRLINE,
          padding: "16px 14px 12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            height: chartHeight,
          }}
        >
          {points.map((pt, idx) => {
            const h = Math.max(2, (pt.pct / max) * chartHeight);
            const bg = pt.isCurrent
              ? "var(--rust)"
              : "var(--outline-variant)";
            return (
              <div
                key={`${pt.label}-${idx}`}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  justifyContent: "flex-end",
                  height: "100%",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 9,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: pt.isCurrent
                      ? "var(--rust)"
                      : "var(--on-surface-variant)",
                  }}
                >
                  {pt.pct.toFixed(1)}
                </span>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 28,
                    height: h,
                    background: bg,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: HAIRLINE,
            display: "flex",
            gap: 10,
          }}
        >
          {points.map((pt, idx) => (
            <span
              key={`${pt.label}-lbl-${idx}`}
              style={{
                flex: 1,
                textAlign: "center",
                fontFamily: "var(--font-display)",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--on-surface-variant)",
              }}
            >
              {pt.label}
            </span>
          ))}
        </div>
      </div>

      <p
        style={{
          margin: "10px 0 0",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          lineHeight: 1.55,
          color: "var(--on-surface-variant)",
        }}
      >
        {insight}
      </p>
    </section>
  );
}
