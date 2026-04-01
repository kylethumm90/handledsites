"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContractorSite } from "@/lib/supabase";
import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";

type Props = { site: ContractorSite };

export default function AdminSiteEditor({ site }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState("");

  const [bannerMessage, setBannerMessage] = useState(site.banner_message);
  const [hoursStart, setHoursStart] = useState(site.hours_start);
  const [hoursEnd, setHoursEnd] = useState(site.hours_end);
  const [reviewCount, setReviewCount] = useState(site.review_count ?? "");
  const [avgRating, setAvgRating] = useState(site.avg_rating ?? "");
  const [badgeLicensed, setBadgeLicensed] = useState(site.badge_licensed);
  const [badgeFreeEstimates, setBadgeFreeEstimates] = useState(site.badge_free_estimates);
  const [badgeEmergency, setBadgeEmergency] = useState(site.badge_emergency);
  const [badgeFamilyOwned, setBadgeFamilyOwned] = useState(site.badge_family_owned);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/sites/${site.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner_message: bannerMessage,
          hours_start: hoursStart,
          hours_end: hoursEnd,
          review_count: reviewCount === "" ? null : Number(reviewCount),
          avg_rating: avgRating === "" ? null : Number(avgRating),
          badge_licensed: badgeLicensed,
          badge_free_estimates: badgeFreeEstimates,
          badge_emergency: badgeEmergency,
          badge_family_owned: badgeFamilyOwned,
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
        {/* Read-only info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Contractor info
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Owner</dt>
              <dd className="text-gray-900">{site.owner_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Phone</dt>
              <dd className="text-gray-900">
                ({site.phone.slice(0, 3)}) {site.phone.slice(3, 6)}-
                {site.phone.slice(6)}
              </dd>
            </div>
            {site.email && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900">{site.email}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Location</dt>
              <dd className="text-gray-900">
                {site.city}, {site.state}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Trade</dt>
              <dd className="text-gray-900">{site.trade}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Slug</dt>
              <dd className="font-mono text-xs text-gray-900">/{site.slug}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Services</dt>
              <dd className="text-right text-gray-900">
                {site.services.join(", ")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Created</dt>
              <dd className="text-gray-900">
                {new Date(site.created_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Editable fields */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Edit settings
          </h2>
          <div className="space-y-4">
            {/* Banner message */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Banner message
              </label>
              <input
                type="text"
                value={bannerMessage}
                onChange={(e) => setBannerMessage(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              />
            </div>

            {/* Business hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Hours start (ET)
                </label>
                <select
                  value={hoursStart}
                  onChange={(e) => setHoursStart(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Hours end (ET)
                </label>
                <select
                  value={hoursEnd}
                  onChange={(e) => setHoursEnd(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Google reviews */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Review count
                </label>
                <input
                  type="number"
                  value={reviewCount}
                  onChange={(e) => setReviewCount(e.target.value)}
                  placeholder="e.g. 47"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Avg rating
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={avgRating}
                  onChange={(e) => setAvgRating(e.target.value)}
                  placeholder="e.g. 4.8"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Badges */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500">
                Trust badges
              </label>
              <div className="space-y-2">
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
