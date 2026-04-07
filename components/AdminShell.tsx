"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, List, Users, FileText, Layers, Wrench, ChevronDown, ExternalLink } from "lucide-react";

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

const TEMPLATES: { trade: string; items: { name: string; path: string | null }[] }[] = [
  {
    trade: "Solar",
    items: [
      { name: "Business Card", path: "/rooftop-power" },
      { name: "Quiz Funnel", path: "/q/rooftop-power" },
    ],
  },
  {
    trade: "Electrical",
    items: [
      { name: "Business Card", path: "/thumm-electric" },
      { name: "Quiz Funnel", path: "/q/thumm-electric" },
    ],
  },
  {
    trade: "Landscaping",
    items: [
      { name: "Business Card", path: "/bros-lawncare" },
      { name: "Quiz Funnel", path: "/q/bros-lawncare" },
    ],
  },
  {
    trade: "HVAC",
    items: [
      { name: "Business Card", path: "/summit-air-solutions" },
      { name: "Quiz Funnel", path: "/q/summit-air-solutions" },
    ],
  },
  {
    trade: "Roofing",
    items: [
      { name: "Business Card", path: "/apex-roofing" },
      { name: "Quiz Funnel", path: "/q/apex-roofing" },
    ],
  },
  {
    trade: "Plumbing",
    items: [
      { name: "Business Card", path: "/flowright-plumbing" },
      { name: "Quiz Funnel", path: "/q/flowright-plumbing" },
    ],
  },
  {
    trade: "Painting",
    items: [
      { name: "Business Card", path: "/colorcraft-painters" },
      { name: "Quiz Funnel", path: "/q/colorcraft-painters" },
    ],
  },
  {
    trade: "General Contractor",
    items: [
      { name: "Business Card", path: "/buildright-construction" },
      { name: "Quiz Funnel", path: "/q/buildright-construction" },
    ],
  },
  {
    trade: "Pest Control",
    items: [
      { name: "Business Card", path: null },
      { name: "Quiz Funnel", path: null },
    ],
  },
];

export default function AdminShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "dashboard" | "sites" | "businesses" | "templates" | "landing-pages" | "tools";
}) {
  const [lpOpen, setLpOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const lpRef = useRef<HTMLDivElement>(null);
  const tplRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (lpRef.current && !lpRef.current.contains(e.target as Node)) {
        setLpOpen(false);
      }
      if (tplRef.current && !tplRef.current.contains(e.target as Node)) {
        setTplOpen(false);
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

          {/* Templates dropdown */}
          <div className="relative" ref={tplRef}>
            <button
              onClick={() => { setTplOpen(!tplOpen); setLpOpen(false); setToolsOpen(false); }}
              className={`${navLinkClass("templates")} cursor-pointer`}
            >
              <Layers className="h-3 w-3" />
              Templates
              <ChevronDown className={`h-2.5 w-2.5 transition-transform ${tplOpen ? "rotate-180" : ""}`} />
            </button>
            {tplOpen && (
              <div className="absolute left-0 top-full z-50 mt-0.5 min-w-[240px] border border-border-dark bg-paper py-1 max-h-[70vh] overflow-y-auto">
                {TEMPLATES.map((group) => (
                  <div key={group.trade}>
                    <div className="px-3 pb-1 pt-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                      {group.trade}
                    </div>
                    {group.items.map((item) =>
                      item.path ? (
                        <a
                          key={`${group.trade}-${item.name}`}
                          href={item.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between px-3 py-1.5 font-body text-xs text-ink hover:bg-border-light"
                        >
                          {item.name}
                          <ExternalLink className="h-3 w-3 text-muted" />
                        </a>
                      ) : (
                        <div
                          key={`${group.trade}-${item.name}`}
                          className="flex items-center justify-between px-3 py-1.5 font-body text-xs text-muted"
                        >
                          {item.name}
                          <span className="font-mono text-[9px]">N/A</span>
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Landing Pages dropdown */}
          <div className="relative" ref={lpRef}>
            <button
              onClick={() => { setLpOpen(!lpOpen); setTplOpen(false); setToolsOpen(false); }}
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
              onClick={() => { setToolsOpen(!toolsOpen); setLpOpen(false); setTplOpen(false); }}
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
