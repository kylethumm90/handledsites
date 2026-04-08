"use client";

import { useState } from "react";
import SiteFooter from "@/components/SiteFooter";

const TONES = ["Professional", "Friendly", "Firm"] as const;
const MAX_CHARS = 4096;

export default function ReviewResponseGenerator() {
  const [review, setReview] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [tone, setTone] = useState<string>("Professional");
  const [stars, setStars] = useState(1);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalState, setModalState] = useState<"form" | "success">("form");
  const [modalError, setModalError] = useState("");
  const [wlName, setWlName] = useState("");
  const [wlEmail, setWlEmail] = useState("");
  const [wlPhone, setWlPhone] = useState("");
  const [wlSubmitting, setWlSubmitting] = useState(false);

  function openWaitlistModal() {
    setWlName("");
    setWlEmail("");
    setWlPhone("");
    setModalError("");
    setModalState("form");
    setWlSubmitting(false);
    setModalOpen(true);
  }

  async function submitWaitlist() {
    setWlSubmitting(true);
    setModalError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: wlName.trim(),
          email: wlEmail.trim(),
          phone: wlPhone.trim(),
          source: "review-response-generator",
        }),
      });
      if (!res.ok) throw new Error();
      setModalState("success");
    } catch {
      setModalError("Something went wrong -- please try again.");
      setWlSubmitting(false);
    }
  }

  const canGenerate = review.trim().length > 0 && businessName.trim().length > 0;

  async function generate() {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await fetch("/api/generate-review-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review, businessName, tone, stars }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResponse(data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate response. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!response) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(response).then(showCopied);
    } else {
      const ta = document.createElement("textarea");
      ta.value = response;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showCopied();
    }
  }

  function showCopied() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .top-bar { height: 3px; background: linear-gradient(90deg, #6366f1, #818cf8, #6366f1); }
        .container { max-width: 720px; margin: 0 auto; padding: 0 20px; }
        .header { padding: 32px 0 0; text-align: center; }
        .logo { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #fff; }
        .logo span { color: #6366f1; }
        .header-tagline { font-size: 13px; color: #737373; margin-top: 4px; font-weight: 500; letter-spacing: 0.3px; }
        .hero { text-align: center; padding: 56px 0 40px; }
        .hero h1 { font-size: clamp(28px, 5vw, 44px); font-weight: 800; line-height: 1.15; letter-spacing: -1px; margin-bottom: 16px; }
        .hero p { font-size: 17px; color: #a3a3a3; font-weight: 400; max-width: 540px; margin: 0 auto; }
        .card { background: #141414; border: 1px solid #262626; border-radius: 16px; padding: 36px 32px; margin-bottom: 24px; }
        @media (max-width: 480px) { .card { padding: 28px 20px; } }
        .input-group { margin-bottom: 24px; }
        .input-group:last-child { margin-bottom: 0; }
        .input-group label { display: block; font-size: 15px; font-weight: 600; color: #e5e5e5; margin-bottom: 10px; }
        .text-input { width: 100%; background: #0a0a0a; border: 1px solid #333; border-radius: 10px; padding: 14px 16px; font-size: 16px; font-family: 'Inter', sans-serif; font-weight: 500; color: #fff; outline: none; transition: border-color 0.2s; resize: vertical; }
        .text-input::placeholder { color: #525252; }
        .text-input:focus { border-color: #6366f1; }

        /* Tone buttons */
        .tone-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .tone-btn { padding: 10px 20px; border-radius: 8px; border: 1px solid #333; background: #0a0a0a; color: #a3a3a3; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .tone-btn:hover { border-color: #6366f1; color: #e5e5e5; }
        .tone-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; }

        /* Star rating */
        .stars-group { display: flex; gap: 6px; }
        .star-btn { width: 44px; height: 44px; border-radius: 8px; border: 1px solid #333; background: #0a0a0a; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .star-btn:hover { border-color: #fbbf24; }
        .star-btn.filled { background: #1c1a00; border-color: #fbbf24; }

        /* Generate button */
        .btn-generate { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; background: #6366f1; color: #fff; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700; padding: 16px; border-radius: 10px; border: none; cursor: pointer; transition: background 0.2s, transform 0.15s; margin-top: 8px; }
        .btn-generate:hover:not(:disabled) { background: #5558e6; transform: translateY(-1px); }
        .btn-generate:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Spinner */
        .spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Output */
        .output-card { opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .output-card.visible { opacity: 1; transform: translateY(0); }
        .output-label { font-size: 14px; font-weight: 700; color: #a3a3a3; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
        .output-box { background: #0a0a0a; border: 1px solid #333; border-radius: 10px; padding: 20px; font-size: 15px; line-height: 1.7; color: #e5e5e5; white-space: pre-wrap; word-wrap: break-word; margin-bottom: 16px; }
        .output-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .btn-copy { background: #6366f1; color: #fff; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; padding: 10px 24px; border-radius: 8px; border: none; cursor: pointer; transition: background 0.2s; }
        .btn-copy:hover { background: #5558e6; }
        .btn-copy.copied { background: #166534; }
        .btn-regen { background: transparent; color: #a3a3a3; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; padding: 10px 24px; border-radius: 8px; border: 1px solid #333; cursor: pointer; transition: all 0.2s; }
        .btn-regen:hover { border-color: #6366f1; color: #e5e5e5; }
        .char-count { margin-left: auto; font-size: 13px; color: #525252; font-weight: 500; }
        .char-over { color: #ef4444; }

        .error-msg { background: #1a0a0a; border: 1px solid #3b1111; border-radius: 10px; padding: 14px 16px; font-size: 14px; color: #ef4444; margin-bottom: 16px; }

        /* How it works */
        .steps-section { margin-bottom: 24px; }
        .steps-section h2 { font-size: 20px; font-weight: 800; letter-spacing: -0.3px; text-align: center; margin-bottom: 20px; }
        .steps-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        @media (max-width: 580px) { .steps-grid { grid-template-columns: 1fr; } }
        .step-card { background: #141414; border: 1px solid #262626; border-radius: 12px; padding: 24px 20px; text-align: center; }
        .step-num { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: #1a1a2e; color: #6366f1; font-size: 14px; font-weight: 700; margin-bottom: 12px; }
        .step-card p { font-size: 14px; font-weight: 600; color: #e5e5e5; line-height: 1.4; }

        /* CTA */
        .cta-card { background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%); border: 1px solid #2d2d5e; border-radius: 16px; padding: 48px 32px; text-align: center; margin-bottom: 24px; }
        @media (max-width: 480px) { .cta-card { padding: 36px 20px; } }
        .cta-card h2 { font-size: clamp(22px, 4vw, 28px); font-weight: 800; line-height: 1.25; letter-spacing: -0.5px; margin-bottom: 12px; }
        .cta-card .subhead { font-size: 16px; color: #a3a3a3; margin-bottom: 32px; }
        .cta-btn { display: inline-block; background: #6366f1; color: #fff; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700; padding: 16px 40px; border-radius: 10px; text-decoration: none; transition: background 0.2s, transform 0.15s; }
        .cta-btn:hover { background: #5558e6; transform: translateY(-1px); }
        .cta-small { font-size: 13px; color: #737373; margin-top: 14px; }
        .footer { text-align: center; padding: 40px 0; font-size: 13px; color: #525252; }

        /* Modal */
        .modal-overlay { display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center; padding: 20px; }
        .modal-card { background: #141414; border: 1px solid #262626; border-radius: 16px; padding: 36px 32px; max-width: 440px; width: 100%; position: relative; animation: modalIn 0.25s ease; }
        @keyframes modalIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 480px) { .modal-card { padding: 28px 20px; } }
        .modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: #737373; font-size: 24px; cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: color 0.2s, background 0.2s; }
        .modal-close:hover { color: #fff; background: #262626; }
        .modal-card h2 { font-size: 22px; font-weight: 800; letter-spacing: -0.3px; margin-bottom: 8px; }
        .modal-sub { font-size: 14px; color: #a3a3a3; margin-bottom: 24px; line-height: 1.5; }
        .modal-input-group { margin-bottom: 16px; }
        .modal-input-group label { display: block; font-size: 14px; font-weight: 600; color: #e5e5e5; margin-bottom: 6px; }
        .modal-input-group input { width: 100%; background: #0a0a0a; border: 1px solid #333; border-radius: 10px; padding: 12px 14px; font-size: 15px; font-family: 'Inter', sans-serif; font-weight: 500; color: #fff; outline: none; transition: border-color 0.2s; }
        .modal-input-group input::placeholder { color: #525252; }
        .modal-input-group input:focus { border-color: #6366f1; }
        .modal-submit { width: 100%; background: #6366f1; color: #fff; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700; padding: 14px; border-radius: 10px; border: none; cursor: pointer; transition: background 0.2s; margin-top: 8px; }
        .modal-submit:hover:not(:disabled) { background: #5558e6; }
        .modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-fine { font-size: 12px; color: #737373; text-align: center; margin-top: 12px; }
        .modal-error { font-size: 13px; color: #ef4444; margin-top: 10px; }
        .modal-success-body { font-size: 15px; color: #a3a3a3; line-height: 1.6; }
      `}</style>

      <div className="top-bar" />

      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="logo">handled<span>.</span></div>
          <p className="header-tagline">Free Tools for Independent Contractors</p>
        </header>

        {/* Hero */}
        <section className="hero">
          <h1>Respond to Any Review in&nbsp;Seconds.</h1>
          <p>Paste the review, pick your tone, get a professional response you can copy and post instantly.</p>
        </section>

        {/* Input Card */}
        <div className="card">
          <div className="input-group">
            <label>Paste the review here</label>
            <textarea
              className="text-input"
              rows={5}
              placeholder="e.g. 'The technician showed up 2 hours late and didn't fix the problem. Would not recommend.'"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Your business name</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Mike's HVAC Service"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Tone</label>
            <div className="tone-group">
              {TONES.map((t) => (
                <button
                  key={t}
                  className={`tone-btn${tone === t ? " active" : ""}`}
                  onClick={() => setTone(t)}
                  type="button"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>Star rating of the review</label>
            <div className="stars-group">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`star-btn${n <= stars ? " filled" : ""}`}
                  onClick={() => setStars(n)}
                  type="button"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  {n <= stars ? "★" : "☆"}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-generate"
            disabled={!canGenerate || loading}
            onClick={generate}
            type="button"
          >
            {loading ? (
              <>
                <div className="spinner" />
                Writing your response...
              </>
            ) : (
              "Generate Response"
            )}
          </button>
        </div>

        {/* Error */}
        {error && <div className="error-msg">{error}</div>}

        {/* Output Card */}
        <div className={`card output-card${response ? " visible" : ""}`}>
          <div className="output-label">Your Response</div>
          <div className="output-box">{response}</div>
          <div className="output-actions">
            <button
              className={`btn-copy${copied ? " copied" : ""}`}
              onClick={copyToClipboard}
              type="button"
            >
              {copied ? "Copied!" : "Copy Response"}
            </button>
            <button
              className="btn-regen"
              onClick={generate}
              disabled={loading}
              type="button"
            >
              Regenerate
            </button>
            <span className={`char-count${response.length > MAX_CHARS ? " char-over" : ""}`}>
              {response.length > 0 && `${response.length} / ${MAX_CHARS}`}
            </span>
          </div>
        </div>

        {/* How It Works */}
        <div className="steps-section">
          <h2>How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num">1</div>
              <p>Paste the review</p>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <p>Pick your tone</p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <p>Copy and post</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-card">
          <h2>handled. can monitor and flag reviews automatically.</h2>
          <p className="subhead">Get notified the moment a review drops so you never miss a chance to respond.</p>
          <button className="cta-btn" onClick={openWaitlistModal} type="button" style={{ border: "none", cursor: "pointer" }}>
            Get Free Access
          </button>
          <p className="cta-small">Free forever. No credit card required.</p>
        </div>

        <SiteFooter />
      </div>

      {/* Waitlist Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setModalOpen(false)} type="button">&times;</button>
            {modalState === "form" ? (
              <>
                <h2>Join the Waitlist</h2>
                <p className="modal-sub">Founding contractor spots are full. Drop your info and we&apos;ll reach out the moment your spot opens.</p>
                <div className="modal-input-group">
                  <label>First name</label>
                  <input type="text" placeholder="Your first name" value={wlName} onChange={(e) => setWlName(e.target.value)} />
                </div>
                <div className="modal-input-group">
                  <label>Email address</label>
                  <input type="email" placeholder="you@email.com" value={wlEmail} onChange={(e) => setWlEmail(e.target.value)} />
                </div>
                <div className="modal-input-group">
                  <label>Mobile number -- we&apos;ll text you when you&apos;re in</label>
                  <input type="tel" placeholder="(555) 123-4567" value={wlPhone} onChange={(e) => setWlPhone(e.target.value)} />
                </div>
                <button
                  className="modal-submit"
                  disabled={!wlName.trim() || !wlEmail.trim() || !wlPhone.trim() || wlSubmitting}
                  onClick={submitWaitlist}
                  type="button"
                >
                  {wlSubmitting ? "Saving..." : "Save My Spot"}
                </button>
                {modalError && <p className="modal-error">{modalError}</p>}
                <p className="modal-fine">No spam. One text when your spot opens. That&apos;s it.</p>
              </>
            ) : (
              <>
                <h2>You&apos;re on the list.</h2>
                <p className="modal-success-body">We&apos;ll text you the moment a founding contractor spot opens. When it does, you&apos;ll get Founding Contractor pricing -- locked in forever, no matter what handled. costs later.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
