"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, List, Users, FileText, Wrench, ChevronDown, ExternalLink, BarChart2, Mail } from "lucide-react";

const LANDING_PAGES = [
  {
    name: "Missed Call Calculator",
    path: "/tools/missed-call-calculator.html",
  },
  {
    name: "Review Link Generator",
    path: "/tools/review-link-generator",
  },
  {
    name: "Review Response Generator",
    path: "/tools/review-response-generator",
  },
];

export default function AdminShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "dashboard" | "sites" | "businesses" | "pulse" | "landing-pages" | "tools" | "emails";
}) {
  const [lpOpen, setLpOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const lpRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (lpRef.current && !lpRef.current.contains(e.target as Node)) {
        setLpOpen(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navLinkClass = (key: string) =>
    `flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition-colors ${
      active === key
        ? "text-ink"
        : "text-muted hover:text-ink"
    }`;

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-paper">
      {/* Masthead */}
      <header className="border-b-[3px] border-double border-border-dark px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-end justify-between">
          <div className="flex items-baseline gap-4">
            <Link href="/admin" className="font-display text-[32px] leading-none text-ink">
              handled.
            </Link>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              Admin Dashboard
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            {dateString}
          </span>
        </div>
      </header>

      {/* Nav */}
      <nav className="border-b border-border-dark px-6 py-1.5">
        <div className="mx-auto flex max-w-6xl items-center gap-1">
          <Link href="/admin" className={navLinkClass("dashboard")}>
            <LayoutDashboard className="h-3 w-3" />
            Dashboard
          </Link>
          <Link href="/admin/sites" className={navLinkClass("sites")}>
            <List className="h-3 w-3" />
            Sites
          </Link>
          <Link href="/admin/businesses" className={navLinkClass("businesses")}>
            <Users className="h-3 w-3" />
            Businesses
          </Link>
          <Link href="/admin/pulse" className={navLinkClass("pulse")}>
            <BarChart2 className="h-3 w-3" />
            Pulse
          </Link>
          <Link href="/admin/emails" className={navLinkClass("emails")}>
            <Mail className="h-3 w-3" />
            Emails
          </Link>

          {/* Landing Pages dropdown */}
          <div className="relative" ref={lpRef}>
            <button
              onClick={() => { setLpOpen(!lpOpen); setToolsOpen(false); }}
              className={`${navLinkClass("landing-pages")} cursor-pointer`}
            >
              <FileText className="h-3 w-3" />
              Landing Pages
              <ChevronDown className={`h-2.5 w-2.5 transition-transform ${lpOpen ? "rotate-180" : ""}`} />
            </button>
            {lpOpen && (
              <div className="absolute left-0 top-full z-50 mt-0.5 min-w-[220px] border border-border-dark bg-paper py-1">
                {LANDING_PAGES.map((page) => (
                  <a
                    key={page.path}
                    href={page.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 font-body text-xs text-ink hover:bg-border-light"
                  >
                    {page.name}
                    <ExternalLink className="h-3 w-3 text-muted" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Tools dropdown */}
          <div className="relative" ref={toolsRef}>
            <button
              onClick={() => { setToolsOpen(!toolsOpen); setLpOpen(false); }}
              className={`${navLinkClass("tools")} cursor-pointer`}
            >
              <Wrench className="h-3 w-3" />
              Tools
              <ChevronDown className={`h-2.5 w-2.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
            </button>
            {toolsOpen && (
              <div className="absolute left-0 top-full z-50 mt-0.5 min-w-[200px] border border-border-dark bg-paper py-1">
                <Link
                  href="/admin/preview"
                  className="flex items-center justify-between px-3 py-2 font-body text-xs text-ink hover:bg-border-light"
                >
                  Teaser Generator
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
