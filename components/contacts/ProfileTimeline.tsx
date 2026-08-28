"use client";

/**
 * Note composer + activity timeline.
 *
 * Notes POST to /api/contractor/customers/[id]/notes, which writes the
 * `user_note` row, regenerates the AI summary, and may apply fields the model
 * extracted from the note (logging a second `ai_extract` row). So after a
 * successful save the whole timeline is refetched from the server rather than
 * appended to locally — otherwise the extract row would be invisible until
 * reload.
 */

import { useState } from "react";
import type { ActivityLogEntry } from "@/lib/supabase";
import { colors } from "@/lib/design-system";
import { relativeTime } from "@/lib/utils";
import { buttonSecondary, card, hairline, ink, inkSoft, sectionLabel } from "./styles";

const ENTRY_COLOR: Record<string, string> = {
  lead_created: colors.blue,
  status_change: colors.navy,
  review_request_sent: colors.amber,
  review_received: colors.green,
  referral_opt_in: colors.purple,
  referral_partner_created: colors.purple,
  quiz_completed: colors.blue,
  user_note: colors.mutedLight,
  note: colors.mutedLight,
  ai_extract: colors.amber,
};

type Props = {
  entries: ActivityLogEntry[];
  onAddNote: (text: string) => Promise<boolean>;
  busy: boolean;
};

export default function ProfileTimeline({ entries, onAddNote, busy }: Props) {
  const [text, setText] = useState("");

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const ok = await onAddNote(trimmed);
    if (ok) setText("");
  };

  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ ...sectionLabel, marginBottom: 10 }}>Activity</div>

      <div style={{ marginBottom: 16 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a note…"
          aria-label="Add a note"
          rows={2}
          style={{
            width: "100%",
            fontSize: 13,
            padding: "9px 11px",
            borderRadius: 8,
            border: `1px solid ${hairline}`,
            color: ink,
            background: "#fff",
            resize: "vertical",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !text.trim()}
            style={{
              ...buttonSecondary,
              background: text.trim() ? colors.green : "#fff",
              color: text.trim() ? "#fff" : inkSoft,
              border: text.trim() ? "none" : `1px solid ${hairline}`,
              cursor: busy || !text.trim() ? "default" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Saving…" : "Add note"}
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div style={{ fontSize: 13, color: inkSoft }}>Nothing recorded yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {entries.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                gap: 10,
                paddingBottom: i === entries.length - 1 ? 0 : 14,
              }}
            >
              {/* dot + connector rail */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span
                  aria-hidden
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: ENTRY_COLOR[e.type] ?? colors.mutedLight,
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                {i === entries.length - 1 ? null : (
                  <span
                    aria-hidden
                    style={{ width: 1, flex: 1, background: hairline, marginTop: 4 }}
                  />
                )}
              </div>

              <div style={{ minWidth: 0, paddingBottom: 2 }}>
                <div style={{ fontSize: 13, color: ink }}>{e.summary}</div>
                <div style={{ fontSize: 11, color: inkSoft, marginTop: 2 }}>
                  {relativeTime(e.created_at)}
                  {e.agent ? ` · ${e.agent}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
