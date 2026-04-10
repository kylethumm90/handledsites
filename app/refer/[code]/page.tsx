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
    .select("name, logo_url, google_rating, google_review_count, google_reviews")
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
    reviews: (business.google_reviews || [])
      .filter((r: { rating: number }) => r.rating >= 4)
      .slice(0, 4),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getReferralData(params.code);
  if (!data) return { title: "Referral" };
  return {
    title: `${data.partnerFirstName}'s referral | ${data.businessName}`,
    description: `${data.partnerFirstName} recommends ${data.businessName}. Get in touch today.`,
  };
}

export default async function ReferralPage({ params }: Props) {
  const data = await getReferralData(params.code);
  if (!data) notFound();

  return <ReferralClient {...data} />;
}
