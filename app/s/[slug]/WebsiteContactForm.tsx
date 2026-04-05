"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type Props = {
  siteId: string;
  services: string[];
};

export default function WebsiteContactForm({ siteId, services }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceNeeded, setServiceNeeded] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/website/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          name: name.trim(),
          phone: phone.replace(/\D/g, ""),
          service_needed: serviceNeeded || null,
          message: message.trim() || null,
        }),
      });
      if (res.ok) setSubmitted(true);
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
          <Check className="h-5 w-5 text-green-600" />
        </div>
        <p className="text-sm font-medium text-gray-900">Thanks! We&apos;ll be in touch shortly.</p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name *"
          required
          className={inputClass}
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number *"
          required
          className={inputClass}
        />
        {services.length > 0 && (
          <select
            value={serviceNeeded}
            onChange={(e) => setServiceNeeded(e.target.value)}
            className={inputClass}
          >
            <option value="">Service needed</option>
            {services.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message (optional)"
          rows={3}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !name.trim() || !phone.trim()}
        className="mt-4 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
