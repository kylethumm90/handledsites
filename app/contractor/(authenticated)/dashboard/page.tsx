import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function ContractorDashboardPage() {
  const siteId = await validateSessionFromCookie();
  if (!siteId) redirect("/contractor/login");

  const supabase = getSupabaseAdmin();

  const { data: currentSite } = await supabase
    .from("sites_full")
    .select("business_id, business_name, logo_url")
    .eq("id", siteId)
    .single();

  if (!currentSite) redirect("/contractor/login");

  const businessId = currentSite.business_id;

  // Fetch business profile for completion check
  const { data: business } = await supabase
    .from("businesses")
    .select("owner_name, years_in_business, service_areas, license_number, hero_tagline, social_facebook, social_instagram, social_nextdoor")
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

  return (
    <DashboardClient
      businessName={currentSite.business_name}
      logoUrl={currentSite.logo_url}
      leads={(leads || []) as Lead[]}
      totalLeads={totalLeads || 0}
      newLeadsThisWeek={newLeadsThisWeek || 0}
      profileData={business ? {
        owner_name: business.owner_name,
        years_in_business: business.years_in_business,
        service_areas: business.service_areas,
        license_number: business.license_number,
        hero_tagline: business.hero_tagline,
        social_facebook: business.social_facebook,
        social_instagram: business.social_instagram,
        social_nextdoor: business.social_nextdoor,
      } : null}
    />
  );
}
