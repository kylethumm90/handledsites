import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import DashboardClient from "./DashboardClient";
import DemoBanner from "@/components/DemoBanner";

export const dynamic = "force-dynamic";

export default async function ContractorDashboardPage() {
  const siteId = await validateSessionFromCookie();
  if (!siteId) redirect("/contractor/login");

  const supabase = getSupabaseAdmin();

  const { data: currentSite } = await supabase
    .from("sites_full")
    .select("business_id, business_name, logo_url, google_rating, google_review_count")
    .eq("id", siteId)
    .single();

  if (!currentSite) redirect("/contractor/login");

  const businessId = currentSite.business_id;

  // Fetch business profile for completion check
  const { data: business } = await supabase
    .from("businesses")
    .select("owner_name, years_in_business, service_areas, license_number, hero_tagline, social_facebook, social_instagram, social_nextdoor, trade, services, about_bio, city, state")
    .eq("id", businessId)
    .single();

  // Recent leads (last 5)
  const { data: leads, count: totalLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(5);

  // New leads this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: newLeadsThisWeek } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("created_at", weekAgo);

  // Page views (last 7 days from rollup + today's live events)
  const weekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { data: allSites } = await supabase
    .from("sites")
    .select("id")
    .eq("business_id", businessId);
  const siteIds = (allSites || []).map((s: { id: string }) => s.id);

  let totalViews = 0;
  if (siteIds.length > 0) {
    const { data: statsRows } = await supabase
      .from("site_stats_daily")
      .select("total_views")
      .in("site_id", siteIds)
      .gte("stat_date", weekAgoDate);
    totalViews = (statsRows || []).reduce((sum: number, r: { total_views: number }) => sum + (r.total_views || 0), 0);

    // Add today's live page_view events
    const todayStr = new Date().toISOString().split("T")[0];
    const { count: todayViews } = await supabase
      .from("site_events")
      .select("id", { count: "exact", head: true })
      .in("site_id", siteIds)
      .eq("event_type", "page_view")
      .gte("created_at", `${todayStr}T00:00:00.000Z`);
    totalViews += todayViews || 0;
  }

  // Check for demo leads
  const { count: demoLeadCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("is_demo", true);

  const hasDemoLeads = (demoLeadCount ?? 0) > 0;

  return (
    <>
    {hasDemoLeads && <DemoBanner />}
    <DashboardClient
      businessName={currentSite.business_name}
      logoUrl={currentSite.logo_url}
      leads={(leads || []) as Lead[]}
      totalLeads={totalLeads || 0}
      newLeadsThisWeek={newLeadsThisWeek || 0}
      totalViews={totalViews}
      googleRating={currentSite.google_rating || null}
      googleReviewCount={currentSite.google_review_count || null}
      hasDemoLeads={hasDemoLeads}
      profileData={business ? {
        owner_name: business.owner_name,
        years_in_business: business.years_in_business,
        service_areas: business.service_areas,
        license_number: business.license_number,
        hero_tagline: business.hero_tagline,
        social_facebook: business.social_facebook,
        social_instagram: business.social_instagram,
        social_nextdoor: business.social_nextdoor,
        trade: business.trade,
        services: business.services,
        about_bio: business.about_bio,
        city: business.city,
        state: business.state,
      } : null}
    />
    </>
  );
}
