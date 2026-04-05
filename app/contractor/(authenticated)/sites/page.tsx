import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin, ContractorSite } from "@/lib/supabase";
import ContractorSitesEditor from "@/components/ContractorSitesEditor";

export const dynamic = "force-dynamic";

export default async function ContractorSitesPage() {
  const siteId = await validateSessionFromCookie();
  if (!siteId) redirect("/contractor/login");

  const supabase = getSupabaseAdmin();

  // Get the site to find business_id
  const { data: currentSite } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", siteId)
    .single();

  if (!currentSite) redirect("/contractor/login");

  // Fetch all sites for this business via the joined view
  const { data: allSites } = await supabase
    .from("sites_full")
    .select("*")
    .eq("business_id", currentSite.business_id)
    .order("type", { ascending: true });

  const sites: ContractorSite[] = (allSites || []).map((data) => ({
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
  }));

  return <ContractorSitesEditor sites={sites} />;
}
