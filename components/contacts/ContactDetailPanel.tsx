"use client";

/**
 * Desktop side panel. Opens beside the table when a row is selected.
 *
 * Activities are fetched on demand from the existing
 * /api/contractor/customers/[id]/activities route (business-scoped there), so
 * the table payload stays small.
 *
 * Job History renders the single job recorded on the lead. The schema has no
 * jobs table — `leads` carries one job_value_cents / job_completed_at — so
 * this is a one-row history by construction. The section is shaped so a real
 * one-to-many can replace the data source without changing the layout.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, X, Send, CheckCircle2 } from "lucide-react";
import type { ActivityLogEntry, Lead } from "@/lib/supabase";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  SENTIMENT_COLORS,
  SENTIMENT_LABELS,
  contactStatusFor,
  sentimentFor,
} from "@/lib/contacts";
import { formatMoneyCompact } from "@/lib/pipeline";
import { formatPhone, initials, nameHue, relativeTime } from "@/lib/utils";
import { colors } from "@/lib/design-system";
import {
  avatarStyle,
  badge,
  buttonPrimary,
  buttonSecondary,
  card,
  hairline,
  ink,
  inkSoft,
  sectionLabel,
} from "./styles";

type Props = {
  lead: Lead;
  hasReviewAsk: boolean;
  onClose: () => void;
  onSendReviewAsk: () => void;
  sending: boolean;
  sent: boolean;
};

export default function ContactDetailPanel({
  lead,
  hasReviewAsk,
  onClose,
  onSendReviewAsk,
  sending,
  sent,
}: Props) {
  const [activities, setActivities] = useState<ActivityLogEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setActivities(null);

    fetch(`/api/contractor/customers/${lead.id}/activities`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setActivities(data?.activities ?? []);
      })
      .catch(() => {
        if (!cancelled) setActivities([]);
      });

    return () => {
      cancelled = true;
    };
  }, [lead.id]);

  const status = contactStatusFor(lead, hasReviewAsk);
  const statusColor = STATUS_COLORS[status];
  const sentiment = sentimentFor(lead);
  const hasJob = !!lead.job_completed_at || lead.job_value_cents != null;

  return (
    <aside
      style={{
        ...card,
        padding: 20,
        position: "sticky",
        top: 68,
        maxHeight: "calc(100vh - 92px)",
        overflowY: "auto",
      }}
      aria-label={`Details for ${lead.name}`}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: inkSoft,
            padding: 4,
            lineHeight: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={avatarStyle(48, nameHue(lead.name))} aria-hidden>
          {initials(lead.name)}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: ink, letterSpacing: "-0.01em" }}>
            {lead.name}
          </div>
          <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ ...badge, color: statusColor.fg, background: statusColor.bg }}>
              {STATUS_LABELS[status]}
            </span>
            {sentiment ? (
              <span style={{ fontSize: 11, color: SENTIMENT_COLORS[sentiment] }}>
                {SENTIMENT_LABELS[sentiment]}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Contact lines — each omitted entirely when absent */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
        {lead.phone ? (
          <InfoLine icon={<Phone size={14} />}>
            <a href={`tel:+1${lead.phone}`} style={{ color: ink, textDecoration: "none" }}>
              {formatPhone(lead.phone)}
            </a>
          </InfoLine>
        ) : null}
        {lead.email ? (
          <InfoLine icon={<Mail size={14} />}>
            <a
              href={`mailto:${lead.email}`}
              style={{ color: ink, textDecoration: "none", wordBreak: "break-all" }}
            >
              {lead.email}
            </a>
          </InfoLine>
        ) : null}
        {lead.address ? (
          <InfoLine icon={<MapPin size={14} />}>{lead.address}</InfoLine>
        ) : null}
      </div>

      <Divider />

      {/* Job history */}
      <Section title="Job History">
        {hasJob ? (
          <>
            <Row
              left={lead.service_needed || "Job"}
              mid={
                lead.job_completed_at
                  ? new Date(lead.job_completed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"
              }
              right={
                lead.job_value_cents != null
                  ? formatMoneyCompact(lead.job_value_cents)
                  : "—"
              }
            />
            {lead.job_value_cents != null ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  marginTop: 4,
                  borderTop: `1px solid ${hairline}`,
                  fontSize: 13,
                }}
              >
                <span style={{ color: inkSoft }}>Total Spent</span>
                <span style={{ fontWeight: 600, color: ink }}>
                  {formatMoneyCompact(lead.job_value_cents)}
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <Empty>No job recorded yet.</Empty>
        )}
      </Section>

      <Divider />

      {/* Last service */}
      <Section title="Last Service">
        {lead.job_completed_at ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 500, color: ink }}>
              {new Date(lead.job_completed_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div style={{ fontSize: 12, color: inkSoft, marginTop: 2 }}>
              {relativeTime(lead.job_completed_at)}
            </div>
          </>
        ) : (
          <Empty>Not recorded.</Empty>
        )}
      </Section>

      <Divider />

      {/* Notes */}
      <Section title="Notes">
        {lead.notes ? (
          <p style={{ fontSize: 13, color: ink, margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            {lead.notes}
          </p>
        ) : (
          <Empty>No notes yet.</Empty>
        )}
      </Section>

      <Divider />

      {/* Recent activity */}
      <Section title="Recent Activity">
        {activities === null ? (
          <Empty>Loading…</Empty>
        ) : activities.length === 0 ? (
          <Empty>Nothing recorded yet.</Empty>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activities
              .slice()
              .reverse()
              .slice(0, 6)
              .map((a) => (
                <div key={a.id} style={{ display: "flex", gap: 8 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: colors.mutedLight,
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, color: ink }}>{a.summary}</div>
                    <div style={{ fontSize: 11, color: inkSoft }}>
                      {relativeTime(a.created_at)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Section>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
        <button
          type="button"
          onClick={onSendReviewAsk}
          disabled={sending || sent}
          style={{
            ...buttonPrimary,
            background: sent ? colors.muted : colors.green,
            cursor: sending || sent ? "default" : "pointer",
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sent ? (
            <>
              <CheckCircle2 size={15} /> Review ask sent
            </>
          ) : (
            <>
              <Send size={15} /> {sending ? "Sending…" : "Send Review Ask"}
            </>
          )}
        </button>
        <Link
          href={`/contractor/customers/${lead.id}`}
          style={{
            ...buttonSecondary,
            textAlign: "center",
            textDecoration: "none",
            padding: "10px 16px",
            fontSize: 13,
          }}
        >
          View Full Profile
        </Link>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------

function InfoLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: ink }}>
      <span style={{ color: inkSoft, lineHeight: 0, flexShrink: 0 }}>{icon}</span>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 16 }}>
      <div style={{ ...sectionLabel, marginBottom: 8 }}>{title}</div>
      {children}
    </section>
  );
}

function Row({ left, mid, right }: { left: string; mid: string; right: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 13,
        paddingBottom: 8,
      }}
    >
      <span style={{ color: ink, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
        {left}
      </span>
      <span style={{ color: inkSoft, whiteSpace: "nowrap", fontSize: 12 }}>{mid}</span>
      <span style={{ color: ink, whiteSpace: "nowrap", fontWeight: 500 }}>{right}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: inkSoft }}>{children}</div>;
}

function Divider() {
  return <div style={{ height: 1, background: hairline, margin: "0 0 16px" }} />;
}
