import { redirect, notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin, Business } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import AdminBusinessEditor from "@/components/AdminBusinessEditor";

export const dynamic = "force-dynamic";

type SiteInfo = {
  id: string;
  type: "business_card" | "quiz_funnel" | "review_funnel";
  slug: string;
  is_active: boolean;
};

async function getBusinessWithSites(id: string) {
  const supabase = getSupabaseAdmin();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !business) return null;

  const { data: sites } = await supabase
    .from("sites")
    .select("id, type, slug, is_active")
    .eq("business_id", id)
    .order("type", { ascending: true });

  return {
    business: business as Business,
    sites: (sites || []) as SiteInfo[],
  };
}

export default async function AdminBusinessDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  const result = await getBusinessWithSites(params.id);
  if (!result) notFound();

  return (
    <AdminShell active="businesses">
      <AdminBusinessEditor
        business={result.business}
        sites={result.sites}
      />
    </AdminShell>
  );
}
