"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const F = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif";
const EASE = "cubic-bezier(0.25,0.1,0.25,1)";

type NavItem = {
  key: string;
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { name: string; path: string; external?: boolean }[];
};

const ICON_SIZE = 18;

const iconProps = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const NAV: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    key: "businesses",
    label: "Businesses",
    href: "/admin/businesses",
    icon: (
      <svg {...iconProps}>
        <path d="M3 21V8l9-5 9 5v13" />
        <path d="M9 21v-6h6v6" />
        <path d="M3 21h18" />
      </svg>
    ),
  },
  {
    key: "users",
    label: "Users",
    href: "/admin/users",
    icon: (
      <svg {...iconProps}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "sites",
    label: "Sites",
    href: "/admin/sites",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
      </svg>
    ),
  },
  {
    key: "pulse",
    label: "Pulse",
    href: "/admin/pulse",
    icon: (
      <svg {...iconProps}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    key: "landing-pages",
    label: "Pages",
    icon: (
      <svg {...iconProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </svg>
    ),
    children: [
      { name: "Missed Call Calculator", path: "/tools/missed-call-calculator.html", external: true },
      { name: "Review Link Generator", path: "/tools/review-link-generator", external: true },
      { name: "Review Response Generator", path: "/tools/review-response-generator", external: true },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    icon: (
      <svg {...iconProps}>
        <path d="M14.7 6.3a4 4 0 1 1 5.66 5.66l-2.12 2.12L12.58 8.4z" />
        <path d="M14 10L4 20v0l4 0l10-10" />
      </svg>
    ),
    children: [
      { name: "Teaser Generator", path: "/admin/preview" },
    ],
  },
];

const SIDEBAR_STATE_KEY = "handled.admin.sidebar.collapsed";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed, mounted]);

  // Auto-open a group if one of its children matches current path
  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const item of NAV) {
      if (item.children && item.children.some((c) => !c.external && pathname.startsWith(c.path))) {
        next[item.key] = true;
      }
    }
    setOpenGroups((prev) => ({ ...prev, ...next }));
  }, [pathname]);

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isGroupActive = (item: NavItem) =>
    !!item.children?.some((c) => !c.external && (pathname === c.path || pathname.startsWith(c.path + "/")));

  const width = collapsed ? 64 : 240;

  const handleSignOut = () => {
    window.location.href = "/admin/login";
  };

  return (
    <aside
      style={{
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100vh",
        width,
        flexShrink: 0,
        background: "#111827",
        color: "#e5e7eb",
        fontFamily: F,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        transition: `width 0.25s ${EASE}`,
        zIndex: 50,
      }}
    >
      <style>{`
        .admin-side-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          margin: 1px 8px;
          border-radius: 8px;
          color: #9ca3af;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background: transparent;
          width: calc(100% - 16px);
          text-align: left;
          font-family: inherit;
          transition: background 0.15s ${EASE}, color 0.15s ${EASE};
          white-space: nowrap;
          position: relative;
        }
        .admin-side-item:hover {
          background: rgba(255,255,255,0.05);
          color: #f3f4f6;
        }
        .admin-side-item.active {
          background: rgba(255,255,255,0.08);
          color: #ffffff;
        }
        .admin-side-item.active::before {
          content: "";
          position: absolute;
          left: -8px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          border-radius: 2px;
          background: #ffffff;
        }
        .admin-side-sub {
          display: flex;
          align-items: center;
          padding: 7px 12px 7px 44px;
          margin: 1px 8px;
          border-radius: 8px;
          color: #9ca3af;
          text-decoration: none;
          font-size: 12.5px;
          transition: background 0.15s ${EASE}, color 0.15s ${EASE};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .admin-side-sub:hover {
          background: rgba(255,255,255,0.05);
          color: #f3f4f6;
        }
        .admin-side-sub.active {
          background: rgba(255,255,255,0.08);
          color: #ffffff;
        }
        .admin-side-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${ICON_SIZE}px;
          height: ${ICON_SIZE}px;
        }
      `}</style>

      {/* Logo / collapse */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "18px 0" : "18px 20px 18px 22px",
          minHeight: 60,
        }}
      >
        {!collapsed && (
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>
              handled<span style={{ fontWeight: 400, color: "#9ca3af" }}>.admin</span>
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            color: "#9ca3af",
            cursor: "pointer",
            transition: `background 0.15s ${EASE}`,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: "auto", paddingTop: 4, paddingBottom: 8 }}>
        {NAV.map((item) => {
          if (item.children) {
            const open = !collapsed && !!openGroups[item.key];
            const groupActive = isGroupActive(item);
            return (
              <div key={item.key}>
                <button
                  className={`admin-side-item${groupActive ? " active" : ""}`}
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                      setOpenGroups((g) => ({ ...g, [item.key]: true }));
                    } else {
                      setOpenGroups((g) => ({ ...g, [item.key]: !g[item.key] }));
                    }
                  }}
                  style={collapsed ? { justifyContent: "center" } : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="admin-side-icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 12 12"
                        fill="none"
                        style={{
                          transition: `transform 0.2s ${EASE}`,
                          transform: open ? "rotate(90deg)" : "none",
                          color: "#9ca3af",
                        }}
                      >
                        <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
                {open && !collapsed && (
                  <div style={{ paddingBottom: 2 }}>
                    {item.children.map((c) =>
                      c.external ? (
                        <a
                          key={c.path}
                          href={c.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-side-sub"
                        >
                          <span>{c.name}</span>
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ marginLeft: 6, opacity: 0.5 }}
                          >
                            <path d="M7 17L17 7M17 7H7M17 7v10" />
                          </svg>
                        </a>
                      ) : (
                        <Link
                          key={c.path}
                          href={c.path}
                          className={`admin-side-sub${isActive(c.path) ? " active" : ""}`}
                        >
                          {c.name}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href!}
              className={`admin-side-item${isActive(item.href) ? " active" : ""}`}
              style={collapsed ? { justifyContent: "center" } : undefined}
              title={collapsed ? item.label : undefined}
            >
              <span className="admin-side-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign out pinned to bottom */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "8px 0",
        }}
      >
        <button
          onClick={handleSignOut}
          className="admin-side-item"
          style={collapsed ? { justifyContent: "center" } : undefined}
          title={collapsed ? "Sign out" : undefined}
        >
          <span className="admin-side-icon">
            <svg {...iconProps}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </span>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
