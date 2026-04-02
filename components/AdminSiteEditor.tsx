"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContractorSite } from "@/lib/supabase";
import { TRADES, TRADE_SERVICES, US_STATES, Trade } from "@/lib/constants";
import { ExternalLink, Trash2, Copy, Check } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import ImageUpload from "./ImageUpload";

type Props = { site: ContractorSite };

export default function AdminSiteEditor({ site }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState("");

  const [logoUrl, setLogoUrl] = useState(site.logo_url);
  const [coverImageUrl, setCoverImageUrl] = useState(site.cover_image_url);
  const [qrRedirectUrl, setQrRedirectUrl] = useState(site.qr_redirect_url ?? "");

  // Contractor info (was read-only, now editable)
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
  const [reviewCount, setReviewCount] = useState(site.review_count ?? "");
  const [avgRating, setAvgRating] = useState(site.avg_rating ?? "");
  const [badgeLicensed, setBadgeLicensed] = useState(site.badge_licensed);
  const [badgeFreeEstimates, setBadgeFreeEstimates] = useState(site.badge_free_estimates);
  const [badgeEmergency, setBadgeEmergency] = useState(site.badge_emergency);
  const [badgeFamilyOwned, setBadgeFamilyOwned] = useState(site.badge_family_owned);

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
      const res = await fetch(`/api/admin/sites/${site.id}`, {
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
          cover_image_url: coverImageUrl,
          banner_message: bannerMessage,
          hours_start: hoursStart,
          hours_end: hoursEnd,
          review_count: reviewCount === "" ? null : Number(reviewCount),
          avg_rating: avgRating === "" ? null : Number(avgRating),
          badge_licensed: badgeLicensed,
          badge_free_estimates: badgeFreeEstimates,
          badge_emergency: badgeEmergency,
          badge_family_owned: badgeFamilyOwned,
          qr_redirect_url: qrRedirectUrl || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Saved successfully");
      router.refresh();
    } catch {
      setMessage("Error saving changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/sites/${site.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/sites");
      router.refresh();
    } catch {
      setMessage("Error deleting site");
      setDeleting(false);
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
          <div className="flex items-center gap-2">
            <Link
              href="/admin/sites"
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Sites
            </Link>
            <span className="text-sm text-gray-300">/</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold text-gray-900">
            {businessName || site.business_name}
          </h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Slug: /{site.slug} &middot; Created{" "}
            {new Date(site.created_at).toLocaleDateString()}
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
            Contractor info
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <ImageUpload
                currentUrl={logoUrl}
                storagePath={`logos/${site.slug}`}
                onUploaded={setLogoUrl}
                shape="circle"
                label="Profile picture"
                useServerUpload
              />
              <ImageUpload
                currentUrl={coverImageUrl}
                storagePath={`covers/${site.slug}`}
                onUploaded={setCoverImageUrl}
                shape="rectangle"
                height="h-20"
                width="w-40"
                label="Cover photo"
                useServerUpload
              />
            </div>
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
                placeholder="Optional"
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

            {/* Services */}
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
            Settings
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Review count</label>
                <input
                  type="number"
                  value={reviewCount}
                  onChange={(e) => setReviewCount(e.target.value)}
                  placeholder="e.g. 47"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Avg rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={avgRating}
                  onChange={(e) => setAvgRating(e.target.value)}
                  placeholder="e.g. 4.8"
                  className={inputClass}
                />
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
              {saving ? "Saving..." : "Save all changes"}
            </button>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <AdminQRSection
        slug={site.slug}
        qrRedirectUrl={qrRedirectUrl}
        onRedirectChange={setQrRedirectUrl}
      />

      {/* Delete zone */}
      <div className="mt-8 rounded-xl border border-red-100 bg-red-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-red-900">
              Delete this site
            </h3>
            <p className="mt-1 text-xs text-red-700">
              This will permanently remove the contractor&apos;s card and cannot
              be undone.
            </p>
          </div>
          {showDeleteConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                {deleting ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminQRSection({
  slug,
  qrRedirectUrl,
  onRedirectChange,
}: {
  slug: string;
  qrRedirectUrl: string;
  onRedirectChange: (url: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://handledsites.com";
  const qrUrl = `${baseUrl}/qr/${slug}`;
  const currentDestination = qrRedirectUrl || `${baseUrl}/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">QR Code</h2>
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0 rounded-lg border border-gray-100 bg-white p-3">
          <QRCodeSVG value={qrUrl} size={140} level="M" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-xs text-gray-500">
              This QR code is permanent — it always encodes the same URL.
              Change the redirect destination below.
            </p>
            <div className="mt-2 flex items-center gap-2">
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
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Redirect destination
            </label>
            <input
              type="url"
              value={qrRedirectUrl}
              onChange={(e) => onRedirectChange(e.target.value)}
              placeholder={currentDestination}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              Leave empty to redirect to their handled.sites card
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
