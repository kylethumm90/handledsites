"use client";

import { useState } from "react";

type Props = {
  siteId: string;
  services: string[];
};

export default function WebsiteContactForm({ siteId, services }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [serviceNeeded, setServiceNeeded] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!firstName.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/website/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          phone: phone.replace(/\D/g, ""),
          service_needed: serviceNeeded || null,
          message: zip ? `ZIP: ${zip}` : null,
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
      <div className="ws-form-card" style={{ textAlign: "center", padding: "48px 28px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0C1A2E", marginBottom: 8 }}>Request sent!</h3>
        <p style={{ fontSize: 14, color: "#6B7280" }}>We&apos;ll be in touch shortly.</p>
      </div>
    );
  }

  return (
    <div className="ws-form-card">
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0C1A2E", marginBottom: 20 }}>Get your free estimate</h3>
      <div className="ws-form-row">
        <div className="ws-form-group">
          <label>First name</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Kyle" />
        </div>
        <div className="ws-form-group">
          <label>Last name</label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
        </div>
      </div>
      <div className="ws-form-group">
        <label>Phone number</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-0000" />
      </div>
      <div className="ws-form-group">
        <label>ZIP code</label>
        <input type="tel" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="35801" />
      </div>
      {services.length > 0 && (
        <div className="ws-form-group">
          <label>What do you need?</label>
          <select value={serviceNeeded} onChange={(e) => setServiceNeeded(e.target.value)}>
            <option value="">Select a service...</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
      <button
        className="ws-btn-submit"
        onClick={handleSubmit}
        disabled={submitting || !firstName.trim() || !phone.trim()}
      >
        {submitting ? "Sending..." : "Get My Free Estimate →"}
      </button>
    </div>
  );
}
