"use client";

/**
 * Stage control + appointment, for the contact profile.
 *
 * Stage writes `status` and the appointment writes `appointment_at`, both
 * through PUT /api/contractor/customers/[id] (which already allows exactly
 * those fields and records speed-to-lead on the first move out of "lead").
 */

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import type { LeadStatus } from "@/lib/supabase";
import { colors } from "@/lib/design-system";
import { buttonSecondary, card, hairline, ink, inkSoft, sectionLabel } from "./styles";

const STAGES: { key: LeadStatus; label: string; color: string }[] = [
  { key: "lead", label: "New", color: colors.amber },
  { key: "contacted", label: "Contacted", color: colors.blue },
  { key: "booked", label: "Appt Set", color: colors.navy },
  { key: "customer", label: "Sold", color: colors.green },
];

type Props = {
  status: LeadStatus;
  appointmentAt: string | null;
  onPatch: (patch: Record<string, unknown>) => Promise<boolean>;
  busy: boolean;
};

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time, not an ISO-Z string. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default function ProfileStageControl({
  status,
  appointmentAt,
  onPatch,
  busy,
}: Props) {
  const [editingAppt, setEditingAppt] = useState(false);
  const [apptValue, setApptValue] = useState(toLocalInput(appointmentAt));
  const [error, setError] = useState("");

  const saveAppointment = async () => {
    if (!apptValue) {
      setError("Pick a date and time.");
      return;
    }
    const parsed = new Date(apptValue);
    if (Number.isNaN(parsed.getTime())) {
      setError("That date and time is invalid.");
      return;
    }
    setError("");
    const ok = await onPatch({ appointment_at: parsed.toISOString() });
    if (ok) setEditingAppt(false);
  };

  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ ...sectionLabel, marginBottom: 10 }}>Stage</div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {STAGES.map((s) => {
          const active = s.key === status;
          return (
            <button
              key={s.key}
              type="button"
              disabled={busy || active}
              onClick={() => void onPatch({ status: s.key })}
              style={{
                flex: "1 1 auto",
                minWidth: 84,
                padding: "8px 10px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                color: active ? "#fff" : ink,
                background: active ? s.color : "#fff",
                border: `1px solid ${active ? s.color : hairline}`,
                cursor: busy || active ? "default" : "pointer",
                opacity: busy && !active ? 0.5 : 1,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${hairline}` }}>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>Appointment</div>

        {editingAppt ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="datetime-local"
              value={apptValue}
              onChange={(e) => setApptValue(e.target.value)}
              aria-label="Appointment date and time"
              style={{
                fontSize: 13,
                padding: "7px 10px",
                borderRadius: 8,
                border: `1px solid ${hairline}`,
                color: ink,
                background: "#fff",
              }}
            />
            <button
              type="button"
              onClick={() => void saveAppointment()}
              disabled={busy}
              style={{
                ...buttonSecondary,
                background: colors.green,
                color: "#fff",
                border: "none",
              }}
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingAppt(false);
                setError("");
                setApptValue(toLocalInput(appointmentAt));
              }}
              style={buttonSecondary}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: 13,
                color: appointmentAt ? ink : inkSoft,
              }}
            >
              <CalendarClock size={14} style={{ color: inkSoft }} aria-hidden />
              {appointmentAt
                ? new Date(appointmentAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "None set"}
            </span>
            <button
              type="button"
              onClick={() => setEditingAppt(true)}
              style={buttonSecondary}
            >
              {appointmentAt ? "Reschedule" : "Set appointment"}
            </button>
          </div>
        )}

        {error ? (
          <div style={{ fontSize: 12, color: colors.red, marginTop: 8 }}>{error}</div>
        ) : null}
      </div>
    </div>
  );
}
