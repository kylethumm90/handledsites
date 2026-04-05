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
    .select("business_id, business_name")
    .eq("id", siteId)
    .single();

  if (!currentSite) redirect("/contractor/login");

  const businessId = currentSite.business_id;

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
      leads={(leads || []) as Lead[]}
      totalLeads={totalLeads || 0}
      newLeadsThisWeek={newLeadsThisWeek || 0}
    />
  );
}
