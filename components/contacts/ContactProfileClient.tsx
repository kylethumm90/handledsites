"use client";

/**
 * Contact profile — the full view behind "View Profile" on the contacts screen.
 *
 * Matches the contacts page by reusing its tokens from ./styles rather than
 * restating any values, and its status/sentiment derivation from lib/contacts.
 *
 * Every mutation goes through routes that already exist and are business-scoped;
 * none were added for this page. After each successful write we call
 * router.refresh() so the server re-renders the badge and timeline — the notes
 * route in particular can add a second `ai_extract` entry and patch fields on
 * the lead, which optimistic local state would miss.
 */

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import type { ActivityLogEntry, Lead, LeadStatus } from "@/lib/supabase";
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
import ProfileStageControl from "./ProfileStageControl";
import ProfileTimeline from "./ProfileTimeline";
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
  timeline: ActivityLogEntry[];
  referralCode: string | null;
  referrer: { id: string; name: string } | null;
  employees: { id: string; name: string }[];
  reviewFunnelSlug: string | null;
  backHref: string;
};

export default function ContactProfileClient({
  lead,
  timeline,
  referralCode,
  referrer,
  employees,
  reviewFunnelSlug,
  backHref,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [code, setCode] = useState(referralCode);
  const [copied, setCopied] = useState(false);

  const hasReviewAsk = useMemo(
    () => timeline.some((e) => e.type === "review_request_sent"),
    [timeline],
  );

  const status = contactStatusFor(lead, hasReviewAsk);
  const statusColor = STATUS_COLORS[status];
  const sentiment = sentimentFor(lead);

  /** PUT a partial lead update. Returns whether it stuck. */
  const patchLead = useCallback(
    async (patch: Record<string, unknown>) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/contractor/customers/${lead.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) return false;
        router.refresh();
        return true;
      } catch {
        return false;
      } finally {
        setBusy(false);
      }
    },
    [lead.id, router],
  );

  const addNote = useCallback(
    async (text: string) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/contractor/customers/${lead.id}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary: text }),
        });
        if (!res.ok) return false;
        router.refresh();
        return true;
      } catch {
        return false;
      } finally {
        setBusy(false);
      }
    },
    [lead.id, router],
  );

  const sendReviewAsk = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/contractor/customers/${lead.id}/review-request-sent`,
        { method: "POST" },
      );
      if (res.ok) {
        setReviewSent(true);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }, [lead.id, router]);

  const makePartner = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/contractor/referral-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: lead.id }),
      });
      const data = await res.json();
      if (res.ok && data.referral_code) {
        setCode(data.referral_code);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }, [lead.id, router]);

  const referralUrl = code
    ? `${typeof window !== "undefined" ? window.location.origin : "https://handledsites.com"}/refer/${code}`
    : null;

  const copyReferral = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context / denied) — the URL is on
      // screen and selectable, so there's nothing to recover from.
    }
  };

  return (
    <div
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        padding: "0 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Back */}
        <Link
          href={backHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: inkSoft,
            textDecoration: "none",
            marginBottom: 14,
          }}
        >
          <ArrowLeft size={14} /> Contacts
        </Link>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <span style={avatarStyle(56, nameHue(lead.name))} aria-hidden>
              {initials(lead.name)}
            </span>
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: ink,
                  margin: 0,
                }}
              >
                {lead.name}
              </h1>
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{ ...badge, color: statusColor.fg, background: statusColor.bg }}
                >
                  {STATUS_LABELS[status]}
                </span>
                {sentiment ? (
                  <span style={{ fontSize: 12, color: SENTIMENT_COLORS[sentiment] }}>
                    {SENTIMENT_LABELS[sentiment]}
                  </span>
                ) : null}
                <span style={{ fontSize: 12, color: inkSoft }}>
                  Added {relativeTime(lead.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {lead.phone ? (
              <>
                <a
                  href={`tel:+1${lead.phone}`}
                  style={{
                    ...buttonSecondary,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    textDecoration: "none",
                    padding: "8px 14px",
                  }}
                >
                  <Phone size={13} /> Call
                </a>
                <a
                  href={`sms:+1${lead.phone}`}
                  style={{
                    ...buttonSecondary,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    textDecoration: "none",
                    padding: "8px 14px",
                  }}
                >
                  <MessageSquare size={13} /> Text
                </a>
              </>
            ) : null}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 340px)",
            gap: 16,
            alignItems: "start",
          }}
          className="cp-grid"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <ProfileStageControl
              status={lead.status as LeadStatus}
              appointmentAt={lead.appointment_at}
              onPatch={patchLead}
              busy={busy}
            />

            {lead.ai_summary ? (
              <div
                style={{
                  ...card,
                  padding: 16,
                  background: colors.amberBg,
                  borderColor: "rgba(232,146,42,0.25)",
                }}
              >
                <div
                  style={{
                    ...sectionLabel,
                    color: colors.amber,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  <Sparkles size={12} /> Summary
                </div>
                <p style={{ fontSize: 13, color: ink, margin: 0, lineHeight: 1.55 }}>
                  {lead.ai_summary}
                </p>
              </div>
            ) : null}

            <ProfileTimeline entries={timeline} onAddNote={addNote} busy={busy} />
          </div>

          {/* Aside */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            {/* Contact info */}
            <div style={{ ...card, padding: 16 }}>
              <div style={{ ...sectionLabel, marginBottom: 10 }}>Contact</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {lead.phone ? (
                  <InfoLine icon={<Phone size={14} />}>{formatPhone(lead.phone)}</InfoLine>
                ) : null}
                {lead.email ? (
                  <InfoLine icon={<Mail size={14} />}>
                    <span style={{ wordBreak: "break-all" }}>{lead.email}</span>
                  </InfoLine>
                ) : null}
                {lead.address ? (
                  <InfoLine icon={<MapPin size={14} />}>{lead.address}</InfoLine>
                ) : null}
                {!lead.phone && !lead.email && !lead.address ? (
                  <span style={{ fontSize: 13, color: inkSoft }}>
                    No contact details on file.
                  </span>
                ) : null}
              </div>
            </div>

            {/* Assigned rep */}
            <div style={{ ...card, padding: 16 }}>
              <div style={{ ...sectionLabel, marginBottom: 10 }}>Assigned to</div>
              <select
                value={lead.employee_id ?? ""}
                disabled={busy}
                onChange={(e) =>
                  void patchLead({ employee_id: e.target.value || null })
                }
                aria-label="Assigned rep"
                style={{
                  width: "100%",
                  fontSize: 13,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${hairline}`,
                  background: "#fff",
                  color: ink,
                }}
              >
                <option value="">Unassigned</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              {employees.length === 0 ? (
                <div style={{ fontSize: 12, color: inkSoft, marginTop: 8 }}>
                  No team members yet.
                </div>
              ) : null}
            </div>

            {/* Job */}
            <div style={{ ...card, padding: 16 }}>
              <div style={{ ...sectionLabel, marginBottom: 10 }}>Job</div>
              <Field label="Service" value={lead.service_needed} />
              <Field
                label="Completed"
                value={
                  lead.job_completed_at
                    ? new Date(lead.job_completed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : null
                }
              />
              <Field
                label="Value"
                value={
                  lead.job_value_cents != null
                    ? formatMoneyCompact(lead.job_value_cents)
                    : null
                }
                last
              />
            </div>

            {/* Referral */}
            <div style={{ ...card, padding: 16 }}>
              <div style={{ ...sectionLabel, marginBottom: 10 }}>Referral</div>

              {referrer ? (
                <div style={{ fontSize: 13, color: ink, marginBottom: code ? 12 : 10 }}>
                  Referred by{" "}
                  <Link
                    href={`/contractor/contacts/${referrer.id}`}
                    style={{ color: colors.purple, textDecoration: "none", fontWeight: 500 }}
                  >
                    {referrer.name}
                  </Link>
                </div>
              ) : null}

              {code && referralUrl ? (
                <>
                  <div
                    style={{
                      fontSize: 12,
                      color: ink,
                      background: colors.purpleBg,
                      padding: "8px 10px",
                      borderRadius: 8,
                      wordBreak: "break-all",
                      marginBottom: 8,
                    }}
                  >
                    {referralUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyReferral()}
                    style={{
                      ...buttonSecondary,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                </>
              ) : lead.status === "customer" ? (
                <button
                  type="button"
                  onClick={() => void makePartner()}
                  disabled={busy}
                  style={{ ...buttonSecondary, opacity: busy ? 0.6 : 1 }}
                >
                  {busy ? "Creating…" : "Make referral partner"}
                </button>
              ) : (
                <div style={{ fontSize: 13, color: inkSoft }}>
                  Available once this contact is a customer.
                </div>
              )}
            </div>

            {/* Review ask */}
            <button
              type="button"
              onClick={() => void sendReviewAsk()}
              disabled={busy || reviewSent}
              style={{
                ...buttonPrimary,
                background: reviewSent ? colors.muted : colors.green,
                cursor: busy || reviewSent ? "default" : "pointer",
                opacity: busy && !reviewSent ? 0.7 : 1,
              }}
            >
              {reviewSent ? (
                <>
                  <CheckCircle2 size={15} /> Review ask sent
                </>
              ) : (
                <>
                  <Send size={15} /> Send Review Ask
                </>
              )}
            </button>

            {reviewFunnelSlug ? (
              <a
                href={`/r/${reviewFunnelSlug}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...buttonSecondary,
                  textAlign: "center",
                  textDecoration: "none",
                  padding: "9px 16px",
                }}
              >
                Open review page
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .cp-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
    </div>
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

/** A label/value row. Renders an em dash rather than hiding, so the set of
 *  facts stays stable between contacts. */
function Field({
  label,
  value,
  last,
}: {
  label: string;
  value: string | null;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 13,
        paddingBottom: last ? 0 : 8,
      }}
    >
      <span style={{ color: inkSoft }}>{label}</span>
      <span style={{ color: value ? ink : inkSoft, textAlign: "right" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}
