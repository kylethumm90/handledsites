"use client";

/**
 * Four summary cards above the contacts table.
 *
 * Only Total Contacts carries a delta — it's the one figure we can compute a
 * month-over-month change for from created_at. The others have no historical
 * signal in the schema yet, so they show the number alone rather than a
 * fabricated trend. Wire deltas in as the underlying events start being
 * recorded.
 */

import { Users, Star, Gift, Frown } from "lucide-react";
import { colors } from "@/lib/design-system";
import { card, mutedText, sectionLabel } from "./styles";

export type ContactStats = {
  totalContacts: number;
  newThisMonth: number;
  reviewRequests: number;
  referralsActive: number;
  unhappy: number;
};

type Tile = {
  label: string;
  value: number;
  delta?: string;
  icon: typeof Users;
  fg: string;
  bg: string;
};

export default function ContactStatCards({ stats }: { stats: ContactStats }) {
  const tiles: Tile[] = [
    {
      label: "Total Contacts",
      value: stats.totalContacts,
      delta: stats.newThisMonth > 0 ? `+${stats.newThisMonth} this month` : undefined,
      icon: Users,
      fg: colors.navy,
      bg: colors.navyBg,
    },
    {
      label: "Review Requests",
      value: stats.reviewRequests,
      icon: Star,
      fg: colors.blue,
      bg: colors.blueBg,
    },
    {
      label: "Referrals Active",
      value: stats.referralsActive,
      icon: Gift,
      fg: colors.purple,
      bg: colors.purpleBg,
    },
    {
      label: "Unhappy Contacts",
      value: stats.unhappy,
      icon: Frown,
      fg: colors.red,
      bg: colors.redBg,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
      }}
    >
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <div key={t.label} style={{ ...card, padding: 16 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: t.bg,
                color: t.fg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Icon size={16} strokeWidth={2} aria-hidden />
            </div>
            <div style={{ ...sectionLabel, marginBottom: 4 }}>{t.label}</div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#1d1d1f",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
              }}
            >
              {t.value.toLocaleString()}
            </div>
            {t.delta ? (
              <div style={{ fontSize: 11, color: colors.green, marginTop: 4 }}>
                {t.delta}
              </div>
            ) : (
              <div style={{ ...mutedText, fontSize: 11, marginTop: 4 }}>&nbsp;</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
