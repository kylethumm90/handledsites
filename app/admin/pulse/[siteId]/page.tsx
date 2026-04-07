import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import PulseDashboard from "./PulseDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPulsePage({
  params,
}: {
  params: { siteId: string };
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const supabase = getSupabaseAdmin();

  const { data: site } = await supabase
    .from("sites_full")
    .select("id, business_name, business_phone, trade, city, state, type, slug")
    .eq("id", params.siteId)
    .single();

  if (!site) redirect("/admin/sites");

  return (
    <PulseDashboard
      siteId={site.id}
      siteName={site.business_name}
      siteType={site.type}
      slug={site.slug}
      trade={site.trade}
      hasPhone={!!site.business_phone}
    />
  );
}
