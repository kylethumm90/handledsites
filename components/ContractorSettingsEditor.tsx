"use client";

import { useState, useRef } from "react";
import type { Business } from "@/lib/supabase";
import { Search, Check } from "lucide-react";

type Props = { business: Business };

type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
};

export default function ContractorSettingsEditor({ business }: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [googleReviewUrl, setGoogleReviewUrl] = useState(business.google_review_url ?? "");
  const [gtmId, setGtmId] = useState(business.gtm_id ?? "");
  const [metaPixelId, setMetaPixelId] = useState(business.meta_pixel_id ?? "");
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState(business.zapier_webhook_url ?? "");

  // Google Places search state
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const handlePlaceSearch = (value: string) => {
    setPlaceQuery(value);
    setShowDropdown(false);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length < 3) {
      setPlaceResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setPlaceResults(data.results || []);
        setShowDropdown(true);
      } catch {
        setPlaceResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const selectPlace = (place: PlaceResult) => {
    const url = `https://search.google.com/local/writereview?placeid=${place.placeId}`;
    setGoogleReviewUrl(url);
    setPlaceQuery("");
    setPlaceResults([]);
    setShowDropdown(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/contractor/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_review_url: googleReviewUrl || null,
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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-0.5 text-xs text-gray-400">
          Configure integrations and tracking for your business.
        </p>
      </div>

      {/* Google Reviews */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Google Reviews
        </h2>

        {/* Search for business */}
        <div className="relative mb-3">
          <label className={labelClass}>Find your business on Google</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={placeQuery}
              onChange={(e) => handlePlaceSearch(e.target.value)}
              placeholder="Search your business name..."
              className={`${inputClass} pl-9`}
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              </div>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && placeResults.length > 0 && (
            <div className="absolute left-0 right-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
              {placeResults.map((place) => (
                <button
                  key={place.placeId}
                  onClick={() => selectPlace(place)}
                  className="flex w-full flex-col px-3 py-2.5 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="text-sm font-medium text-gray-900">{place.name}</span>
                  <span className="text-xs text-gray-500">{place.address}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current URL display */}
        {googleReviewUrl ? (
          <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
              <span className="text-xs font-medium text-green-700">Review link connected</span>
            </div>
            <p className="mt-1 truncate text-xs font-mono text-green-600">
              {googleReviewUrl}
            </p>
            <button
              onClick={() => setGoogleReviewUrl("")}
              className="mt-1.5 text-[10px] text-green-600 underline hover:text-green-800"
            >
              Change
            </button>
          </div>
        ) : (
          <div>
            <label className={labelClass}>Or paste your review link directly</label>
            <input
              type="url"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://search.google.com/local/writereview?placeid=..."
              className={inputClass}
            />
          </div>
        )}

        <p className="mt-2 text-xs text-gray-400">
          Happy customers from your review funnel will be directed here to leave a Google review.
        </p>
      </div>

      {/* Integrations */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
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
  );
}
