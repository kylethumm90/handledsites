"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, List, FileText, ChevronDown, ExternalLink } from "lucide-react";

const LANDING_PAGES = [
  {
    name: "Missed Call Calculator",
    path: "/tools/missed-call-calculator.html",
  },
  {
    name: "Review Link Generator",
    path: "/tools/review-link-generator.html",
  },
];

export default function AdminShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "dashboard" | "sites" | "landing-pages";
}) {
  const [lpOpen, setLpOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLpOpen(false);
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

              {/* Landing Pages dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setLpOpen(!lpOpen)}
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
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
