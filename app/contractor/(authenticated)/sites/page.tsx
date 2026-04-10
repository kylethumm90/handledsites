import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin, ContractorSite } from "@/lib/supabase";
import ContractorSitesEditor from "@/components/ContractorSitesEditor";

export const dynamic = "force-dynamic";

export default async function ContractorSitesPage() {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  const { businessId } = auth;
  const supabase = getSupabaseAdmin();

  // Fetch business for custom domain info + website fields
  const { data: business } = await supabase
    .from("businesses")
    .select("custom_domain, domain_status, about_bio, hero_tagline, years_in_business, license_number, service_areas, google_place_id")
    .eq("id", businessId)
    .single();

  const customDomain = business?.domain_status === "active" ? business.custom_domain : null;

  // Fetch all sites for this business via the joined view
  const { data: allSites } = await supabase
    .from("sites_full")
    .select("*")
    .eq("business_id", businessId)
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
    social_facebook: data.social_facebook ?? null,
    social_instagram: data.social_instagram ?? null,
    social_google: data.social_google ?? null,
    social_nextdoor: data.social_nextdoor ?? null,
  }));

  // Fetch per-site metrics
  const siteIds = sites.map((s) => s.id);

  const [leadCounts, responseCounts, reviewCount] = await Promise.all([
    supabase
      .from("leads")
      .select("site_id", { count: "exact", head: false })
      .in("site_id", siteIds)
      .eq("is_demo", false)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        (data || []).forEach((r: { site_id: string }) => {
          counts[r.site_id] = (counts[r.site_id] || 0) + 1;
        });
        return counts;
      }),
    supabase
      .from("review_responses")
      .select("site_id", { count: "exact", head: false })
      .in("site_id", siteIds)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        (data || []).forEach((r: { site_id: string }) => {
          counts[r.site_id] = (counts[r.site_id] || 0) + 1;
        });
        return counts;
      }),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .then(({ count }) => count ?? 0),
  ]);

  const siteMetrics: Record<string, { label: string; value: number }[]> = {};
  for (const site of sites) {
    switch (site.type) {
      case "business_card":
        if (site.review_count != null && site.review_count > 0) {
          siteMetrics[site.id] = [
            { label: "Reviews", value: site.review_count },
            ...(site.avg_rating != null ? [{ label: "Rating", value: site.avg_rating }] : []),
          ];
        }
        break;
      case "quiz_funnel":
        siteMetrics[site.id] = [{ label: "Leads", value: leadCounts[site.id] || 0 }];
        break;
      case "review_funnel":
        siteMetrics[site.id] = [{ label: "Responses", value: responseCounts[site.id] || 0 }];
        break;
      case "review_wall":
        siteMetrics[site.id] = [{ label: "Reviews", value: reviewCount }];
        break;
      case "website":
        siteMetrics[site.id] = [{ label: "Leads", value: leadCounts[site.id] || 0 }];
        break;
    }
  }

  const websiteData = {
    aboutBio: business?.about_bio ?? "",
    heroTagline: business?.hero_tagline ?? "",
    yearsInBusiness: business?.years_in_business ?? null,
    licenseNumber: business?.license_number ?? "",
    serviceAreas: (business?.service_areas || []).join(", "),
  };

  const hasGoogle = !!business?.google_place_id;

  // Fetch employees
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  // Get business slug for team URLs
  const businessSlug = sites.length > 0 ? sites[0].slug : "";

  return <ContractorSitesEditor sites={sites} customDomain={customDomain} siteMetrics={siteMetrics} websiteData={websiteData} hasGoogle={hasGoogle} employees={employees || []} businessSlug={businessSlug} />;
}
