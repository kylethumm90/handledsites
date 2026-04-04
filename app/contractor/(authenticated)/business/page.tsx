import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin, Business } from "@/lib/supabase";
import ContractorBusinessEditor from "@/components/ContractorBusinessEditor";

export const dynamic = "force-dynamic";

export default async function ContractorBusinessPage() {
  const siteId = await validateSessionFromCookie();
  if (!siteId) redirect("/contractor/login");

  const supabase = getSupabaseAdmin();

  // Get business_id from the site
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

  return <ContractorBusinessEditor business={business as Business} />;
}
