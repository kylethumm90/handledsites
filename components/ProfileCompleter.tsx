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

type ChatMsg = { from: "bot" | "user"; text: string };

const BotAvatar = () => (
  <img src="/handled-favicon.png" alt="" style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1 }} />
);

const HeaderAvatar = () => (
  <img src="/handled-favicon.png" alt="" style={{ width: 28, height: 28, borderRadius: 7 }} />
);

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

  const [hidden, setHidden] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [step, setStep] = useState(-1);
  const [typing, setTyping] = useState(false);
  const [log, setLog] = useState<ChatMsg[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [inputReady, setInputReady] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const greetingDone = useRef(false);
  const firstQuestionDone = useRef(false);

  const q = step >= 0 && step < questions.length ? questions[step] : null;
  const totalSteps = questions.length;
  const progress = totalSteps > 0 ? Math.min((Math.max(step, 0) / totalSteps) * 100, 100) : 100;
  const isDone = step >= questions.length && !typing;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [log, typing, inputReady]);

  // Greeting sequence
  useEffect(() => {
    if (questions.length === 0 || minimized || greetingDone.current) return;
    greetingDone.current = true;
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setLog([{
        from: "bot",
        text: `Hey! Let's finish setting up ${businessName}. These answers fill in your site so it's ready for customers.`,
      }]);
      setStep(0);

      // Chain: pause → typing → first question → input
      setTimeout(() => {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          setLog((p) => [...p, { from: "bot", text: questions[0].message }]);
          setTimeout(() => {
            setInputReady(true);
            firstQuestionDone.current = true;
            inputRef.current?.focus();
          }, 350);
        }, 1100);
      }, 400);
    }, 1300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimized]);

  // Subsequent questions (step > 0)
  const prevStepRef = useRef(-1);
  useEffect(() => {
    if (step <= 0 || step === prevStepRef.current) return;
    prevStepRef.current = step;

    if (step >= questions.length) {
      // Done
      setTyping(true);
      setInputReady(false);
      setTimeout(() => {
        setTyping(false);
        setLog((p) => [...p, { from: "bot", text: "That's everything. Your site is ready to go." }]);
      }, 800 + Math.random() * 600);
      return;
    }

    setTyping(true);
    setInputReady(false);
    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      setTyping(false);
      setLog((p) => [...p, { from: "bot", text: questions[step].message }]);
      setTimeout(() => {
        setInputReady(true);
        inputRef.current?.focus();
      }, 350);
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const saveAnswers = useCallback(async (finalAnswers: Record<string, string | number | string[]>) => {
    try {
      await fetch("/api/contractor/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAnswers),
      });
    } catch {
      // Silent fail
    }
  }, []);

  const send = useCallback(() => {
    if (!q || !inputVal.trim()) return;
    const raw = inputVal.trim();
    const value = q.parse ? q.parse(raw) : raw;
    const displayText = Array.isArray(value) ? value.join(", ") : String(value);

    const newAnswers = { ...answers, [q.field]: value };
    setAnswers(newAnswers);
    setLog((p) => [...p, { from: "user", text: displayText }]);
    setInputVal("");
    setInputReady(false);

    const nextStep = step + 1;
    if (nextStep >= questions.length) {
      saveAnswers(newAnswers);
    }
    setStep(nextStep);
  }, [q, inputVal, answers, step, questions.length, saveAnswers]);

  const handleSkip = useCallback(() => {
    if (!q) return;
    setLog((p) => [...p, { from: "user", text: q.skipLabel || "Skipped" }]);
    setInputVal("");
    setInputReady(false);

    const nextStep = step + 1;
    if (nextStep >= questions.length) {
      saveAnswers(answers);
    }
    setStep(nextStep);
  }, [q, step, questions.length, answers, saveAnswers]);

  if (questions.length === 0 || hidden) return null;

  return (
    <>
      <style>{`
        @keyframes pcDotUp {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-4px); opacity: 0.85; }
        }
        @keyframes pcSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pc-dot { width: 5px; height: 5px; border-radius: 50%; background: #999; display: inline-block; animation: pcDotUp 1.2s infinite ease-in-out; }
        .pc-msg { animation: pcSlideUp 0.28s ease both; }
        .pc-ci:focus { outline: none; border-color: #bbb; }
      `}</style>

      <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, overflow: "hidden", background: "#fff", marginBottom: 20 }}>
        {/* Header */}
        <div
          onClick={() => setMinimized((m) => !m)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", userSelect: "none" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <HeaderAvatar />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111", lineHeight: 1.2 }}>handled.</div>
              <div style={{ fontSize: 11, color: "#999", lineHeight: 1.2, marginTop: 1 }}>{isDone ? "Profile complete" : "Setting up your profile"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#3574d1", fontWeight: 600 }}>
              {isDone ? "Done" : `${Math.max(step, 0) + 1} of ${totalSteps}`}
            </span>
            <button onClick={(e) => { e.stopPropagation(); setHidden(true); }} style={{ background: "none", border: "none", fontSize: 12, color: "#ccc", cursor: "pointer", padding: 0 }}>Later</button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round"
              style={{ transform: minimized ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s ease" }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: "#f0f0f0" }}>
          <div style={{ height: "100%", background: "#3574d1", width: `${isDone ? 100 : progress}%`, transition: "width 0.5s ease" }} />
        </div>

        {/* Collapsible body */}
        {!minimized && (
          <>
            {/* Context banner */}
            {!isDone && (
              <div style={{ padding: "9px 14px", fontSize: 12, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", lineHeight: 1.45 }}>
                Your site needs this info to work properly. Without it, pages show placeholder content and your contact info won&apos;t be visible to customers.
              </div>
            )}

            {/* Chat area */}
            <div ref={scrollRef} style={{ padding: "14px 14px 6px", maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {log.map((m, i) => (
                m.from === "bot" ? (
                  <div key={i} className="pc-msg" style={{ display: "flex", alignItems: "flex-start", gap: 7, maxWidth: "88%" }}>
                    <BotAvatar />
                    <div style={{ background: "#f3f3f3", color: "#333", padding: "8px 11px", borderRadius: "3px 10px 10px 10px", fontSize: 13, lineHeight: 1.5 }}>{m.text}</div>
                  </div>
                ) : (
                  <div key={i} className="pc-msg" style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ background: "#111", color: "#fff", padding: "8px 11px", borderRadius: "10px 10px 3px 10px", fontSize: 13, lineHeight: 1.5, maxWidth: "80%" }}>{m.text}</div>
                  </div>
                )
              ))}
              {typing && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7, padding: "4px 0" }}>
                  <BotAvatar />
                  <div style={{ background: "#f3f3f3", padding: "9px 13px", borderRadius: "3px 10px 10px 10px", display: "flex", gap: 4 }}>
                    <span className="pc-dot" style={{ animationDelay: "0ms" }} />
                    <span className="pc-dot" style={{ animationDelay: "150ms" }} />
                    <span className="pc-dot" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            {inputReady && q?.inputType && !isDone && (
              <div className="pc-msg" style={{ padding: "6px 12px 12px", borderTop: "1px solid #f2f2f2", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    ref={inputRef}
                    type={q.inputType}
                    placeholder={q.placeholder}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    className="pc-ci"
                    style={{ flex: 1, padding: "8px 11px", borderRadius: 7, border: "1px solid #e0e0e0", fontSize: 13, color: "#111", background: "#fafafa", transition: "border-color 0.15s ease" }}
                    autoFocus
                  />
                  <button
                    onClick={send}
                    disabled={!inputVal.trim()}
                    style={{ width: 32, height: 32, borderRadius: 7, background: "#111", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: inputVal.trim() ? "pointer" : "default", flexShrink: 0, opacity: inputVal.trim() ? 1 : 0.3 }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
                {q.skipLabel && (
                  <button onClick={handleSkip} style={{ background: "none", border: "none", fontSize: 11, color: "#bbb", cursor: "pointer", padding: 0, textAlign: "center" }}>{q.skipLabel}</button>
                )}
              </div>
            )}

            {/* Done CTA */}
            {isDone && (
              <div className="pc-msg" style={{ padding: "6px 12px 12px", borderTop: "1px solid #f2f2f2" }}>
                <a href="/contractor/sites" style={{ display: "block", width: "100%", padding: "9px", borderRadius: 7, background: "#111", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
                  View your site
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
