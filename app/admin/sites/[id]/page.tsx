import { redirect, notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin, ContractorSite } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import AdminSiteEditor from "@/components/AdminSiteEditor";

export const dynamic = "force-dynamic";

async function getSite(id: string): Promise<ContractorSite | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("sites_full")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    business_id: data.business_id,
    type: data.type,
    business_name: data.business_name,
    owner_name: data.owner_name,
    phone: data.business_phone,
    email: data.business_email,
    city: data.city,
    state: data.state,
    trade: data.trade,
    services: data.services,
    slug: data.slug,
    badge_licensed: data.badge_licensed ?? false,
    badge_free_estimates: data.badge_free_estimates ?? false,
    badge_emergency: data.badge_emergency ?? false,
    badge_family_owned: data.badge_family_owned ?? false,
    logo_url: data.logo_url,
    cover_image_url: data.cover_image_url,
    qr_redirect_url: data.qr_redirect_url,
    banner_message: data.banner_message ?? "",
    hours_start: data.hours_start ?? 7,
    hours_end: data.hours_end ?? 19,
    review_count: data.review_count,
    avg_rating: data.avg_rating,
    created_at: data.created_at,
    gtm_id: data.gtm_id ?? null,
    meta_pixel_id: data.meta_pixel_id ?? null,
    zapier_webhook_url: data.zapier_webhook_url ?? null,
    social_facebook: data.social_facebook ?? null,
    social_instagram: data.social_instagram ?? null,
    social_google: data.social_google ?? null,
    social_nextdoor: data.social_nextdoor ?? null,
  } as ContractorSite;
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
