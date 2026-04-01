import type { ContractorSite } from "@/lib/supabase";
import { TRADE_ICONS } from "@/lib/icons";
import { MapPin, Shield } from "lucide-react";
import BannerStrip from "./BannerStrip";
import AvailabilityDot from "./AvailabilityDot";
import CTAButtons from "./CTAButtons";
import ServicesGrid from "./ServicesGrid";
import ReviewStars from "./ReviewStars";

type Props = {
  contractor: ContractorSite;
};

export default function ContractorCard({ contractor }: Props) {
  const initials = contractor.business_name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const TradeIcon = TRADE_ICONS[contractor.trade] || TRADE_ICONS["Other"];

  return (
    <div className="mx-auto w-full max-w-[420px] space-y-5 p-5">
      {/* Banner */}
      <BannerStrip message={contractor.banner_message} />

      {/* Avatar */}
      <div className="flex justify-center">
        {contractor.logo_url ? (
          <img
            src={contractor.logo_url}
            alt={`${contractor.business_name} logo`}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card-surface">
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
        {contractor.licensed_insured && (
          <div className="mt-2 flex items-center justify-center gap-1">
            <Shield className="h-3.5 w-3.5 text-card-save-fg" />
            <span className="text-xs font-medium text-card-save-fg">
              Licensed & Insured
            </span>
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
        <p className="text-xs text-card-muted/50">
          powered by{" "}
          <a href="/" className="underline hover:text-card-muted">
            handled.sites
          </a>
        </p>
      </div>
    </div>
  );
}
