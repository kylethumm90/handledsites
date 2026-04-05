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
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      active === key
        ? "bg-gray-100 text-gray-900"
        : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-bold text-gray-900">
              handled.sites <span className="font-normal text-gray-400">admin</span>
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/admin" className={navLinkClass("dashboard")}>
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <Link href="/admin/sites" className={navLinkClass("sites")}>
                <List className="h-3.5 w-3.5" />
                Sites
              </Link>
              <Link href="/admin/businesses" className={navLinkClass("businesses")}>
                <Users className="h-3.5 w-3.5" />
                Businesses
              </Link>

              {/* Templates dropdown */}
              <div className="relative" ref={tplRef}>
                <button
                  onClick={() => { setTplOpen(!tplOpen); setLpOpen(false); setToolsOpen(false); }}
                  className={`${navLinkClass("templates")} cursor-pointer`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Templates
                  <ChevronDown className={`h-3 w-3 transition-transform ${tplOpen ? "rotate-180" : ""}`} />
                </button>
                {tplOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-[240px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg max-h-[70vh] overflow-y-auto">
                    {TEMPLATES.map((group) => (
                      <div key={group.trade}>
                        <div className="px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {group.trade}
                        </div>
                        {group.items.map((item) =>
                          item.path ? (
                            <a
                              key={`${group.trade}-${item.name}`}
                              href={item.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              {item.name}
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            </a>
                          ) : (
                            <div
                              key={`${group.trade}-${item.name}`}
                              className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-400"
                            >
                              {item.name}
                              <span className="text-[10px]">No preview</span>
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
                  <FileText className="h-3.5 w-3.5" />
                  Landing Pages
                  <ChevronDown className={`h-3 w-3 transition-transform ${lpOpen ? "rotate-180" : ""}`} />
                </button>
                {lpOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {LANDING_PAGES.map((page) => (
                      <a
                        key={page.path}
                        href={page.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        {page.name}
                        <ExternalLink className="h-3 w-3 text-gray-400" />
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
                  <Wrench className="h-3.5 w-3.5" />
                  Tools
                  <ChevronDown className={`h-3 w-3 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
                </button>
                {toolsOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <Link
                      href="/admin/preview"
                      className="flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Teaser Generator
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
