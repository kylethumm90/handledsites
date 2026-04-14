import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TRADE_IMAGES } from "@/lib/constants";
import EmployeeCard from "@/components/EmployeeCard";

export const revalidate = 60;

type Props = {
  params: { businessSlug: string; employeeSlug: string };
};

async function getEmployeeData(businessSlug: string, employeeSlug: string) {
  const supabase = getSupabaseAdmin();

  // Find the business card site with this slug to get the business_id
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("business_id")
    .eq("slug", businessSlug)
    .eq("type", "business_card")
    .eq("is_active", true)
    .single();

  if (siteError || !site) return null;

  // Fetch employee by business_id and employee slug
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("*")
    .eq("business_id", site.business_id)
    .eq("slug", employeeSlug)
    .eq("is_active", true)
    .single();

  if (empError || !employee) return null;

  // Fetch business data
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("name, logo_url, trade, city, state, services, google_rating, google_review_count")
    .eq("id", site.business_id)
    .single();

  if (bizError || !business) return null;

  return { employee, business };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getEmployeeData(params.businessSlug, params.employeeSlug);
  if (!data) return { title: "Not Found" };

  const { employee, business } = data;
  const title = `${employee.name} - ${business.name}`;
  const description = `${employee.title || business.trade} at ${business.name} in ${business.city}, ${business.state}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function EmployeeCardPage({ params }: Props) {
  const data = await getEmployeeData(params.businessSlug, params.employeeSlug);
  if (!data) notFound();

  const { employee, business } = data;

  const coverImage =
    TRADE_IMAGES[business.trade] || TRADE_IMAGES["default"];

  const supabase = getSupabaseAdmin();

  // Get review funnel URL for this business
  const { data: reviewSite } = await supabase
    .from("sites")
    .select("slug")
    .eq("business_id", employee.business_id)
    .eq("type", "review_funnel")
    .eq("is_active", true)
    .limit(1)
    .single();

  const reviewFunnelUrl = reviewSite ? `/r/${reviewSite.slug}` : null;

  // Count five-star reviews attributed to this rep
  const { count: fiveStarCount } = await supabase
    .from("review_responses")
    .select("id", { count: "exact", head: true })
    .eq("rep_id", employee.id)
    .gte("rating", 4);

  return (
    <div className="min-h-screen bg-card-bg font-inter">
      <EmployeeCard
        employee={{
          name: employee.name,
          title: employee.title,
          phone: employee.phone,
          email: employee.email,
          photo_url: employee.photo_url,
          bio: employee.bio,
          certifications: employee.certifications,
          stats: employee.stats,
          hours_start: employee.hours_start,
          hours_end: employee.hours_end,
          calendar_url: employee.calendar_url,
          slug: employee.slug,
        }}
        business={{
          name: business.name,
          logo_url: business.logo_url,
          trade: business.trade,
          city: business.city,
          state: business.state,
          services: business.services || [],
          google_rating: business.google_rating,
          google_review_count: business.google_review_count,
        }}
        coverImage={coverImage}
        reviewFunnelUrl={reviewFunnelUrl}
        fiveStarCount={fiveStarCount ?? 0}
      />
    </div>
  );
}
