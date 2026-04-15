"use client";

/**
 * handled. — Pipeline screen
 *
 * For now this page renders only:
 *   1. Navy header bar with "handled." brand + company name
 *   2. Pipeline / Post-Sale full-width toggle
 *   3. Four stage boxes (tap to filter — wiring comes later)
 *
 * See docs/PRODUCT_SPEC.md and docs/mockups/pipeline-basic*.png.
 */

import { useState } from "react";
import { colors, fonts } from "@/lib/design-system";

// ---------------------------------------------------------------------------
// Types + placeholder data
// ---------------------------------------------------------------------------

type View = "pipeline" | "post_sale";

type StageKey =
  // pipeline
  | "new"
  | "contacted"
  | "appt_set"
  | "job_done"
  // post-sale
  | "recovery"
  | "feedback"
  | "reviewed"
  | "referrer";

type Stage = {
  key: StageKey;
  label: string;
  color: string;
  count: number;
};

// Placeholder counts; will be wired to real data later.
const PIPELINE_STAGES: Stage[] = [
  { key: "new", label: "New", color: colors.amber, count: 5 },
  { key: "contacted", label: "Contacted", color: colors.blue, count: 3 },
  { key: "appt_set", label: "Appt Set", color: colors.navy, count: 2 },
  { key: "job_done", label: "Job Done", color: colors.green, count: 3 },
];

const POST_SALE_STAGES: Stage[] = [
  { key: "recovery", label: "Recovery", color: colors.red, count: 4 },
  { key: "feedback", label: "Feedback", color: colors.amber, count: 2 },
  { key: "reviewed", label: "Reviewed", color: colors.green, count: 8 },
  { key: "referrer", label: "Referrer", color: colors.purple, count: 1 },
];

// Placeholder — will come from the authenticated contractor later.
const COMPANY_NAME = "Deerfield Plumbing Co";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PipelinePage() {
  const [view, setView] = useState<View>("pipeline");
  const [selectedStage, setSelectedStage] = useState<StageKey | null>(null);

  const stages = view === "pipeline" ? PIPELINE_STAGES : POST_SALE_STAGES;

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
        stages={stages}
        selected={selectedStage}
        onSelect={handleStageTap}
      />
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
  stages: Stage[];
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
  stage: Stage;
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
