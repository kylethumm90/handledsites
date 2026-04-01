"use client";

import { Phone } from "lucide-react";
import { TRADE_ICONS } from "@/lib/icons";

type Props = {
  businessName: string;
  phone: string;
  city: string;
  state: string;
  trade: string;
};

export default function PhonePreview({
  businessName,
  phone,
  city,
  state,
  trade,
}: Props) {
  const initials = (businessName || "YB")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const TradeIcon = TRADE_ICONS[trade] || TRADE_ICONS["Other"];

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
      <div className="rounded-[2.5rem] border-4 border-gray-700 bg-card-bg p-4 shadow-2xl">
        {/* Notch */}
        <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-gray-800" />

        {/* Card content */}
        <div className="space-y-4 text-center">
          {/* Avatar */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-card-surface">
            <span className="text-lg font-bold text-white">
              {initials || "YB"}
            </span>
          </div>

          {/* Business name */}
          <div>
            <h3 className="text-sm font-bold text-white">
              {businessName || "Your Business"}
            </h3>
            <p className="text-xs text-card-muted">
              {city || "Your City"}, {state || "ST"}
            </p>
          </div>

          {/* Trade badge */}
          <div className="flex items-center justify-center gap-1">
            <TradeIcon className="h-3 w-3 text-card-muted" />
            <span className="text-xs text-card-muted">
              {trade || "Your Trade"}
            </span>
          </div>

          {/* Available dot */}
          <div className="flex items-center justify-center gap-1.5">
            <div className="h-2 w-2 animate-pulse-dot rounded-full bg-green-500" />
            <span className="text-xs text-green-400">Available now</span>
          </div>

          {/* CTA buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-card-call py-2 text-xs font-semibold text-white">
              <Phone className="h-3 w-3" />
              {formatPhone(phone)}
            </div>
            <div className="rounded-lg bg-card-text-bg py-2 text-xs font-semibold text-card-text-fg">
              Text us instead
            </div>
            <div className="rounded-lg bg-card-save-bg py-2 text-xs font-semibold text-card-save-fg">
              Save to contacts
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gray-600" />
      </div>
    </div>
  );
}
