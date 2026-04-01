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
      />

      {/* Services Grid */}
      {contractor.services.length > 0 && (
        <ServicesGrid services={contractor.services} />
      )}

      {/* Location pill */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1.5 rounded-full bg-card-surface px-4 py-2">
          <MapPin className="h-3.5 w-3.5 text-card-muted" />
          <span className="text-xs font-medium text-card-muted">
            {contractor.city}, {contractor.state}
          </span>
        </div>
      </div>

      {/* Reviews */}
      <ReviewStars
        reviewCount={contractor.review_count}
        avgRating={contractor.avg_rating}
      />

      {/* Footer */}
      <div className="pt-4 text-center">
        <a href="/" className="inline-block">
          <img src="/logo-light.png" alt="handled." style={{ height: '16px', width: 'auto', opacity: 0.5 }} />
        </a>
      </div>
    </div>
  );
}
