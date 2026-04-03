"use client";

import { useState } from "react";

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
};

export default function QuizClient({
  funnel,
  questions,
}: {
  funnel: FunnelData;
  questions: QuizQuestion[];
}) {
  const totalSteps = questions.length + 1; // questions + contact form
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const accent = funnel.accentColor;
  const isContactStep = step === questions.length;
  const currentQuestion = step < questions.length ? questions[step] : null;
  const progress = ((step + (submitted ? 1 : 0)) / totalSteps) * 100;

  function selectOption(questionId: string, option: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    // Auto-advance after selection
    setTimeout(() => setStep((s) => s + 1), 250);
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function handleSubmit() {
    if (!contactName.trim() || !contactPhone.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnel_id: funnel.id,
          name: contactName.trim(),
          phone: contactPhone.trim(),
          email: contactEmail.trim(),
          answers,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #ffffff; color: #111; }
        .quiz-wrap { min-height: 100dvh; display: flex; flex-direction: column; font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }

        /* Header */
        .quiz-header { padding: 20px 24px; text-align: center; border-bottom: 1px solid #e5e5e5; }
        .quiz-logo { font-size: 16px; font-weight: 700; color: #525252; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .quiz-logo img { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; }

        /* Progress */
        .progress-bar { height: 3px; background: #e5e5e5; }
        .progress-fill { height: 100%; transition: width 0.4s ease; border-radius: 0 2px 2px 0; }

        /* Content */
        .quiz-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px 20px; }
        .quiz-card { max-width: 540px; width: 100%; }

        /* Step indicator */
        .step-indicator { font-size: 13px; font-weight: 600; color: #a3a3a3; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Question */
        .question-text { font-size: clamp(22px, 4vw, 28px); font-weight: 800; letter-spacing: -0.5px; line-height: 1.25; margin-bottom: 28px; }

        /* Options */
        .options-list { display: flex; flex-direction: column; gap: 10px; }
        .option-btn { width: 100%; text-align: left; padding: 16px 20px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; color: #1a1a1a; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 14px; }
        .option-btn:hover { border-color: ${accent}; background: #f0f0f0; }
        .option-btn.selected { border-color: ${accent}; background: ${accent}18; }
        .option-letter { width: 28px; height: 28px; border-radius: 7px; background: #e5e5e5; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #737373; flex-shrink: 0; transition: all 0.15s; }
        .option-btn:hover .option-letter { background: ${accent}; color: #fff; }
        .option-btn.selected .option-letter { background: ${accent}; color: #fff; }

        /* Contact form */
        .contact-heading { font-size: clamp(22px, 4vw, 28px); font-weight: 800; letter-spacing: -0.5px; line-height: 1.25; margin-bottom: 8px; }
        .contact-sub { font-size: 15px; color: #737373; margin-bottom: 28px; line-height: 1.5; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 14px; font-weight: 600; color: #525252; margin-bottom: 6px; }
        .form-group input { width: 100%; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 10px; padding: 14px 16px; font-size: 16px; font-family: 'Inter', sans-serif; font-weight: 500; color: #111; outline: none; transition: border-color 0.2s; }
        .form-group input::placeholder { color: #a3a3a3; }
        .form-group input:focus { border-color: ${accent}; }
        .submit-btn { width: 100%; padding: 16px; border-radius: 10px; border: none; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700; color: #fff; cursor: pointer; transition: opacity 0.2s, transform 0.15s; margin-top: 8px; }
        .submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .form-fine { font-size: 12px; color: #a3a3a3; text-align: center; margin-top: 12px; }
        .form-error { font-size: 13px; color: #ef4444; margin-top: 10px; }

        /* Back button */
        .back-btn { background: none; border: none; color: #a3a3a3; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; padding: 8px 0; margin-top: 20px; transition: color 0.2s; display: flex; align-items: center; gap: 4px; }
        .back-btn:hover { color: #525252; }

        /* Thank you */
        .thankyou-wrap { text-align: center; }
        .thankyou-check { width: 64px; height: 64px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .thankyou-check svg { width: 32px; height: 32px; }
        .thankyou-heading { font-size: clamp(24px, 5vw, 32px); font-weight: 800; letter-spacing: -0.5px; margin-bottom: 12px; }
        .thankyou-body { font-size: 16px; color: #525252; line-height: 1.6; margin-bottom: 28px; }
        .thankyou-phone { display: inline-flex; align-items: center; gap: 10px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 16px 28px; font-size: 18px; font-weight: 700; color: #111; text-decoration: none; transition: border-color 0.2s; }
        .thankyou-phone:hover { border-color: ${accent}; }
        .thankyou-phone svg { width: 20px; height: 20px; }

        /* Footer */
        .quiz-footer { padding: 20px; text-align: center; font-size: 12px; color: #a3a3a3; }
        .quiz-footer a { color: #737373; text-decoration: none; font-weight: 600; }
        .quiz-footer a:hover { color: #525252; }

        /* Animation */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeUp 0.35s ease; }
      `}</style>

      <div className="quiz-wrap">
        {/* Header */}
        <div className="quiz-header">
          <div className="quiz-logo">
            {funnel.logoUrl && (
              <img src={funnel.logoUrl} alt="" />
            )}
            {funnel.businessName}
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%`, background: accent }}
          />
        </div>

        {/* Content */}
        <div className="quiz-content">
          {submitted ? (
            /* Thank you screen */
            <div className="quiz-card animate-in">
              <div className="thankyou-wrap">
                <div className="thankyou-check" style={{ background: `${accent}20` }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <h1 className="thankyou-heading">Thanks, {contactName.split(" ")[0]}!</h1>
                <p className="thankyou-body">
                  We got your info. Someone from {funnel.businessName} will reach out shortly to get you taken care of.
                </p>
                {funnel.phone && (
                  <a href={`tel:${funnel.phone}`} className="thankyou-phone">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Call {funnel.phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}
                  </a>
                )}
              </div>
            </div>
          ) : isContactStep ? (
            /* Contact form */
            <div className="quiz-card animate-in" key="contact">
              <div className="step-indicator">Last step</div>
              <h2 className="contact-heading">Where should we send your quote?</h2>
              <p className="contact-sub">Drop your info and {funnel.businessName} will follow up with a free estimate.</p>

              <div className="form-group">
                <label>Your name</label>
                <input
                  type="text"
                  placeholder="First and last name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Phone number</label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email (optional)</label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>

              <button
                className="submit-btn"
                style={{ background: accent }}
                disabled={!contactName.trim() || !contactPhone.trim() || submitting}
                onClick={handleSubmit}
                type="button"
              >
                {submitting ? "Sending..." : funnel.ctaText}
              </button>

              {error && <p className="form-error">{error}</p>}
              <p className="form-fine">Your info goes directly to {funnel.businessName}. No spam.</p>

              <button className="back-btn" onClick={goBack} type="button">
                ← Back
              </button>
            </div>
          ) : currentQuestion ? (
            /* Quiz question */
            <div className="quiz-card animate-in" key={currentQuestion.id}>
              <div className="step-indicator">
                Question {step + 1} of {questions.length}
              </div>
              <h2 className="question-text">{currentQuestion.question}</h2>
              <div className="options-list">
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={opt}
                    className={`option-btn${answers[currentQuestion.id] === opt ? " selected" : ""}`}
                    onClick={() => selectOption(currentQuestion.id, opt)}
                    type="button"
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>

              {step > 0 && (
                <button className="back-btn" onClick={goBack} type="button">
                  ← Back
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="quiz-footer">
          Powered by <a href="https://handledsites.com" target="_blank" rel="noopener noreferrer">handled.</a>
        </div>
      </div>
    </>
  );
}
