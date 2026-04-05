"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { generateUniqueSlug, checkDuplicateContact } from "@/lib/slug";
import { TRADES, TRADE_SERVICES, US_STATES, Trade } from "@/lib/constants";
import PhonePreview from "./PhonePreview";
import SuccessState from "./SuccessState";

type FormData = {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  trade: string;
  services: string[];
  badgeLicensed: boolean;
  badgeFreeEstimates: boolean;
  badgeEmergency: boolean;
  badgeFamilyOwned: boolean;
};

const initialForm: FormData = {
  businessName: "",
  ownerName: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  trade: "",
  services: [],
  badgeLicensed: false,
  badgeFreeEstimates: false,
  badgeEmergency: false,
  badgeFamilyOwned: false,
};

const TRUST_BADGES = [
  { key: "badgeLicensed" as const, label: "Licensed & Insured" },
  { key: "badgeFreeEstimates" as const, label: "Free estimates" },
  { key: "badgeEmergency" as const, label: "24/7 emergency service" },
  { key: "badgeFamilyOwned" as const, label: "Family owned & operated" },
];

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function SignupForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [step, setStep] = useState(1);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  const phoneDigits = form.phone.replace(/\D/g, "");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2MB.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError("");
  };

  const availableServices = form.trade
    ? TRADE_SERVICES[form.trade as Trade] || []
    : [];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setForm((f) => ({ ...f, phone: formatPhoneInput(value) }));
    } else if (name === "trade") {
      setForm((f) => ({ ...f, trade: value, services: [] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleServiceToggle = (service: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(service)
        ? f.services.filter((s) => s !== service)
        : [...f.services, service],
    }));
  };

  const handleNextStep = () => {
    setError("");
    if (!form.businessName || !form.ownerName || !form.city || !form.state) {
      setError("Please fill in all required fields.");
      return;
    }
    if (phoneDigits.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (honeypot) return;

    if (!form.trade) {
      setError("Please select your trade.");
      return;
    }

    if (form.services.length === 0) {
      setError("Please select at least one service.");
      return;
    }

    setSubmitting(true);

    try {
      const duplicateError = await checkDuplicateContact(
        phoneDigits,
        form.email || null
      );
      if (duplicateError) {
        setError(duplicateError);
        setSubmitting(false);
        return;
      }

      const slug = await generateUniqueSlug(form.businessName);
      const supabase = getSupabaseClient();

      let logoUrl: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop() || "png";
        const path = `logos/${slug}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("contractor-assets")
          .upload(path, logoFile, { upsert: true });
        if (uploadError) throw new Error("Logo upload failed: " + uploadError.message);
        const { data: urlData } = supabase.storage
          .from("contractor-assets")
          .getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      // Create business record
      const { data: bizData, error: bizError } = await supabase
        .from("businesses")
        .insert({
          name: form.businessName,
          owner_name: form.ownerName,
          phone: phoneDigits,
          email: form.email || null,
          city: form.city,
          state: form.state,
          trade: form.trade,
          services: form.services,
          logo_url: logoUrl,
        })
        .select("id")
        .single();

      if (bizError) {
        throw new Error(bizError.message);
      }

      // Create all three site types
      const { error: siteError } = await supabase
        .from("sites")
        .insert([
          {
            business_id: bizData.id,
            type: "business_card",
            slug,
            badge_licensed: form.badgeLicensed,
            badge_free_estimates: form.badgeFreeEstimates,
            badge_emergency: form.badgeEmergency,
            badge_family_owned: form.badgeFamilyOwned,
          },
          {
            business_id: bizData.id,
            type: "quiz_funnel",
            slug,
          },
          {
            business_id: bizData.id,
            type: "review_funnel",
            slug,
          },
          {
            business_id: bizData.id,
            type: "website",
            slug,
          },
        ]);

      if (siteError) {
        throw new Error(siteError.message);
      }

      setSuccessSlug(slug);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (successSlug) {
    return (
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <SuccessState slug={successSlug} />
        </div>
        <div className="hidden lg:block">
          <PhonePreview
            businessName={form.businessName}
            phone={form.phone}
            city={form.city}
            state={form.state}
            trade={form.trade}
            logoUrl={logoPreview}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-12 lg:grid-cols-2">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Create your free site
          </h2>
          <span className="text-xs text-gray-400">Step {step} of 2</span>
        </div>

        {/* Honeypot */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <input
            type="text"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {step === 1 && (
            <>
              {/* Business Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Business name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="Blue Hen HVAC"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Company logo
                </label>
                <div className="flex items-center gap-3">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                      Logo
                    </div>
                  )}
                  <label className="cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-gray-300">
                    {logoFile ? "Change logo" : "Upload logo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="sr-only"
                    />
                  </label>
                  {logoFile && (
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">Square format, under 2MB</p>
              </div>

              {/* Owner Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Owner name *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  placeholder="John Smith"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(302) 555-0147"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@bluehenHVAC.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Wilmington"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    State *
                  </label>
                  <select
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
              >
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Trade */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Trade *
                </label>
                <select
                  name="trade"
                  value={form.trade}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                >
                  <option value="">Select your trade</option>
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
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Services offered *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableServices.map((service) => (
                      <label
                        key={service}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          form.services.includes(service)
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.services.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="sr-only"
                        />
                        {service}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Trust badges
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TRUST_BADGES.map((badge) => (
                    <label
                      key={badge.key}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        form[badge.key]
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form[badge.key]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [badge.key]: e.target.checked }))
                        }
                        className="sr-only"
                      />
                      {badge.label}
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex-1 rounded-lg border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting ? "Creating your site..." : "Create my free site"}
                </button>
              </div>
            </>
          )}
        </div>
      </form>

      {/* Live Preview */}
      <div className="hidden lg:block">
        <PhonePreview
          businessName={form.businessName}
          phone={form.phone}
          city={form.city}
          state={form.state}
          trade={form.trade}
          logoUrl={logoPreview}
        />
      </div>
    </div>
  );
}
