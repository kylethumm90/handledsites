"use client";

/**
 * handled. — Pipeline screen
 *
 * Renders:
 *   1. Navy header bar with "handled." brand + company name + demo tier toggle
 *   2. Pipeline / Post-Sale full-width toggle
 *   3. Four stage boxes (tap to filter the card list)
 *   4. Agent status bar (AI Team tier only — Ava on pipeline, Stella on post-sale)
 *   5. Contact cards filtered by the active stage
 *   6. Upsell hint card (Base tier only)
 *   7. Bottom navy upsell CTA (Base tier only)
 *
 * See docs/PRODUCT_SPEC.md and docs/mockups/pipeline-basic*.png.
 */

import { useMemo, useState } from "react";
import { colors, fonts, type StageKey } from "@/lib/design-system";
import { UpsellHint } from "@/components/ui/primitives";
import { ContactCard, type Tier } from "@/components/pipeline/contact-card";
import {
  PIPELINE_CONTACTS,
  POST_SALE_CONTACTS,
} from "@/components/pipeline/sample-data";

// ---------------------------------------------------------------------------
// Types + config
// ---------------------------------------------------------------------------

type View = "pipeline" | "post_sale";

type StageConfig = {
  key: StageKey;
  label: string;
  color: string;
};

const PIPELINE_STAGES: StageConfig[] = [
  { key: "new", label: "New", color: colors.amber },
  { key: "contacted", label: "Contacted", color: colors.blue },
  { key: "appt_set", label: "Appt Set", color: colors.navy },
  { key: "job_done", label: "Job Done", color: colors.green },
];

const POST_SALE_STAGES: StageConfig[] = [
  { key: "recovery", label: "Recovery", color: colors.red },
  { key: "feedback", label: "Feedback", color: colors.amber },
  { key: "reviewed", label: "Reviewed", color: colors.green },
  { key: "referrer", label: "Referrer", color: colors.purple },
];

type StageWithCount = StageConfig & { count: number };

// Placeholder — will come from the authenticated contractor later.
const COMPANY_NAME = "Deerfield Plumbing Co";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PipelinePage() {
  const [view, setView] = useState<View>("pipeline");
  const [tier, setTier] = useState<Tier>("base");
  const [selectedStage, setSelectedStage] = useState<StageKey | null>(null);

  const stageConfigs =
    view === "pipeline" ? PIPELINE_STAGES : POST_SALE_STAGES;
  const allContacts =
    view === "pipeline" ? PIPELINE_CONTACTS : POST_SALE_CONTACTS;

  // Live counts derived from the sample data.
  const stagesWithCounts = useMemo(
    () =>
      stageConfigs.map((s) => ({
        ...s,
        count: allContacts.filter((c) => c.stage === s.key).length,
      })),
    [stageConfigs, allContacts],
  );

  const visibleContacts = useMemo(
    () =>
      selectedStage
        ? allContacts.filter((c) => c.stage === selectedStage)
        : allContacts,
    [allContacts, selectedStage],
  );

  const handleViewChange = (next: View) => {
    setView(next);
    setSelectedStage(null); // clear filter when switching views
  };

  const handleStageTap = (key: StageKey) => {
    setSelectedStage((prev) => (prev === key ? null : key));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.bg,
        fontFamily: fonts.body,
        color: colors.navy,
      }}
    >
      <Header
        companyName={COMPANY_NAME}
        tier={tier}
        onTierChange={setTier}
      />
      <ViewToggle value={view} onChange={handleViewChange} />
      <StageRow
        stages={stagesWithCounts}
        selected={selectedStage}
        onSelect={handleStageTap}
      />

      {tier === "ai_team" ? <AgentStatusBar view={view} /> : null}

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 16,
        }}
      >
        {visibleContacts.map((contact) => (
          <ContactCard key={contact.id} contact={contact} tier={tier} />
        ))}

        {tier === "base" ? (
          <UpsellHint>
            {view === "pipeline"
              ? "With Ava, these leads get an instant text-back in under 10 seconds."
              : "With Stella, feedback requests go out automatically the day after the job."}
          </UpsellHint>
        ) : null}
      </section>

      {tier === "base" ? <BottomUpsell view={view} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({
  companyName,
  tier,
  onTierChange,
}: {
  companyName: string;
  tier: Tier;
  onTierChange: (next: Tier) => void;
}) {
  return (
    <header
      style={{
        backgroundColor: colors.navy,
        color: colors.white,
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        minHeight: 56,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span
          style={{
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: "-0.01em",
          }}
        >
          handled.
        </span>
        <span
          style={{
            fontFamily: fonts.body,
            fontWeight: 500,
            fontSize: 11,
            color: "rgba(255,255,255,0.7)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {companyName}
        </span>
      </div>

      <TierToggle value={tier} onChange={onTierChange} />
    </header>
  );
}

function TierToggle({
  value,
  onChange,
}: {
  value: Tier;
  onChange: (next: Tier) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Tier (demo)"
      style={{
        display: "inline-flex",
        border: "1px solid rgba(255,255,255,0.25)",
        backgroundColor: "transparent",
      }}
    >
      <TierButton
        active={value === "base"}
        label="BASE"
        onClick={() => onChange("base")}
      />
      <TierButton
        active={value === "ai_team"}
        label="AI TEAM"
        onClick={() => onChange("ai_team")}
      />
    </div>
  );
}

function TierButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        minHeight: 44,
        padding: "0 12px",
        border: "none",
        borderRadius: 0,
        cursor: "pointer",
        fontFamily: fonts.mono,
        fontWeight: 600,
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        backgroundColor: active ? colors.amber : "transparent",
        color: active ? colors.navy : "rgba(255,255,255,0.8)",
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// View Toggle
// ---------------------------------------------------------------------------

function ViewToggle({
  value,
  onChange,
}: {
  value: View;
  onChange: (next: View) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Pipeline view"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.white,
      }}
    >
      <ToggleButton
        active={value === "pipeline"}
        label="Pipeline"
        onClick={() => onChange("pipeline")}
      />
      <ToggleButton
        active={value === "post_sale"}
        label="Post-Sale"
        onClick={() => onChange("post_sale")}
      />
    </div>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        minHeight: 44,
        padding: "12px 16px",
        border: "none",
        borderRadius: 0,
        cursor: "pointer",
        fontFamily: fonts.body,
        fontWeight: 600,
        fontSize: 14,
        letterSpacing: "0.01em",
        backgroundColor: active ? colors.navy : "transparent",
        color: active ? colors.white : colors.muted,
        transition: "background-color 120ms ease, color 120ms ease",
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Stage boxes row
// ---------------------------------------------------------------------------

function StageRow({
  stages,
  selected,
  onSelect,
}: {
  stages: StageWithCount[];
  selected: StageKey | null;
  onSelect: (key: StageKey) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {stages.map((stage, i) => (
        <StageBox
          key={stage.key}
          stage={stage}
          active={selected === stage.key}
          showLeftBorder={i > 0}
          onClick={() => onSelect(stage.key)}
        />
      ))}
    </div>
  );
}

function StageBox({
  stage,
  active,
  showLeftBorder,
  onClick,
}: {
  stage: StageWithCount;
  active: boolean;
  showLeftBorder: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${stage.label}: ${stage.count}`}
      onClick={onClick}
      style={{
        minHeight: 72,
        padding: "14px 8px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        border: "none",
        borderLeft: showLeftBorder
          ? `1px solid ${colors.borderLight}`
          : "none",
        borderTop: active ? `2px solid ${stage.color}` : "2px solid transparent",
        borderRadius: 0,
        backgroundColor: active ? colors.bg : "transparent",
        cursor: "pointer",
        transition: "background-color 120ms ease",
      }}
    >
      <span
        style={{
          fontFamily: fonts.mono,
          fontWeight: 600,
          fontSize: 28,
          lineHeight: 1,
          color: stage.color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {stage.count}
      </span>
      <span
        style={{
          fontFamily: fonts.body,
          fontWeight: 600,
          fontSize: 9,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        {stage.label}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Agent status bar (AI Team tier only)
// ---------------------------------------------------------------------------

function AgentStatusBar({ view }: { view: View }) {
  const isAva = view === "pipeline";
  const agentColor = isAva ? colors.amber : colors.green;
  const agentBg = isAva ? colors.amberBg : colors.greenBg;
  const initial = isAva ? "A" : "S";
  const name = isAva ? "Ava" : "Stella";
  const summary = isAva
    ? "Responded to 7 leads today · Avg response: 8 seconds · 2 appointments booked"
    : "Sent 4 feedback requests · Logged 2 new reviews · 1 recovery flagged";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        backgroundColor: agentBg,
        borderLeft: `3px solid ${agentColor}`,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 24,
          height: 24,
          flexShrink: 0,
          backgroundColor: agentColor,
          color: colors.white,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.body,
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        {initial}
      </div>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.navy,
          lineHeight: 1.35,
          minWidth: 0,
        }}
      >
        <span style={{ fontWeight: 700 }}>{name}</span>
        <span style={{ color: colors.muted }}> · {summary}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bottom upsell CTA (Base tier only)
// ---------------------------------------------------------------------------

function BottomUpsell({ view }: { view: View }) {
  const painLine =
    view === "pipeline"
      ? "Leads don't wait. Every hour without a response is a lost job."
      : "Happy customers forget. Every job without a review is a missed referral.";

  return (
    <section
      style={{
        backgroundColor: colors.navy,
        color: colors.white,
        padding: "24px 20px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: fonts.body,
          fontWeight: 600,
          fontSize: 15,
          lineHeight: 1.4,
          color: colors.white,
        }}
      >
        {painLine}
      </p>
      <button
        type="button"
        style={{
          minHeight: 48,
          padding: "14px 20px",
          backgroundColor: colors.amber,
          color: colors.navy,
          border: "none",
          borderRadius: 0,
          cursor: "pointer",
          fontFamily: fonts.body,
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        ⚡ Activate Your AI Team
      </button>
    </section>
  );
}
