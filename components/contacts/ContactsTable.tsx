"use client";

/**
 * Desktop table. Header row, contact rows, and the pagination footer.
 *
 * Pagination is server-driven (?page=), so the footer renders links rather
 * than local state — 1,635 contacts is far too many to ship to the browser and
 * filter in memory the way the older pipeline screen does.
 */

import Link from "next/link";
import type { Lead } from "@/lib/supabase";
import type { TabKey } from "@/lib/contacts";
import ContactRow, { type RowActivity } from "./ContactRow";
import { card, hairline, ink, inkSoft, tableHeaderCell } from "./styles";

type Props = {
  leads: Lead[];
  activityByLead: Record<string, RowActivity>;
  askedLeadIds: Set<string>;
  selectedId: string | null;
  checkedIds: Set<string>;
  busyId: string | null;
  onSelect: (lead: Lead) => void;
  onToggleCheck: (id: string) => void;
  onToggleAll: () => void;
  onAction: (lead: Lead) => void;
  page: number;
  pageSize: number;
  total: number;
  tab: TabKey;
  search: string;
};

const COLUMNS = ["Customer", "Recent Activity", "Status", "Sentiment", "Next Action"];

export default function ContactsTable({
  leads,
  activityByLead,
  askedLeadIds,
  selectedId,
  checkedIds,
  busyId,
  onSelect,
  onToggleCheck,
  onToggleAll,
  onAction,
  page,
  pageSize,
  total,
  tab,
  search,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const allChecked = leads.length > 0 && leads.every((l) => checkedIds.has(l.id));

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    if (search) params.set("q", search);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/contractor/contacts${qs ? `?${qs}` : ""}`;
  };

  if (leads.length === 0) {
    return (
      <div style={{ ...card, padding: 48, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: ink, marginBottom: 6 }}>
          No contacts here
        </div>
        <div style={{ fontSize: 13, color: inkSoft }}>
          {search
            ? `Nothing matches “${search}”.`
            : "Nothing matches this filter yet."}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...card, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
          <thead>
            <tr>
              <th style={{ ...tableHeaderCell, width: 36, paddingRight: 0 }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={onToggleAll}
                  aria-label="Select all on this page"
                  style={{ cursor: "pointer" }}
                />
              </th>
              {COLUMNS.map((c, i) => (
                <th
                  key={c}
                  style={{
                    ...tableHeaderCell,
                    textAlign: i === COLUMNS.length - 1 ? "right" : "left",
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <ContactRow
                key={lead.id}
                lead={lead}
                activity={activityByLead[lead.id]}
                hasReviewAsk={askedLeadIds.has(lead.id)}
                selected={selectedId === lead.id}
                checked={checkedIds.has(lead.id)}
                busy={busyId === lead.id}
                onSelect={() => onSelect(lead)}
                onToggleCheck={() => onToggleCheck(lead.id)}
                onAction={() => onAction(lead)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 14px",
          borderTop: `1px solid ${hairline}`,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 12, color: inkSoft, fontVariantNumeric: "tabular-nums" }}>
          Showing {first.toLocaleString()}–{last.toLocaleString()} of{" "}
          {total.toLocaleString()}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <PageLink href={hrefFor(page - 1)} disabled={page <= 1} label="Previous">
            ‹
          </PageLink>
          <span
            style={{
              fontSize: 12,
              color: inkSoft,
              fontVariantNumeric: "tabular-nums",
              padding: "0 4px",
            }}
          >
            Page {page.toLocaleString()} of {totalPages.toLocaleString()}
          </span>
          <PageLink
            href={hrefFor(page + 1)}
            disabled={page >= totalPages}
            label="Next"
          >
            ›
          </PageLink>
        </div>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 8,
    border: `1px solid ${hairline}`,
    fontSize: 14,
    color: disabled ? "rgba(0,0,0,0.2)" : ink,
    textDecoration: "none",
    background: "#fff",
  };

  if (disabled) {
    return (
      <span aria-disabled style={style}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} scroll={false} aria-label={label} style={style}>
      {children}
    </Link>
  );
}
