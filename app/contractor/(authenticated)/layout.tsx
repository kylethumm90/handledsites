"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { PlanProvider } from "@/lib/plans";

const TABS = [
  { label: "Dashboard", href: "/contractor/dashboard" },
  { label: "Customers", href: "/contractor/customers" },
  { label: "Sites", href: "/contractor/sites" },
  { label: "Settings", href: "/contractor/settings" },
];

export default function ContractorAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f5f5f7 0%, #fbfbfd 40%, #f5f5f7 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif",
    }}>
      <style>{`
        @keyframes navFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hs-nav { animation: navFadeIn 0.5s cubic-bezier(0.25,0.1,0.25,1) both; }
      `}</style>

      {/* Frosted glass nav */}
      <nav className="hs-nav" style={{
        position: "sticky", top: 0, zIndex: 100,
        height: 52,
        background: "rgba(251,251,253,0.72)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "0.5px solid rgba(0,0,0,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 16px",
      }}>
        <div style={{
          width: "100%", maxWidth: 680,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <span style={{
            fontSize: 15, fontWeight: 600, color: "#1d1d1f",
            letterSpacing: "-0.02em",
          }}>
            handled<span style={{ fontWeight: 400, color: "#86868b" }}>.sites</span>
          </span>

          {/* Segmented control */}
          <div style={{
            display: "flex", alignItems: "center", gap: 2,
            background: "rgba(0,0,0,0.04)", borderRadius: 10, padding: 3,
          }}>
            {TABS.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#1d1d1f" : "#86868b",
                    background: isActive ? "#fff" : "transparent",
                    boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.06), 0 0.5px 1px rgba(0,0,0,0.04)" : "none",
                    textDecoration: "none",
                    transition: "all 0.25s cubic-bezier(0.25,0.1,0.25,1)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <LogoutButton />
        </div>
      </nav>

      {/* Content */}
      <main style={{
        maxWidth: 680, margin: "0 auto",
        padding: "24px 16px 48px",
      }}>
        <PlanProvider>
          {children}
        </PlanProvider>
      </main>
    </div>
  );
}
