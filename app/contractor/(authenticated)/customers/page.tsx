import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import CustomersClient from "@/components/CustomersClient";
import DemoBanner from "@/components/DemoBanner";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const siteId = await validateSessionFromCookie();
  if (!siteId) redirect("/contractor/login");

  const supabase = getSupabaseAdmin();

  const { data: site } = await supabase
    .from("sites_full")
    .select("business_id, trade")
    .eq("id", siteId)
    .single();

  if (!site) redirect("/contractor/login");

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", site.business_id)
    .order("created_at", { ascending: false });

  // Check for demo leads
  const { count: demoLeadCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("business_id", site.business_id)
    .eq("is_demo", true);

  const hasDemoLeads = (demoLeadCount ?? 0) > 0;

  return (
    <>
      {hasDemoLeads && <DemoBanner />}
      <CustomersClient
        leads={(leads || []) as Lead[]}
        trade={site.trade}
      />
    </>
  );
}
