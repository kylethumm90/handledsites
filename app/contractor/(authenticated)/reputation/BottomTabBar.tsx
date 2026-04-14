"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Handshake, LayoutGrid, Share2 } from "lucide-react";
import { HAIRLINE } from "./tokens";

const BASE = "/contractor/reputation";

type TabKey = "dashboard" | "funnel" | "alerts" | "network";

type Tab = {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  href?: string; // omit for non-routing stubs
};

const TABS: Tab[] = [
  {
    key: "dashboard",
    label: "Dash",
    icon: <LayoutGrid size={18} strokeWidth={1.5} />,
    href: BASE,
  },
  {
    key: "funnel",
    label: "Funnel",
    icon: <Share2 size={18} strokeWidth={1.5} />,
    href: `${BASE}/funnel`,
  },
  {
    key: "alerts",
    label: "Alerts",
    icon: <Bell size={18} strokeWidth={1.5} />,
    href: `${BASE}/alerts`,
  },
  {
    key: "network",
    label: "Network",
    icon: <Handshake size={18} strokeWidth={1.5} />,
    href: `${BASE}/network`,
  },
];

export default function BottomTabBar({ hasAlert = false }: { hasAlert?: boolean }) {
  const pathname = usePathname() || "";
  const activeKey: TabKey = pathname.startsWith(`${BASE}/alerts`)
    ? "alerts"
    : pathname.startsWith(`${BASE}/funnel`)
      ? "funnel"
      : pathname.startsWith(`${BASE}/network`)
        ? "network"
        : "dashboard";

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--surface-lowest)",
        borderTop: HAIRLINE,
        display: "flex",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          padding: "8px 10px 10px",
          gap: 6,
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeKey;
          const inner = (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                padding: "8px 0 7px",
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "#FFFFFF" : "var(--on-surface-variant)",
                transition: "background 0.2s",
              }}
            >
              <div style={{ position: "relative" }}>
                {tab.icon}
                {tab.key === "alerts" && hasAlert && !isActive && (
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -3,
                      width: 6,
                      height: 6,
                      background: "var(--alert)",
                      border: "0.5px solid var(--surface-lowest)",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {tab.label}
              </span>
            </div>
          );

          if (tab.href) {
            return (
              <Link
                key={tab.key}
                href={tab.href}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {inner}
              </Link>
            );
          }
          return (
            <button
              key={tab.key}
              type="button"
              aria-label={`${tab.label} (coming soon)`}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "inherit",
              }}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
