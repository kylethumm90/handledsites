"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BusinessGroup } from "./page";

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

export default function PulseTable({ businesses }: { businesses: BusinessGroup[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const maxViews = businesses.length > 0 ? businesses[0].total_views : 1;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (businesses.length === 0) {
    return <p className="text-sm text-gray-400">No sites yet</p>;
  }

  const thClass = "px-4 py-3 text-xs font-medium text-gray-500";
  const numClass = (val: number) =>
    `px-4 py-3 text-right text-sm tabular-nums ${val > 0 ? "text-gray-900" : "text-gray-300"}`;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="w-8 px-3 py-3" />
            <th className={thClass}>Business</th>
            <th className={`${thClass} text-right`}>Views</th>
            <th className={`${thClass} w-[160px]`} />
            <th className={`${thClass} text-right`}>Visitors</th>
            <th className={`${thClass} text-right`}>Calls</th>
            <th className={`${thClass} text-right`}>Texts</th>
            <th className={`${thClass} text-right`}>Forms</th>
            <th className={`${thClass} text-right`}>Reviews</th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((biz) => {
            const isOpen = expanded.has(biz.business_id);
            const barWidth = maxViews > 0 ? (biz.total_views / maxViews) * 100 : 0;
            const siteCount = biz.sites.length;

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
                    <span className="font-medium text-gray-900">{biz.business_name}</span>
                    <div className="text-xs text-gray-400">
                      {biz.trade} · {biz.city}, {biz.state}
                      {siteCount > 1 && <span> · {siteCount} sites</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-gray-900">
                    {biz.total_views}
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      {barWidth > 0 && (
                        <div
                          className="h-full rounded-full bg-gray-900 transition-all duration-500"
                          style={{ width: `${Math.max(2, barWidth)}%` }}
                        />
                      )}
                    </div>
                  </td>
                  <td className={numClass(biz.unique_visitors)}>{biz.unique_visitors}</td>
                  <td className={numClass(biz.phone_clicks)}>{biz.phone_clicks}</td>
                  <td className={numClass(biz.text_clicks)}>{biz.text_clicks}</td>
                  <td className={numClass(biz.form_submits)}>{biz.form_submits}</td>
                  <td className={numClass(biz.review_completes)}>{biz.review_completes}</td>
                </tr>

                {/* Expanded site rows */}
                {isOpen && biz.sites.map((site) => (
                  <tr key={site.id} className="border-b border-gray-50 bg-gray-50/50">
                    <td className="px-3 py-2.5" />
                    <td className="px-4 py-2.5 pl-6">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${siteTypeBadge(site.type)}`}>
                          {siteTypeLabel(site.type)}
                        </span>
                        <Link
                          href={`/admin/pulse/${site.id}`}
                          className="text-xs text-gray-500 hover:text-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {siteUrl(site.type, site.slug)}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums text-gray-600">
                      {site.total_views}
                    </td>
                    <td className="px-4 py-2.5">
                      {biz.total_views > 0 && site.total_views > 0 && (
                        <div className="h-1.5 w-full rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-gray-400"
                            style={{ width: `${(site.total_views / biz.total_views) * 100}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums text-gray-400">
                      {site.unique_visitors}
                    </td>
                    <td className={`px-4 py-2.5 text-right text-xs tabular-nums ${site.phone_clicks > 0 ? "text-gray-600" : "text-gray-300"}`}>
                      {site.phone_clicks}
                    </td>
                    <td className={`px-4 py-2.5 text-right text-xs tabular-nums ${site.text_clicks > 0 ? "text-gray-600" : "text-gray-300"}`}>
                      {site.text_clicks}
                    </td>
                    <td className={`px-4 py-2.5 text-right text-xs tabular-nums ${site.form_submits > 0 ? "text-gray-600" : "text-gray-300"}`}>
                      {site.form_submits}
                    </td>
                    <td className={`px-4 py-2.5 text-right text-xs tabular-nums ${site.review_completes > 0 ? "text-gray-600" : "text-gray-300"}`}>
                      {site.review_completes}
                    </td>
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
