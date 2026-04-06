"use client";

import { useState, useCallback } from "react";
import Script from "next/script";

type QuizQuestion = {
  id: string;
  question: string;
  type: string;
  options: string[];
};

type FunnelData = {
  id: string;
  businessName: string;
  trade: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
  headline: string | null;
  ctaText: string;
  accentColor: string;
  gtmId: string | null;
  metaPixelId: string | null;
  zapierWebhookUrl: string | null;
  // Configurable copy (with sensible defaults)
  quizHeadline?: string;
  dqHeadline?: string;
  dqBody?: string;
  formHeadline?: string;
  formSubtext?: string;
  submitButtonText?: string;
  finePrint?: string;
  thankYouHeadline?: string;
  thankYouBody?: string;
  buttonTextColor?: string;
  googleRating?: number | null;
  googleReviewCount?: number | null;
};

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    fbq: (...args: unknown[]) => void;
  }
}

export default function QuizClient({
  funnel,
  questions,
}: {
  funnel: FunnelData;
  questions: QuizQuestion[];
}) {
  const totalSteps = questions.length + 1; // questions + lead form
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [disqualified, setDisqualified] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const accent = funnel.accentColor;
  const btnColor = funnel.buttonTextColor || "#ffffff";
  const isContactStep = step === questions.length;
  const currentQuestion = step < questions.length ? questions[step] : null;
  const progress = 15 + ((step + (submitted ? 1 : 0)) / totalSteps) * 85;

  // Configurable copy with defaults
  const dqHeadline = funnel.dqHeadline || "We work best with homeowners.";
  const dqBody = funnel.dqBody || "Feel free to reach out directly if you have questions.";
  const formHeadline = funnel.formHeadline || funnel.headline || "You qualify. Let\u2019s get you a free quote.";
  const formSubtext = funnel.formSubtext || "Fill in a few details and we\u2019ll get back to you fast.";
  const submitText = funnel.submitButtonText || funnel.ctaText;
  const finePrint = funnel.finePrint || "No commitment. No spam.";
  const thankYouHeadline = funnel.thankYouHeadline || "You\u2019re on the list.";
  const thankYouBody = funnel.thankYouBody || `A member of our team will be in touch shortly.`;

  function selectOption(questionId: string, option: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));

    // Disqualification: "Do you own your home?" → "No"
    if (questionId === "homeowner" && option === "No") {
      setDisqualified(true);
      return;
    }

    // Auto-advance after selection
    setTimeout(() => setStep((s) => s + 1), 250);
  }

  function goBack() {
    if (step > 0) {
      setDisqualified(false);
      setStep((s) => s - 1);
    }
  }

  // Keyboard handler for option cards
  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent, questionId: string, option: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectOption(questionId, option);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function handleSubmit() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) return;
    setSubmitting(true);
    setError("");

    const leadData = {
      trade: funnel.trade.toLowerCase().replace(/\s+/g, "_"),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      zip: zip.trim(),
      answers,
    };

    // 1. POST to internal API
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: funnel.id,
          name: `${leadData.firstName} ${leadData.lastName}`,
          phone: leadData.phone,
          email: leadData.email,
          answers: { ...answers, zip: leadData.zip },
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Still show thank-you even if internal API fails
      console.error("Internal API submission failed");
    }

    // 2. POST to Zapier webhook (fire-and-forget)
    if (funnel.zapierWebhookUrl) {
      try {
        fetch(funnel.zapierWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadData),
        }).catch((err) => console.error("Zapier webhook error:", err));
      } catch (err) {
        console.error("Zapier webhook error:", err);
      }
    }

    // 3. Fire tracking events
    try {
      // Meta Pixel Lead event
      if (typeof window.fbq === "function") {
        window.fbq("track", "Lead");
      }
      // GTM dataLayer event
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "quiz_lead_submitted",
        trade: funnel.trade.toLowerCase().replace(/\s+/g, "_"),
        answers,
      });
    } catch (err) {
      console.error("Tracking error:", err);
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  // Build answer summary for thank-you screen
  const answerSummary = questions
    .filter((q) => answers[q.id])
    .map((q) => ({ question: q.question, answer: answers[q.id] }));

  return (
    <>
      {/* --- GTM --- */}
      {funnel.gtmId && (
        <Script id="gtm" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${funnel.gtmId}');
        `}</Script>
      )}

      {/* --- Meta Pixel --- */}
      {funnel.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${funnel.metaPixelId}');
          fbq('track', 'PageView');
        `}</Script>
      )}

      <style>{`
        /* ===== CSS Variables (reskin here) ===== */
        :root {
          --bg: #FAFAF8;
          --card-bg: #ffffff;
          --heading: #1A1A1A;
          --body: #555555;
          --muted: #999999;
          --border: #E5E5E5;
          --accent: ${accent};
          --accent-light: ${accent}18;
          --accent-border: ${accent};
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--heading); }

        .qf-wrap {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
          padding: 24px 20px;
          padding-top: 130px;
          background: var(--bg);
        }

        /* --- Headline (below progress bar, above quiz) --- */
        .qf-headline {
          font-size: clamp(18px, 3.5vw, 22px);
          font-weight: 700;
          color: var(--heading);
          line-height: 1.35;
          max-width: 480px;
          margin: 0 auto 32px;
          text-align: center;
        }

        /* --- Fixed top bar (logo + progress) --- */
        .qf-topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: #ffffff;
        }
        .qf-topbar-logo {
          display: flex;
          justify-content: center;
          padding: 20px 20px 16px;
        }
        .qf-topbar-logo img {
          height: 80px;
          width: auto;
          max-width: 200px;
          object-fit: contain;
        }
        .qf-topbar-name {
          font-size: 22px;
          font-weight: 800;
          color: var(--heading);
          letter-spacing: -0.5px;
        }
        .qf-progress {
          height: 4px;
          background: var(--border);
        }
        .qf-progress-fill {
          height: 100%;
          background: var(--accent);
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 0 2px 2px 0;
        }

        /* --- Card container --- */
        .qf-card {
          max-width: 520px;
          width: 100%;
        }

        /* --- Step indicator --- */
        .qf-step {
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* --- Question heading --- */
        .qf-question {
          font-size: clamp(24px, 5vw, 32px);
          font-weight: 800;
          color: var(--heading);
          letter-spacing: -0.5px;
          line-height: 1.2;
          margin-bottom: 32px;
        }

        /* --- Option cards --- */
        .qf-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .qf-option {
          width: 100%;
          text-align: left;
          padding: 18px 22px;
          background: var(--card-bg);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          color: var(--heading);
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 14px;
          outline: none;
        }
        .qf-option:hover {
          border-color: var(--accent-border);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .qf-option:focus-visible {
          border-color: var(--accent-border);
          box-shadow: 0 0 0 3px ${accent}30;
        }
        .qf-option.selected {
          border-color: var(--accent-border);
          background: var(--accent-light);
        }

        /* Letter badge */
        .qf-letter {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #F0F0EE;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: var(--body);
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .qf-option:hover .qf-letter,
        .qf-option.selected .qf-letter {
          background: var(--accent);
          color: #fff;
        }

        /* --- Back button --- */
        .qf-back {
          background: none;
          border: none;
          color: var(--muted);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 0;
          margin-top: 24px;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .qf-back:hover { color: var(--body); }

        /* --- Disqualification --- */
        .qf-dq {
          text-align: center;
          padding: 40px 0;
        }
        .qf-dq-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #FEF3C7;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 28px;
        }
        .qf-dq h2 {
          font-size: clamp(20px, 4vw, 26px);
          font-weight: 800;
          color: var(--heading);
          margin-bottom: 12px;
          line-height: 1.3;
        }
        .qf-dq p {
          font-size: 16px;
          color: var(--body);
          line-height: 1.6;
        }

        /* --- Contact form --- */
        .qf-form-heading {
          font-size: clamp(24px, 5vw, 32px);
          font-weight: 800;
          color: var(--heading);
          letter-spacing: -0.5px;
          line-height: 1.2;
          margin-bottom: 8px;
        }
        .qf-form-sub {
          font-size: 16px;
          color: var(--body);
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .qf-field {
          margin-bottom: 16px;
        }
        .qf-field label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--body);
          margin-bottom: 6px;
        }
        .qf-field input {
          width: 100%;
          background: var(--card-bg);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 16px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          color: var(--heading);
          outline: none;
          transition: border-color 0.2s;
        }
        .qf-field input::placeholder { color: #BBBBBB; }
        .qf-field input:focus { border-color: var(--accent); }
        .qf-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 480px) {
          .qf-row { grid-template-columns: 1fr; }
        }

        /* --- Submit button --- */
        .qf-submit {
          width: 100%;
          padding: 16px;
          border-radius: 8px;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: ${btnColor};
          background: var(--accent);
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 8px;
        }
        .qf-submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .qf-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .qf-fine {
          font-size: 13px;
          color: var(--muted);
          text-align: center;
          margin-top: 14px;
          line-height: 1.5;
        }
        .qf-error {
          font-size: 13px;
          color: #ef4444;
          margin-top: 10px;
        }

        /* --- Thank you --- */
        .qf-ty { text-align: center; }
        .qf-ty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: ${accent}20;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .qf-ty-icon svg { width: 32px; height: 32px; }
        .qf-ty h1 {
          font-size: clamp(26px, 5vw, 36px);
          font-weight: 800;
          color: var(--heading);
          letter-spacing: -0.5px;
          margin-bottom: 12px;
        }
        .qf-ty p {
          font-size: 17px;
          color: var(--body);
          line-height: 1.6;
          margin-bottom: 32px;
        }

        /* Answer summary card */
        .qf-summary {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          text-align: left;
          max-width: 420px;
          margin: 0 auto;
        }
        .qf-summary-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }
        .qf-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 10px 0;
          border-bottom: 1px solid #F5F5F3;
          gap: 16px;
        }
        .qf-summary-row:last-child { border-bottom: none; }
        .qf-summary-q {
          font-size: 14px;
          color: var(--body);
          flex: 1;
        }
        .qf-summary-a {
          font-size: 14px;
          font-weight: 700;
          color: var(--heading);
          text-align: right;
          flex-shrink: 0;
        }

        /* --- Google stars footer --- */
        .qf-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-top: 1px solid var(--border);
        }
        .qf-google-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        .qf-google-stars-icons {
          font-size: 16px;
          color: #FBBC04;
          letter-spacing: 1px;
        }
        .qf-google-stars-text {
          font-size: 13px;
          color: var(--muted);
          font-weight: 500;
        }

        /* --- Animation --- */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .qf-animate { animation: fadeUp 0.35s ease; }
      `}</style>

      {/* GTM noscript fallback */}
      {funnel.gtmId && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${funnel.gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
      )}

      {/* Fixed top bar: logo + progress */}
      <div className="qf-topbar">
        <div className="qf-topbar-logo">
          {funnel.logoUrl ? (
            <img src={funnel.logoUrl} alt={funnel.businessName} />
          ) : (
            <span className="qf-topbar-name">{funnel.businessName}</span>
          )}
        </div>
        <div className="qf-progress">
          <div className="qf-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="qf-wrap">
        {funnel.quizHeadline && step === 0 && !disqualified && !submitted && (
          <p className="qf-headline">{funnel.quizHeadline}</p>
        )}
        {submitted ? (
          /* ===== Thank You ===== */
          <div className="qf-card qf-animate" key="thankyou">
            <div className="qf-ty">
              <div className="qf-ty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h1>{thankYouHeadline}</h1>
              <p>{thankYouBody}</p>

              {answerSummary.length > 0 && (
                <div className="qf-summary">
                  <div className="qf-summary-title">Your answers</div>
                  {answerSummary.map((item) => (
                    <div key={item.question} className="qf-summary-row">
                      <span className="qf-summary-q">{item.question}</span>
                      <span className="qf-summary-a">{item.answer}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : disqualified ? (
          /* ===== Disqualification ===== */
          <div className="qf-card qf-animate" key="dq">
            <div className="qf-dq">
              <div className="qf-dq-icon">&#128274;</div>
              <h2>{dqHeadline}</h2>
              <p>{dqBody}</p>
              <button className="qf-back" onClick={goBack} type="button">
                &larr; Go back
              </button>
            </div>
          </div>
        ) : isContactStep ? (
          /* ===== Lead Capture Form ===== */
          <div className="qf-card qf-animate" key="contact">
            <h2 className="qf-form-heading">
              {formHeadline}
            </h2>
            <p className="qf-form-sub">
              {formSubtext}
            </p>

            <div className="qf-row">
              <div className="qf-field">
                <label>First name</label>
                <input
                  type="text"
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="qf-field">
                <label>Last name</label>
                <input
                  type="text"
                  placeholder="Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="qf-field">
              <label>Phone</label>
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="qf-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="jane@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="qf-field">
              <label>Zip code</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="78701"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
            </div>

            <button
              className="qf-submit"
              disabled={!firstName.trim() || !lastName.trim() || !phone.trim() || submitting}
              onClick={handleSubmit}
              type="button"
            >
              {submitting ? "Sending..." : submitText}
            </button>

            {error && <p className="qf-error">{error}</p>}
            <p className="qf-fine">{finePrint}</p>

            <button className="qf-back" onClick={goBack} type="button">
              &larr; Back
            </button>
          </div>
        ) : currentQuestion ? (
          /* ===== Quiz Question ===== */
          <div className="qf-card qf-animate" key={currentQuestion.id}>
            <div className="qf-step">
              Question {step + 1} of {questions.length}
            </div>
            <h2 className="qf-question">{currentQuestion.question}</h2>
            <div className="qf-options">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={opt}
                  className={`qf-option${answers[currentQuestion.id] === opt ? " selected" : ""}`}
                  onClick={() => selectOption(currentQuestion.id, opt)}
                  onKeyDown={(e) => handleOptionKeyDown(e, currentQuestion.id, opt)}
                  type="button"
                  role="radio"
                  aria-checked={answers[currentQuestion.id] === opt}
                  tabIndex={0}
                >
                  <span className="qf-letter">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>

            {step > 0 && (
              <button className="qf-back" onClick={goBack} type="button">
                &larr; Back
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Google star rating footer */}
      {!submitted && !disqualified && funnel.googleRating && funnel.googleReviewCount && funnel.googleRating >= 4 && funnel.googleReviewCount >= 5 && (
        <div className="qf-footer">
          <svg className="qf-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="qf-google-stars-icons">{"★".repeat(Math.round(funnel.googleRating))}</span>
          <span className="qf-google-stars-text">{funnel.googleRating} stars on Google ({funnel.googleReviewCount} reviews)</span>
        </div>
      )}
    </>
  );
}
