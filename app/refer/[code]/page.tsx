import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ReferralClient from "./ReferralClient";
import type { Metadata } from "next";

export const revalidate = 60;

type Props = { params: { code: string } };

async function getReferralData(code: string) {
  const supabase = getSupabaseAdmin();

  const { data: partner } = await supabase
    .from("referral_partners")
    .select("id, business_id, customer_id, referral_code")
    .eq("referral_code", code)
    .single();

  if (!partner) return null;

  const { data: customer } = await supabase
    .from("leads")
    .select("name")
    .eq("id", partner.customer_id)
    .single();

  const { data: business } = await supabase
    .from("businesses")
    .select("name, logo_url, google_rating, google_review_count, google_reviews, trade, city, state, brand_color")
    .eq("id", partner.business_id)
    .single();

  if (!business) return null;

  return {
    referralCode: partner.referral_code,
    partnerFirstName: (customer?.name || "").split(" ")[0],
    partnerFullName: customer?.name || "",
    businessName: business.name,
    logoUrl: business.logo_url,
    rating: business.google_rating,
    reviewCount: business.google_review_count,
    trade: business.trade,
    city: business.city,
    state: business.state,
    brandColor: business.brand_color,
    reviews: (business.google_reviews || [])
      .filter((r: { rating: number }) => r.rating >= 4)
      .slice(0, 4),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getReferralData(params.code);
  if (!data) return { title: "Referral" };

  const title = `${data.partnerFirstName} recommends ${data.businessName}`;
  const description = data.rating
    ? `${data.partnerFirstName} recommends ${data.businessName} — ${data.rating}★ rated${data.reviewCount ? ` across ${data.reviewCount} reviews` : ""}. Get in touch today.`
    : `${data.partnerFirstName} recommends ${data.businessName}. Get in touch today.`;

  // Branded OG card rendered by /api/og/refer — encode everything we need so
  // Facebook's scraper doesn't have to hit the DB.
  const ogParams = new URLSearchParams();
  ogParams.set("business", data.businessName);
  ogParams.set("partner", data.partnerFirstName);
  if (data.logoUrl) ogParams.set("logo", data.logoUrl);
  if (data.rating) ogParams.set("rating", String(data.rating));
  if (data.reviewCount) ogParams.set("reviews", String(data.reviewCount));
  if (data.trade) ogParams.set("trade", data.trade);
  if (data.city) ogParams.set("city", data.city);
  if (data.state) ogParams.set("state", data.state);
  if (data.brandColor) ogParams.set("color", data.brandColor);
  const ogImageUrl = `/api/og/refer?${ogParams.toString()}`;

  return {
    title: `${title} | ${data.businessName}`,
    description,
    openGraph: {
      title,
      description,
      siteName: data.businessName,
      type: "website",
      url: `/refer/${params.code}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ReferralPage({ params }: Props) {
  const data = await getReferralData(params.code);
  if (!data) notFound();

  return (
    <ReferralClient
      referralCode={data.referralCode}
      partnerFirstName={data.partnerFirstName}
      partnerFullName={data.partnerFullName}
      businessName={data.businessName}
      logoUrl={data.logoUrl}
      rating={data.rating}
      reviewCount={data.reviewCount}
      reviews={data.reviews}
    />
  );
}
