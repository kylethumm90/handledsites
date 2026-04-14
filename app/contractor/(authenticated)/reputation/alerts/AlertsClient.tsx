"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Phone } from "lucide-react";
import type { AlertsData, AlertSeverity, OpenAlert, ResolvedAlertItem } from "../types";
import { DISPLAY, HAIRLINE, LABEL } from "../tokens";

type FilterKey = "all" | "critical" | "warning";

// =============================================================================
// Main
// =============================================================================
export default function AlertsClient({ data }: { data: AlertsData }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const visibleAlerts = useMemo(() => {
    if (filter === "all") return data.openAlerts;
    return data.openAlerts.filter((a) => a.severity === filter);
  }, [data.openAlerts, filter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <TitleBlock />

      <StatsGrid
        critical={data.criticalCount}
        warning={data.warningCount}
        resolved={data.resolvedCount}
      />

      <FilterTabs active={filter} onChange={setFilter} />

      {/* Open alerts list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {visibleAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
        {visibleAlerts.length === 0 && (
          <div
            style={{
              padding: "24px 16px",
              border: HAIRLINE,
              background: "var(--surface-lowest)",
              textAlign: "center",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--on-surface-variant)",
            }}
          >
            No alerts match this filter.
          </div>
        )}
      </div>

      <ResolvedSection
        items={data.resolvedThisMonth}
        progress={data.resolvedProgress}
      />
    </div>
  );
}

// =============================================================================
// Title block: "Alerts" + info dot + subtitle
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
          Alerts
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
          title="Alerts help you spot customers at risk"
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
        Customers that need your attention
      </p>
    </div>
  );
}

// =============================================================================
// Stats grid: critical / warning / resolved
// =============================================================================
function StatsGrid({
  critical,
  warning,
  resolved,
}: {
  critical: number;
  warning: number;
  resolved: number;
}) {
  return (
    <div
      style={{
        border: HAIRLINE,
        background: "var(--outline-variant)",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "0.5px",
      }}
    >
      <StatCell dotColor="var(--alert)" label="Critical" value={critical} />
      <StatCell dotColor="var(--warning)" label="Warning" value={warning} />
      <StatCell dotColor="var(--success)" label="Resolved" value={resolved} />
    </div>
  );
}

function StatCell({
  dotColor,
  label,
  value,
}: {
  dotColor: string;
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        background: "var(--surface-lowest)",
        padding: "14px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 72,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 6,
            height: 6,
            background: dotColor,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span style={LABEL}>{label}</span>
      </div>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.03em",
          color: "var(--on-surface)",
          lineHeight: 1,
        }}
      >
        {String(value).padStart(2, "0")}
      </span>
    </div>
  );
}

// =============================================================================
// Filter tabs
// =============================================================================
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "warning", label: "Warning" },
];

function FilterTabs({
  active,
  onChange,
}: {
  active: FilterKey;
  onChange: (key: FilterKey) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        borderBottom: HAIRLINE,
      }}
    >
      {FILTERS.map((f) => {
        const isActive = f.key === active;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange(f.key)}
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
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// Alert card
// =============================================================================
const SEVERITY: Record<
  AlertSeverity,
  { badgeLabel: string; badgeBg: string; accent: string }
> = {
  critical: {
    badgeLabel: "Action Required",
    badgeBg: "var(--alert)",
    accent: "var(--alert)",
  },
  warning: {
    badgeLabel: "Needs Attention",
    badgeBg: "var(--warning)",
    accent: "var(--warning)",
  },
};

function AlertCard({ alert }: { alert: OpenAlert }) {
  const sev = SEVERITY[alert.severity];

  return (
    <article
      style={{
        background: "var(--surface-lowest)",
        border: HAIRLINE,
        padding: 16,
      }}
    >
      {/* Row 1: name + badge ... ID right */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <span
            style={{
              ...DISPLAY,
              fontSize: 17,
              fontWeight: 700,
              color: "var(--on-surface)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {alert.customerName}
          </span>
          <SeverityBadge label={sev.badgeLabel} bg={sev.badgeBg} />
        </div>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--on-surface-variant)",
            whiteSpace: "nowrap",
          }}
        >
          ID: {alert.customerRefId}
        </span>
      </div>

      {/* Job label */}
      <div style={{ ...LABEL, marginTop: 8 }}>JOB: {alert.jobLabel}</div>

      {/* Sentiment row + bar */}
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span style={LABEL}>Sentiment Score</span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.03em",
              color: sev.accent,
              lineHeight: 1,
            }}
          >
            {alert.sentimentScore}
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
              width: `${Math.max(0, Math.min(alert.sentimentScore, 100))}%`,
              height: "100%",
              background: sev.accent,
            }}
          />
        </div>
      </div>

      {/* Quote */}
      <div
        style={{
          marginTop: 16,
          padding: "12px 14px",
          background: "var(--surface-low)",
          borderLeft: `2px solid ${sev.accent}`,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-body)",
            fontStyle: "italic",
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--on-surface-variant)",
          }}
        >
          &ldquo;{alert.quote}&rdquo;
        </p>
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        style={{
          marginTop: 16,
          width: "100%",
          padding: "14px 16px",
          background:
            "linear-gradient(15deg, var(--cta-coral) 0%, var(--cta-coral-dark) 100%)",
          color: "#FFFFFF",
          fontFamily: "var(--font-display)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          border: "0.5px solid var(--cta-coral-dark)",
          borderRadius: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Phone size={14} strokeWidth={2} />
        Call {alert.customerName.split(" ")[0]} Now
      </button>

      {/* Secondary CTA */}
      <button
        type="button"
        style={{
          marginTop: 8,
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
        Assign to Team Member
      </button>
    </article>
  );
}

function SeverityBadge({ label, bg }: { label: string; bg: string }) {
  return (
    <span
      style={{
        background: bg,
        color: "#FFFFFF",
        fontFamily: "var(--font-display)",
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "4px 7px",
        border: 0,
        borderRadius: 0,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// =============================================================================
// Resolved This Month
// =============================================================================
function ResolvedSection({
  items,
  progress,
}: {
  items: ResolvedAlertItem[];
  progress: { resolved: number; total: number };
}) {
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
        <span
          style={{
            ...DISPLAY,
            fontSize: 14,
            fontWeight: 700,
            color: "var(--on-surface)",
          }}
        >
          Resolved This Month
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 11,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            color: "var(--on-surface-variant)",
          }}
        >
          ({progress.resolved}/{progress.total})
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => (
          <ResolvedRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function ResolvedRow({ item }: { item: ResolvedAlertItem }) {
  return (
    <button
      type="button"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: "var(--surface-low)",
        border: HAIRLINE,
        borderRadius: 0,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          background: "var(--success-soft)",
          border: "0.5px solid var(--success)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Check size={12} strokeWidth={2.5} color="var(--success)" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            ...DISPLAY,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--on-surface)",
          }}
        >
          {item.customerName}
        </div>
        <div
          style={{
            ...LABEL,
            marginTop: 2,
            color: "var(--on-surface-variant)",
          }}
        >
          {item.actionLabel}
        </div>
      </div>
      <ChevronRight size={14} strokeWidth={1.5} color="var(--on-surface-variant)" />
    </button>
  );
}
