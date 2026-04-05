import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin, Business } from "@/lib/supabase";
import ContractorSettingsEditor from "@/components/ContractorSettingsEditor";

export const dynamic = "force-dynamic";

export default async function ContractorSettingsPage() {
  const siteId = await validateSessionFromCookie();
  if (!siteId) redirect("/contractor/login");

  const supabase = getSupabaseAdmin();

  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", siteId)
    .single();

  if (!site) redirect("/contractor/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", site.business_id)
    .single();

  if (!business) redirect("/contractor/login");

  return <ContractorSettingsEditor business={business as Business} />;
}
