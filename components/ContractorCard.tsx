import type { ContractorSite } from "@/lib/supabase";
import { TRADE_ICONS } from "@/lib/icons";
import { TRADE_IMAGES } from "@/lib/constants";
import { MapPin, Shield, Tag, Clock, Heart } from "lucide-react";
import BannerStrip from "./BannerStrip";
import AvailabilityDot from "./AvailabilityDot";
import CTAButtons from "./CTAButtons";
import ServicesGrid from "./ServicesGrid";
import ReviewStars from "./ReviewStars";
import type { LucideIcon } from "lucide-react";

type Props = {
  contractor: ContractorSite;
};

const BADGE_CONFIG: { key: keyof ContractorSite; label: string; icon: LucideIcon }[] = [
  { key: "badge_licensed", label: "Licensed & Insured", icon: Shield },
  { key: "badge_free_estimates", label: "Free Estimates", icon: Tag },
  { key: "badge_emergency", label: "24/7 Emergency", icon: Clock },
  { key: "badge_family_owned", label: "Family Owned", icon: Heart },
];

export default function ContractorCard({ contractor }: Props) {
  const initials = contractor.business_name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const TradeIcon = TRADE_ICONS[contractor.trade] || TRADE_ICONS["Other"];

  const activeBadges = BADGE_CONFIG.filter((b) => contractor[b.key]);

  return (
    <div className="mx-auto w-full max-w-[420px] space-y-5 p-5">
      {/* Banner */}
      <BannerStrip message={contractor.banner_message} />

      {/* Cover photo */}
      <div className="relative h-[160px] w-full overflow-hidden rounded-xl">
        <img
          src={contractor.cover_image_url || TRADE_IMAGES[contractor.trade] || TRADE_IMAGES["default"]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.55))" }}
        />
      </div>

      {/* Avatar — overlapping cover by 50% (40px avatar + 20px space-y-5 gap) */}
      <div className="relative z-10 flex justify-center" style={{ marginTop: "-60px" }}>
        {contractor.logo_url ? (
          <img
            src={contractor.logo_url}
            alt={`${contractor.business_name} logo`}
            className="h-20 w-20 rounded-full object-cover"
            style={{ border: "3px solid white" }}
          />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full bg-card-surface"
            style={{ border: "3px solid white" }}
          >
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>
        )}
      </div>

      {/* Business info */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">
          {contractor.business_name}
        </h1>
        <div className="mt-1 flex items-center justify-center gap-1">
          <TradeIcon className="h-3.5 w-3.5 text-card-muted" />
          <p className="text-sm text-card-muted">
            {contractor.city}, {contractor.state}
          </p>
        </div>

        {/* Trust badges */}
        {activeBadges.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {activeBadges.map((badge) => (
              <div
                key={badge.key}
                className="inline-flex items-center gap-1"
                style={{
                  background: "#1e2235",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "11px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                }}
              >
                <badge.icon className="h-3 w-3 text-card-muted" />
                <span className="text-card-muted">{badge.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <AvailabilityDot
        hoursStart={contractor.hours_start}
        hoursEnd={contractor.hours_end}
      />

      {/* CTA Buttons */}
      <CTAButtons
        phone={contractor.phone}
        businessName={contractor.business_name}
        city={contractor.city}
        state={contractor.state}
        slug={contractor.slug}
        siteId={contractor.id}
      />

      {/* Services Grid */}
      {contractor.services.length > 0 && (
        <ServicesGrid services={contractor.services} />
      )}

      {/* Reviews */}
      <ReviewStars
        reviewCount={contractor.review_count}
        avgRating={contractor.avg_rating}
      />

      {/* Social Links */}
      <SocialLinks
        facebook={contractor.social_facebook}
        instagram={contractor.social_instagram}
        google={contractor.social_google}
        nextdoor={contractor.social_nextdoor}
      />

      {/* Location pill */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1.5 rounded-full bg-card-surface px-4 py-2">
          <MapPin className="h-3.5 w-3.5 text-card-muted" />
          <span className="text-xs font-medium text-card-muted">
            {contractor.city}, {contractor.state}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 text-center">
        <a href="/sites" className="inline-block">
          <img src="/logo-light.png" alt="handled." style={{ height: '16px', width: 'auto', opacity: 0.5 }} />
        </a>
      </div>
    </div>
  );
}

function SocialLinks({
  facebook,
  instagram,
  google,
  nextdoor,
}: {
  facebook: string | null;
  instagram: string | null;
  google: string | null;
  nextdoor: string | null;
}) {
  const links = [
    { url: facebook, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
    { url: instagram, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
    { url: google, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
    { url: nextdoor, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg> },
  ].filter((l) => l.url);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-4 border-t border-card-surface pt-4">
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url!}
          target="_blank"
          rel="noopener noreferrer"
          className="text-card-muted transition-colors hover:text-white"
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
