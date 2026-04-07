"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type ProfileData = {
  owner_name: string | null;
  years_in_business: number | null;
  service_areas: string[] | null;
  license_number: string | null;
  hero_tagline: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_nextdoor: string | null;
};

type Question = {
  id: string;
  field: keyof ProfileData;
  message: string;
  placeholder: string;
  inputType: "text" | "number" | "tel";
  skipLabel?: string;
  parse?: (value: string) => string | number | string[];
};

const ALL_QUESTIONS: Question[] = [
  {
    id: "owner_name",
    field: "owner_name",
    message: "First off — what's your name? We'll use this on your website's about section.",
    placeholder: "e.g. John Martinez",
    inputType: "text",
  },
  {
    id: "years_in_business",
    field: "years_in_business",
    message: "How many years have you been in business? This builds trust with customers.",
    placeholder: "Just a number is fine",
    inputType: "number",
    parse: (v) => parseInt(v, 10) || 0,
  },
  {
    id: "service_areas",
    field: "service_areas",
    message: "What cities or areas do you serve? Separate them with commas and we'll show them on your site.",
    placeholder: "e.g. Austin, Round Rock, Cedar Park",
    inputType: "text",
    parse: (v) => v.split(",").map((s) => s.trim()).filter(Boolean),
  },
  {
    id: "hero_tagline",
    field: "hero_tagline",
    message: "Got a tagline or slogan? This shows as the main headline on your website.",
    placeholder: "e.g. Fast, reliable HVAC service you can trust",
    inputType: "text",
    skipLabel: "Skip — I'll think of one later",
  },
  {
    id: "license_number",
    field: "license_number",
    message: "Do you have a license number? We'll display it on your site for credibility.",
    placeholder: "e.g. TACLA12345C",
    inputType: "text",
    skipLabel: "Skip — I don't have one",
  },
  {
    id: "social_instagram",
    field: "social_instagram",
    message: "Got an Instagram? Drop your profile URL and we'll link it on your sites.",
    placeholder: "e.g. https://instagram.com/yourbusiness",
    inputType: "text",
    skipLabel: "No Instagram",
  },
  {
    id: "social_facebook",
    field: "social_facebook",
    message: "How about a Facebook page?",
    placeholder: "e.g. https://facebook.com/yourbusiness",
    inputType: "text",
    skipLabel: "No Facebook",
  },
];

type ChatMsg = { type: "bot" | "user"; text: string };

export default function ProfileCompleter({
  businessName,
  existing,
}: {
  businessName: string;
  existing: ProfileData;
}) {
  const questions = ALL_QUESTIONS.filter((q) => {
    const val = existing[q.field];
    if (val === null || val === undefined) return true;
    if (Array.isArray(val) && val.length === 0) return true;
    if (typeof val === "string" && val.trim() === "") return true;
    return false;
  });

  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(true);
  const [inputReady, setInputReady] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatLog, setChatLog] = useState<ChatMsg[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({});
  const [phase, setPhase] = useState<"greeting" | "questions" | "saving" | "done">("greeting");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);

  const currentQ = step < questions.length ? questions[step] : null;
  const totalSteps = questions.length;
  const progress = totalSteps > 0 ? Math.min((step / totalSteps) * 100, 100) : 100;

  const randomDelay = () => 1000 + Math.random() * 600;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatLog, typing, inputReady]);

  // Greeting → first question sequence
  useEffect(() => {
    if (initRef.current || questions.length === 0) return;
    initRef.current = true;

    // Show typing, then greeting
    const t1 = setTimeout(() => {
      setTyping(false);
      setChatLog([{
        type: "bot",
        text: `Hey! Let's finish setting up ${businessName}. Just a few quick questions to make your site look great.`,
      }]);
      setPhase("questions");
    }, 1400);

    return () => clearTimeout(t1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After greeting, show typing then first question
  useEffect(() => {
    if (phase !== "questions" || chatLog.length !== 1 || step !== 0) return;

    const t1 = setTimeout(() => setTyping(true), 600);
    const t2 = setTimeout(() => {
      setTyping(false);
      setChatLog((prev) => [...prev, { type: "bot", text: questions[0].message }]);
    }, 600 + randomDelay());
    const t3 = setTimeout(() => {
      setInputReady(true);
      inputRef.current?.focus();
    }, 600 + randomDelay() + 400);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, chatLog.length]);

  // Advance to next question after step changes (not for step 0)
  const prevStepRef = useRef(0);
  useEffect(() => {
    if (step === 0 || step === prevStepRef.current) return;
    prevStepRef.current = step;

    if (step >= questions.length) {
      // Done — show completion
      setTyping(true);
      setInputReady(false);
      const delay = randomDelay();
      const t = setTimeout(() => {
        setTyping(false);
        setChatLog((prev) => [...prev, {
          type: "bot",
          text: "You're all set! Your site is going to look great. Head over to Sites to check it out.",
        }]);
        setPhase("done");
      }, delay);
      return () => clearTimeout(t);
    }

    // Next question
    setTyping(true);
    setInputReady(false);
    const delay = randomDelay();
    const t = setTimeout(() => {
      setTyping(false);
      setChatLog((prev) => [...prev, { type: "bot", text: questions[step].message }]);
      setTimeout(() => {
        setInputReady(true);
        inputRef.current?.focus();
      }, 400);
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const saveAnswers = useCallback(async (finalAnswers: Record<string, string | number | string[]>) => {
    setPhase("saving");
    try {
      await fetch("/api/contractor/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAnswers),
      });
    } catch {
      // Silent fail
    }
    setPhase("done");
  }, []);

  const handleSubmit = useCallback(() => {
    if (!currentQ || !inputValue.trim()) return;

    const raw = inputValue.trim();
    const value = currentQ.parse ? currentQ.parse(raw) : raw;
    const displayText = Array.isArray(value) ? value.join(", ") : String(value);

    const newAnswers = { ...answers, [currentQ.field]: value };
    setAnswers(newAnswers);
    setChatLog((prev) => [...prev, { type: "user", text: displayText }]);
    setInputValue("");
    setInputReady(false);

    const nextStep = step + 1;
    if (nextStep >= questions.length) {
      saveAnswers(newAnswers);
    }
    setStep(nextStep);
  }, [currentQ, inputValue, answers, step, questions.length, saveAnswers]);

  const handleSkip = useCallback(() => {
    if (!currentQ) return;

    setChatLog((prev) => [...prev, { type: "user", text: currentQ.skipLabel || "Skipped" }]);
    setInputValue("");
    setInputReady(false);

    const nextStep = step + 1;
    if (nextStep >= questions.length) {
      saveAnswers(answers);
    }
    setStep(nextStep);
  }, [currentQ, step, questions.length, answers, saveAnswers]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Nothing to ask or dismissed
  if (questions.length === 0 || dismissed) return null;

  return (
    <>
      <style>{`
        @keyframes pc-dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pc-msgSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pc-inputFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pc-msg-enter { animation: pc-msgSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .pc-input-enter { animation: pc-inputFadeIn 0.3s ease forwards; }
        .pc-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #9ca3af; display: inline-block;
          animation: pc-dotBounce 1.2s infinite ease-in-out;
        }
        .pc-progress-fill { transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
        .pc-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        .pc-send:hover:not(:disabled) { background: #2563eb; transform: scale(1.05); }
        .pc-send:active:not(:disabled) { transform: scale(0.97); }
      `}</style>

      <div className="mb-8" style={{
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #e8ecf0",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #f0f2f5",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "white", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 600,
            }}>H</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", letterSpacing: "-0.01em" }}>handled.</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>Setting up your profile</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontSize: 12, fontWeight: 500, color: "#6b7280",
              background: "#f3f4f6", padding: "4px 10px", borderRadius: 20,
            }}>
              {phase === "done" ? "Done" : `${Math.min(step + 1, totalSteps)} of ${totalSteps}`}
            </span>
            <button
              onClick={() => setDismissed(true)}
              style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}
            >
              Later
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#f0f2f5", width: "100%" }}>
          <div className="pc-progress-fill" style={{
            height: "100%",
            background: "linear-gradient(90deg, #3b82f6, #2563eb)",
            borderRadius: 3,
            width: `${phase === "done" ? 100 : progress}%`,
          }} />
        </div>

        {/* Chat area */}
        <div ref={scrollRef} style={{
          padding: "20px 20px 12px",
          minHeight: 240, maxHeight: 360,
          overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          {chatLog.map((msg, i) => (
            msg.type === "bot" ? (
              <div key={i} className="pc-msg-enter" style={{ display: "flex", alignItems: "flex-start", gap: 8, maxWidth: "88%" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600,
                }}>H</div>
                <div style={{
                  background: "#f3f4f6", color: "#1f2937",
                  padding: "10px 14px", borderRadius: "4px 14px 14px 14px",
                  fontSize: 14, lineHeight: 1.5,
                }}>{msg.text}</div>
              </div>
            ) : (
              <div key={i} className="pc-msg-enter" style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#ffffff",
                  padding: "10px 14px", borderRadius: "14px 14px 4px 14px",
                  fontSize: 14, lineHeight: 1.5, maxWidth: "78%",
                }}>{msg.text}</div>
              </div>
            )
          ))}

          {/* Typing indicator */}
          {typing && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600,
              }}>H</div>
              <div style={{
                background: "#f3f4f6", padding: "12px 16px",
                borderRadius: "4px 14px 14px 14px",
                display: "flex", gap: 4, alignItems: "center",
              }}>
                <span className="pc-dot" style={{ animationDelay: "0ms" }} />
                <span className="pc-dot" style={{ animationDelay: "160ms" }} />
                <span className="pc-dot" style={{ animationDelay: "320ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input area — only when ready */}
        {inputReady && currentQ && phase === "questions" && (
          <div className="pc-input-enter" style={{
            padding: "12px 16px 16px", borderTop: "1px solid #f0f2f5",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                ref={inputRef}
                type={currentQ.inputType}
                placeholder={currentQ.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pc-input"
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  border: "1.5px solid #e5e7eb", fontSize: 14,
                  color: "#111827", background: "#fafbfc",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                autoFocus
              />
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                className="pc-send"
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "#3b82f6", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, cursor: inputValue.trim() ? "pointer" : "default",
                  opacity: inputValue.trim() ? 1 : 0.4,
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            {currentQ.skipLabel && (
              <button
                onClick={handleSkip}
                style={{
                  background: "none", border: "none", fontSize: 12,
                  color: "#9ca3af", cursor: "pointer", padding: "2px 0",
                  textAlign: "center",
                }}
              >
                {currentQ.skipLabel}
              </button>
            )}
          </div>
        )}

        {/* Final state CTA */}
        {phase === "done" && !typing && (
          <div className="pc-input-enter" style={{
            padding: "12px 16px 16px", borderTop: "1px solid #f0f2f5",
          }}>
            <a
              href="/contractor/sites"
              style={{
                display: "block", width: "100%", padding: "12px 20px",
                borderRadius: 10, textAlign: "center",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "white", fontSize: 14, fontWeight: 600,
                textDecoration: "none", letterSpacing: "-0.01em",
              }}
            >
              View your site &rarr;
            </a>
          </div>
        )}
      </div>
    </>
  );
}
