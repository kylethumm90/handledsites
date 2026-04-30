"use client";

import { useState } from "react";

const VERTICALS = [
  "HVAC",
  "Roofing",
  "Solar",
  "Plumbing",
  "Electrical",
  "Pest control",
  "Landscaping",
  "Cleaning",
  "Garage doors",
  "Other",
];

const REVENUE_RANGES = [
  "Under $200k",
  "$200k–$500k",
  "$500k–$1M",
  "$1M–$2M",
  "$2M–$5M",
  "Over $5M",
];

const PHONE_SETUPS = [
  "I answer my own phone",
  "Family member or partner answers",
  "Voicemail / call back later",
  "Answering service",
  "Office manager / receptionist",
  "Mix of the above",
];

export default function PilotApplyForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    try {
      const res = await fetch("/api/pilot/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Something went wrong. Please try again.");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E08A1E]/10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E08A1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-900">Application received.</h3>
        <p className="text-sm text-gray-600">
          I read every one personally. If we&apos;re a fit, you&apos;ll hear from me within
          a couple of days. — Kyle
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-10">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
        Application
      </p>
      <h3 className="mb-8 text-2xl font-bold text-gray-900 md:text-3xl">
        Tell me about your shop.
      </h3>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Your name" name="name" required placeholder="Kyle Adams" />
        <Field label="Business name" name="business_name" required placeholder="Adams HVAC" />

        <SelectField label="Vertical" name="vertical" required options={VERTICALS} placeholder="HVAC, Roofing, Solar..." />
        <Field label="State" name="state" required placeholder="TX" />

        <Field label="Service area" name="service_area" placeholder="Greater Houston, ~30 mi radius" />
        <SelectField label="Annual revenue" name="annual_revenue" required options={REVENUE_RANGES} placeholder="Pick a range" />

        <Field label="People in the business" name="team_size" required placeholder="Team size" />
        <SelectField label="Current phone setup" name="phone_setup" required options={PHONE_SETUPS} placeholder="How you handle calls today" />

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">
            What&apos;s the biggest thing falling through the cracks right now?
          </label>
          <p className="mb-2 text-xs text-gray-500">
            The more specific, the better. This is the most useful question on the page.
          </p>
          <textarea
            name="biggest_pain"
            rows={4}
            placeholder="e.g. I'm losing $2k/wk in missed calls when I'm on a roof and my voicemail is full..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0"
          />
        </div>

        <Field label="Phone" name="phone" type="tel" required placeholder="(555) 555-1234" />
        <Field label="Email" name="email" type="email" required placeholder="you@yourshop.com" />

        {error && (
          <div className="md:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Apply for the pilot →"}
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            No credit card. No contract. Kyle reads every application personally.
          </p>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-900">
        {label} {required && <span className="text-[#E08A1E]">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  required = false,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-900">
        {label} {required && <span className="text-[#E08A1E]">*</span>}
      </label>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0"
      >
        <option value="" disabled>{placeholder || "Select..."}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
