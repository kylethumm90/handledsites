import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SiteStats = {
  id: string;
  business_name: string;
  trade: string;
  city: string;
  state: string;
  type: string;
  slug: string;
  total_views: number;
  unique_visitors: number;
  phone_clicks: number;
  text_clicks: number;
  form_submits: number;
  review_clicks: number;
  review_completes: number;
};

async function getAllSiteStats(): Promise<{
  sites: SiteStats[];
  totals: { views: number; visitors: number; phone: number; text: number; forms: number; reviews: number };
}> {
  const supabase = getSupabaseAdmin();

  // Get all sites
  const { data: sites } = await supabase
    .from("sites_full")
    .select("id, business_name, trade, city, state, type, slug, business_phone")
    .order("business_name");

  if (!sites || sites.length === 0) {
    return { sites: [], totals: { views: 0, visitors: 0, phone: 0, text: 0, forms: 0, reviews: 0 } };
  }

  const siteIds = sites.map((s) => s.id);

  // Get last 30 days of stats
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: statsRows } = await supabase
    .from("site_stats_daily")
    .select("site_id, total_views, unique_visitors, phone_clicks, text_clicks, form_submits, review_clicks, review_completes")
    .in("site_id", siteIds)
    .gte("stat_date", startDate);

  // Also get today's live events
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: todayEvents } = await supabase
    .from("site_events")
    .select("site_id, event_type, visitor_id")
    .in("site_id", siteIds)
    .gte("created_at", `${todayStr}T00:00:00.000Z`);

  // Aggregate per site
  const statsMap: Record<string, SiteStats> = {};
  for (const site of sites) {
    statsMap[site.id] = {
      id: site.id,
      business_name: site.business_name,
      trade: site.trade,
      city: site.city,
      state: site.state,
      type: site.type,
      slug: site.slug,
      total_views: 0,
      unique_visitors: 0,
      phone_clicks: 0,
      text_clicks: 0,
      form_submits: 0,
      review_clicks: 0,
      review_completes: 0,
    };
  }

  // Sum rollup stats
  if (statsRows) {
    for (const row of statsRows) {
      const s = statsMap[row.site_id];
      if (!s) continue;
      s.total_views += row.total_views || 0;
      s.unique_visitors += row.unique_visitors || 0;
      s.phone_clicks += row.phone_clicks || 0;
      s.text_clicks += row.text_clicks || 0;
      s.form_submits += row.form_submits || 0;
      s.review_clicks += row.review_clicks || 0;
      s.review_completes += row.review_completes || 0;
    }
  }

  // Add today's live events
  if (todayEvents) {
    const todayVisitors: Record<string, Set<string>> = {};
    for (const e of todayEvents) {
      const s = statsMap[e.site_id];
      if (!s) continue;
      switch (e.event_type) {
        case "page_view":
          s.total_views++;
          if (!todayVisitors[e.site_id]) todayVisitors[e.site_id] = new Set();
          todayVisitors[e.site_id].add(e.visitor_id);
          break;
        case "phone_click": s.phone_clicks++; break;
        case "text_click": s.text_clicks++; break;
        case "form_submit": s.form_submits++; break;
        case "review_click": s.review_clicks++; break;
        case "review_complete": s.review_completes++; break;
      }
    }
    for (const [siteId, visitors] of Object.entries(todayVisitors)) {
      if (statsMap[siteId]) statsMap[siteId].unique_visitors += visitors.size;
    }
  }

  const allSites = Object.values(statsMap).sort((a, b) => b.total_views - a.total_views);

  const totals = {
    views: allSites.reduce((sum, s) => sum + s.total_views, 0),
    visitors: allSites.reduce((sum, s) => sum + s.unique_visitors, 0),
    phone: allSites.reduce((sum, s) => sum + s.phone_clicks, 0),
    text: allSites.reduce((sum, s) => sum + s.text_clicks, 0),
    forms: allSites.reduce((sum, s) => sum + s.form_submits, 0),
    reviews: allSites.reduce((sum, s) => sum + s.review_completes, 0),
  };

  return { sites: allSites, totals };
}

function siteTypeLabel(type: string) {
  return type.replace(/_/g, " ");
}

export default async function PulseOverviewPage() {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  const { sites, totals } = await getAllSiteStats();
  const maxViews = sites.length > 0 ? sites[0].total_views : 1;

  return (
    <AdminShell active="pulse">
      {/* Totals row */}
      <div
        className="animate-newsroom-in mb-10 grid grid-cols-3 sm:grid-cols-6"
        style={{ animationDelay: "0.05s" }}
      >
        <div className="py-4 pr-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            Views
          </p>
          <p className="mt-1 font-display text-[40px] leading-none text-ink">
            {totals.views}
          </p>
        </div>
        <div className="border-l border-border-dark py-4 px-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            Visitors
          </p>
          <p className="mt-1 font-display text-[40px] leading-none text-ink">
            {totals.visitors}
          </p>
        </div>
        <div className="border-l border-border-dark py-4 px-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            Calls
          </p>
          <p className="mt-1 font-display text-[40px] leading-none text-ink">
            {totals.phone}
          </p>
        </div>
        <div className="border-l border-border-dark py-4 px-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            Texts
          </p>
          <p className="mt-1 font-display text-[40px] leading-none text-ink">
            {totals.text}
          </p>
        </div>
        <div className="border-l border-border-dark py-4 px-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            Forms
          </p>
          <p className="mt-1 font-display text-[40px] leading-none text-ink">
            {totals.forms}
          </p>
        </div>
        <div className="border-l border-border-dark py-4 pl-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            Reviews
          </p>
          <p className="mt-1 font-display text-[40px] leading-none text-ink">
            {totals.reviews}
          </p>
        </div>
      </div>

      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        Last 30 days across all sites
      </p>

      {/* Site-by-site breakdown */}
      <div
        className="animate-newsroom-in"
        style={{ animationDelay: "0.1s" }}
      >
        <h2 className="mb-5 font-display text-lg italic text-ink">All Sites</h2>

        {sites.length === 0 ? (
          <p className="font-body text-sm text-muted">No sites yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-t-2 border-ink border-b border-b-border-dark">
                  <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                    Site
                  </th>
                  <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                    Type
                  </th>
                  <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted text-right">
                    Views
                  </th>
                  <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted w-[200px]">
                    {/* bar */}
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
                {sites.map((site, i) => {
                  const barWidth = maxViews > 0 ? (site.total_views / maxViews) * 100 : 0;
                  return (
                    <tr
                      key={site.id}
                      className="animate-row-in border-b border-border-light last:border-0"
                      style={{ animationDelay: `${0.12 + i * 0.02}s` }}
                    >
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/admin/pulse/${site.id}`}
                          className="font-body text-sm font-medium text-ink hover:underline"
                        >
                          {site.business_name}
                        </Link>
                        <div className="font-mono text-[10px] text-muted">
                          {site.trade} &middot; {site.city}, {site.state}
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-[10px] uppercase text-muted">
                        {siteTypeLabel(site.type)}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-sm tabular-nums text-ink">
                        {site.total_views}
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
                        {site.unique_visitors}
                      </td>
                      <td className={`py-2.5 pr-4 text-right font-mono text-sm tabular-nums ${site.phone_clicks > 0 ? "text-ink" : "text-border-dark"}`}>
                        {site.phone_clicks}
                      </td>
                      <td className={`py-2.5 pr-4 text-right font-mono text-sm tabular-nums ${site.text_clicks > 0 ? "text-ink" : "text-border-dark"}`}>
                        {site.text_clicks}
                      </td>
                      <td className={`py-2.5 pr-4 text-right font-mono text-sm tabular-nums ${site.form_submits > 0 ? "text-ink" : "text-border-dark"}`}>
                        {site.form_submits}
                      </td>
                      <td className={`py-2.5 text-right font-mono text-sm tabular-nums ${site.review_completes > 0 ? "text-ink" : "text-border-dark"}`}>
                        {site.review_completes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
