"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BusinessGroup } from "./page";

function siteTypeLabel(type: string) {
  return type.replace(/_/g, " ");
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

  return (
    <div className="animate-newsroom-in" style={{ animationDelay: "0.1s" }}>
      <h2 className="mb-5 font-display text-lg italic text-ink">By Business</h2>

      {businesses.length === 0 ? (
        <p className="font-body text-sm text-muted">No sites yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-t-2 border-ink border-b border-b-border-dark">
                <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted w-6">
                </th>
                <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                  Business
                </th>
                <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted text-right">
                  Views
                </th>
                <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted w-[180px]">
                </th>
                <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted text-right">
                  Visitors
                </th>
                <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted text-right">
                  Calls
                </th>
                <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted text-right">
                  Texts
                </th>
                <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted text-right">
                  Forms
                </th>
                <th className="py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted text-right">
                  Reviews
                </th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((biz, i) => {
                const isOpen = expanded.has(biz.business_id);
                const barWidth = maxViews > 0 ? (biz.total_views / maxViews) * 100 : 0;
                const siteCount = biz.sites.length;

                return (
                  <Fragment key={biz.business_id}>
                    {/* Business row */}
                    <tr
                      className="animate-row-in border-b border-border-light cursor-pointer select-none hover:bg-border-light/30"
                      style={{ animationDelay: `${0.12 + i * 0.02}s` }}
                      onClick={() => toggle(biz.business_id)}
                    >
                      <td className="py-2.5 pr-2">
                        <ChevronRight
                          className={`h-3 w-3 text-muted transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
                        />
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="font-body text-sm font-medium text-ink">
                          {biz.business_name}
                        </span>
                        <div className="font-mono text-[10px] text-muted">
                          {biz.trade} &middot; {biz.city}, {biz.state}
                          {siteCount > 1 && (
                            <span> &middot; {siteCount} sites</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-sm tabular-nums text-ink">
                        {biz.total_views}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="h-2 w-full bg-border-light">
                          {barWidth > 0 && (
                            <div
                              className="animate-bar-in h-full bg-ink"
                              style={{
                                width: `${Math.max(2, barWidth)}%`,
                                animationDelay: `${0.15 + i * 0.03}s`,
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-sm tabular-nums text-muted">
                        {biz.unique_visitors}
                      </td>
                      <td className={`py-2.5 pr-4 text-right font-mono text-sm tabular-nums ${biz.phone_clicks > 0 ? "text-ink" : "text-border-dark"}`}>
                        {biz.phone_clicks}
                      </td>
                      <td className={`py-2.5 pr-4 text-right font-mono text-sm tabular-nums ${biz.text_clicks > 0 ? "text-ink" : "text-border-dark"}`}>
                        {biz.text_clicks}
                      </td>
                      <td className={`py-2.5 pr-4 text-right font-mono text-sm tabular-nums ${biz.form_submits > 0 ? "text-ink" : "text-border-dark"}`}>
                        {biz.form_submits}
                      </td>
                      <td className={`py-2.5 text-right font-mono text-sm tabular-nums ${biz.review_completes > 0 ? "text-ink" : "text-border-dark"}`}>
                        {biz.review_completes}
                      </td>
                    </tr>

                    {/* Expanded site rows */}
                    {isOpen && biz.sites.map((site) => (
                      <tr
                        key={site.id}
                        className="border-b border-border-light/60 bg-[#F0EBE4]"
                      >
                        <td className="py-2 pr-2"></td>
                        <td className="py-2 pr-4 pl-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-block bg-ink px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-paper">
                              {siteTypeLabel(site.type)}
                            </span>
                            <Link
                              href={`/admin/pulse/${site.id}`}
                              className="font-mono text-[11px] text-muted hover:text-ink hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {siteUrl(site.type, site.slug)}
                            </Link>
                          </div>
                        </td>
                        <td className="py-2 pr-4 text-right font-mono text-xs tabular-nums text-ink">
                          {site.total_views}
                        </td>
                        <td className="py-2 pr-4">
                          {biz.total_views > 0 && site.total_views > 0 && (
                            <div className="h-1.5 w-full bg-border-dark/30">
                              <div
                                className="h-full bg-ink/50"
                                style={{ width: `${(site.total_views / biz.total_views) * 100}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono text-xs tabular-nums text-muted">
                          {site.unique_visitors}
                        </td>
                        <td className={`py-2 pr-4 text-right font-mono text-xs tabular-nums ${site.phone_clicks > 0 ? "text-ink" : "text-border-dark"}`}>
                          {site.phone_clicks}
                        </td>
                        <td className={`py-2 pr-4 text-right font-mono text-xs tabular-nums ${site.text_clicks > 0 ? "text-ink" : "text-border-dark"}`}>
                          {site.text_clicks}
                        </td>
                        <td className={`py-2 pr-4 text-right font-mono text-xs tabular-nums ${site.form_submits > 0 ? "text-ink" : "text-border-dark"}`}>
                          {site.form_submits}
                        </td>
                        <td className={`py-2 text-right font-mono text-xs tabular-nums ${site.review_completes > 0 ? "text-ink" : "text-border-dark"}`}>
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
      )}
    </div>
  );
}
