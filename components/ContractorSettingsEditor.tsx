"use client";

import { useState } from "react";
import type { Business } from "@/lib/supabase";

type Props = { business: Business };

export default function ContractorSettingsEditor({ business }: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [gtmId, setGtmId] = useState(business.gtm_id ?? "");
  const [metaPixelId, setMetaPixelId] = useState(business.meta_pixel_id ?? "");
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState(business.zapier_webhook_url ?? "");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/contractor/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
