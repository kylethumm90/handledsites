"use client";

/**
 * PipelineV2 — new design-system pipeline screen for /contractor/customers.
 *
 * Takes real `Lead[]` from the server component and renders the new
 * Pipeline / Post-Sale experience using `ContactCard` + primitives.
 *
 * Tier is derived from the authenticated business:
 *   ai_team  = ava plan feature enabled AND businesses.ava_enabled
 *   base     = otherwise
 *
 * This component renders inside the existing contractor layout (which
 * has its own top nav), so we do NOT render the navy brand header from
 * the standalone /pipeline demo. We start with the view toggle.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActivityLogEntry, Lead } from "@/lib/supabase";
import { useCurrentPlan } from "@/lib/plans";
import { colors, fonts, type StageKey } from "@/lib/design-system";
import { UpsellHint } from "@/components/ui/primitives";
import {
  ContactCard,
  type Contact,
  type Tier,
} from "@/components/pipeline/contact-card";
import ContactDetailModal from "@/components/pipeline/contact-detail-modal";
import { leadToContact } from "@/lib/pipeline-v2";

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

type Props = {
  leads: Lead[];
  businessName: string;
  avaEnabled: boolean;
  /**
   * customer_id → referral_partners.referral_code for every customer in this
   * business that has been enrolled (either by tapping "Make referral
   * partner" in the modal or via the public review-funnel opt-in). Server-
   * fetched in customers/page.tsx; the modal flips its CTA to the share link
   * when the open lead's id is in here.
   */
  referralCodesByLead?: Record<string, string>;
};

export default function PipelineV2({
  leads,
  businessName,
  avaEnabled,
  referralCodesByLead,
}: Props) {
  const router = useRouter();
  const plan = useCurrentPlan();
  const [view, setView] = useState<View>("pipeline");
  const [selectedStage, setSelectedStage] = useState<StageKey | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  // Activities cache keyed by lead id so re-opening the modal is instant.
  const [activitiesByLead, setActivitiesByLead] = useState<
    Record<string, ActivityLogEntry[]>
  >({});
  // Local mirror of the server-supplied referral codes map. Lets a freshly
  // enrolled partner stay visible after the modal closes and reopens
  // without waiting for router.refresh() to repaint the prop.
  const [referralCodes, setReferralCodes] = useState<Record<string, string>>(
    () => referralCodesByLead ?? {},
  );
  useEffect(() => {
    setReferralCodes(referralCodesByLead ?? {});
  }, [referralCodesByLead]);

  // Tier is driven by (plan has Ava) AND (business has flipped Ava on).
  // Matches the "both flags must be true" rule used by PipelineClient.
  const tier: Tier =
    plan.features.ava && avaEnabled ? "ai_team" : "base";

  const leadsById = useMemo(() => {
    const out = new Map<string, Lead>();
    for (const l of leads) out.set(l.id, l);
    return out;
  }, [leads]);

  const selectedLead = selectedLeadId
    ? leadsById.get(selectedLeadId) ?? null
    : null;

  // Fetch activity_log entries for the selected lead the first time the
  // modal opens on that lead. Subsequent opens reuse the cached array.
  useEffect(() => {
    if (!selectedLeadId) return;
    if (activitiesByLead[selectedLeadId]) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/contractor/customers/${selectedLeadId}/activities`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          activities?: ActivityLogEntry[];
        };
        if (cancelled) return;
        setActivitiesByLead((prev) => ({
          ...prev,
          [selectedLeadId]: data.activities ?? [],
        }));
      } catch {
        // Silent — the modal still renders with an empty timeline.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedLeadId, activitiesByLead]);

  // Build ContactCard-shaped objects from real leads, once per view/tier.
  const contacts = useMemo<Contact[]>(() => {
    const out: Contact[] = [];
    for (const lead of leads) {
      const contact = leadToContact(lead, {
        view,
        aiTeamLive: tier === "ai_team",
      });
      if (contact) out.push(contact);
    }
    return out;
  }, [leads, view, tier]);

  const stageConfigs =
    view === "pipeline" ? PIPELINE_STAGES : POST_SALE_STAGES;

  const stagesWithCounts = useMemo<StageWithCount[]>(
    () =>
      stageConfigs.map((s) => ({
        ...s,
        count: contacts.filter((c) => c.stage === s.key).length,
      })),
    [stageConfigs, contacts],
  );

  const visibleContacts = useMemo(
    () =>
      selectedStage
        ? contacts.filter((c) => c.stage === selectedStage)
        : contacts,
    [contacts, selectedStage],
  );

  const handleViewChange = (next: View) => {
    setView(next);
    setSelectedStage(null);
  };

  const handleStageTap = (key: StageKey) => {
    setSelectedStage((prev) => (prev === key ? null : key));
  };

  return (
    <div
      style={{
        // Break out of the contractor layout's 680px centered container
        // so the full-bleed design-system screen can span the viewport.
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        marginTop: -24,
        marginBottom: -48,
        backgroundColor: colors.bg,
        fontFamily: fonts.body,
        color: colors.navy,
        minHeight: "calc(100vh - 52px)",
      }}
    >
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          paddingBottom: 0,
        }}
      >
        <BusinessTitle name={businessName} />
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
          {visibleContacts.length === 0 ? (
            <EmptyState view={view} />
          ) : (
            visibleContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                tier={tier}
                onSelect={(id) => setSelectedLeadId(id)}
              />
            ))
          )}

          {tier === "base" && visibleContacts.length > 0 ? (
            <UpsellHint>
              {view === "pipeline"
                ? "With Ava, these leads get an instant text-back in under 10 seconds."
                : "With Stella, feedback requests go out automatically the day after the job."}
            </UpsellHint>
          ) : null}
        </section>

        {tier === "base" ? <BottomUpsell view={view} /> : null}
      </div>

      {selectedLead ? (
        <ContactDetailModal
          lead={selectedLead}
          // Respect the caller's current view so a "customer" lead opened
          // from the Pipeline tab still shows as Job Done, not Feedback.
          stage={
            view === "pipeline"
              ? stageFromView("pipeline", selectedLead)
              : stageFromView("post_sale", selectedLead)
          }
          activities={activitiesByLead[selectedLead.id]}
          onUpdate={() => {
            // Drop the cached activity list for this lead so the next open
            // re-fetches (the status change just wrote a new entry).
            setActivitiesByLead((prev) => {
              const next = { ...prev };
              delete next[selectedLead.id];
              return next;
            });
            // Re-query the server component so leadsById picks up the
            // new status and downstream counts/stages stay consistent.
            router.refresh();
          }}
          onNoteAdded={(entry) => {
            // Merge the note into our activity cache so the timeline
            // updates instantly — no refetch, no router.refresh().
            // API returns rows in ascending (oldest → newest) order, so
            // the new note belongs at the end; the modal reverses for
            // display so it'll still render at the top.
            setActivitiesByLead((prev) => {
              const existing = prev[selectedLead.id] ?? [];
              return {
                ...prev,
                [selectedLead.id]: [...existing, entry],
              };
            });
          }}
          existingReferralCode={referralCodes[selectedLead.id] ?? null}
          onReferralCodeChange={(leadId, code) => {
            setReferralCodes((prev) => ({ ...prev, [leadId]: code }));
          }}
          onClose={() => setSelectedLeadId(null)}
        />
      ) : null}
    </div>
  );
}

// Mirror the same stage derivation leadToContact uses, in one line, so the
// modal's top bar color matches the card the user tapped.
function stageFromView(view: View, lead: Lead): StageKey | undefined {
  const c = leadToContact(lead, { view, aiTeamLive: false });
  return c?.stage;
}

// ---------------------------------------------------------------------------
// Business title (lives inside the page, not the nav)
// ---------------------------------------------------------------------------

function BusinessTitle({ name }: { name: string }) {
  return (
    <div
      style={{
        padding: "16px 20px 12px",
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.borderLight}`,
      }}
    >
      <div
        style={{
          fontFamily: fonts.body,
          fontWeight: 600,
          fontSize: 9,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Pipeline
      </div>
      <div
        style={{
          marginTop: 2,
          fontFamily: fonts.body,
          fontWeight: 700,
          fontSize: 18,
          color: colors.navy,
          lineHeight: 1.2,
        }}
      >
        {name}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View toggle
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
// Stage row
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
        borderTop: active
          ? `2px solid ${stage.color}`
          : "2px solid transparent",
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
    ? "Responding to new leads the moment they arrive"
    : "Collecting feedback and flagging recovery cases";

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
// Bottom upsell (Base tier only)
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
        onClick={() => {
          window.location.href = "/pricing";
        }}
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

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ view }: { view: View }) {
  return (
    <div
      style={{
        padding: "32px 16px",
        textAlign: "center",
        backgroundColor: colors.white,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          fontFamily: fonts.body,
          fontWeight: 600,
          fontSize: 14,
          color: colors.navy,
        }}
      >
        {view === "pipeline"
          ? "No active leads in this view."
          : "No post-sale activity yet."}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.muted,
          lineHeight: 1.4,
        }}
      >
        {view === "pipeline"
          ? "New leads will appear here the moment they come in."
          : "Customers land here after their job is complete."}
      </div>
    </div>
  );
}
