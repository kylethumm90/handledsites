import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import CustomersClient from "@/components/CustomersClient";
import DemoBanner from "@/components/DemoBanner";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  const { businessId, siteId } = auth;
  const supabase = getSupabaseAdmin();

  const { data: site } = await supabase
    .from("sites_full")
    .select("trade")
    .eq("id", siteId)
    .single();

  if (!site) redirect("/contractor/login");

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  // Check for demo leads
  const { count: demoLeadCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("is_demo", true);

  const hasDemoLeads = (demoLeadCount ?? 0) > 0;

  return (
    <>
      <CustomersClient
        leads={(leads || []) as Lead[]}
        trade={site.trade}
      />
      {hasDemoLeads && <DemoBanner />}
    </>
  );
}
