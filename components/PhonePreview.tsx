"use client";

import { Phone, Shield } from "lucide-react";
import { TRADE_IMAGES } from "@/lib/constants";

type Props = {
  businessName: string;
  phone: string;
  city: string;
  state: string;
  trade: string;
  logoUrl?: string | null;
};

export default function PhonePreview({
  businessName,
  phone,
  city,
  state,
  trade,
  logoUrl,
}: Props) {
  const initials = (businessName || "YB")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const formatPhone = (p: string) => {
    const digits = p.replace(/\D/g, "");
    if (digits.length >= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    return p || "(555) 123-4567";
  };

  return (
    <div className="relative mx-auto w-[280px]">
      {/* Phone frame */}
      <div
        className="mx-auto flex h-[580px] w-[280px] flex-col rounded-[2.5rem] border-4 overflow-hidden"
        style={{
          borderColor: "#1e2433",
          backgroundColor: "#161926",
          boxShadow: "0 32px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.12)",
        }}
      >
        {/* Notch */}
        <div className="mx-auto mt-2 mb-1 h-4 w-20 flex-shrink-0 rounded-full" style={{ backgroundColor: "#1e2433", position: "relative", zIndex: 10 }} />

        {/* Cover photo */}
        <div className="relative h-[120px] w-full flex-shrink-0 overflow-hidden">
          <img
            src={TRADE_IMAGES[trade] || TRADE_IMAGES["default"]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.55))" }}
          />
        </div>

        {/* Avatar — overlapping cover by 50% */}
        <div className="relative z-10 flex justify-center" style={{ marginTop: "-32px" }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-32 w-32 rounded-full object-cover"
              style={{ border: "2px solid white" }}
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-card-surface"
              style={{ border: "2px solid white" }}
            >
              <span className="text-2xl font-bold text-white">
                {initials || "YB"}
              </span>
            </div>
          )}
        </div>

        {/* Card content */}
        <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-4 text-center">

          {/* Business name */}
          <div>
            <h3 className="text-lg font-bold text-white">
              {businessName || "Your Business"}
            </h3>
            <p className="text-sm text-card-muted">
              {city || "Your City"}, {state || "ST"}
            </p>
          </div>

          {/* Badge pill */}
          <div
            className="inline-flex items-center gap-1.5"
            style={{
              background: "#1e2235",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: "12px",
              padding: "4px 10px",
              borderRadius: "20px",
            }}
          >
            <Shield className="h-3 w-3 text-card-muted" />
            <span className="text-card-muted">Licensed & Insured</span>
          </div>

          {/* Available dot */}
          <div className="flex items-center justify-center gap-1.5">
            <div className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-green-500" />
            <span className="text-sm text-green-400">Available now</span>
          </div>

          {/* CTA buttons */}
          <div className="w-full space-y-2 px-2">
            <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-card-call py-3 text-sm font-semibold text-white">
              <Phone className="h-4 w-4" />
              {formatPhone(phone)}
            </div>
            <div className="w-full rounded-lg bg-card-text-bg py-3 text-sm font-semibold text-card-text-fg">
              Text us instead
            </div>
            <div className="w-full rounded-lg bg-card-save-bg py-3 text-sm font-semibold text-card-save-fg">
              Save to contacts
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="mx-auto mb-2 mt-4 h-1 w-16 flex-shrink-0 rounded-full bg-gray-600" />
      </div>
    </div>
  );
}
