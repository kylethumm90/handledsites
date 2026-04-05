"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContractorSite } from "@/lib/supabase";
import { ExternalLink, Trash2, Copy, Check, Eye } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import ImageUpload from "./ImageUpload";

type Props = { site: ContractorSite };

export default function AdminSiteEditor({ site }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState("");

  const [coverImageUrl, setCoverImageUrl] = useState(site.cover_image_url);
  const [qrRedirectUrl, setQrRedirectUrl] = useState(site.qr_redirect_url ?? "");

  // Site-specific settings
  const [bannerMessage, setBannerMessage] = useState(site.banner_message);
  const [hoursStart, setHoursStart] = useState(site.hours_start);
  const [hoursEnd, setHoursEnd] = useState(site.hours_end);
  const [reviewCount, setReviewCount] = useState(site.review_count ?? "");
  const [avgRating, setAvgRating] = useState(site.avg_rating ?? "");
  const [badgeLicensed, setBadgeLicensed] = useState(site.badge_licensed);
  const [badgeFreeEstimates, setBadgeFreeEstimates] = useState(site.badge_free_estimates);
  const [badgeEmergency, setBadgeEmergency] = useState(site.badge_emergency);
  const [badgeFamilyOwned, setBadgeFamilyOwned] = useState(site.badge_family_owned);

  const formatPhoneDisplay = (p: string) => {
    if (p.length === 10) return `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}`;
    return p;
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/sites/${site.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

  const handleImpersonate = async () => {
    setImpersonating(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id }),
      });
      if (!res.ok) throw new Error("Failed to impersonate");
      window.open("/contractor/dashboard", "_blank");
    } catch {
      setMessage("Error switching to contractor view");
    } finally {
      setImpersonating(false);
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
            {site.business_name}
          </h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Slug: /{site.slug} &middot; Created{" "}
            {new Date(site.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleImpersonate}
            disabled={impersonating}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Eye className="h-3 w-3" />
            {impersonating ? "Opening..." : "View as user"}
          </button>
          <a
            href={site.type === "quiz_funnel" ? `/q/${site.slug}` : site.type === "review_funnel" ? `/r/${site.slug}` : `/${site.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            View site
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Business info — read-only summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Business info
            </h2>
            <Link
              href={`/admin/businesses/${site.business_id}`}
              className="flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
            >
              Edit business
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {site.logo_url && (
              <div className="flex items-center gap-3">
                <img
                  src={site.logo_url}
                  alt={site.business_name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Business</p>
                <p className="text-sm text-gray-900">{site.business_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Owner</p>
                <p className="text-sm text-gray-900">{site.owner_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Phone</p>
                <p className="text-sm text-gray-900">{formatPhoneDisplay(site.phone)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Email</p>
                <p className="text-sm text-gray-900">{site.email || <span className="text-gray-300">&mdash;</span>}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Trade</p>
                <p className="text-sm text-gray-900">{site.trade}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Location</p>
                <p className="text-sm text-gray-900">{site.city}, {site.state}</p>
              </div>
            </div>
            {site.services.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">Services</p>
                <div className="flex flex-wrap gap-1">
                  {site.services.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(site.gtm_id || site.meta_pixel_id || site.zapier_webhook_url) && (
              <div className="border-t border-gray-100 pt-2">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">Tracking</p>
                <p className="text-xs text-gray-500">
                  {[
                    site.gtm_id && "GTM",
                    site.meta_pixel_id && "Meta Pixel",
                    site.zapier_webhook_url && "Zapier",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Site settings — editable */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Site settings
          </h2>
          <div className="space-y-4">
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
              {saving ? "Saving..." : "Save site settings"}
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
