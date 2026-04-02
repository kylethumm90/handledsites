"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ReviewLinkGeneratorInner() {
  const searchParams = useSearchParams();

  const [reviewLink, setReviewLink] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Waitlist modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalState, setModalState] = useState<"form" | "success">("form");
  const [modalError, setModalError] = useState("");
  const [wlName, setWlName] = useState("");
  const [wlEmail, setWlEmail] = useState("");
  const [wlPhone, setWlPhone] = useState("");
  const [wlSubmitting, setWlSubmitting] = useState(false);

  useEffect(() => {
    const link = searchParams.get("link");
    const business = searchParams.get("business");
    const error = searchParams.get("error");

    if (link) {
      setReviewLink(link);
      setBusinessName(business || "");
    }

    if (error) {
      const messages: Record<string, string> = {
        access_denied:
          "You declined the Google sign-in. No worries. Click the button below to try again whenever you're ready.",
        invalid_state:
          "The sign-in session expired. Please try again.",
        no_gbp_access:
          "We couldn't access your Google Business Profile. Make sure the Google account you sign in with is the one that manages your business listing.",
        no_gbp_accounts:
          "No Google Business Profile found for this account. You need a verified GBP listing before we can generate your review link.",
        no_locations:
          "We found your GBP account but no locations with a Place ID. Make sure your business listing is verified on Google.",
        token_exchange:
          "Something went wrong connecting to Google. Please try again.",
        server_error:
          "Something went wrong on our end. Please try again.",
        profile_fetch:
          "We couldn't read your Google profile. Please try again.",
        missing_tokens:
          "Google didn't return the credentials we need. Please try again.",
      };
      setErrorMsg(messages[error] || "Something went wrong. Please try again.");
    }
  }, [searchParams]);

  function copyToClipboard() {
    if (!reviewLink) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reviewLink).then(showCopied);
    } else {
      const ta = document.createElement("textarea");
      ta.value = reviewLink;
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
          source: "review-link-generator",
        }),
      });
      if (!res.ok) throw new Error();
      setModalState("success");
    } catch {
      setModalError("Something went wrong -- please try again.");
      setWlSubmitting(false);
    }
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

        .card { background: #141414; border: 1px solid #262626; border-radius: 16px; padding: 36px 32px; margin-bottom: 24px; text-align: center; }
        @media (max-width: 480px) { .card { padding: 28px 20px; } }

        /* OAuth button */
        .btn-google { display: inline-flex; align-items: center; justify-content: center; gap: 12px; background: #6366f1; color: #fff; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700; padding: 16px 40px; border-radius: 10px; border: none; cursor: pointer; transition: background 0.2s, transform 0.15s; text-decoration: none; width: 100%; max-width: 400px; }
        .btn-google:hover { background: #5558e6; transform: translateY(-1px); }
        .btn-google svg { width: 20px; height: 20px; flex-shrink: 0; }
        .fine-print { font-size: 13px; color: #737373; margin-top: 14px; }

        /* Error */
        .error-card { background: #1a0a0a; border: 1px solid #3b1111; border-radius: 16px; padding: 24px 28px; margin-bottom: 24px; }
        .error-card p { font-size: 15px; color: #ef4444; line-height: 1.6; margin-bottom: 16px; }
        .error-card p:last-child { margin-bottom: 0; }

        /* Result */
        .result-card { background: #141414; border: 1px solid #262626; border-radius: 16px; padding: 36px 32px; margin-bottom: 24px; }
        @media (max-width: 480px) { .result-card { padding: 28px 20px; } }
        .result-label { font-size: 13px; font-weight: 700; color: #22c55e; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .result-label svg { width: 16px; height: 16px; }
        .result-business { font-size: 18px; font-weight: 700; color: #e5e5e5; margin-bottom: 16px; text-align: center; }
        .result-box { background: #0a0a0a; border: 1px solid #333; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
        .result-link { font-size: 13px; font-family: 'Inter', monospace; color: #6366f1; word-break: break-all; font-weight: 500; }
        .result-actions { display: flex; gap: 8px; }
        .btn-copy { flex: 1; background: #6366f1; color: #fff; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .btn-copy:hover { background: #5558e6; }
        .btn-copy.copied { background: #166534; }
        .btn-copy svg { width: 16px; height: 16px; }
        .btn-test { flex: 1; background: transparent; color: #a3a3a3; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px; border: 1px solid #333; cursor: pointer; transition: all 0.2s; text-decoration: none; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .btn-test:hover { border-color: #6366f1; color: #e5e5e5; }
        .btn-test svg { width: 16px; height: 16px; }
        .connected-note { margin-top: 24px; padding-top: 20px; border-top: 1px solid #262626; font-size: 14px; color: #a3a3a3; line-height: 1.6; text-align: center; }

        /* Tips */
        .tips-section { margin-bottom: 24px; }
        .tips-section h2 { font-size: 20px; font-weight: 800; letter-spacing: -0.3px; text-align: center; margin-bottom: 20px; }
        .tips-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        @media (max-width: 580px) { .tips-grid { grid-template-columns: 1fr; } }
        .tip-card { background: #141414; border: 1px solid #262626; border-radius: 12px; padding: 24px 20px; text-align: center; }
        .tip-icon { width: 40px; height: 40px; border-radius: 10px; background: #1a1a2e; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .tip-icon svg { width: 20px; height: 20px; color: #6366f1; }
        .tip-card p { font-size: 14px; font-weight: 600; color: #e5e5e5; line-height: 1.4; }
        .tip-card .tip-example { font-size: 12px; color: #737373; margin-top: 8px; font-weight: 400; font-style: italic; line-height: 1.5; }

        /* CTA */
        .cta-card { background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%); border: 1px solid #2d2d5e; border-radius: 16px; padding: 48px 32px; text-align: center; margin-bottom: 24px; }
        @media (max-width: 480px) { .cta-card { padding: 36px 20px; } }
        .cta-card h2 { font-size: clamp(22px, 4vw, 28px); font-weight: 800; line-height: 1.25; letter-spacing: -0.5px; margin-bottom: 12px; }
        .cta-card .subhead { font-size: 16px; color: #a3a3a3; margin-bottom: 32px; }
        .cta-btn { display: inline-block; background: #6366f1; color: #fff; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700; padding: 16px 40px; border-radius: 10px; text-decoration: none; transition: background 0.2s, transform 0.15s; border: none; cursor: pointer; }
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
        <header className="header">
          <div className="logo">handled<span>.</span></div>
          <p className="header-tagline">Free Tools for Independent Contractors</p>
        </header>

        <section className="hero">
          <h1>Get Your Google Review Link. Instantly.</h1>
          <p>Connect your Google Business Profile and we&apos;ll build your working review link in seconds. No setup. No guessing.</p>
        </section>

        {/* Error state */}
        {errorMsg && !reviewLink && (
          <div className="error-card">
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Result state */}
        {reviewLink ? (
          <div className="result-card">
            <div className="result-label">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              Your review link is ready.
            </div>
            {businessName && (
              <div className="result-business">{businessName}</div>
            )}
            <div className="result-box">
              <span className="result-link">{reviewLink}</span>
            </div>
            <div className="result-actions">
              <button
                className={`btn-copy${copied ? " copied" : ""}`}
                onClick={copyToClipboard}
                type="button"
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    Copy Link
                  </>
                )}
              </button>
              <a
                className="btn-test"
                href={reviewLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Test It
              </a>
            </div>
            <div className="connected-note">
              You&apos;re now connected to handled. Stella will automatically respond to your Google reviews.
            </div>
          </div>
        ) : (
          /* Initial state -- OAuth button */
          <div className="card">
            <a href="/api/auth/google" className="btn-google">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff" fillOpacity=".9"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity=".7"/><path d="M5.84 14.09A6.97 6.97 0 0 1 5.48 12c0-.72.12-1.43.36-2.09V7.07H2.18A10.98 10.98 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#fff" fillOpacity=".5"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.99 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity=".8"/></svg>
              Get My Review Link
            </a>
            <p className="fine-print">Free. Takes 30 seconds. No spam.</p>
          </div>
        )}

        {/* Tips */}
        <div className="tips-section">
          <h2>What to Do With Your Review Link</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p>Send it in your job completion text</p>
              <p className="tip-example">&quot;Thanks for choosing us! If you have a moment, we&apos;d love a review: [link]&quot;</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <p>Add it to your email signature</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 11h18"/></svg>
              </div>
              <p>Save it in your phone contacts as &quot;My Review Link&quot;</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-card">
          <h2>handled. sends your review link automatically after every job.</h2>
          <p className="subhead">Stella follows up with every customer so you never have to ask manually.</p>
          <button className="cta-btn" onClick={openWaitlistModal} type="button">
            Get Free Access
          </button>
          <p className="cta-small">Free forever. No credit card required.</p>
        </div>

        <footer className="footer">
          &copy; 2026 handled. | Free tools for contractors who run lean.
        </footer>
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

export default function ReviewLinkGenerator() {
  return (
    <Suspense>
      <ReviewLinkGeneratorInner />
    </Suspense>
  );
}
