import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSupabaseAdmin, ContractorSite } from "@/lib/supabase";
import ContractorCard from "@/components/ContractorCard";
import PulsePageView from "@/components/PulsePageView";

export const revalidate = 60;

type Props = {
  params: { slug: string };
};

async function getContractor(slug: string): Promise<ContractorSite | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("sites_full")
    .select("*")
    .eq("slug", slug)
    .eq("type", "business_card")
    .single();

  if (error || !data) return null;

  // Map sites_full view to ContractorSite shape for backward compatibility
  return {
    id: data.id,
    type: "business_card" as const,
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
    review_count: data.google_review_count ?? data.review_count,
    avg_rating: data.google_rating ?? data.avg_rating,
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const contractor = await getContractor(params.slug);
  if (!contractor) return { title: "Not Found" };

  const title = contractor.business_name;
  const description = `${contractor.trade} services in ${contractor.city}, ${contractor.state}`;
  const ogImageUrl = `/api/og?name=${encodeURIComponent(contractor.business_name)}&trade=${encodeURIComponent(contractor.trade)}&city=${encodeURIComponent(contractor.city)}&state=${encodeURIComponent(contractor.state)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function CardPage({ params }: Props) {
  const contractor = await getContractor(params.slug);
  if (!contractor) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: contractor.business_name,
    telephone: `+1${contractor.phone}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: contractor.city,
      addressRegion: contractor.state,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      itemListElement: contractor.services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service,
        },
      })),
    },
  };

  return (
    <div className="min-h-screen bg-card-bg font-inter">
      <PulsePageView siteId={contractor.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContractorCard contractor={contractor} />
    </div>
  );
}
