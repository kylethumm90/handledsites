import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSupabaseAdmin, ContractorSite } from "@/lib/supabase";
import ContractorCard from "@/components/ContractorCard";

export const revalidate = 60;

type Props = {
  params: { slug: string };
};

async function getContractor(slug: string): Promise<ContractorSite | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("contractor_sites")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as ContractorSite;
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContractorCard contractor={contractor} />
    </div>
  );
}
