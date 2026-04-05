"use client";

import { useState } from "react";
import { ExternalLink, Copy, Check, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import type { Lead } from "@/lib/supabase";

type SiteInfo = {
  id: string;
  type: "business_card" | "quiz_funnel" | "review_funnel";
  slug: string;
  isActive: boolean;
};

type Props = {
  businessName: string;
  logoUrl: string | null;
  services: string[];
  sites: SiteInfo[];
  leads: Lead[];
  totalLeads: number;
};

function formatPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

function siteUrl(site: SiteInfo): string {
  if (site.type === "quiz_funnel") return `/q/${site.slug}`;
  if (site.type === "review_funnel") return `/r/${site.slug}`;
  return `/${site.slug}`;
}

function siteLabel(type: string): string {
  if (type === "business_card") return "Business Card";
  if (type === "quiz_funnel") return "Quiz Funnel";
  return "Review Funnel";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy link
        </>
      )}
    </button>
  );
}

export default function DashboardClient({
  businessName,
  logoUrl,
  services,
  sites,
  leads,
  totalLeads,
}: Props) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://handledsites.com";

  // Setup checklist
  const checklist = [
    { label: "Upload a logo", done: !!logoUrl, href: "/contractor/business" },
    { label: "Add your services", done: services.length > 0, href: "/contractor/business" },
    { label: "Share your link", done: false, href: null },
  ];
  const allDone = checklist.every((c) => c.done);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Welcome, {businessName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your sites, view leads, and share your links.
        </p>
      </div>

      {/* Setup checklist */}
      {!allDone && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Getting started
          </h2>
          <div className="space-y-2.5">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                {item.done ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-4.5 w-4.5 text-gray-300 flex-shrink-0" />
                )}
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`text-sm ${
                      item.done
                        ? "text-gray-400 line-through"
                        : "text-gray-700 hover:text-gray-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={`text-sm ${
                      item.done ? "text-gray-400 line-through" : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your Sites */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Your sites
        </h2>
        {sites.length === 0 ? (
          <p className="text-sm text-gray-400">No sites yet.</p>
        ) : (
          <div className="space-y-3">
            {sites.map((site) => {
              const url = `${baseUrl}${siteUrl(site)}`;
              return (
                <div
                  key={site.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          site.type === "business_card"
                            ? "bg-gray-200 text-gray-600"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {siteLabel(site.type)}
                      </span>
                      {!site.isActive && (
                        <span className="text-[10px] font-medium text-red-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs font-mono text-gray-500">
                      {url}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <CopyButton text={url} />
                    <a
                      href={siteUrl(site)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
                    >
                      View
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Leads */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Recent leads
            {totalLeads > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-white">
                {totalLeads}
              </span>
            )}
          </h2>
        </div>

        {leads.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400">No leads yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              When someone fills out your quiz funnel, they&apos;ll show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-5 py-2 font-medium">Phone</th>
                  <th className="px-5 py-2 font-medium hidden sm:table-cell">Email</th>
                  <th className="px-5 py-2 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-5 py-2.5 font-medium text-gray-900">
                      {lead.name}
                    </td>
                    <td className="px-5 py-2.5 text-gray-600">
                      <a
                        href={`tel:${lead.phone}`}
                        className="hover:text-gray-900"
                      >
                        {formatPhone(lead.phone)}
                      </a>
                    </td>
                    <td className="px-5 py-2.5 text-gray-600 hidden sm:table-cell">
                      {lead.email || (
                        <span className="text-gray-300">&mdash;</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-gray-400 text-right whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
