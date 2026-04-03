"use client";

import { useState } from "react";
import type { ContractorSite } from "@/lib/supabase";
import { TRADES, TRADE_SERVICES, US_STATES, Trade } from "@/lib/constants";
import { ExternalLink, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import ImageUpload from "./ImageUpload";

type Props = { site: ContractorSite };

export default function ContractorSiteEditor({ site }: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [logoUrl, setLogoUrl] = useState(site.logo_url);

  // Contractor info
  const [businessName, setBusinessName] = useState(site.business_name);
  const [ownerName, setOwnerName] = useState(site.owner_name);
  const [phone, setPhone] = useState(site.phone);
  const [email, setEmail] = useState(site.email ?? "");
  const [city, setCity] = useState(site.city);
  const [state, setState] = useState(site.state);
  const [trade, setTrade] = useState(site.trade);
  const [services, setServices] = useState<string[]>(site.services);

  // Settings
  const [bannerMessage, setBannerMessage] = useState(site.banner_message);
  const [hoursStart, setHoursStart] = useState(site.hours_start);
  const [hoursEnd, setHoursEnd] = useState(site.hours_end);
  const [badgeLicensed, setBadgeLicensed] = useState(site.badge_licensed);
  const [badgeFreeEstimates, setBadgeFreeEstimates] = useState(site.badge_free_estimates);
  const [badgeEmergency, setBadgeEmergency] = useState(site.badge_emergency);
  const [badgeFamilyOwned, setBadgeFamilyOwned] = useState(site.badge_family_owned);

  // Integrations
  const [gtmId, setGtmId] = useState(site.gtm_id ?? "");
  const [metaPixelId, setMetaPixelId] = useState(site.meta_pixel_id ?? "");
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState(site.zapier_webhook_url ?? "");

  const availableServices = trade
    ? TRADE_SERVICES[trade as Trade] || []
    : [];

  const handleTradeChange = (newTrade: string) => {
    setTrade(newTrade);
    setServices([]);
  };

  const handleServiceToggle = (service: string) => {
    setServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const formatPhoneDisplay = (p: string) => {
    if (p.length === 10) return `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}`;
    return p;
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value.replace(/\D/g, "").slice(0, 10));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/contractor/sites/${site.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          owner_name: ownerName,
          phone,
          email: email || null,
          city,
          state,
          trade,
          services,
          logo_url: logoUrl,
          banner_message: bannerMessage,
          hours_start: hoursStart,
          hours_end: hoursEnd,
          badge_licensed: badgeLicensed,
          badge_free_estimates: badgeFreeEstimates,
          badge_emergency: badgeEmergency,
          badge_family_owned: badgeFamilyOwned,
          gtm_id: gtmId || null,
          meta_pixel_id: metaPixelId || null,
          zapier_webhook_url: zapierWebhookUrl || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Changes saved!");
    } catch {
      setMessage("Error saving changes");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none";
  const labelClass = "mb-1 block text-xs font-medium text-gray-500";

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Edit Your Business Card
          </h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Changes go live immediately after saving.
          </p>
        </div>
        <a
          href={`/${site.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          View card
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contractor info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Business info
          </h2>
          <div className="space-y-4">
            <ImageUpload
              currentUrl={logoUrl}
              storagePath={`logos/${site.slug}`}
              onUploaded={setLogoUrl}
              shape="circle"
              label="Profile picture"
            />
            <div>
              <label className={labelClass}>Business name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Owner name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                value={formatPhoneDisplay(phone)}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClass}
                >
                  {US_STATES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Trade</label>
              <select
                value={trade}
                onChange={(e) => handleTradeChange(e.target.value)}
                className={inputClass}
              >
                {TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {availableServices.length > 0 && (
              <div>
                <label className={labelClass}>Services</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {availableServices.map((service) => (
                    <label
                      key={service}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                        services.includes(service)
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={services.includes(service)}
                        onChange={() => handleServiceToggle(service)}
                        className="sr-only"
                      />
                      {service}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Card settings
          </h2>
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

            {message && (
              <p
                className={`text-sm ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}
              >
                {message}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <QRSection slug={site.slug} />

      {/* Integrations */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Integrations &amp; tracking
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Google Tag Manager ID</label>
            <input
              type="text"
              value={gtmId}
              onChange={(e) => setGtmId(e.target.value)}
              placeholder="GTM-XXXXXXX"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Meta Pixel ID</label>
            <input
              type="text"
              value={metaPixelId}
              onChange={(e) => setMetaPixelId(e.target.value)}
              placeholder="123456789012345"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Zapier webhook URL</label>
            <input
              type="url"
              value={zapierWebhookUrl}
              onChange={(e) => setZapierWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              Quiz lead data will be POSTed here on each submission
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QRSection({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://handledsites.com";
  const qrUrl = `${baseUrl}/qr/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">
        Your QR Code
      </h2>
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0 rounded-lg border border-gray-100 bg-white p-3">
          <QRCodeSVG value={qrUrl} size={140} level="M" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500">
            This QR code is permanent. Print it on flyers, truck decals, or
            business cards — you can change where it goes later.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="truncate rounded-md bg-gray-50 px-2 py-1 text-xs font-mono text-gray-700">
              {qrUrl}
            </span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
