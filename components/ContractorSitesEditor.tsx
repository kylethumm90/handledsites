"use client";

import { useState } from "react";
import type { ContractorSite } from "@/lib/supabase";
import { ExternalLink, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import PhonePreview from "./PhonePreview";
import QuizPreview from "./QuizPreview";

type Props = { sites: ContractorSite[] };

function siteUrl(site: ContractorSite): string {
  return site.type === "quiz_funnel" ? `/q/${site.slug}` : `/${site.slug}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}

function QuizFunnelCard({ site }: { site: ContractorSite }) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://handledsites.com";
  const fullUrl = `${baseUrl}${siteUrl(site)}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {/* Preview */}
        <div className="pointer-events-none flex-shrink-0">
          <div style={{ transform: "scale(0.55)", transformOrigin: "top center", height: "320px", width: "154px" }}>
            <QuizPreview
              businessName={site.business_name}
              trade={site.trade}
              logoUrl={site.logo_url}
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            Quiz Funnel
          </span>

          <div className="mt-3 flex items-center gap-2">
            <span className="truncate rounded-md bg-gray-50 px-2 py-1 text-xs font-mono text-gray-600">
              {fullUrl}
            </span>
            <CopyButton text={fullUrl} />
          </div>

          <div className="mt-3">
            <a
              href={siteUrl(site)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessCardSiteCard({ site }: { site: ContractorSite }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [bannerMessage, setBannerMessage] = useState(site.banner_message);
  const [hoursStart, setHoursStart] = useState(site.hours_start);
  const [hoursEnd, setHoursEnd] = useState(site.hours_end);
  const [badgeLicensed, setBadgeLicensed] = useState(site.badge_licensed);
  const [badgeFreeEstimates, setBadgeFreeEstimates] = useState(site.badge_free_estimates);
  const [badgeEmergency, setBadgeEmergency] = useState(site.badge_emergency);
  const [badgeFamilyOwned, setBadgeFamilyOwned] = useState(site.badge_family_owned);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://handledsites.com";
  const fullUrl = `${baseUrl}${siteUrl(site)}`;
  const qrUrl = `${baseUrl}/qr/${site.slug}`;

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/contractor/sites/${site.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner_message: bannerMessage,
          hours_start: hoursStart,
          hours_end: hoursEnd,
          badge_licensed: badgeLicensed,
          badge_free_estimates: badgeFreeEstimates,
          badge_emergency: badgeEmergency,
          badge_family_owned: badgeFamilyOwned,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Saved!");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none";
  const labelClass = "mb-1 block text-xs font-medium text-gray-500";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      {/* Header: type badge + URL + actions */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
            Business Card
          </span>
          <div className="mt-2 flex items-center gap-2">
            <span className="truncate rounded-md bg-gray-50 px-2 py-1 text-xs font-mono text-gray-600">
              {fullUrl}
            </span>
            <CopyButton text={fullUrl} />
          </div>
        </div>
        <a
          href={siteUrl(site)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          View
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto]">
        {/* Preview */}
        <div className="flex justify-center pointer-events-none">
          <div style={{ transform: "scale(0.65)", transformOrigin: "top center", marginBottom: "-200px" }}>
            <PhonePreview
              businessName={site.business_name}
              phone={site.phone}
              city={site.city}
              state={site.state}
              trade={site.trade}
              logoUrl={site.logo_url}
            />
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Banner message</label>
            <input
              type="text"
              value={bannerMessage}
              onChange={(e) => setBannerMessage(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Hours start (ET)</label>
              <select
                value={hoursStart}
                onChange={(e) => setHoursStart(Number(e.target.value))}
                className={inputClass}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Hours end (ET)</label>
              <select
                value={hoursEnd}
                onChange={(e) => setHoursEnd(Number(e.target.value))}
                className={inputClass}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Trust badges</label>
            <div className="mt-1 space-y-2">
              {[
                { label: "Licensed & Insured", value: badgeLicensed, set: setBadgeLicensed },
                { label: "Free estimates", value: badgeFreeEstimates, set: setBadgeFreeEstimates },
                { label: "24/7 emergency", value: badgeEmergency, set: setBadgeEmergency },
                { label: "Family owned", value: badgeFamilyOwned, set: setBadgeFamilyOwned },
              ].map((badge) => (
                <label
                  key={badge.label}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={badge.value}
                    onChange={(e) => badge.set(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{badge.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {message && (
              <span
                className={`text-sm ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}
              >
                {message}
              </span>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-lg border border-gray-100 bg-white p-3">
            <QRCodeSVG value={qrUrl} size={120} level="M" />
          </div>
          <CopyButton text={qrUrl} />
          <p className="text-center text-[10px] text-gray-400 max-w-[140px]">
            Print this on flyers, truck decals, or business cards
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ContractorSitesEditor({ sites }: Props) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Your Sites</h1>
        <p className="mt-0.5 text-xs text-gray-400">
          Manage settings for each of your sites.
        </p>
      </div>

      {sites.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-400">No sites yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sites.map((site) =>
            site.type === "business_card" ? (
              <BusinessCardSiteCard key={site.id} site={site} />
            ) : (
              <QuizFunnelCard key={site.id} site={site} />
            )
          )}
        </div>
      )}
    </div>
  );
}
