"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Business } from "@/lib/supabase";
import { TRADES, TRADE_SERVICES, US_STATES, Trade } from "@/lib/constants";
import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import ImageUpload from "./ImageUpload";

type SiteInfo = {
  id: string;
  type: "business_card" | "quiz_funnel" | "review_funnel" | "website";
  slug: string;
  is_active: boolean;
};

type Props = {
  business: Business;
  sites: SiteInfo[];
};

export default function AdminBusinessEditor({ business, sites }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [logoUrl, setLogoUrl] = useState(business.logo_url);
  const [name, setName] = useState(business.name);
  const [ownerName, setOwnerName] = useState(business.owner_name);
  const [phone, setPhone] = useState(business.phone);
  const [email, setEmail] = useState(business.email ?? "");
  const [city, setCity] = useState(business.city);
  const [state, setState] = useState(business.state);
  const [trade, setTrade] = useState(business.trade);
  const [services, setServices] = useState<string[]>(business.services);

  // Integrations
  const [gtmId, setGtmId] = useState(business.gtm_id ?? "");
  const [metaPixelId, setMetaPixelId] = useState(business.meta_pixel_id ?? "");
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState(business.zapier_webhook_url ?? "");

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
      const res = await fetch(`/api/admin/businesses/${business.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          owner_name: ownerName,
          phone,
          email: email || null,
          city,
          state,
          trade,
          services,
          logo_url: logoUrl,
          gtm_id: gtmId || null,
          meta_pixel_id: metaPixelId || null,
          zapier_webhook_url: zapierWebhookUrl || null,
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

  const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none";
  const labelClass = "mb-1 block text-xs font-medium text-gray-500";

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/businesses"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Businesses
          </Link>
          <span className="text-sm text-gray-300">/</span>
        </div>
        <h1 className="mt-1 text-xl font-semibold text-gray-900">
          {name || business.name}
        </h1>
        <p className="mt-0.5 text-xs text-gray-400">
          Created {new Date(business.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Business info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Business info
          </h2>
          <div className="space-y-4">
            <ImageUpload
              currentUrl={logoUrl}
              storagePath={`logos/${business.id}`}
              onUploaded={setLogoUrl}
              shape="circle"
              label="Logo"
              useServerUpload
            />
            <div>
              <label className={labelClass}>Business name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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

        {/* Integrations & tracking */}
        <div className="space-y-8">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
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

          {/* Linked sites */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              Linked sites
            </h2>
            {sites.length === 0 ? (
              <p className="text-sm text-gray-400">No sites linked to this business</p>
            ) : (
              <div className="space-y-2">
                {sites.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          s.type === "business_card" ? "bg-gray-100 text-gray-600"
                            : s.type === "quiz_funnel" ? "bg-amber-50 text-amber-700"
                            : s.type === "website" ? "bg-blue-50 text-blue-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {s.type === "business_card" ? "Card" : s.type === "quiz_funnel" ? "Quiz" : s.type === "website" ? "Website" : "Review"}
                      </span>
                      <span className="text-sm text-gray-700">/{s.slug}</span>
                    </div>
                    <Link
                      href={`/admin/sites/${s.id}`}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Edit site
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="mt-8">
        {message && (
          <p
            className={`mb-3 text-sm ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}
          >
            {message}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save all changes"}
        </button>
      </div>

      {/* Delete zone */}
      <div className="mt-8 rounded-xl border border-red-100 bg-red-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-red-900">Delete this business</h3>
            <p className="mt-1 text-xs text-red-700">
              This will permanently delete the business and all linked sites, leads, and data. This cannot be undone.
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
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const res = await fetch(`/api/admin/businesses/${business.id}`, { method: "DELETE" });
                    if (!res.ok) throw new Error("Delete failed");
                    router.push("/admin/businesses");
                    router.refresh();
                  } catch {
                    setMessage("Error deleting business");
                    setDeleting(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                disabled={deleting}
                className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                {deleting ? "Deleting..." : "Yes, delete everything"}
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
