import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import PulseTable from "./PulseTable";

export const dynamic = "force-dynamic";

export type SiteStats = {
  id: string;
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

export type BusinessGroup = {
  business_id: string;
  business_name: string;
  trade: string;
  city: string;
  state: string;
  sites: SiteStats[];
  total_views: number;
  unique_visitors: number;
  phone_clicks: number;
  text_clicks: number;
  form_submits: number;
  review_completes: number;
};

async function getAllSiteStats(): Promise<{
  businesses: BusinessGroup[];
  totals: { views: number; visitors: number; phone: number; text: number; forms: number; reviews: number };
}> {
  const supabase = getSupabaseAdmin();

  const { data: sites } = await supabase
    .from("sites_full")
    .select("id, business_id, business_name, trade, city, state, type, slug, business_phone")
    .order("business_name");

  if (!sites || sites.length === 0) {
    return { businesses: [], totals: { views: 0, visitors: 0, phone: 0, text: 0, forms: 0, reviews: 0 } };
  }

  const siteIds = sites.map((s) => s.id);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: statsRows } = await supabase
    .from("site_stats_daily")
    .select("site_id, total_views, unique_visitors, phone_clicks, text_clicks, form_submits, review_clicks, review_completes")
    .in("site_id", siteIds)
    .gte("stat_date", startDate);

  const todayStr = new Date().toISOString().split("T")[0];
  const { data: todayEvents } = await supabase
    .from("site_events")
    .select("site_id, event_type, visitor_id")
    .in("site_id", siteIds)
    .gte("created_at", `${todayStr}T00:00:00.000Z`);

  // Build per-site stats
  const siteStatsMap: Record<string, SiteStats> = {};
  const siteMetaMap: Record<string, { business_id: string; business_name: string; trade: string; city: string; state: string }> = {};

  for (const site of sites) {
    siteStatsMap[site.id] = {
      id: site.id,
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
    siteMetaMap[site.id] = {
      business_id: site.business_id,
      business_name: site.business_name,
      trade: site.trade,
      city: site.city,
      state: site.state,
    };
  }

  if (statsRows) {
    for (const row of statsRows) {
      const s = siteStatsMap[row.site_id];
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

  if (todayEvents) {
    const todayVisitors: Record<string, Set<string>> = {};
    for (const e of todayEvents) {
      const s = siteStatsMap[e.site_id];
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
      if (siteStatsMap[siteId]) siteStatsMap[siteId].unique_visitors += visitors.size;
    }
  }

  // Group by business
  const bizMap: Record<string, BusinessGroup> = {};
  for (const site of sites) {
    const meta = siteMetaMap[site.id];
    const stats = siteStatsMap[site.id];
    if (!bizMap[meta.business_id]) {
      bizMap[meta.business_id] = {
        business_id: meta.business_id,
        business_name: meta.business_name,
        trade: meta.trade,
        city: meta.city,
        state: meta.state,
        sites: [],
        total_views: 0,
        unique_visitors: 0,
        phone_clicks: 0,
        text_clicks: 0,
        form_submits: 0,
        review_completes: 0,
      };
    }
    const biz = bizMap[meta.business_id];
    biz.sites.push(stats);
    biz.total_views += stats.total_views;
    biz.unique_visitors += stats.unique_visitors;
    biz.phone_clicks += stats.phone_clicks;
    biz.text_clicks += stats.text_clicks;
    biz.form_submits += stats.form_submits;
    biz.review_completes += stats.review_completes;
  }

  const businesses = Object.values(bizMap).sort((a, b) => b.total_views - a.total_views);

  const totals = {
    views: businesses.reduce((sum, b) => sum + b.total_views, 0),
    visitors: businesses.reduce((sum, b) => sum + b.unique_visitors, 0),
    phone: businesses.reduce((sum, b) => sum + b.phone_clicks, 0),
    text: businesses.reduce((sum, b) => sum + b.text_clicks, 0),
    forms: businesses.reduce((sum, b) => sum + b.form_submits, 0),
    reviews: businesses.reduce((sum, b) => sum + b.review_completes, 0),
  };

  return { businesses, totals };
}

export default async function PulseOverviewPage() {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  const { businesses, totals } = await getAllSiteStats();

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

      <PulseTable businesses={businesses} />
    </AdminShell>
  );
}
