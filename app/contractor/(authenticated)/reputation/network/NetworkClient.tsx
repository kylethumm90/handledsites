"use client";

import { ChevronRight, Settings2, Star } from "lucide-react";
import type {
  NetworkData,
  NetworkReferrer,
  ReferralActivity,
  ReferralActivityStatus,
  StellaQueueItem,
} from "../types";
import { DISPLAY, HAIRLINE, LABEL } from "../tokens";

// =============================================================================
// Helpers
// =============================================================================
function formatCompactUsd(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    const k = dollars / 1000;
    // Keep one decimal only when it would be meaningful (e.g. 42.8K, not 42.0K).
    const rounded = Math.round(k * 10) / 10;
    return `$${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}K`;
  }
  return `$${Math.round(dollars)}`;
}

function formatFullUsd(cents: number): string {
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString("en-US")}`;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffH = Math.round(diffMs / (60 * 60 * 1000));
  if (diffH < 1) return "JUST NOW";
  if (diffH < 24) return `${diffH}H AGO`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}D AGO`;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

// =============================================================================
// Main
// =============================================================================
export default function NetworkClient({ data }: { data: NetworkData }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <TitleBlock />

      <StatsGrid
        activeReferrers={data.stats.activeReferrers}
        referrals={data.stats.referralsThisMonth}
        revenueCents={data.stats.revenueCents}
        avgValueCents={data.stats.avgValueCents}
      />

      <LeaderboardSection
        referrers={data.leaderboard}
        total={data.leaderboardTotal}
      />

      <RecentActivitySection items={data.recentActivity} />

      <StellaQueueSection
        items={data.stellaQueue}
        scheduledCount={data.stellaScheduledCount}
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
          Network
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
          title="People sending you work"
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
        Your referral network is growing.
      </p>
    </div>
  );
}

// =============================================================================
// Stats grid (2x2)
// =============================================================================
function StatsGrid({
  activeReferrers,
  referrals,
  revenueCents,
  avgValueCents,
}: {
  activeReferrers: number;
  referrals: number;
  revenueCents: number;
  avgValueCents: number;
}) {
  return (
    <div
      style={{
        border: HAIRLINE,
        background: "var(--outline-variant)",
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "0.5px",
      }}
    >
      <StatCell
        dotColor="var(--on-surface)"
        label="Active Referrers"
        value={String(activeReferrers).padStart(2, "0")}
      />
      <StatCell
        dotColor="var(--on-surface)"
        label="Referrals"
        value={String(referrals).padStart(2, "0")}
      />
      <StatCell
        dotColor="var(--cta-coral)"
        label="Revenue"
        value={formatCompactUsd(revenueCents)}
        emphasized
      />
      <StatCell
        dotColor="var(--on-surface)"
        label="Avg Value"
        value={formatFullUsd(avgValueCents)}
      />
    </div>
  );
}

function StatCell({
  dotColor,
  label,
  value,
  emphasized = false,
}: {
  dotColor: string;
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      style={{
        background: emphasized ? "var(--coral-soft)" : "var(--surface-lowest)",
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
          color: emphasized ? "var(--cta-coral-dark)" : "var(--on-surface)",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// =============================================================================
// Leaderboard
// =============================================================================
function LeaderboardSection({
  referrers,
  total,
}: {
  referrers: NetworkReferrer[];
  total: number;
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
          Top Referrers Leaderboard
        </span>
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
          aria-label={`View all ${total} referrers`}
        >
          View All ({total})
        </button>
      </div>
      <div
        style={{
          background: "var(--surface-lowest)",
          border: HAIRLINE,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {referrers.map((r, idx) => (
          <LeaderboardRow
            key={r.id}
            referrer={r}
            isLast={idx === referrers.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function LeaderboardRow({
  referrer,
  isLast,
}: {
  referrer: NetworkReferrer;
  isLast: boolean;
}) {
  const isTopThree = referrer.rank <= 3;
  const rankBg = isTopThree ? "var(--rust)" : "var(--surface-high)";
  const rankFg = isTopThree ? "#FFFFFF" : "var(--on-surface-variant)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderBottom: isLast ? "none" : HAIRLINE,
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          background: rankBg,
          color: rankFg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontSize: 11,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}
      >
        {String(referrer.rank).padStart(2, "0")}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            ...DISPLAY,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--on-surface)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {referrer.name}
        </div>
        <div
          style={{
            ...LABEL,
            marginTop: 2,
            color: "var(--on-surface-variant)",
          }}
        >
          {referrer.sinceLabel}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: isTopThree ? "var(--rust)" : "var(--on-surface)",
            lineHeight: 1,
          }}
        >
          {referrer.referralCount}
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontVariantNumeric: "tabular-nums",
            color: "var(--on-surface-variant)",
          }}
        >
          {formatCompactUsd(referrer.revenueCents)}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Recent activity
// =============================================================================
const STATUS_STYLE: Record<
  ReferralActivityStatus,
  { label: string; bg: string; fg: string }
> = {
  closed: {
    label: "Closed",
    bg: "var(--cta-coral)",
    fg: "#FFFFFF",
  },
  booked: {
    label: "Booked",
    bg: "var(--warning)",
    fg: "#FFFFFF",
  },
  contacted: {
    label: "Contacted",
    bg: "var(--surface-high)",
    fg: "var(--on-surface-variant)",
  },
};

function RecentActivitySection({ items }: { items: ReferralActivity[] }) {
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
          Recent Activity
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function ActivityRow({ item }: { item: ReferralActivity }) {
  const status = STATUS_STYLE[item.status];
  return (
    <article
      style={{
        background: "var(--surface-lowest)",
        border: HAIRLINE,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <InitialSquare initials={initialsOf(item.referrerName)} />
        <ChevronRight
          size={12}
          strokeWidth={1.5}
          color="var(--on-surface-variant)"
        />
        <InitialSquare initials={initialsOf(item.referredName)} />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--on-surface)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <strong style={{ fontWeight: 600 }}>{item.referrerName}</strong>
            <span style={{ color: "var(--on-surface-variant)" }}>
              {" "}
              referred{" "}
            </span>
            <strong style={{ fontWeight: 600 }}>{item.referredName}</strong>
          </span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={LABEL}>JOB: {item.jobLabel}</span>
          <StatusBadge label={status.label} bg={status.bg} fg={status.fg} />
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
          {formatRelative(item.timestamp)}
        </span>
      </div>
    </article>
  );
}

function InitialSquare({ initials }: { initials: string }) {
  return (
    <span
      style={{
        width: 26,
        height: 26,
        background: "var(--on-surface)",
        color: "#FFFFFF",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.04em",
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

function StatusBadge({
  label,
  bg,
  fg,
}: {
  label: string;
  bg: string;
  fg: string;
}) {
  return (
    <span
      style={{
        background: bg,
        color: fg,
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
// Stella's Queue
// =============================================================================
function StellaQueueSection({
  items,
  scheduledCount,
}: {
  items: StellaQueueItem[];
  scheduledCount: number;
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
          Stella&rsquo;s Queue
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
          ({items.length}/{scheduledCount})
        </span>
      </div>

      {/* Description card with left coral border */}
      <div
        style={{
          padding: "12px 14px",
          background: "var(--surface-low)",
          borderLeft: "2px solid var(--cta-coral)",
          marginBottom: 10,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-body)",
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--on-surface-variant)",
          }}
        >
          Automatic referral asks scheduled for {scheduledCount} high-sentiment
          customers.
        </p>
      </div>

      <div
        style={{
          background: "var(--surface-lowest)",
          border: HAIRLINE,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {items.map((item, idx) => (
          <QueueRow
            key={item.id}
            item={item}
            isLast={idx === items.length - 1}
          />
        ))}
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        style={{
          marginTop: 10,
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
        <Settings2 size={14} strokeWidth={2} />
        Manage Automations
      </button>
    </section>
  );
}

function QueueRow({
  item,
  isLast,
}: {
  item: StellaQueueItem;
  isLast: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderBottom: isLast ? "none" : HAIRLINE,
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
        aria-hidden
      >
        <Star size={11} strokeWidth={2} color="var(--success)" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
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
          {item.customerName}
        </div>
        <div
          style={{
            ...LABEL,
            marginTop: 2,
            color: "var(--on-surface-variant)",
          }}
        >
          SNT {item.sentimentScore}
        </div>
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
        {item.scheduledLabel}
      </span>
    </div>
  );
}
