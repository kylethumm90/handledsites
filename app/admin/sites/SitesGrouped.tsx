"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, BarChart2 } from "lucide-react";

export type SiteRow = {
  id: string;
  type: string;
  slug: string;
  created_at: string;
};

export type BusinessGroup = {
  business_id: string;
  business_name: string;
  owner_name: string;
  trade: string;
  city: string;
  state: string;
  sites: SiteRow[];
};

function siteTypeLabel(type: string) {
  switch (type) {
    case "business_card": return "Business Card";
    case "quiz_funnel": return "Quiz Funnel";
    case "review_funnel": return "Review Funnel";
    case "review_wall": return "Review Wall";
    case "website": return "Website";
    default: return type.replace(/_/g, " ");
  }
}

function siteTypeBadge(type: string) {
  switch (type) {
    case "business_card": return "bg-gray-100 text-gray-600";
    case "quiz_funnel": return "bg-amber-50 text-amber-700";
    case "review_funnel": return "bg-green-50 text-green-700";
    case "review_wall": return "bg-purple-50 text-purple-700";
    case "website": return "bg-blue-50 text-blue-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

function siteUrl(type: string, slug: string) {
  if (type === "quiz_funnel") return `/q/${slug}`;
  if (type === "review_funnel") return `/r/${slug}`;
  if (type === "website") return `/s/${slug}`;
  if (type === "review_wall") return `/reviews/${slug}`;
  return `/${slug}`;
}

export default function SitesGrouped({ businesses }: { businesses: BusinessGroup[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-500">
            <th className="w-8 px-3 py-3" />
            <th className="px-4 py-3 font-medium">Business</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">Trade</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium text-right">Sites</th>
          </tr>
        </thead>
        <tbody>
          {businesses.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                No businesses found
              </td>
            </tr>
          ) : (
            businesses.map((biz) => {
              const isOpen = expanded.has(biz.business_id);
              return (
                <Fragment key={biz.business_id}>
                  {/* Business row */}
                  <tr
                    className="border-b border-gray-50 cursor-pointer select-none hover:bg-gray-50"
                    onClick={() => toggle(biz.business_id)}
                  >
                    <td className="px-3 py-3">
                      <ChevronRight
                        className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/businesses/${biz.business_id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {biz.business_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{biz.owner_name}</td>
                    <td className="px-4 py-3 text-gray-600">{biz.trade}</td>
                    <td className="px-4 py-3 text-gray-600">{biz.city}, {biz.state}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{biz.sites.length}</td>
                  </tr>

                  {/* Expanded site rows */}
                  {isOpen && biz.sites.map((site) => (
                    <tr
                      key={site.id}
                      className="border-b border-gray-50 bg-gray-50/50"
                    >
                      <td className="px-3 py-2.5" />
                      <td className="px-4 py-2.5" colSpan={3}>
                        <div className="flex items-center gap-3 pl-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${siteTypeBadge(site.type)}`}>
                            {siteTypeLabel(site.type)}
                          </span>
                          <Link
                            href={`/admin/sites/${site.id}`}
                            className="text-xs text-gray-500 hover:text-blue-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            /{site.slug}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/pulse/${site.id}`}
                            className="text-gray-400 hover:text-blue-600"
                            title="View Pulse"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <BarChart2 className="h-3.5 w-3.5" />
                          </Link>
                          <a
                            href={siteUrl(site.type, site.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-gray-400">
                        {new Date(site.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
