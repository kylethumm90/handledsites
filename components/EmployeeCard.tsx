"use client";

import { useEffect, useState } from "react";
import { Phone, MessageSquare, UserPlus, Calendar, Shield, Settings2, Star } from "lucide-react";
import { SERVICE_ICONS } from "@/lib/icons";
import { generateVCard, downloadVCard } from "@/lib/vcard";

type Props = {
  employee: {
    name: string;
    title: string | null;
    phone: string | null;
    email: string | null;
    photo_url: string | null;
    bio: string | null;
    certifications: string[] | null;
    stats: string[] | null;
    hours_start: number;
    hours_end: number;
    calendar_url: string | null;
    slug: string;
  };
  business: {
    name: string;
    logo_url: string | null;
    trade: string;
    city: string;
    state: string;
    services: string[];
  };
  coverImage: string;
  reviewFunnelUrl?: string | null;
  fiveStarCount?: number;
};

function isWithinBusinessHours(start: number, end: number): boolean {
  const now = new Date();
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const hour = etTime.getHours();
  return hour >= start && hour < end;
}

function getFirstName(fullName: string): string {
  return fullName.split(/\s+/)[0] || fullName;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export default function EmployeeCard({ employee, business, coverImage, reviewFunnelUrl, fiveStarCount }: Props) {
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    setAvailable(isWithinBusinessHours(employee.hours_start, employee.hours_end));
    const interval = setInterval(() => {
      setAvailable(isWithinBusinessHours(employee.hours_start, employee.hours_end));
    }, 60000);
    return () => clearInterval(interval);
  }, [employee.hours_start, employee.hours_end]);

  const firstName = getFirstName(employee.name);
  const businessInitials = getInitials(business.name);
  const formattedPhone = employee.phone ? `+1${employee.phone}` : null;

  const handleSaveContact = async () => {
    if (!employee.phone) return;
    const cardUrl =
      typeof window !== "undefined"
        ? window.location.href
        : "https://handled.sites";

    const vcard = generateVCard({
      businessName: `${employee.name} - ${business.name}`,
      phone: employee.phone,
      city: business.city,
      state: business.state,
      url: cardUrl,
    });

    if (navigator.share) {
      try {
        const file = new File([vcard], `${employee.name}.vcf`, {
          type: "text/vcard",
        });
        await navigator.share({ files: [file] });
        return;
      } catch {
        // Share cancelled or failed, fall through to download
      }
    }

    downloadVCard(vcard, employee.name.toLowerCase().replace(/\s+/g, "-"));
  };

  return (
    <div className="mx-auto w-full max-w-[420px] space-y-5 p-5">
      {/* Employee Card label */}
      <p className="text-center text-xs uppercase tracking-widest text-card-muted">
        Employee Card
      </p>

      {/* Tagline */}
      <p className="text-center text-sm text-card-muted">
        Your local {business.trade} expert in {business.city}, {business.state}
      </p>

      {/* Cover photo */}
      <div className="relative h-[160px] w-full overflow-hidden rounded-xl">
        <img
          src={coverImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.55))",
          }}
        />
      </div>

      {/* Profile photo + company logo overlay */}
      <div className="relative z-10 flex justify-center" style={{ marginTop: "-60px" }}>
        <div className="relative">
          {/* Profile photo */}
          {employee.photo_url ? (
            <img
              src={employee.photo_url}
              alt={employee.name}
              className="h-24 w-24 rounded-full object-cover"
              style={{ border: "3px solid white" }}
            />
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full bg-card-surface"
              style={{ border: "3px solid white" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}

          {/* Company logo badge */}
          <div
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-card-surface"
            style={{ border: "2px solid #12151f" }}
          >
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-bold text-white">
                {businessInitials}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">{employee.name}</h1>

        {/* Title */}
        {employee.title && (
          <p className="mt-1 text-sm text-card-muted">{employee.title}</p>
        )}

        {/* Company name */}
        <p className="mt-0.5 text-xs text-card-muted opacity-70">
          {business.name}
        </p>
      </div>

      {/* Availability dot */}
      <div className="flex items-center justify-center gap-2">
        {available ? (
          <>
            <div className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-400">
              Available now
            </span>
          </>
        ) : (
          <>
            <div className="h-2.5 w-2.5 rounded-full bg-gray-500" />
            <span className="text-sm font-medium text-card-muted">
              After hours
            </span>
          </>
        )}
      </div>

      {/* Certification badges */}
      {employee.certifications && employee.certifications.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {employee.certifications.map((cert) => (
            <div
              key={cert}
              className="inline-flex items-center gap-1 rounded-full bg-card-surface px-3 py-1 text-xs text-card-muted"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Shield className="h-3 w-3" />
              <span>{cert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stat badges */}
      {employee.stats && employee.stats.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {employee.stats.map((stat) => (
            <div
              key={stat}
              className="inline-flex items-center gap-1 rounded-full bg-card-surface px-3 py-1 text-xs text-card-muted"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span>{stat}</span>
            </div>
          ))}
        </div>
      )}

      {/* Five-star review count */}
      {fiveStarCount != null && fiveStarCount > 0 && (
        <div className="flex items-center justify-center">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "rgba(250,204,21,0.12)", color: "#facc15" }}
          >
            <Star className="h-3 w-3" fill="#facc15" />
            {fiveStarCount} five-star review{fiveStarCount !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      {employee.phone && (
        <div className="space-y-3">
          <a
            href={`tel:${formattedPhone}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-card-call py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <Phone className="h-4 w-4" />
            Call {firstName} directly
          </a>

          <a
            href={`sms:${formattedPhone}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-card-text-bg py-3.5 text-sm font-bold text-card-text-fg transition-opacity hover:opacity-90"
          >
            <MessageSquare className="h-4 w-4" />
            Text {firstName} instead
          </a>

          <button
            onClick={handleSaveContact}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-card-save-bg py-3.5 text-sm font-bold text-card-save-fg transition-opacity hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Save to contacts
          </button>

          <a
            href={employee.calendar_url || `sms:${formattedPhone}?body=${encodeURIComponent("Hi, I'd like to schedule a consultation")}`}
            target={employee.calendar_url ? "_blank" : undefined}
            rel={employee.calendar_url ? "noopener noreferrer" : undefined}
            className="flex items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-bold text-card-muted transition-opacity hover:opacity-90"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "transparent" }}
          >
            <Calendar className="h-4 w-4" />
            Schedule a consultation
          </a>

          {reviewFunnelUrl && (
            <a
              href={`${reviewFunnelUrl}?rep=${employee.slug}`}
              className="flex items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ borderColor: "rgba(255,255,255,0.1)", background: "transparent", color: "#facc15" }}
            >
              <Star className="h-4 w-4" />
              Leave a review
            </a>
          )}
        </div>
      )}

      {/* Services grid */}
      {business.services.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {business.services.slice(0, 4).map((service) => {
            const Icon = SERVICE_ICONS[service] || Settings2;
            return (
              <div
                key={service}
                className="flex items-center gap-2 rounded-xl bg-card-surface px-3 py-3"
              >
                <Icon className="h-4 w-4 text-card-muted" />
                <span className="text-xs font-medium text-card-muted">
                  {service}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* About section */}
      {employee.bio && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-card-muted">
            About {firstName}
          </p>
          <div className="rounded-xl bg-card-surface p-4">
            <p className="text-sm italic text-card-muted">{employee.bio}</p>
          </div>
        </div>
      )}

      {/* handled. footer */}
      <div className="pt-4 text-center">
        <a href="/sites" className="inline-block">
          <img
            src="/logo-light.png"
            alt="handled."
            style={{ height: "16px", width: "auto", opacity: 0.5 }}
          />
        </a>
      </div>
    </div>
  );
}
