"use client";

import { useState } from "react";
import Link from "next/link";

const TOOLS = [
  { label: "Missed Call Calculator", href: "/tools/missed-call-calculator.html" },
  { label: "Review Link Generator", href: "/tools/review-link-generator" },
  { label: "Review Response Generator", href: "/tools/review-response-generator" },
  { label: "Google Review Grader", href: "/tools/review-grader" },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="px-6 pt-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/">
          <img src="/logo-dark.png" alt="handled." className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="hidden text-sm font-medium text-gray-500 hover:text-gray-900 sm:inline-block"
          >
            Pricing
          </Link>

          {/* Tools dropdown */}
          <div
            className="relative hidden sm:block"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <button className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
              Tools
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {open && (
              <div className="absolute right-0 top-full pt-2 z-50">
                <div className="w-56 rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
                  {TOOLS.map((tool) => (
                    <a
                      key={tool.href}
                      href={tool.href}
                      className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      {tool.label}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-300"
                      >
                        <path d="M7 17L17 7M17 7H7M17 7v10" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/contractor/login"
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/#get-started"
            className="hidden rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 sm:inline-block"
          >
            Create Free Page
          </Link>
        </div>
      </div>
    </nav>
  );
}
