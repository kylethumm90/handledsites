"use client";

/**
 * Filter tabs above the table. Each tab is a link that sets ?tab= and resets
 * ?page=, preserving the current search. Counts come from the server and use
 * the same filter as the rows behind them.
 *
 * Several tabs will legitimately read 0 until sentiment scoring and review
 * submission start being recorded — that is an accurate empty, not a bug.
 */

import Link from "next/link";
import { TABS, type TabKey } from "@/lib/contacts";
import { colors } from "@/lib/design-system";
import { hairline, ink, inkSoft } from "./styles";

type Props = {
  active: TabKey;
  counts: Record<TabKey, number>;
  search: string;
};

const ACCENT: Partial<Record<TabKey, string>> = {
  needs_review: colors.amber,
  happy: colors.green,
  at_risk: colors.red,
  referral: colors.purple,
};

export default function ContactFilterTabs({ active, counts, search }: Props) {
  const hrefFor = (tab: TabKey) => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    if (search) params.set("q", search);
    const qs = params.toString();
    return `/contractor/contacts${qs ? `?${qs}` : ""}`;
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        borderBottom: `1px solid ${hairline}`,
        overflowX: "auto",
        scrollbarWidth: "thin",
      }}
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        const count = counts[t.key] ?? 0;
        const accent = ACCENT[t.key];
        return (
          <Link
            key={t.key}
            href={hrefFor(t.key)}
            scroll={false}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 12px",
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? ink : inkSoft,
              borderBottom: `2px solid ${isActive ? colors.green : "transparent"}`,
              textDecoration: "none",
              whiteSpace: "nowrap",
              marginBottom: -1,
            }}
          >
            {t.label}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: count > 0 && accent ? accent : inkSoft,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {count.toLocaleString()}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
