"use client";

import { Phone } from "lucide-react";

type Props = {
  businessName: string;
  trade: string;
  city: string;
  state: string;
  services: string[];
  logoUrl?: string | null;
};

export default function WebsitePreview({
  businessName,
  trade,
  city,
  state,
  services,
  logoUrl,
}: Props) {
  const initials = businessName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="w-[420px]">
      {/* Browser chrome */}
      <div className="rounded-t-xl border border-b-0 border-gray-200 bg-gray-100 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 rounded-md bg-white px-3 py-1 text-[9px] text-gray-400 font-mono truncate">
            handledsites.com/s/{businessName.toLowerCase().replace(/\s+/g, "-")}
          </div>
        </div>
      </div>

      {/* Browser viewport */}
      <div className="overflow-hidden rounded-b-xl border border-gray-200 bg-white" style={{ height: 280 }}>
        {/* Nav */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
          <div className="flex items-center gap-1.5">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-10 w-10 rounded object-cover" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-[7px] font-bold text-white">{initials}</div>
            )}
            <span className="text-[9px] font-bold text-gray-900">{businessName}</span>
          </div>
          <div className="flex items-center gap-1 rounded bg-orange-500 px-2 py-1 text-[7px] font-bold text-white">
            <Phone className="h-2 w-2" />
            Call
          </div>
        </div>

        {/* Hero */}
        <div className="bg-[#0C1A2E] px-4 py-5 text-center">
          <div className="mb-1.5 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[7px] text-white/80">
            <div className="h-1 w-1 rounded-full bg-green-400" />
            Available now
          </div>
          <div className="text-[11px] font-extrabold text-white leading-tight">{trade} Services in {city}, {state}</div>
          <div className="mt-1 text-[7px] text-white/60">Licensed & insured</div>
          <div className="mt-2 flex justify-center gap-1.5">
            <div className="rounded bg-orange-500 px-2.5 py-1 text-[7px] font-bold text-white">Call Now</div>
            <div className="rounded border border-white/25 px-2 py-1 text-[7px] text-white/80">Get a Quote</div>
          </div>
        </div>

        {/* Proof bar */}
        <div className="flex items-center justify-center gap-4 bg-blue-600 px-3 py-1.5">
          <div className="text-center">
            <div className="text-[9px] font-extrabold text-white">4.9</div>
            <div className="text-[6px] text-white/70">rating</div>
          </div>
          <div className="h-3 w-px bg-white/25" />
          <div className="text-[7px] text-yellow-300">★★★★★</div>
          <div className="h-3 w-px bg-white/25" />
          <div className="text-center">
            <div className="text-[9px] font-extrabold text-white">24/7</div>
            <div className="text-[6px] text-white/70">emergency</div>
          </div>
        </div>

        {/* Services */}
        <div className="px-4 py-3">
          <div className="mb-1.5 text-[7px] font-bold uppercase tracking-wider text-blue-600">What we do</div>
          <div className="text-[9px] font-extrabold text-gray-900 mb-2">{trade} services for every situation</div>
          <div className="grid grid-cols-3 gap-1">
            {services.slice(0, 6).filter((s) => s !== "Free Estimates").map((s) => (
              <div key={s} className="rounded border border-gray-100 bg-gray-50 px-1.5 py-1 text-center text-[6px] font-medium text-gray-600 truncate">
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
