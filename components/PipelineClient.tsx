"use client";

// Mobile-first Pipeline screen. One component, two modes:
//  • Manual  — contractor does the work; the header chip reads "Manual",
//              the alert card counts leads with no response yet, and each
//              card's footer shows a live-ticking "No response yet · 34m".
//  • Ava is live — same layout, different copy: red "needs attention"
//              alert + green "handled today" alert, footers show
//              "Ava responded in 8s", etc.
//
// The mode is a single boolean (`avaLive`) threaded through one render
// tree. No forked codepaths. Flipping the businesses.ava_enabled column
// swaps the entire screen.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lead } from "@/lib/supabase";
import { useCurrentPlan } from "@/lib/plans";
import { initials, nameHue } from "@/lib/utils";
import {
  STAGE_COLORS,
  computeStageCounts,
  computePipelineValue,
  formatMoneyCompact,
  formatElapsed,
  waitingElapsedSeconds,
  isWaitingOnYou,
  isStale,
  avgSpeedToLead,
  leadsHandledSince,
  startOfTodayMs,
} from "@/lib/pipeline";
import AddContactModal from "@/components/AddContactModal";

type Props = {
  leads: Lead[];
  trade: string;
  avaEnabled: boolean; // from businesses.ava_enabled
};

const MAX_WIDTH = 420;
const INK = "#111827";
const MUTED = "#6B7280";
const HAIRLINE = "rgba(17,24,39,0.08)";
const SURFACE = "#FFFFFF";
const BG = "#F5F5F7";

// ── Small building blocks ─────────────────────────────────────────────

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const hue = nameHue(name);
  const bg = `hsl(${(hue % 60) + 120}, 25%, 35%)`;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: bg,
        color: "#fff",
        fontSize: size * 0.34,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

function StageTile({
  label,
  count,
  color,
  dim,
}: {
  label: string;
  count: number;
  color: string;
  dim: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: SURFACE,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 10,
        padding: "12px 4px 10px",
        textAlign: "center",
        opacity: dim ? 0.65 : 1,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {count}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: MUTED,
          marginTop: 6,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function PipelineTotalBar({
  totalCents,
  thisWeekCents,
  weekDeltaPct,
  segments,
}: {
  totalCents: number;
  thisWeekCents: number;
  weekDeltaPct: number | null;
  segments: { color: string; pct: number }[];
}) {
  const deltaColor =
    weekDeltaPct == null
      ? MUTED
      : weekDeltaPct >= 0
        ? "#16A34A"
        : "#DC2626";
  const deltaStr =
    weekDeltaPct == null ? "" : `${weekDeltaPct >= 0 ? "+" : ""}${weekDeltaPct}%`;

  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 10,
        padding: "12px 14px 14px",
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
        <div
          style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}
        >
          Pipeline
        </div>
        <div style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>
          This week
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
          marginTop: 2,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: INK,
            letterSpacing: "-0.03em",
          }}
        >
          {formatMoneyCompact(totalCents)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>
          {formatMoneyCompact(thisWeekCents)}{" "}
          <span
            style={{ color: deltaColor, fontWeight: 700, marginLeft: 2 }}
          >
            {deltaStr}
          </span>
        </div>
      </div>

      {/* 4-segment progress bar. Segments are weighted by count share, not
          value share — the bar is about "shape of the pipeline", not dollars. */}
      <div
        style={{
          marginTop: 11,
          height: 5,
          borderRadius: 3,
          background: "#E5E7EB",
          display: "flex",
          overflow: "hidden",
        }}
      >
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{
              width: `${seg.pct}%`,
              background: seg.color,
              transition: "width 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AlertCard({
  tone,
  title,
  subtitle,
  actionHref,
}: {
  tone: "red" | "green";
  title: string;
  subtitle: string;
  actionHref?: string;
}) {
  const bg = tone === "red" ? "#FEF2F2" : "#F0FDF4";
  const border = tone === "red" ? "#FECACA" : "#BBF7D0";
  const dotBg = tone === "red" ? "#DC2626" : "#16A34A";
  const titleColor = tone === "red" ? "#991B1B" : "#166534";
  const subColor = tone === "red" ? "#B91C1C" : "#15803D";

  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          background: dotBg,
          color: "#fff",
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {tone === "red" ? "!" : "✓"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: titleColor,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: subColor,
            marginTop: 1,
          }}
        >
          {subtitle}
        </div>
      </div>
      {actionHref && (
        <div style={{ color: subColor, fontSize: 18, fontWeight: 400 }}>
          ›
        </div>
      )}
    </div>
  );

  if (actionHref) {
    return (
      <Link
        href={actionHref}
        style={{ textDecoration: "none", display: "block" }}
      >
        {content}
      </Link>
    );
  }
  return content;
}

function LeadCard({
  lead,
  nowMs,
  avaLive,
  onOpen,
}: {
  lead: Lead;
  nowMs: number;
  avaLive: boolean;
  onOpen: (lead: Lead) => void;
}) {
  const service = lead.service_needed || lead.answers?.service_type || null;
  const value = lead.estimated_value_cents
    ? formatMoneyCompact(lead.estimated_value_cents)
    : null;

  // "34m" — time since the lead landed. Capped client-side for the card
  // header; the alert row shows the full elapsed countup.
  const elapsedSinceCreated = formatElapsed(
    Math.floor((nowMs - Date.parse(lead.created_at)) / 1000),
  );

  const waiting = !lead.first_response_at;

  // Footer line switches on (waiting, mode, qualifying-tag)
  let footerDot = "#DC2626";
  let footerText: string;
  let qualifier: string | null = null;
  let competitorBadge = false;

  if (waiting) {
    footerDot = "#DC2626";
    footerText = `No response yet · ${formatElapsed(waitingElapsedSeconds(lead, nowMs))}`;
  } else {
    const speed = lead.speed_to_lead_seconds ?? 0;
    if (avaLive) {
      footerDot = "#16A34A";
      footerText = `Ava responded in ${formatElapsed(speed)}`;
      if (lead.status === "contacted") qualifier = "qualifying";
    } else {
      footerDot = MUTED;
      footerText = `Responded in ${formatElapsed(speed)}`;
    }
  }

  // Competitor tag surfaces in Ava mode as a yellow pill (mockup)
  if (avaLive && lead.tags?.includes("competitor")) competitorBadge = true;

  return (
    <button
      type="button"
      onClick={() => onOpen(lead)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: "100%",
        background: SURFACE,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 12,
        padding: "12px 14px",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <Avatar name={lead.name} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: INK,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {lead.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: MUTED,
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {elapsedSinceCreated}
          </div>
        </div>
        {(service || value) && (
          <div
            style={{
              fontSize: 12,
              color: MUTED,
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            {service}
            {service && value ? " · " : ""}
            {value}
          </div>
        )}
        {lead.notes && (
          <div
            style={{
              fontSize: 13,
              color: INK,
              marginTop: 6,
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {lead.notes}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: footerDot,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: footerDot,
              letterSpacing: "-0.01em",
            }}
          >
            {footerText}
          </span>
          {qualifier && (
            <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>
              · {qualifier}
            </span>
          )}
          {competitorBadge && (
            <span
              style={{
                background: "#FEF3C7",
                color: "#92400E",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 10,
                letterSpacing: "0.01em",
              }}
            >
              Competitor
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function PipelineBottomTabs() {
  // Pipeline / Reputation / Pulse from the mockup. Pipeline is the
  // current page; Reputation routes to the existing Reputation dash;
  // Pulse is a stub until that section ships.
  const items: { key: string; label: string; href?: string; icon: string }[] = [
    { key: "pipeline", label: "Pipeline", href: "/contractor/customers", icon: "▦" },
    { key: "reputation", label: "Reputation", href: "/contractor/reputation", icon: "★" },
    { key: "pulse", label: "Pulse", icon: "▮" },
  ];
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: SURFACE,
        borderTop: `1px solid ${HAIRLINE}`,
        display: "flex",
        justifyContent: "center",
        zIndex: 30,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: MAX_WIDTH,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          padding: "10px 0 14px",
        }}
      >
        {items.map((item) => {
          const inner = (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                color: item.key === "pipeline" ? INK : MUTED,
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: item.key === "pipeline" ? 700 : 500,
                }}
              >
                {item.label}
              </span>
            </div>
          );
          if (item.href) {
            return (
              <Link
                key={item.key}
                href={item.href}
                style={{ textDecoration: "none" }}
              >
                {inner}
              </Link>
            );
          }
          return (
            <div
              key={item.key}
              style={{ cursor: "default", opacity: 0.6 }}
              aria-label={`${item.label} (coming soon)`}
            >
              {inner}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

// ── Main screen ───────────────────────────────────────────────────────

export default function PipelineClient({ leads: initialLeads, trade, avaEnabled }: Props) {
  const router = useRouter();
  const { features } = useCurrentPlan();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [showAdd, setShowAdd] = useState(false);

  // Single source of truth for "live Ava". The screen is always Ava-
  // ready; we just gate the copy behind two flags so flipping the DB
  // column turns the whole experience on without a deploy.
  const avaLive = features.ava && avaEnabled;

  // 1Hz heartbeat drives the live "No response yet · 34m" countup on
  // every uncontacted card. Using one shared interval + one state
  // variable means 30 cards don't spawn 30 intervals — they all
  // re-render off a single tick.
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const nonDemoLeads = useMemo(
    () => leads.filter((l) => !l.is_demo),
    [leads],
  );

  const counts = useMemo(() => computeStageCounts(nonDemoLeads), [nonDemoLeads]);
  const value = useMemo(
    () => computePipelineValue(nonDemoLeads, nowMs),
    // intentionally don't recompute every tick — only when leads change:
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nonDemoLeads],
  );

  const total = counts.new + counts.contacted + counts.apptSet + counts.done;
  const segments = useMemo(() => {
    if (total === 0) return [];
    return [
      { color: STAGE_COLORS.new, pct: (counts.new / total) * 100 },
      { color: STAGE_COLORS.contacted, pct: (counts.contacted / total) * 100 },
      { color: STAGE_COLORS.apptSet, pct: (counts.apptSet / total) * 100 },
      { color: STAGE_COLORS.done, pct: (counts.done / total) * 100 },
    ];
  }, [counts, total]);

  const waitingCount = useMemo(
    () => nonDemoLeads.filter(isWaitingOnYou).length,
    [nonDemoLeads],
  );
  const staleCount = useMemo(
    () => nonDemoLeads.filter((l) => isStale(l, nowMs)).length,
    // tick once per minute at most — stale is 48h+, no need for 1Hz
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nonDemoLeads],
  );
  const todayStart = startOfTodayMs(nowMs);
  const handledToday = useMemo(
    () => leadsHandledSince(nonDemoLeads, todayStart),
    [nonDemoLeads, todayStart],
  );
  const avgToday = useMemo(
    () => avgSpeedToLead(nonDemoLeads, todayStart),
    [nonDemoLeads, todayStart],
  );

  // Lead list ordering: newest first (matches mockup).
  const sortedLeads = useMemo(() => {
    const all = [...leads].sort(
      (a, b) =>
        Date.parse(b.created_at) - Date.parse(a.created_at),
    );
    return all;
  }, [leads]);

  const handleOpenLead = (lead: Lead) => {
    router.push(`/contractor/customers/${lead.id}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: INK,
        paddingBottom: 80,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: MAX_WIDTH,
          margin: "0 auto",
          padding: "18px 14px 0",
        }}
      >
        {/* Header: brand + title on the left, mode chip on the right */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: INK,
                letterSpacing: "-0.01em",
              }}
            >
              handled.
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: INK,
                letterSpacing: "-0.03em",
                marginTop: 2,
                lineHeight: 1.1,
              }}
            >
              Pipeline
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: avaLive ? "#16A34A" : MUTED,
              marginTop: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                background: avaLive ? "#16A34A" : MUTED,
                display: "inline-block",
              }}
            />
            {avaLive ? "Ava is live" : "Manual"}
          </div>
        </div>

        {/* Stage tiles */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <StageTile
            label="New"
            count={counts.new}
            color={STAGE_COLORS.new}
            dim={counts.new === 0}
          />
          <StageTile
            label="Contacted"
            count={counts.contacted}
            color={STAGE_COLORS.contacted}
            dim={counts.contacted === 0}
          />
          <StageTile
            label="Appt set"
            count={counts.apptSet}
            color={STAGE_COLORS.apptSet}
            dim={counts.apptSet === 0}
          />
          <StageTile
            label="Done"
            count={counts.done}
            color={STAGE_COLORS.done}
            dim={counts.done === 0}
          />
        </div>

        {/* Pipeline $ total + weekly delta + 4-segment progress bar */}
        <div style={{ marginBottom: 12 }}>
          <PipelineTotalBar
            totalCents={value.totalCents}
            thisWeekCents={value.thisWeekCents}
            weekDeltaPct={value.weekDeltaPct}
            segments={segments}
          />
        </div>

        {/* Alert cards — same slot, mode-aware content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {avaLive ? (
            <>
              {staleCount > 0 && (
                <AlertCard
                  tone="red"
                  title={`${staleCount} lead${staleCount === 1 ? "" : "s"} need${staleCount === 1 ? "s" : ""} your attention`}
                  subtitle="Stale 48h+ — Ava can't move forward"
                  actionHref="/contractor/customers?filter=stale"
                />
              )}
              {handledToday > 0 && (
                <AlertCard
                  tone="green"
                  title={`${handledToday} lead${handledToday === 1 ? "" : "s"} handled today`}
                  subtitle={
                    avgToday != null
                      ? `Avg response: ${formatElapsed(avgToday)}`
                      : "Tracking response times"
                  }
                />
              )}
            </>
          ) : (
            waitingCount > 0 && (
              <AlertCard
                tone="red"
                title={`${waitingCount} lead${waitingCount === 1 ? "" : "s"} waiting on you`}
                subtitle="Nobody has responded yet"
              />
            )
          )}
        </div>

        {/* Section label + add button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "4px 2px 8px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: MUTED,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            All leads
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: INK,
              color: "#fff",
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 14,
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            + Add
          </button>
        </div>

        {/* Lead list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sortedLeads.length === 0 ? (
            <div
              style={{
                background: SURFACE,
                border: `1px dashed ${HAIRLINE}`,
                borderRadius: 12,
                padding: "28px 14px",
                textAlign: "center",
                color: MUTED,
                fontSize: 13,
              }}
            >
              No leads yet. Tap “+ Add” to bring your first one in.
            </div>
          ) : (
            sortedLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                nowMs={nowMs}
                avaLive={avaLive}
                onOpen={handleOpenLead}
              />
            ))
          )}
        </div>
      </div>

      {showAdd && (
        <AddContactModal
          trade={trade}
          onClose={() => setShowAdd(false)}
          onAdded={(lead) => {
            setLeads([lead, ...leads]);
            setShowAdd(false);
          }}
          onBulkAdded={(newLeads) => {
            setLeads([...newLeads, ...leads]);
            setShowAdd(false);
          }}
        />
      )}

      <PipelineBottomTabs />
    </div>
  );
}
