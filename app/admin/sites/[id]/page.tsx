import { redirect, notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin, ContractorSite } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import AdminSiteEditor from "@/components/AdminSiteEditor";

export const dynamic = "force-dynamic";

async function getSite(id: string): Promise<ContractorSite | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("contractor_sites")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as ContractorSite;
}

export default async function AdminSiteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  const site = await getSite(params.id);
  if (!site) notFound();

  return (
    <AdminShell active="sites">
      <AdminSiteEditor site={site} />
    </AdminShell>
  );
}
