"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { generateUniqueSlug } from "@/lib/slug";
import { TRADES, TRADE_SERVICES, US_STATES, Trade } from "@/lib/constants";
import PhonePreview from "./PhonePreview";
import SuccessState from "./SuccessState";

type FormData = {
  businessName: string;
  ownerName: string;
  phone: string;
  city: string;
  state: string;
  trade: string;
  services: string[];
  licensedInsured: boolean;
};

const initialForm: FormData = {
  businessName: "",
  ownerName: "",
  phone: "",
  city: "",
  state: "",
  trade: "",
  services: [],
  licensedInsured: false,
};

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function SignupForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  const phoneDigits = form.phone.replace(/\D/g, "");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Honeypot check
    if (honeypot) return;

    // Validation
    if (phoneDigits.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!form.businessName || !form.ownerName || !form.city || !form.state || !form.trade) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.services.length === 0) {
      setError("Please select at least one service.");
      return;
    }

    setSubmitting(true);

    try {
      const slug = await generateUniqueSlug(form.businessName);

      const { error: insertError } = await getSupabaseClient()
        .from("contractor_sites")
        .insert({
          business_name: form.businessName,
          owner_name: form.ownerName,
          phone: phoneDigits,
          city: form.city,
          state: form.state,
          trade: form.trade,
          services: form.services,
          slug,
          licensed_insured: form.licensedInsured,
        });

      if (insertError) {
        throw new Error(insertError.message);
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
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          Create your free card
        </h2>

        {/* Honeypot — hidden from humans */}
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
              required
            />
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
              required
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
              required
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
                required
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
                required
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
              required
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

          {/* Licensed & Insured */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.licensedInsured}
              onChange={(e) =>
                setForm((f) => ({ ...f, licensedInsured: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm text-gray-700">Licensed & Insured</span>
          </label>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? "Creating your card..." : "Create my free card"}
          </button>
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
        />
      </div>
    </div>
  );
}
