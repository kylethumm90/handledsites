"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────
//
// Shape returned by /reputation/page.tsx after rolling up referral_rewards
// + the related referrer/referred lead rows. Cards are pre-grouped by
// referrer so the client never has to do its own aggregation.

export type PendingRewardCard = {
  referrerLeadId: string;
  referrerName: string;
  closedCount: number;
  totalValueCents: number;
  earnedCents: number;
  pendingCents: number;
  rewardIds: string[]; // every pending reward in this card, paid as a batch
  oldestPendingAt: string;
  description: string;
  totalReferralCount: number;
};

export type GrowthData = {
  feedbackCount: number;
  reviewsCount: number;
  referralsCount: number;
  weeklyClosedReferrals: number;
  pendingRewardCards: PendingRewardCard[];
};

type Tab = "feedback" | "reviews" | "referrals";

// ──────────────────────────────────────────────────────────────────────
// Tokens
// ──────────────────────────────────────────────────────────────────────

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const INK = "#0F172A";
const MUTED = "#6B7280";
const HAIRLINE = "0.5px solid #E5E7EB";
const SURFACE = "#FFFFFF";
const SURFACE_LOW = "#F9FAFB";
const PRIMARY = "#0F172A";
const SUCCESS = "#10B981";
const SUCCESS_SOFT = "#D1FAE5";
const PENDING = "#D97706";

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

// "$18.4k" / "$350" / "$1.2M"
function formatMoneyCompact(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000)
    return `$${(dollars / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (dollars >= 1_000)
    return `$${(dollars / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `$${Math.round(dollars)}`;
}

function formatMoneyShort(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}

function daysSince(iso: string): number {
  const ms = Date.now() - Date.parse(iso);
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

// Stable hue from a name so the avatar feels intentional.
function hueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

// ──────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────

export default function ReputationGrowthClient({ data }: { data: GrowthData }) {
  const [tab, setTab] = useState<Tab>("referrals");
  const [cards, setCards] = useState<PendingRewardCard[]>(data.pendingRewardCards);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSend(card: PendingRewardCard) {
    if (paying) return;
    setPaying(card.referrerLeadId);
    setError(null);
    try {
      // Pay every pending reward attached to this card. We hit the
      // single-reward route in parallel — small N (≤ a handful), and
      // the route is idempotent against double-clicks.
      await Promise.all(
        card.rewardIds.map((id) =>
          fetch(`/api/contractor/reputation/rewards/${id}/pay`, {
            method: "POST",
          }).then((r) => {
            if (!r.ok) throw new Error("pay failed");
          })
        )
      );
      // Optimistically drop the card and bump earned totals on the next
      // server fetch.
      setCards((prev) =>
        prev.filter((c) => c.referrerLeadId !== card.referrerLeadId)
      );
      router.refresh();
    } catch {
      setError("Couldn't mark reward as sent. Try again.");
    } finally {
      setPaying(null);
    }
  }

  return (
    <div
      style={{
        fontFamily: FONT_STACK,
        color: INK,
        background: SURFACE_LOW,
        minHeight: "100vh",
        padding: "20px 16px 96px",
      }}
    >
      <style>{`
        .rg-pill {
          font-family: ${FONT_STACK};
          font-size: 13px;
          font-weight: 600;
          padding: 10px 18px;
          border-radius: 999px;
          border: 0.5px solid #E5E7EB;
          background: ${SURFACE};
          color: ${INK};
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .rg-pill:hover { background: #F3F4F6; }
        .rg-pill[data-active="true"] {
          background: ${PRIMARY};
          color: #FFFFFF;
          border-color: ${PRIMARY};
        }
        .rg-send-btn {
          font-family: ${FONT_STACK};
          font-size: 13px;
          font-weight: 600;
          padding: 9px 18px;
          border-radius: 999px;
          background: ${PRIMARY};
          color: #FFFFFF;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .rg-send-btn:hover:not(:disabled) {
          background: #1E293B;
          box-shadow: 0 2px 8px rgba(15,23,42,0.12);
        }
        .rg-send-btn:disabled { opacity: 0.55; cursor: wait; }
      `}</style>

      {/* ──────────────── Header ──────────────── */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: MUTED,
            marginBottom: 4,
          }}
        >
          HANDLED.
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Growth
        </h1>
      </div>

      {/* ──────────────── Tab pills ──────────────── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <PillTab
          label="Feedback"
          count={data.feedbackCount}
          active={tab === "feedback"}
          onClick={() => setTab("feedback")}
        />
        <PillTab
          label="Reviews"
          count={data.reviewsCount}
          active={tab === "reviews"}
          onClick={() => setTab("reviews")}
        />
        <PillTab
          label="Referrals"
          count={data.referralsCount}
          active={tab === "referrals"}
          onClick={() => setTab("referrals")}
        />
      </div>

      {tab === "referrals" && (
        <ReferralsTab
          weeklyCount={data.weeklyClosedReferrals}
          cards={cards}
          paying={paying}
          error={error}
          onSend={handleSend}
        />
      )}
      {tab === "feedback" && <ComingSoon label="Feedback" count={data.feedbackCount} />}
      {tab === "reviews" && <ComingSoon label="Reviews" count={data.reviewsCount} />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────────────────

function PillTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rg-pill"
      data-active={active}
      onClick={onClick}
    >
      {label} · {count}
    </button>
  );
}

function ReferralsTab({
  weeklyCount,
  cards,
  paying,
  error,
  onSend,
}: {
  weeklyCount: number;
  cards: PendingRewardCard[];
  paying: string | null;
  error: string | null;
  onSend: (card: PendingRewardCard) => void;
}) {
  return (
    <>
      {/* Weekly summary banner */}
      <div
        style={{
          background: SUCCESS_SOFT,
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 18,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            background: SUCCESS,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>
            {weeklyCount} referral {weeklyCount === 1 ? "reward" : "rewards"}{" "}
            queued this week
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
            Auto-created when a referred customer closes in your pipeline.
          </div>
        </div>
      </div>

      {/* Section header */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: MUTED,
          marginBottom: 10,
        }}
      >
        REWARDS PENDING · {cards.length}
      </div>

      {error && (
        <div
          style={{
            fontSize: 12,
            color: "#B91C1C",
            background: "#FEF2F2",
            padding: "8px 12px",
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      {cards.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cards.map((card) => (
            <RewardCard
              key={card.referrerLeadId}
              card={card}
              paying={paying === card.referrerLeadId}
              onSend={() => onSend(card)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function RewardCard({
  card,
  paying,
  onSend,
}: {
  card: PendingRewardCard;
  paying: boolean;
  onSend: () => void;
}) {
  const hue = hueFromName(card.referrerName);
  const pendingDays = daysSince(card.oldestPendingAt);
  return (
    <div
      style={{
        background: SURFACE,
        borderRadius: 12,
        padding: 16,
        border: HAIRLINE,
        position: "relative",
      }}
    >
      {/* Top-right badge */}
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          minWidth: 22,
          height: 22,
          padding: "0 6px",
          borderRadius: 11,
          background: SUCCESS_SOFT,
          color: "#047857",
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {card.totalReferralCount}
      </div>

      {/* Header row: avatar + name + stats */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: `hsl(${hue}, 60%, 88%)`,
            color: `hsl(${hue}, 50%, 30%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initials(card.referrerName)}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: INK,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {card.referrerName}
          </div>
          <div
            style={{
              fontSize: 12,
              color: MUTED,
              marginTop: 3,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatMoneyCompact(card.totalValueCents)} value · {card.closedCount}{" "}
            closed · {formatMoneyCompact(card.earnedCents)} earned
          </div>
        </div>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 13,
          color: INK,
          lineHeight: 1.4,
          marginBottom: 14,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {card.description}
      </div>

      {/* Footer: Send button + pending */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          className="rg-send-btn"
          onClick={onSend}
          disabled={paying}
        >
          {paying ? "Sending…" : `Send ${formatMoneyShort(card.pendingCents)}`}
        </button>
        <span
          style={{
            fontSize: 12,
            color: PENDING,
            fontWeight: 500,
          }}
        >
          Pending {pendingDays}d
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: SURFACE,
        borderRadius: 12,
        padding: "32px 20px",
        border: HAIRLINE,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 4 }}>
        No pending rewards
      </div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
        When a referred customer closes in your pipeline, a reward will
        appear here for you to send.
      </div>
    </div>
  );
}

function ComingSoon({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        background: SURFACE,
        borderRadius: 12,
        padding: "32px 20px",
        border: HAIRLINE,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 4 }}>
        {label} · {count}
      </div>
      <div style={{ fontSize: 12, color: MUTED }}>
        View coming soon. Counts above are live.
      </div>
    </div>
  );
}
