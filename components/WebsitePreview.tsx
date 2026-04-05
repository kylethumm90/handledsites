"use client";

import { Phone } from "lucide-react";

type Props = {
  businessName: string;
  trade: string;
  city: string;
  state: string;
  services: string[];
};

export default function WebsitePreview({
  businessName,
  trade,
  city,
  state,
  services,
}: Props) {
  return (
    <div className="relative mx-auto w-[280px]">
      <div
        className="mx-auto flex h-[580px] w-[280px] flex-col rounded-[2.5rem] border-4 overflow-hidden"
        style={{ borderColor: "#d1d5db", backgroundColor: "#ffffff" }}
      >
        {/* Notch */}
        <div className="mx-auto mt-2 mb-1 h-4 w-20 flex-shrink-0 rounded-full" style={{ backgroundColor: "#e5e7eb" }} />

        {/* Hero */}
        <div className="bg-gray-900 px-5 py-6 text-center">
          <p className="text-xs font-bold text-white">{businessName}</p>
          <p className="mt-1 text-[9px] text-gray-400">{trade} · {city}, {state}</p>
          <div className="mt-3 flex justify-center gap-2">
            <div className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-[8px] font-semibold text-gray-900">
              <Phone className="h-2.5 w-2.5" />
              Call now
            </div>
            <div className="rounded-md border border-gray-600 px-3 py-1.5 text-[8px] font-semibold text-white">
              Text us
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="flex-1 px-4 py-4">
          <p className="mb-2 text-center text-[7px] font-medium uppercase tracking-wider text-gray-400">
            Our Services
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {services.slice(0, 6).map((s) => (
              <div
                key={s}
                className="rounded-md bg-gray-50 px-2 py-1.5 text-center text-[7px] font-medium text-gray-600"
              >
                {s}
              </div>
            ))}
          </div>

          {/* Contact hint */}
          <div className="mt-4">
            <p className="mb-1.5 text-center text-[7px] font-medium uppercase tracking-wider text-gray-400">
              Get In Touch
            </p>
            <div className="space-y-1">
              <div className="rounded-md border border-gray-200 px-2 py-1.5 text-[7px] text-gray-400">
                Your name
              </div>
              <div className="rounded-md border border-gray-200 px-2 py-1.5 text-[7px] text-gray-400">
                Phone number
              </div>
              <div className="rounded-md bg-gray-900 px-2 py-1.5 text-center text-[7px] font-semibold text-white">
                Send message
              </div>
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="mx-auto mb-2 mt-2 h-1 w-16 flex-shrink-0 rounded-full bg-gray-300" />
      </div>
    </div>
  );
}
