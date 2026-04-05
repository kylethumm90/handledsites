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

  // Get the site to find business_id
  const { data: currentSite } = await supabase
    .from("sites_full")
    .select("*")
    .eq("id", siteId)
    .single();

  if (!currentSite) redirect("/contractor/login");

  const businessId = currentSite.business_id;

  // Fetch all sites for this business
  const { data: allSites } = await supabase
    .from("sites_full")
    .select("id, type, slug, business_name, is_active, created_at")
    .eq("business_id", businessId)
    .order("type", { ascending: true });

  // Fetch recent leads for this business
  const { data: leads, count: leadCount } = await supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <DashboardClient
      businessName={currentSite.business_name}
      logoUrl={currentSite.logo_url}
      services={currentSite.services || []}
      sites={(allSites || []).map((s) => ({
        id: s.id,
        type: s.type as "business_card" | "quiz_funnel" | "review_funnel",
        slug: s.slug,
        isActive: s.is_active,
      }))}
      leads={(leads || []) as Lead[]}
      totalLeads={leadCount || 0}
    />
  );
}
