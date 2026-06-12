"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inter } from "next/font/google";
import { PlanProvider } from "@/lib/plans";
import { initials } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Design tokens (Handled hi-fi mockups)
const NAVY = "#0F2A4A";
const AMBER = "#F59E0B";
const CANVAS = "#FAFAF8";
const SIDEBAR_MUTED = "#9DB0C5";

type Tab = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none" }}
    >
      {children}
    </svg>
  );
}

const TABS: Tab[] = [
  {
    label: "Dashboard",
    href: "/contractor/dashboard",
    icon: (
      <NavIcon>
        <rect x="1.5" y="1.5" width="5.2" height="5.2" rx="1.2" />
        <rect x="9.3" y="1.5" width="5.2" height="5.2" rx="1.2" />
        <rect x="1.5" y="9.3" width="5.2" height="5.2" rx="1.2" />
        <rect x="9.3" y="9.3" width="5.2" height="5.2" rx="1.2" />
      </NavIcon>
    ),
  },
  {
    label: "Sites",
    href: "/contractor/sites",
    icon: (
      <NavIcon>
        <circle cx="8" cy="8" r="6.3" />
        <ellipse cx="8" cy="8" rx="2.8" ry="6.3" />
        <line x1="1.9" y1="8" x2="14.1" y2="8" />
      </NavIcon>
    ),
  },
  {
    label: "Pipeline",
    href: "/contractor/customers",
    icon: (
      <NavIcon>
        <line x1="2" y1="3.5" x2="14" y2="3.5" />
        <line x1="2" y1="8" x2="11" y2="8" />
        <line x1="2" y1="12.5" x2="13" y2="12.5" />
      </NavIcon>
    ),
  },
  {
    label: "Reputation",
    href: "/contractor/reputation",
    icon: (
      <NavIcon>
        <polygon points="8,1.5 9.9,5.6 14.5,6.1 11.1,9.3 12,13.8 8,11.5 4,13.8 4.9,9.3 1.5,6.1 6.1,5.6" />
      </NavIcon>
    ),
  },
  {
    label: "Settings",
    href: "/contractor/settings",
    icon: (
      <NavIcon>
        <circle cx="8" cy="8" r="5.8" />
        <circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none" />
      </NavIcon>
    ),
  },
];

function signOut() {
  fetch("/api/contractor/logout", { method: "POST" }).then(() => {
    window.location.href = "/contractor/login";
  });
}

function Wordmark({ size = 21 }: { size?: number }) {
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      handled
      <span className="hs-logo-dot" aria-hidden>
        .
      </span>
    </span>
  );
}

export default function ContractorShell({
  businessName,
  ownerName,
  logoUrl,
  children,
}: {
  businessName: string | null;
  ownerName: string | null;
  logoUrl: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const identityName = ownerName || businessName || "Your account";
  const identitySub = ownerName ? businessName : null;

  return (
    <div
      className={inter.className}
      style={{ minHeight: "100vh", background: CANVAS, color: "#1A2433" }}
    >
      <style>{`
        @keyframes hs-logo-dot-pulse {
          0%, 100% {
            text-shadow:
              0 0 2px rgba(245,158,11,0.55),
              0 0 4px rgba(245,158,11,0.35);
          }
          50% {
            text-shadow:
              0 0 6px rgba(245,158,11,0.95),
              0 0 14px rgba(245,158,11,0.65),
              0 0 22px rgba(245,158,11,0.35);
          }
        }
        .hs-logo-dot {
          color: ${AMBER};
          animation: hs-logo-dot-pulse 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hs-logo-dot { animation: none; }
        }

        .hsd-sidebar { display: none; }
        .hsd-topbar { display: flex; }

        .hsd-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          font-size: 13.5px; font-weight: 600;
          color: ${SIDEBAR_MUTED}; text-decoration: none;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .hsd-nav-item:hover { background: rgba(255,255,255,0.07); color: #FFFFFF; }
        .hsd-nav-item.is-active { background: rgba(255,255,255,0.12); color: #FFFFFF; }

        .hsd-signout {
          background: none; border: none; padding: 0; cursor: pointer;
          font-family: inherit; font-size: 12px; font-weight: 600;
          color: ${SIDEBAR_MUTED}; transition: color 0.15s ease;
        }
        .hsd-signout:hover { color: #FFFFFF; }

        .hsd-mobile-tab {
          flex: none; padding: 6px 12px; border-radius: 999px;
          font-size: 12.5px; font-weight: 600; text-decoration: none;
          color: #66707E; background: transparent; white-space: nowrap;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .hsd-mobile-tab:hover { background: #F4F2EC; }
        .hsd-mobile-tab.is-active { background: ${NAVY}; color: #FFFFFF; font-weight: 700; }

        .hsd-mobile-signout {
          background: none; border: none; padding: 0; cursor: pointer;
          font-family: inherit; font-size: 12px; font-weight: 600;
          color: #8A93A0;
        }
        .hsd-mobile-signout:hover { color: #1A2433; }

        .hsd-content { max-width: 1240px; margin: 0 auto; padding: 24px 16px 64px; }

        @media (min-width: 1024px) {
          .hsd-sidebar { display: flex; }
          .hsd-topbar { display: none; }
          .hsd-content { padding: 32px 36px 90px; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "stretch", minHeight: "100vh" }}>
        {/* ===== Desktop sidebar ===== */}
        <aside
          className="hsd-sidebar"
          style={{
            width: 224,
            flex: "none",
            background: NAVY,
            color: "#FFFFFF",
            padding: "18px 12px 16px",
            flexDirection: "column",
            gap: 3,
            position: "sticky",
            top: 0,
            height: "100vh",
            boxSizing: "border-box",
          }}
        >
          <div style={{ padding: "4px 12px 16px" }}>
            <Wordmark />
          </div>

          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`hsd-nav-item${isActive(tab.href) ? " is-active" : ""}`}
            >
              {tab.icon}
              {tab.label}
            </Link>
          ))}

          <div style={{ flex: 1 }} />

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.12)",
              padding: "14px 10px 4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    objectFit: "cover",
                    flex: "none",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: AMBER,
                    color: "#42300A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    flex: "none",
                  }}
                >
                  {initials(identityName)}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: 1.25,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {identityName}
                </div>
                {identitySub && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: SIDEBAR_MUTED,
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {identitySub}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: "10px 0 0 42px" }}>
              <button className="hsd-signout" onClick={signOut}>
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* ===== Main column ===== */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Mobile top bar */}
          <nav
            className="hsd-topbar"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 100,
              background: "rgba(250,250,248,0.92)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              borderBottom: "1px solid #E6E3DC",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px",
            }}
          >
            <span style={{ color: NAVY }}>
              <Wordmark size={17} />
            </span>
            <div
              style={{
                display: "flex",
                gap: 4,
                overflowX: "auto",
                flex: 1,
                scrollbarWidth: "none",
              }}
            >
              {TABS.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`hsd-mobile-tab${isActive(tab.href) ? " is-active" : ""}`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            <button className="hsd-mobile-signout" onClick={signOut}>
              Sign out
            </button>
          </nav>

          <main style={{ flex: 1, minWidth: 0 }}>
            <div className="hsd-content">
              <PlanProvider>{children}</PlanProvider>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
