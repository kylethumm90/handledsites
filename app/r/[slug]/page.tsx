import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ReviewClient from "./ReviewClient";
import PulsePageView from "@/components/PulsePageView";
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
  searchParams,
}: {
  params: { slug: string };
  searchParams: { rep?: string; rep_id?: string };
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

  // Look up rep if param provided
  let repId: string | null = null;
  let repName: string | null = null;

  if (searchParams.rep_id) {
    const { data: emp } = await supabase
      .from("employees")
      .select("id, name")
      .eq("id", searchParams.rep_id)
      .eq("business_id", site.business_id)
      .eq("is_active", true)
      .single();
    if (emp) {
      repId = emp.id;
      repName = emp.name.split(" ")[0];
    }
  } else if (searchParams.rep) {
    const { data: emp } = await supabase
      .from("employees")
      .select("id, name")
      .eq("slug", searchParams.rep)
      .eq("business_id", site.business_id)
      .eq("is_active", true)
      .single();
    if (emp) {
      repId = emp.id;
      repName = emp.name.split(" ")[0];
    }
  }

  return (
    <>
    <PulsePageView siteId={site.id} />
    <ReviewClient
      siteId={site.id}
      businessName={site.business_name}
      logoUrl={site.logo_url}
      googleReviewUrl={site.google_review_url}
      repId={repId}
      repName={repName}
    />
    </>
  );
}
