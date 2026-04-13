"use client";

import { useState, useRef } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { trackReviewClick, trackReviewComplete } from "@/lib/pulse";

type Props = {
  siteId: string;
  businessName: string;
  logoUrl: string | null;
  googleReviewUrl: string | null;
  trade?: string | null;
  brandColor?: string | null;
  referralEnabled?: boolean;
  rewardAmountCents?: number | null;
  rewardType?: "cash" | "credit" | "gift_card" | null;
  repId?: string | null;
  repName?: string | null;
  existingLead?: { id: string; name: string; phone: string } | null;
};

type ReferralState = "idle" | "form" | "submitting" | "enrolled";

const DEFAULT_BRAND = "#10B981";

function rewardTypeLabel(type: "cash" | "credit" | "gift_card" | null | undefined): string {
  switch (type) {
    case "cash":
      return "cash";
    case "credit":
      return "in account credit";
    case "gift_card":
      return "as a gift card";
    default:
      return "";
  }
}

type Step = "rating" | "questions" | "feedback" | "result";

const EMOJIS = [
  { emoji: "😍", label: "Loved it", value: 5 },
  { emoji: "😊", label: "Really good", value: 4 },
  { emoji: "😐", label: "It was okay", value: 3 },
  { emoji: "😕", label: "Not great", value: 2 },
  { emoji: "😤", label: "Frustrated", value: 1 },
];

const STEP_PROGRESS: Record<Step, number> = {
  rating: 33,
  questions: 66,
  feedback: 100,
  result: 100,
};

export default function ReviewClient({
  siteId,
  businessName,
  logoUrl,
  googleReviewUrl,
  trade,
  brandColor,
  referralEnabled,
  rewardAmountCents,
  rewardType,
  repId,
  repName,
  existingLead,
}: Props) {
  const [step, setStep] = useState<Step>("rating");
  const [rating, setRating] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);
  const [professionalism, setProfessionalism] = useState("");
  const [communication, setCommunication] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);
  const [isPositive, setIsPositive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const emojiRowRef = useRef<HTMLDivElement>(null);

  // Referral enrollment state (thank-you page step 2)
  const [referralState, setReferralState] = useState<ReferralState>("idle");
  const [referralName, setReferralName] = useState("");
  const [referralPhone, setReferralPhone] = useState("");
  const [referralUrl, setReferralUrl] = useState<string | null>(null);
  const [referralError, setReferralError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const accent = brandColor && brandColor.trim() ? brandColor : DEFAULT_BRAND;
  const rewardDollars =
    rewardAmountCents != null && rewardAmountCents > 0
      ? Math.round(rewardAmountCents / 100)
      : null;
  const showReferralBlock = referralEnabled !== false; // default true if undefined
  const hasRewardCopy = rewardDollars != null && rewardType != null;

  const handleEnroll = async () => {
    if (!referralName.trim() || !referralPhone.trim()) {
      setReferralError("Name and phone are required.");
      return;
    }
    setReferralError("");
    setReferralState("submitting");
    try {
      const res = await fetch("/api/reviews/referral-enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          name: referralName.trim(),
          phone: referralPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReferralError(data.error || "Something went wrong. Please try again.");
        setReferralState("form");
        return;
      }
      setReferralUrl(data.referral_url);
      setReferralState("enrolled");
    } catch {
      setReferralError("Network error. Please try again.");
      setReferralState("form");
    }
  };

  // One-tap path: link carried a lead_id, so we already know who the
  // reviewer is and can enroll them without asking for name/phone again.
  const handleEnrollExistingLead = async () => {
    if (!existingLead) return;
    setReferralError("");
    setReferralState("submitting");
    try {
      const res = await fetch("/api/reviews/referral-enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          lead_id: existingLead.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReferralError(data.error || "Something went wrong. Please try again.");
        setReferralState("idle");
        return;
      }
      setReferralUrl(data.referral_url);
      setReferralState("enrolled");
    } catch {
      setReferralError("Network error. Please try again.");
      setReferralState("idle");
    }
  };

  const handleCopyLink = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {}
  };

  const handleRating = (value: number) => {
    setSelectedEmoji(value);
    setRating(value);
    trackReviewClick(siteId);
    setTimeout(() => setStep("questions"), 200);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: siteId, rating, professionalism, communication, feedback, rep_id: repId || undefined, rep_name: repName || undefined, lead_id: existingLead?.id || undefined }),
      });
      const data = await res.json();
      setIsPositive(data.is_positive);
      if (data.generated_review) {
        setGeneratedReview(data.generated_review);
      }
      trackReviewComplete(siteId);
      setStep("result");
    } catch {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Shell businessName={businessName} logoUrl={logoUrl} step="result">
        {/* Confirmation */}
        <div className="text-center" style={{ paddingTop: 24, paddingBottom: 8 }}>
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "#ECFDF5" }}
          >
            <Check className="h-7 w-7" style={{ color: "#10B981" }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 500, color: "#111827" }}>
            {existingLead ? `Thanks, ${existingLead.name.split(" ")[0]}!` : "Thank you!"}
          </h2>
          <p className="mt-2" style={{ fontSize: 14, color: "#6B7280" }}>
            Your review means a lot to {businessName}.
          </p>
        </div>

        {showReferralBlock && (
          <>
            {/* Divider */}
            <div
              style={{
                height: 1,
                background: "#F3F4F6",
                margin: "24px 0",
              }}
            />

            {/* Referral CTA block */}
            {(referralState === "idle" || (existingLead && referralState === "submitting")) && (
              <div style={{ paddingBottom: 8 }}>
                <h3
                  className="text-center"
                  style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 8 }}
                >
                  {hasRewardCopy
                    ? `Earn $${rewardDollars} for every friend you refer`
                    : `Know someone who needs ${trade || "help"}?`}
                </h3>
                <p
                  className="text-center"
                  style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 1.5 }}
                >
                  {hasRewardCopy
                    ? `When someone you refer books with ${businessName}, you get $${rewardDollars} ${rewardTypeLabel(rewardType)}. It's that simple.`
                    : `Send friends to ${businessName} and help your neighbors find someone they can trust.`}
                </p>
                <button
                  onClick={() => {
                    if (existingLead) {
                      handleEnrollExistingLead();
                    } else {
                      setReferralState("form");
                    }
                  }}
                  disabled={referralState === "submitting"}
                  style={{
                    display: "block",
                    width: "100%",
                    minHeight: 44,
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: accent,
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: referralState === "submitting" ? "default" : "pointer",
                    opacity: referralState === "submitting" ? 0.7 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (referralState !== "submitting") {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (referralState !== "submitting") {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                    }
                  }}
                >
                  {referralState === "submitting" ? "Setting up..." : "Count me in"}
                </button>
                {referralError && existingLead && (
                  <p style={{ fontSize: 12, color: "#DC2626", marginTop: 8, textAlign: "center" }}>
                    {referralError}
                  </p>
                )}
              </div>
            )}

            {/* Inline enrollment form (fallback when no lead_id on the URL) */}
            {!existingLead && (referralState === "form" || referralState === "submitting") && (
              <div style={{ paddingBottom: 8 }}>
                <h3
                  className="text-center"
                  style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 6 }}
                >
                  You&rsquo;re almost in
                </h3>
                <p
                  className="text-center"
                  style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}
                >
                  We&rsquo;ll generate your unique referral link.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    type="text"
                    value={referralName}
                    onChange={(e) => setReferralName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid #D1D5DB",
                      fontSize: 15,
                      color: "#111827",
                      outline: "none",
                    }}
                  />
                  <input
                    type="tel"
                    value={referralPhone}
                    onChange={(e) => setReferralPhone(e.target.value)}
                    placeholder="Mobile number"
                    autoComplete="tel"
                    inputMode="tel"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid #D1D5DB",
                      fontSize: 15,
                      color: "#111827",
                      outline: "none",
                    }}
                  />
                  {referralError && (
                    <p style={{ fontSize: 12, color: "#DC2626", margin: 0 }}>{referralError}</p>
                  )}
                  <button
                    onClick={handleEnroll}
                    disabled={referralState === "submitting"}
                    style={{
                      display: "block",
                      width: "100%",
                      minHeight: 44,
                      padding: "12px 20px",
                      borderRadius: 10,
                      border: "none",
                      background: accent,
                      color: "#FFFFFF",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: referralState === "submitting" ? "default" : "pointer",
                      opacity: referralState === "submitting" ? 0.7 : 1,
                      marginTop: 4,
                    }}
                  >
                    {referralState === "submitting" ? "Setting up..." : "Get my referral link"}
                  </button>
                  <button
                    onClick={() => {
                      setReferralState("idle");
                      setReferralError("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9CA3AF",
                      fontSize: 12,
                      cursor: "pointer",
                      padding: "4px 0",
                    }}
                  >
                    Never mind
                  </button>
                </div>
              </div>
            )}

            {/* Enrolled — show the link */}
            {referralState === "enrolled" && referralUrl && (
              <div style={{ paddingBottom: 8 }}>
                <div className="text-center" style={{ marginBottom: 16 }}>
                  <div
                    className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: "#ECFDF5" }}
                  >
                    <Check className="h-5 w-5" style={{ color: "#10B981" }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
                    You&rsquo;re in!
                  </h3>
                  <p style={{ fontSize: 13, color: "#6B7280" }}>
                    Share this link with friends who need {trade || "help"}.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    padding: "10px 12px",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 13,
                      color: "#374151",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    }}
                  >
                    {referralUrl}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    aria-label="Copy referral link"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: accent,
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {linkCopied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <a
                  href={`sms:?&body=${encodeURIComponent(
                    `Check out ${businessName} — I just used them and they were great: ${referralUrl}`
                  )}`}
                  style={{
                    display: "block",
                    width: "100%",
                    minHeight: 44,
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: `1.5px solid ${accent}`,
                    background: "#FFFFFF",
                    color: accent,
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "center",
                    textDecoration: "none",
                    lineHeight: "20px",
                    marginBottom: 8,
                  }}
                >
                  Share via text
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    referralUrl
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    minHeight: 44,
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "#1877F2",
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                    lineHeight: "20px",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="#FFFFFF"
                    aria-hidden="true"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                  Share on Facebook
                </a>
              </div>
            )}
          </>
        )}
      </Shell>
    );
  }

  return (
    <Shell businessName={businessName} logoUrl={logoUrl} step={step}>
      {/* Step 1: Rating */}
      {step === "rating" && (
        <div style={{ paddingTop: 28, paddingBottom: 24 }}>
          <h2 className="text-center" style={{ fontSize: 18, fontWeight: 500, color: "#111827", marginBottom: 32 }}>
            How was your experience
            <br />
            with {businessName}?
          </h2>
          <div
            ref={emojiRowRef}
            className="flex justify-center"
            style={{ gap: 8 }}
            role="radiogroup"
            aria-label="Rate your experience"
          >
            {EMOJIS.map((e) => (
              <button
                key={e.value}
                onClick={() => handleRating(e.value)}
                onKeyDown={(ev) => {
                  const idx = EMOJIS.findIndex((em) => em.value === e.value);
                  if (ev.key === "ArrowRight" && idx < EMOJIS.length - 1) {
                    (emojiRowRef.current?.children[idx + 1] as HTMLElement)?.focus();
                  } else if (ev.key === "ArrowLeft" && idx > 0) {
                    (emojiRowRef.current?.children[idx - 1] as HTMLElement)?.focus();
                  }
                }}
                role="radio"
                aria-checked={selectedEmoji === e.value}
                aria-label={e.label}
                tabIndex={0}
                className="flex flex-col items-center rounded-xl p-3"
                style={{
                  gap: 6,
                  transition: "transform 150ms ease",
                  transform: selectedEmoji === e.value ? "scale(1.15)" : "scale(1)",
                  outline: "none",
                }}
                onMouseEnter={(ev) => { (ev.currentTarget as HTMLElement).style.transform = "scale(1.15)"; }}
                onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.transform = selectedEmoji === e.value ? "scale(1.15)" : "scale(1)"; }}
                onMouseDown={(ev) => { (ev.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
                onMouseUp={(ev) => { (ev.currentTarget as HTMLElement).style.transform = "scale(1.15)"; }}
                onFocus={(ev) => { ev.currentTarget.style.outlineOffset = "2px"; ev.currentTarget.style.outline = "2px solid #10B981"; }}
                onBlur={(ev) => { ev.currentTarget.style.outline = "none"; }}
              >
                <span style={{ fontSize: 30 }}>{e.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 400, color: "#6B7280" }}>
                  {e.label}
                </span>
                {/* Selected underline bar */}
                <span
                  style={{
                    display: "block",
                    height: 3,
                    width: 24,
                    borderRadius: 2,
                    backgroundColor: selectedEmoji === e.value ? "#10B981" : "transparent",
                    transition: "background-color 150ms ease",
                    marginTop: 2,
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Quick questions */}
      {step === "questions" && (
        <div style={{ paddingTop: 28, paddingBottom: 24 }}>
          <div className="mb-6 flex justify-center">
            <span style={{ fontSize: 36 }}>
              {EMOJIS.find((e) => e.value === rating)?.emoji}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Professionalism */}
            <div>
              <p className="text-center" style={{ fontSize: 18, fontWeight: 500, color: "#111827", marginBottom: 12 }}>
                How professional was the team?
              </p>
              <div className="flex justify-center gap-2">
                {["Very", "Somewhat", "Not really"].map((option) => (
                  <PillButton
                    key={option}
                    label={option}
                    selected={professionalism === option}
                    onClick={() => setProfessionalism(option)}
                  />
                ))}
              </div>
            </div>

            {/* Communication */}
            <div>
              <p className="text-center" style={{ fontSize: 18, fontWeight: 500, color: "#111827", marginBottom: 12 }}>
                How was communication throughout?
              </p>
              <div className="flex justify-center gap-2">
                {["Great", "Okay", "Poor"].map((option) => (
                  <PillButton
                    key={option}
                    label={option}
                    selected={communication === option}
                    onClick={() => setCommunication(option)}
                  />
                ))}
              </div>
            </div>
          </div>

          {professionalism && communication && (
            <CtaButton onClick={() => setStep("feedback")} style={{ marginTop: 24 }}>
              Continue
            </CtaButton>
          )}
        </div>
      )}

      {/* Step 3: Feedback */}
      {step === "feedback" && (
        <div style={{ paddingTop: 28, paddingBottom: 24 }}>
          <div className="mb-6 flex justify-center">
            <span style={{ fontSize: 36 }}>
              {EMOJIS.find((e) => e.value === rating)?.emoji}
            </span>
          </div>
          <h2 className="text-center" style={{ fontSize: 18, fontWeight: 500, color: "#111827", marginBottom: 16 }}>
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
            className="w-full"
            style={{
              borderRadius: 12,
              border: "1px solid #D1D5DB",
              padding: "12px 16px",
              fontSize: 14,
              color: "#111827",
              outline: "none",
              transition: "border-color 200ms ease, box-shadow 200ms ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#10B981";
              e.currentTarget.style.boxShadow = "0 0 0 3px #ECFDF5";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#D1D5DB";
              e.currentTarget.style.boxShadow = "none";
            }}
            autoFocus
          />
          <CtaButton onClick={handleSubmit} disabled={submitting} style={{ marginTop: 12 }}>
            {submitting ? "Submitting..." : "Continue"}
          </CtaButton>
        </div>
      )}

      {/* Result - Happy */}
      {step === "result" && isPositive && (
        <div style={{ paddingTop: 28, paddingBottom: 24 }}>
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "#ECFDF5" }}>
              <Check className="h-7 w-7" style={{ color: "#10B981" }} />
            </div>
          </div>
          <h2 className="text-center" style={{ fontSize: 18, fontWeight: 500, color: "#111827", marginBottom: 24 }}>
            Thanks for the kind words!
          </h2>

          {generatedReview && (
            <>
              {/* Review text */}
              <div style={{ borderRadius: 12, border: "1px solid #D1D5DB", backgroundColor: "#F9FAFB", padding: 16, marginBottom: 12 }}>
                <textarea
                  value={generatedReview}
                  onChange={(e) => setGeneratedReview(e.target.value)}
                  rows={4}
                  className="w-full"
                  style={{
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    backgroundColor: "#FFFFFF",
                    padding: "8px 12px",
                    fontSize: 14,
                    color: "#111827",
                    outline: "none",
                    transition: "border-color 200ms ease, box-shadow 200ms ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#10B981";
                    e.currentTarget.style.boxShadow = "0 0 0 3px #ECFDF5";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#D1D5DB";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <p className="mt-2 text-center" style={{ fontSize: 13, color: "#9CA3AF" }}>
                  Feel free to edit before posting
                </p>
              </div>

              {/* Copy button */}
              <button
                onClick={async () => {
                  if (generatedReview) {
                    await navigator.clipboard.writeText(generatedReview);
                    setCopied(true);
                  }
                }}
                className="flex w-full items-center justify-center gap-2"
                style={{
                  borderRadius: 12,
                  minHeight: 44,
                  fontSize: 14,
                  fontWeight: 600,
                  transition: "all 200ms ease",
                  backgroundColor: copied ? "#ECFDF5" : "#FFFFFF",
                  color: copied ? "#047857" : "#111827",
                  border: copied ? "1px solid #10B981" : "1px solid #D1D5DB",
                  outline: "none",
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                onFocus={(e) => { e.currentTarget.style.outlineOffset = "2px"; e.currentTarget.style.outline = "2px solid #10B981"; }}
                onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy review
                  </>
                )}
              </button>

              {/* Go to Google */}
              {googleReviewUrl ? (
                <>
                  <p className="text-center" style={{ fontSize: 13, color: "#9CA3AF", margin: "12px 0" }}>
                    Then paste it on Google
                  </p>
                  <CtaButton as="a" href={googleReviewUrl} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(() => setDone(true), 2500)}>
                    Leave a review on Google
                    <ExternalLink className="h-4 w-4" />
                  </CtaButton>
                </>
              ) : (
                <p className="text-center" style={{ fontSize: 13, color: "#9CA3AF", marginTop: 12 }}>
                  Share this review wherever {businessName} collects reviews.
                </p>
              )}
            </>
          )}

          {!generatedReview && googleReviewUrl && (
            <CtaButton as="a" href={googleReviewUrl} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(() => setDone(true), 2500)}>
              Leave a review on Google
              <ExternalLink className="h-4 w-4" />
            </CtaButton>
          )}

          <button
            onClick={() => setDone(true)}
            className="w-full text-center"
            style={{ marginTop: 12, padding: 8, fontSize: 13, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", transition: "color 200ms ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#6B7280"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#9CA3AF"; }}
          >
            No thanks
          </button>
        </div>
      )}

      {step === "result" && !isPositive && (
        <div style={{ paddingTop: 28, paddingBottom: 24 }}>
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "#ECFDF5" }}>
              <Check className="h-7 w-7" style={{ color: "#10B981" }} />
            </div>
          </div>
          <h2 className="text-center" style={{ fontSize: 18, fontWeight: 500, color: "#111827", marginBottom: 8 }}>
            Thanks for sharing.
          </h2>
          <p className="text-center" style={{ fontSize: 14, color: "#6B7280" }}>
            Your feedback has been sent directly to {businessName}.
            <br />
            We take this seriously and will follow up.
          </p>
        </div>
      )}
    </Shell>
  );
}

/* ─── Shared Components ─── */

function ProgressBar({ step }: { step: Step }) {
  const pct = STEP_PROGRESS[step] || 33;
  return (
    <div style={{ height: 3, backgroundColor: "#E5E7EB", borderRadius: 0 }}>
      <div
        style={{
          height: 3,
          width: `${pct}%`,
          backgroundColor: "#10B981",
          borderRadius: 2,
          transition: "width 300ms ease",
        }}
      />
    </div>
  );
}

function PillButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 9999,
        minHeight: 40,
        paddingLeft: 16,
        paddingRight: 16,
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 200ms ease",
        backgroundColor: selected ? "#10B981" : "#FFFFFF",
        color: selected ? "#FFFFFF" : "#111827",
        border: selected ? "1px solid #10B981" : "1px solid #D1D5DB",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "#10B981";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "#D1D5DB";
        }
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onFocus={(e) => { e.currentTarget.style.outlineOffset = "2px"; e.currentTarget.style.outline = "2px solid #10B981"; }}
      onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
    >
      {label}
    </button>
  );
}

function CtaButton({
  children,
  onClick,
  disabled,
  style,
  as,
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  as?: "a";
  [key: string]: unknown;
}) {
  const baseStyle: React.CSSProperties = {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    minHeight: 44,
    fontSize: 14,
    fontWeight: 600,
    color: "#FFFFFF",
    backgroundColor: "#10B981",
    border: "none",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background-color 200ms ease, transform 150ms ease",
    outline: "none",
    textDecoration: "none",
    ...style,
  };

  const handlers = {
    onMouseEnter: (e: React.MouseEvent) => { if (!disabled) (e.currentTarget as HTMLElement).style.backgroundColor = "#059669"; },
    onMouseLeave: (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#10B981"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; },
    onMouseDown: (e: React.MouseEvent) => { if (!disabled) (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; },
    onMouseUp: (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; },
    onFocus: (e: React.FocusEvent) => { (e.currentTarget as HTMLElement).style.outlineOffset = "2px"; (e.currentTarget as HTMLElement).style.outline = "2px solid #10B981"; },
    onBlur: (e: React.FocusEvent) => { (e.currentTarget as HTMLElement).style.outline = "none"; },
  };

  if (as === "a") {
    return (
      <a style={baseStyle} {...handlers} {...rest} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} style={baseStyle} {...handlers}>
      {children}
    </button>
  );
}

function Shell({
  businessName,
  logoUrl,
  step,
  children,
}: {
  businessName: string;
  logoUrl: string | null;
  step: Step;
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F9FAFB" }}>
      <div className="mx-auto" style={{ maxWidth: 448, padding: "32px 20px" }}>
        {/* Logo / business name */}
        <div className="flex justify-center" style={{ marginBottom: 16 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              style={{ width: 64, objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{businessName}</span>
          )}
        </div>

        {/* Card */}
        <div
          style={{
            borderRadius: 16,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          {/* Progress bar flush with top */}
          <ProgressBar step={step} />

          {/* Card content */}
          <div style={{ padding: "28px 32px 24px" }}>
            {children}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center" style={{ fontSize: 13, color: "#9CA3AF", marginTop: 16 }}>
          Powered by handled.
        </p>
      </div>
    </div>
  );
}
