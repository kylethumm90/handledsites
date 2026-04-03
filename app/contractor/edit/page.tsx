import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin, ContractorSite } from "@/lib/supabase";
import ContractorSiteEditor from "@/components/ContractorSiteEditor";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function ContractorEditPage() {
  const siteId = await validateSessionFromCookie();
  if (!siteId) redirect("/contractor/login");

  const { data, error } = await getSupabaseAdmin()
    .from("sites_full")
    .select("*")
    .eq("id", siteId)
    .single();

  if (error || !data) redirect("/contractor/login");

  const site = {
    id: data.id,
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
  } as ContractorSite;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-sm font-bold text-gray-900">
            handled.sites
          </span>
          <LogoutButton />
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <ContractorSiteEditor site={site} />
      </main>
    </div>
  );
}
