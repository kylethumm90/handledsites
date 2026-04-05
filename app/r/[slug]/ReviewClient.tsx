"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type Props = {
  siteId: string;
  businessName: string;
  logoUrl: string | null;
  googleReviewUrl: string | null;
};

type Step = "rating" | "feedback" | "result";

const EMOJIS = [
  { emoji: "😍", label: "Loved it", value: 5 },
  { emoji: "😊", label: "Really good", value: 4 },
  { emoji: "😐", label: "It was okay", value: 3 },
  { emoji: "😕", label: "Not great", value: 2 },
  { emoji: "😤", label: "Frustrated", value: 1 },
];

export default function ReviewClient({
  siteId,
  businessName,
  logoUrl,
  googleReviewUrl,
}: Props) {
  const [step, setStep] = useState<Step>("rating");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);
  const [isPositive, setIsPositive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);

  const handleRating = (value: number) => {
    setRating(value);
    setStep("feedback");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: siteId, rating, feedback }),
      });
      const data = await res.json();
      setIsPositive(data.is_positive);
      if (data.generated_review) {
        setGeneratedReview(data.generated_review);
      }
      setStep("result");
    } catch {
      setSubmitting(false);
    }
  };

  const handleCopyAndReview = async () => {
    if (generatedReview) {
      await navigator.clipboard.writeText(generatedReview);
      setCopied(true);
    }
    if (googleReviewUrl) {
      window.open(googleReviewUrl, "_blank");
    }
  };

  if (done) {
    return (
      <Shell businessName={businessName} logoUrl={logoUrl}>
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <Check className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Thank you!</h2>
          <p className="mt-2 text-sm text-gray-500">
            We appreciate you taking the time.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell businessName={businessName} logoUrl={logoUrl}>
      {/* Step 1: Rating */}
      {step === "rating" && (
        <div className="py-8">
          <h2 className="mb-8 text-center text-lg font-semibold text-gray-900">
            How was your experience
            <br />
            with {businessName}?
          </h2>
          <div className="flex justify-center gap-3">
            {EMOJIS.map((e) => (
              <button
                key={e.value}
                onClick={() => handleRating(e.value)}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all hover:bg-gray-50 active:scale-95"
              >
                <span className="text-3xl">{e.emoji}</span>
                <span className="text-[10px] font-medium text-gray-500">
                  {e.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Feedback */}
      {step === "feedback" && (
        <div className="py-8">
          <div className="mb-6 flex justify-center">
            <span className="text-4xl">
              {EMOJIS.find((e) => e.value === rating)?.emoji}
            </span>
          </div>
          <h2 className="mb-4 text-center text-base font-semibold text-gray-900">
            {rating >= 4
              ? `What did ${businessName} do that stood out?`
              : "What could we have done better?"}
          </h2>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={
              rating >= 4
                ? "Tell us what made it great..."
                : "We'd love to know how we can improve..."
            }
            rows={4}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Continue"}
          </button>
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && isPositive && (
        <div className="py-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <Check className="h-7 w-7 text-green-600" />
            </div>
          </div>
          <h2 className="mb-2 text-center text-base font-semibold text-gray-900">
            Thanks for the kind words!
          </h2>
          <p className="mb-6 text-center text-sm text-gray-500">
            Mind sharing your experience on Google?
            {!googleReviewUrl && " (Ask your contractor for their Google review link)"}
          </p>

          {generatedReview && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Your review (feel free to edit before posting)
              </p>
              <textarea
                value={generatedReview}
                onChange={(e) => setGeneratedReview(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              />
            </div>
          )}

          {googleReviewUrl && (
            <button
              onClick={handleCopyAndReview}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied! Opening Google...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy &amp; Review on Google
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setDone(true)}
            className="mt-3 w-full py-2 text-center text-xs text-gray-400 hover:text-gray-600"
          >
            No thanks
          </button>
        </div>
      )}

      {step === "result" && !isPositive && (
        <div className="py-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Check className="h-7 w-7 text-blue-600" />
            </div>
          </div>
          <h2 className="mb-2 text-center text-base font-semibold text-gray-900">
            Thanks for sharing.
          </h2>
          <p className="text-center text-sm text-gray-500">
            Your feedback has been sent directly to {businessName}.
            <br />
            We take this seriously and will follow up.
          </p>
        </div>
      )}
    </Shell>
  );
}

function Shell({
  businessName,
  logoUrl,
  children,
}: {
  businessName: string;
  logoUrl: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-5 py-8">
        {/* Logo / business name */}
        <div className="mb-6 flex justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              className="h-12 max-w-[180px] object-contain"
            />
          ) : (
            <span className="text-lg font-bold text-gray-900">{businessName}</span>
          )}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white px-6 shadow-sm">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] text-gray-300">
          Powered by handled.
        </p>
      </div>
    </div>
  );
}
