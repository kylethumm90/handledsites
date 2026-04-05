import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import CustomersClient from "@/components/CustomersClient";

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

  return (
    <CustomersClient
      leads={(leads || []) as Lead[]}
      trade={site.trade}
    />
  );
}
