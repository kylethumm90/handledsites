"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { TRADES, TRADE_SERVICES, Trade } from "@/lib/constants";
import PhonePreview from "@/components/PhonePreview";
import QuizPreview from "@/components/QuizPreview";
import WebsitePreview from "@/components/WebsitePreview";

const DEMO_SERVICES: Record<string, string[]> = {};
TRADES.forEach((t) => {
  DEMO_SERVICES[t] = TRADE_SERVICES[t as Trade]?.slice(0, 6) || [];
});

export default function PreviewGenerator() {
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("5551234567");
  const [trade, setTrade] = useState("Plumbing");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const city = "Your City";
  const state = "ST";
  const services = DEMO_SERVICES[trade] || [];
  const displayName = businessName || "Your Business";

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUrl(URL.createObjectURL(file));
  };

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Preview Generator</h1>
      <p className="mb-6 text-xs text-gray-400">Enter business details and screenshot the previews below.</p>

      {/* Inputs */}
      <div className="mb-8 flex flex-wrap items-end gap-3">
        <div className="w-48">
          <label className="mb-1 block text-xs font-medium text-gray-500">Business name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Flowright Plumbing"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>
        <div className="w-36">
          <label className="mb-1 block text-xs font-medium text-gray-500">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="5551234567"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>
        <div className="w-36">
          <label className="mb-1 block text-xs font-medium text-gray-500">Trade</label>
          <select
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          >
            {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Logo</label>
          {logoUrl ? (
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="" className="h-9 w-9 rounded-full object-cover border border-gray-200" />
              <button onClick={() => { setLogoUrl(null); if (fileRef.current) fileRef.current.value = ""; }} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <Upload className="h-3.5 w-3.5" /> Upload
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
        </div>
      </div>

      {/* Preview grid */}
      <div
        className="rounded-2xl p-10"
        style={{
          backgroundImage: "url(/preview-background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Row 1: Business card (large, left) + Quiz & Review (smaller, side by side, right) */}
        <div className="flex items-center justify-center gap-6">
          {/* Business Card — hero, larger */}
          <div className="flex flex-col items-center gap-1">
            <div style={{ transform: "scale(0.7)", transformOrigin: "top center", height: 406, width: 196 }}>
              <PhonePreview
                businessName={displayName}
                phone={phone}
                city={city}
                state={state}
                trade={trade}
                logoUrl={logoUrl}
              />
            </div>
            <span className="rounded-full bg-gray-900/80 px-4 py-1.5 text-lg font-semibold text-white backdrop-blur-sm">
              📇 Digital Business Card
            </span>
          </div>

          {/* Quiz + Review — smaller, side by side */}
          <div className="flex items-start gap-5">
            <div className="flex flex-col items-center gap-1">
              <div style={{ transform: "scale(0.45)", transformOrigin: "top center", height: 261, width: 126 }}>
                <QuizPreview
                  businessName={displayName}
                  trade={trade}
                  logoUrl={logoUrl}
                />
              </div>
              <span className="rounded-full bg-gray-900/80 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
                ⚡ Instant Quote Funnel
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div style={{ transform: "scale(0.45)", transformOrigin: "top center", height: 261, width: 126 }}>
                <ReviewPreview businessName={displayName} logoUrl={logoUrl} />
              </div>
              <span className="rounded-full bg-gray-900/80 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
                ⭐ Review Booster
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Website */}
        <div className="mt-6 flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <div style={{ transform: "scale(0.84)", transformOrigin: "top center", height: 294, width: 353 }}>
              <WebsitePreview
                businessName={displayName}
                trade={trade}
                city={city}
                state={state}
                services={services}
                logoUrl={logoUrl}
              />
            </div>
            <span className="rounded-full bg-gray-900/80 px-3 py-1 text-base font-medium text-white backdrop-blur-sm">
              🌐 Conversion Website
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewPreview({ businessName, logoUrl }: { businessName: string; logoUrl: string | null }) {
  return (
    <div className="relative mx-auto w-[280px]">
      <div
        className="mx-auto flex h-[580px] w-[280px] flex-col rounded-[2.5rem] border-4 overflow-hidden"
        style={{ borderColor: "#d1d5db", backgroundColor: "#f9fafb" }}
      >
        {/* Notch */}
        <div className="mx-auto mt-2 mb-1 h-4 w-20 flex-shrink-0 rounded-full" style={{ backgroundColor: "#e5e7eb" }} />

        {/* Logo / name */}
        <div className="flex items-center justify-center bg-white px-4 py-4">
          {logoUrl ? (
            <img src={logoUrl} alt={businessName} className="h-24 max-w-[180px] object-contain" />
          ) : (
            <span className="text-lg font-bold text-gray-900">{businessName}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col items-center px-6 pt-6">
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm w-full">
            <h3 className="mb-5 text-center text-base font-semibold text-gray-900">
              How was your experience<br />with {businessName}?
            </h3>
            <div className="flex justify-center gap-2.5">
              {["😍", "😊", "😐", "😕", "😤"].map((e) => (
                <div key={e} className="flex flex-col items-center gap-1">
                  <span className="text-3xl">{e}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-3 text-center text-[8px] text-gray-300">Powered by handled.</div>
        <div className="mx-auto mb-2 h-1 w-16 flex-shrink-0 rounded-full bg-gray-300" />
      </div>
    </div>
  );
}
