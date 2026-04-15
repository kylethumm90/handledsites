"use client";

/**
 * handled. — Pipeline screen
 *
 * Renders:
 *   1. Navy header bar with "handled." brand + company name
 *   2. Pipeline / Post-Sale full-width toggle
 *   3. Four stage boxes (tap to filter the card list)
 *   4. Contact cards below, filtered by the active stage
 *
 * See docs/PRODUCT_SPEC.md and docs/mockups/pipeline-basic*.png.
 */

import { useMemo, useState } from "react";
import { colors, fonts, type StageKey } from "@/lib/design-system";
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

// Current tier — will be driven by the authenticated contractor later.
const CURRENT_TIER: Tier = "base";

type StageWithCount = StageConfig & { count: number };

// Placeholder — will come from the authenticated contractor later.
const COMPANY_NAME = "Deerfield Plumbing Co";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PipelinePage() {
  const [view, setView] = useState<View>("pipeline");
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
      <Header companyName={COMPANY_NAME} />
      <ViewToggle value={view} onChange={handleViewChange} />
      <StageRow
        stages={stagesWithCounts}
        selected={selectedStage}
        onSelect={handleStageTap}
      />

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 16,
        }}
      >
        {visibleContacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            tier={CURRENT_TIER}
          />
        ))}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({ companyName }: { companyName: string }) {
  return (
    <header
      style={{
        backgroundColor: colors.navy,
        color: colors.white,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 48,
      }}
    >
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
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
        }}
      >
        {companyName}
      </span>
    </header>
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
