"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const F = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif";
const EASE = "cubic-bezier(0.25,0.1,0.25,1)";

const TABS = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "businesses", label: "Businesses", href: "/admin/businesses" },
  { key: "sites", label: "Sites", href: "/admin/sites" },
  { key: "pulse", label: "Pulse", href: "/admin/pulse" },
];

const LANDING_PAGES = [
  { name: "Missed Call Calculator", path: "/tools/missed-call-calculator.html" },
  { name: "Review Link Generator", path: "/tools/review-link-generator" },
  { name: "Review Response Generator", path: "/tools/review-response-generator" },
];

const TOOLS = [
  { name: "Teaser Generator", path: "/admin/preview" },
];

export default function AdminShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "dashboard" | "sites" | "businesses" | "pulse" | "landing-pages" | "tools" | "emails";
}) {
  const pathname = usePathname();
  const [lpOpen, setLpOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const lpRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (lpRef.current && !lpRef.current.contains(e.target as Node)) setLpOpen(false);
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isActive = (key: string, href: string) =>
    active === key || pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));

  const dropdownStyle: React.CSSProperties = {
    position: "absolute", left: 0, top: "100%", zIndex: 50,
    marginTop: 6, minWidth: 220, borderRadius: 12,
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: "0.5px solid rgba(0,0,0,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
    padding: "4px 0",
  };

  const dropdownItemStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "8px 14px", fontSize: 13, color: "#1d1d1f",
    textDecoration: "none", borderRadius: 8, margin: "0 4px",
    transition: `background 0.15s ${EASE}`,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f5f5f7 0%, #fbfbfd 40%, #f5f5f7 100%)",
      fontFamily: F,
    }}>
      <style>{`
        @keyframes adminNavIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .admin-nav { animation: adminNavIn 0.5s ${EASE} both; }
        .admin-dd-item:hover { background: rgba(0,0,0,0.04) !important; }
        .admin-logout:hover { color: #1d1d1f !important; }
      `}</style>

      {/* Frosted glass nav */}
      <nav className="admin-nav" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(251,251,253,0.72)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "0.5px solid rgba(0,0,0,0.06)",
        padding: "0 24px",
      }}>
        <div style={{
          maxWidth: 1080, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 52,
        }}>
          {/* Logo */}
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
              handled<span style={{ fontWeight: 400, color: "#86868b" }}>.admin</span>
            </span>
          </Link>

          {/* Segmented control */}
          <div style={{
            display: "flex", alignItems: "center", gap: 2,
            background: "rgba(0,0,0,0.04)", borderRadius: 10, padding: 3,
          }}>
            {TABS.map((tab) => {
              const a = isActive(tab.key, tab.href);
              return (
                <Link key={tab.key} href={tab.href} style={{
                  padding: "5px 12px", borderRadius: 8,
                  fontSize: 12, fontWeight: a ? 600 : 400,
                  color: a ? "#1d1d1f" : "#86868b",
                  background: a ? "#fff" : "transparent",
                  boxShadow: a ? "0 1px 4px rgba(0,0,0,0.06), 0 0.5px 1px rgba(0,0,0,0.04)" : "none",
                  textDecoration: "none",
                  transition: `all 0.25s ${EASE}`,
                  whiteSpace: "nowrap",
                }}>
                  {tab.label}
                </Link>
              );
            })}

            {/* Landing Pages dropdown */}
            <div ref={lpRef} style={{ position: "relative" }}>
              <button onClick={() => { setLpOpen(!lpOpen); setToolsOpen(false); }} style={{
                padding: "5px 12px", borderRadius: 8, border: "none",
                fontSize: 12, fontWeight: active === "landing-pages" ? 600 : 400,
                color: active === "landing-pages" ? "#1d1d1f" : "#86868b",
                background: active === "landing-pages" ? "#fff" : "transparent",
                boxShadow: active === "landing-pages" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer", fontFamily: F,
                transition: `all 0.25s ${EASE}`,
                display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap",
              }}>
                Pages
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none" style={{
                  transition: `transform 0.2s ${EASE}`,
                  transform: lpOpen ? "rotate(180deg)" : "none",
                }}>
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {lpOpen && (
                <div style={dropdownStyle}>
                  {LANDING_PAGES.map((p) => (
                    <a key={p.path} href={p.path} target="_blank" rel="noopener noreferrer" className="admin-dd-item" style={dropdownItemStyle}>
                      {p.name}
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aeaeb2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Tools dropdown */}
            <div ref={toolsRef} style={{ position: "relative" }}>
              <button onClick={() => { setToolsOpen(!toolsOpen); setLpOpen(false); }} style={{
                padding: "5px 12px", borderRadius: 8, border: "none",
                fontSize: 12, fontWeight: active === "tools" ? 600 : 400,
                color: active === "tools" ? "#1d1d1f" : "#86868b",
                background: active === "tools" ? "#fff" : "transparent",
                boxShadow: active === "tools" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer", fontFamily: F,
                transition: `all 0.25s ${EASE}`,
                display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap",
              }}>
                Tools
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none" style={{
                  transition: `transform 0.2s ${EASE}`,
                  transform: toolsOpen ? "rotate(180deg)" : "none",
                }}>
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {toolsOpen && (
                <div style={dropdownStyle}>
                  {TOOLS.map((t) => (
                    <Link key={t.path} href={t.path} className="admin-dd-item" style={dropdownItemStyle}>
                      {t.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logout */}
          <a href="/admin/login" className="admin-logout" style={{
            fontSize: 12, fontWeight: 400, color: "#86868b",
            textDecoration: "none", transition: `color 0.2s ${EASE}`,
          }}>
            Sign out
          </a>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 24px 48px" }}>
        {children}
      </main>
    </div>
  );
}
