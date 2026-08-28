"use client";

import Link from "next/link";
import type { Lead } from "@/lib/supabase";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  SENTIMENT_COLORS,
  SENTIMENT_LABELS,
  contactStatusFor,
  nextActionFor,
  sentimentFor,
} from "@/lib/contacts";
import { colors } from "@/lib/design-system";
import { initials, nameHue, relativeTime } from "@/lib/utils";
import {
  avatarStyle,
  badge,
  buttonSecondary,
  hairline,
  ink,
  inkSoft,
  tableCell,
} from "./styles";

export type RowActivity = { type: string; summary: string; at: string };

type Props = {
  lead: Lead;
  activity?: RowActivity;
  hasReviewAsk: boolean;
  selected: boolean;
  checked: boolean;
  onSelect: () => void;
  onToggleCheck: () => void;
  onAction: () => void;
  busy?: boolean;
};

/** Dot colour by activity type, so the column scans without reading. */
const ACTIVITY_COLOR: Record<string, string> = {
  lead_created: colors.blue,
  status_change: colors.navy,
  review_request_sent: colors.amber,
  review_received: colors.green,
  referral_opt_in: colors.purple,
  referral_partner_created: colors.purple,
  quiz_completed: colors.blue,
  ai_extract: colors.mutedLight,
  note: colors.mutedLight,
  user_note: colors.mutedLight,
};

export default function ContactRow({
  lead,
  activity,
  hasReviewAsk,
  selected,
  checked,
  onSelect,
  onToggleCheck,
  onAction,
  busy,
}: Props) {
  const status = contactStatusFor(lead, hasReviewAsk);
  const statusColor = STATUS_COLORS[status];
  const sentiment = sentimentFor(lead);
  const action = nextActionFor(status);

  return (
    <tr
      onClick={onSelect}
      style={{
        cursor: "pointer",
        background: selected ? "#f5faf6" : "transparent",
        boxShadow: selected ? `inset 3px 0 0 ${colors.green}` : "none",
      }}
    >
      <td style={{ ...tableCell, width: 36, paddingRight: 0 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggleCheck}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${lead.name}`}
          style={{ cursor: "pointer" }}
        />
      </td>

      {/* Customer */}
      <td style={tableCell}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={avatarStyle(32, nameHue(lead.name))} aria-hidden>
            {initials(lead.name)}
          </span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 500,
                color: ink,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {lead.name}
            </div>
            {/* address is null for every lead today — omit the line entirely
                rather than leaving a blank slot under the name. */}
            {lead.address ? (
              <div style={{ fontSize: 12, color: inkSoft }}>{lead.address}</div>
            ) : null}
          </div>
        </div>
      </td>

      {/* Recent Activity */}
      <td style={tableCell}>
        {activity ? (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: ACTIVITY_COLOR[activity.type] ?? colors.mutedLight,
                marginTop: 6,
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, color: ink }}>{activity.summary}</div>
              <div style={{ fontSize: 11, color: inkSoft }}>
                {relativeTime(activity.at)}
              </div>
            </div>
          </div>
        ) : (
          <span style={{ color: inkSoft }}>—</span>
        )}
      </td>

      {/* Status */}
      <td style={tableCell}>
        <span style={{ ...badge, color: statusColor.fg, background: statusColor.bg }}>
          {STATUS_LABELS[status]}
        </span>
      </td>

      {/* Sentiment — only 3 of 1,635 leads are scored, so most read "—". */}
      <td style={tableCell}>
        {sentiment ? (
          <span style={{ fontSize: 13, color: SENTIMENT_COLORS[sentiment] }}>
            {SENTIMENT_LABELS[sentiment]}
          </span>
        ) : (
          <span style={{ color: inkSoft }}>—</span>
        )}
      </td>

      {/* Next action */}
      <td style={{ ...tableCell, textAlign: "right", whiteSpace: "nowrap" }}>
        {action.kind === "profile" ? (
          // Clicking the row opens the quick-look panel; this button is the
          // deliberate gesture for the full profile, so it navigates.
          <Link
            href={`/contractor/contacts/${lead.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{ ...buttonSecondary, textDecoration: "none", display: "inline-block" }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            style={{
              ...buttonSecondary,
              opacity: busy ? 0.5 : 1,
              cursor: busy ? "default" : "pointer",
            }}
          >
            {busy ? "Sending…" : action.label}
          </button>
        )}
      </td>
    </tr>
  );
}

export const ROW_BORDER = hairline;
