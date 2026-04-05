import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ReviewClient from "./ReviewClient";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = getSupabaseAdmin();
  const { data: site } = await supabase
    .from("sites_full")
    .select("business_name")
    .eq("slug", params.slug)
    .eq("type", "review_funnel")
    .eq("is_active", true)
    .single();

  if (!site) return { title: "Review" };

  return {
    title: `How was your experience? | ${site.business_name}`,
    description: `Share your feedback about ${site.business_name}`,
  };
}

export default async function ReviewFunnelPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = getSupabaseAdmin();

  const { data: site } = await supabase
    .from("sites_full")
    .select("*")
    .eq("slug", params.slug)
    .eq("type", "review_funnel")
    .eq("is_active", true)
    .single();

  if (!site) notFound();

  return (
    <ReviewClient
      siteId={site.id}
      businessName={site.business_name}
      logoUrl={site.logo_url}
      googleReviewUrl={site.google_review_url}
    />
  );
}
