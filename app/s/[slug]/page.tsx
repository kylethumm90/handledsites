import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { Phone, Mail, Clock, Shield, Tag, Heart, ExternalLink } from "lucide-react";
import WebsiteContactForm from "./WebsiteContactForm";

export const revalidate = 60;

type SiteData = {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  email: string | null;
  city: string;
  state: string;
  trade: string;
  services: string[];
  logo_url: string | null;
  about_bio: string | null;
  google_review_url: string | null;
  hours_start: number;
  hours_end: number;
  badge_licensed: boolean;
  badge_free_estimates: boolean;
  badge_emergency: boolean;
  badge_family_owned: boolean;
};

async function getSiteData(slug: string): Promise<SiteData | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("sites_full")
    .select("*")
    .eq("slug", slug)
    .eq("type", "website")
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    business_name: data.business_name,
    owner_name: data.owner_name,
    phone: data.business_phone,
    email: data.business_email,
    city: data.city,
    state: data.state,
    trade: data.trade,
    services: data.services || [],
    logo_url: data.logo_url,
    about_bio: data.about_bio,
    google_review_url: data.google_review_url,
    hours_start: data.hours_start ?? 7,
    hours_end: data.hours_end ?? 19,
    badge_licensed: data.badge_licensed ?? false,
    badge_free_estimates: data.badge_free_estimates ?? false,
    badge_emergency: data.badge_emergency ?? false,
    badge_family_owned: data.badge_family_owned ?? false,
  };
}

function formatPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const site = await getSiteData(params.slug);
  if (!site) return { title: "Not Found" };

  const title = `${site.business_name} | ${site.trade} in ${site.city}, ${site.state}`;
  const description =
    site.about_bio ||
    `${site.trade} services in ${site.city}, ${site.state}. Call ${formatPhone(site.phone)} for a free estimate.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function WebsitePage({
  params,
}: {
  params: { slug: string };
}) {
  const site = await getSiteData(params.slug);
  if (!site) notFound();

  const badges = [
    { active: site.badge_licensed, label: "Licensed & Insured", icon: Shield },
    { active: site.badge_free_estimates, label: "Free Estimates", icon: Tag },
    { active: site.badge_emergency, label: "24/7 Emergency", icon: Clock },
    { active: site.badge_family_owned, label: "Family Owned", icon: Heart },
  ].filter((b) => b.active);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.business_name,
    telephone: `+1${site.phone}`,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.city,
      addressRegion: site.state,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      itemListElement: site.services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s },
      })),
    },
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gray-900 px-6 py-16 text-center sm:py-24">
        <div className="mx-auto max-w-2xl">
          {site.logo_url && (
            <img
              src={site.logo_url}
              alt={`${site.business_name} logo`}
              className="mx-auto mb-6 h-16 w-16 rounded-full object-cover"
            />
          )}
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {site.business_name}
          </h1>
          <p className="mt-2 text-base text-gray-400">
            {site.trade} &middot; {site.city}, {site.state}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={`tel:${site.phone}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 sm:w-auto"
            >
              <Phone className="h-4 w-4" />
              Call now
            </a>
            <a
              href={`sms:${site.phone}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 sm:w-auto"
            >
              Text us
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      {site.services.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
              Our Services
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {site.services.map((service) => (
                <div
                  key={service}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm font-medium text-gray-700"
                >
                  {service}
                </div>
              ))}
            </div>
            {site.badge_free_estimates && (
              <p className="mt-4 text-center text-xs text-gray-500">
                Free estimates on all services
              </p>
            )}
          </div>
        </section>
      )}

      {/* About */}
      {site.about_bio && (
        <section className="border-t border-gray-100 px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
              About {site.business_name}
            </h2>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {site.logo_url && (
                <img
                  src={site.logo_url}
                  alt={site.business_name}
                  className="h-20 w-20 flex-shrink-0 rounded-full object-cover"
                />
              )}
              <p className="text-sm leading-relaxed text-gray-600">
                {site.about_bio}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {site.google_review_url && (
        <section className="border-t border-gray-100 px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-6 text-xs font-medium uppercase tracking-wider text-gray-400">
              What Our Customers Say
            </h2>
            <a
              href={site.google_review_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              See our reviews on Google
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>
      )}

      {/* Trust Badges */}
      {badges.length > 0 && (
        <section className="border-t border-gray-100 px-6 py-8">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-4">
            {badges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-1.5 text-sm text-gray-500"
              >
                <badge.icon className="h-4 w-4 text-gray-400" />
                {badge.label}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
            Get In Touch
          </h2>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <a
              href={`tel:${site.phone}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-[10px] font-medium uppercase text-gray-400">Phone</p>
                <p className="text-sm text-gray-900">{formatPhone(site.phone)}</p>
              </div>
            </a>
            {site.email && (
              <a
                href={`mailto:${site.email}`}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-[10px] font-medium uppercase text-gray-400">Email</p>
                  <p className="truncate text-sm text-gray-900">{site.email}</p>
                </div>
              </a>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-[10px] font-medium uppercase text-gray-400">Hours</p>
                <p className="text-sm text-gray-900">
                  {formatHour(site.hours_start)} – {formatHour(site.hours_end)}
                </p>
              </div>
            </div>
          </div>

          <WebsiteContactForm siteId={site.id} services={site.services} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-8 text-center">
        <p className="text-sm text-gray-500">
          {site.business_name} &middot; {site.city}, {site.state}
        </p>
        <a
          href="https://handledsites.com"
          className="mt-2 inline-block text-[10px] text-gray-300 hover:text-gray-400"
        >
          Powered by handled.
        </a>
      </footer>
    </div>
  );
}
