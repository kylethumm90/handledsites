"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TRADE_SERVICES, Trade } from "@/lib/constants";

type ProfileData = {
  owner_name: string | null;
  years_in_business: number | null;
  service_areas: string[] | null;
  license_number: string | null;
  hero_tagline: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_nextdoor: string | null;
  trade: string | null;
  services: string[] | null;
  about_bio: string | null;
  city: string | null;
  state: string | null;
};

type Question = {
  id: string;
  field: string;
  message: string;
  placeholder: string;
  inputType: "text" | "number" | "tel" | "multi-select";
  skipLabel?: string;
  parse?: (value: string) => string | number | string[];
  options?: string[];
};

function buildQuestions(trade: string | null): Question[] {
  const tradeServices = trade ? TRADE_SERVICES[trade as Trade] || [] : [];

  const qs: Question[] = [];

  // Services — only if we know the trade and have options
  if (tradeServices.length > 0) {
    qs.push({
      id: "services",
      field: "services",
      message: "What services do you offer? Tap all that apply.",
      placeholder: "",
      inputType: "multi-select",
      options: tradeServices,
    });
  }

  // About bio differentiator
  qs.push({
    id: "about_bio",
    field: "about_bio",
    message: "What makes your business different? We'll use this to write your website's about section.",
    placeholder: "e.g. Family owned for 12 years, licensed and insured, free estimates on every job",
    inputType: "text",
    skipLabel: "Skip — I'll add this later",
  });

  // Original questions
  qs.push(
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
  );

  return qs;
}

type ChatMsg = { from: "bot" | "user"; text: string };

const StellaAvatar = ({ size = 26 }: { size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: size / 2, background: "#3574d1", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.42, fontWeight: 700, flexShrink: 0,
  }}>S</div>
);

export default function ProfileCompleter({
  businessName,
  existing,
}: {
  businessName: string;
  existing: ProfileData;
}) {
  const allQuestions = buildQuestions(existing.trade);
  const questions = allQuestions.filter((q) => {
    const val = existing[q.field as keyof ProfileData];
    if (val === null || val === undefined) return true;
    if (Array.isArray(val) && val.length === 0) return true;
    if (typeof val === "string" && val.trim() === "") return true;
    return false;
  });

  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [step, setStep] = useState(-1);
  const [typing, setTyping] = useState(false);
  const [log, setLog] = useState<ChatMsg[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [inputReady, setInputReady] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({});
  const [started, setStarted] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = step >= 0 && step < questions.length ? questions[step] : null;
  const totalSteps = questions.length;
  const progress = totalSteps > 0 ? Math.min((Math.max(step, 0) / totalSteps) * 100, 100) : 100;
  const isDone = step >= questions.length && !typing && !generating;

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [log, typing, inputReady]);

  // Start greeting sequence when modal first opens
  useEffect(() => {
    if (!open || started) return;
    setStarted(true);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setLog([{
        from: "bot",
        text: `Hey! Let's finish setting up ${businessName}. These answers fill in your site so it's ready for customers.`,
      }]);
      setStep(0);
    }, 1300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, started]);

  // First question after greeting
  const greetingFiredRef = useRef(false);
  useEffect(() => {
    if (step !== 0 || !open || greetingFiredRef.current) return;
    if (log.length !== 1) return;
    greetingFiredRef.current = true;

    const t1 = setTimeout(() => setTyping(true), 500);
    const t2 = setTimeout(() => {
      setTyping(false);
      setLog((p) => [...p, { from: "bot", text: questions[0].message }]);
      setTimeout(() => {
        setInputReady(true);
        setSelectedOptions([]);
        inputRef.current?.focus();
      }, 400);
    }, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, log.length, open]);

  // Subsequent questions
  const prevStepRef = useRef(-1);
  useEffect(() => {
    if (step <= 0 || step === prevStepRef.current) return;
    prevStepRef.current = step;

    if (step >= questions.length) {
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
    const delay = 900 + Math.random() * 500;
    setTimeout(() => {
      setTyping(false);
      setLog((p) => [...p, { from: "bot", text: questions[step].message }]);
      setTimeout(() => {
        setInputReady(true);
        setSelectedOptions([]);
        inputRef.current?.focus();
      }, 400);
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const generateBio = useCallback(async (differentiator: string, currentAnswers: Record<string, string | number | string[]>): Promise<string> => {
    try {
      const services = (currentAnswers.services as string[]) || existing.services || [];
      const res = await fetch("/api/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          trade: existing.trade,
          city: existing.city,
          state: existing.state,
          services,
          differentiator,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        return d.bio || differentiator;
      }
    } catch { /* fallback below */ }
    return differentiator;
  }, [businessName, existing]);

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

  const advanceStep = useCallback((newAnswers: Record<string, string | number | string[]>) => {
    const nextStep = step + 1;
    if (nextStep >= questions.length) {
      saveAnswers(newAnswers);
    }
    setStep(nextStep);
  }, [step, questions.length, saveAnswers]);

  const send = useCallback(async () => {
    if (!q) return;

    if (q.inputType === "multi-select") {
      // Multi-select submit
      if (selectedOptions.length === 0) return;
      const displayText = selectedOptions.join(", ");
      const newAnswers = { ...answers, [q.field]: selectedOptions };
      setAnswers(newAnswers);
      setLog((p) => [...p, { from: "user", text: displayText }]);
      setSelectedOptions([]);
      setInputReady(false);
      advanceStep(newAnswers);
      return;
    }

    // Text input submit
    if (!inputVal.trim()) return;
    const raw = inputVal.trim();
    const value = q.parse ? q.parse(raw) : raw;
    const displayText = Array.isArray(value) ? value.join(", ") : String(value);

    setLog((p) => [...p, { from: "user", text: displayText }]);
    setInputVal("");
    setInputReady(false);

    // Bio generation for about_bio field
    if (q.field === "about_bio") {
      setGenerating(true);
      setTyping(true);
      const newAnswers = { ...answers };
      const generatedBio = await generateBio(raw, newAnswers);
      newAnswers[q.field] = generatedBio;
      setAnswers(newAnswers);
      setTyping(false);
      setGenerating(false);
      advanceStep(newAnswers);
      return;
    }

    const newAnswers = { ...answers, [q.field]: value };
    setAnswers(newAnswers);
    advanceStep(newAnswers);
  }, [q, inputVal, selectedOptions, answers, advanceStep, generateBio]);

  const handleSkip = useCallback(() => {
    if (!q) return;
    setLog((p) => [...p, { from: "user", text: q.skipLabel || "Skipped" }]);
    setInputVal("");
    setInputReady(false);
    setSelectedOptions([]);
    advanceStep(answers);
  }, [q, answers, advanceStep]);

  const toggleOption = useCallback((option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }, []);

  const closeModal = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 280);
  }, []);

  if (questions.length === 0 || dismissed) return null;

  return (
    <>
      <style>{`
        @keyframes pcDotPulse {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.25; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pcMsgUp {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pcSheetUp {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pcSheetDown {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(20px); }
        }
        @keyframes pcBgIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pcBgOut { from { opacity: 1; } to { opacity: 0; } }
        .pc-td { width: 6px; height: 6px; border-radius: 50%; background: #8e8e93; display: inline-block; animation: pcDotPulse 1.3s infinite ease-in-out; }
        .pc-ma { animation: pcMsgUp 0.25s cubic-bezier(0.25, 1, 0.5, 1) both; }
        .pc-sheet-open { animation: pcSheetUp 0.34s cubic-bezier(0.32, 0.72, 0, 1) both; }
        .pc-sheet-close { animation: pcSheetDown 0.28s cubic-bezier(0.32, 0.72, 0, 1) both; }
        .pc-bg-open { animation: pcBgIn 0.28s ease both; }
        .pc-bg-close { animation: pcBgOut 0.28s ease both; }
        .pc-ci:focus { outline: none; }
        .pc-ci::placeholder { color: #8e8e93; }
        .pc-sb:active { transform: scale(0.9); }
      `}</style>

      {/* Collapsed card on Dashboard */}
      <div
        onClick={() => setOpen(true)}
        style={{
          border: "1px solid #e5e5ea", borderRadius: 12, overflow: "hidden",
          cursor: "pointer", background: "#fff", marginBottom: 16,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StellaAvatar size={30} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1c1e", lineHeight: 1.2 }}>Stella from handled.</div>
              <div style={{ fontSize: 11, color: "#8e8e93", lineHeight: 1.2, marginTop: 1 }}>
                {isDone ? "Profile complete" : "Setting up your profile"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#3574d1", fontWeight: 600 }}>
              {isDone ? "Done" : `${Math.max(step, 0) + 1} of ${totalSteps}`}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
              style={{ background: "none", border: "none", fontSize: 12, color: "#c7c7cc", cursor: "pointer", padding: 0 }}
            >
              Later
            </button>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </div>
        </div>
        <div style={{ height: 2, background: "#f2f2f7" }}>
          <div style={{ height: "100%", background: "#3574d1", width: `${isDone ? 100 : progress}%`, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* Modal overlay */}
      {open && (
        <div
          className={closing ? "pc-bg-close" : "pc-bg-open"}
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.32)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            className={closing ? "pc-sheet-close" : "pc-sheet-open"}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "calc(100% - 24px)", maxWidth: 480, maxHeight: "70vh",
              background: "#fff", borderRadius: 16,
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 10px", borderBottom: "1px solid #f2f2f7" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <StellaAvatar size={36} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1c1c1e", lineHeight: 1.2 }}>Stella from handled.</div>
                  <div style={{ fontSize: 12, color: "#8e8e93", lineHeight: 1.2, marginTop: 1 }}>
                    {isDone ? "Profile complete" : "Setting up your profile"}
                  </div>
                </div>
              </div>
              <button onClick={closeModal} style={{
                width: 30, height: 30, borderRadius: 15, background: "#f2f2f7", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: "#f2f2f7" }}>
              <div style={{ height: "100%", background: "#3574d1", width: `${isDone ? 100 : progress}%`, transition: "width 0.5s ease" }} />
            </div>

            {/* Context banner */}
            {step >= 0 && step < questions.length && !isDone && (
              <div style={{ padding: "10px 16px", fontSize: 12, color: "#8e8e93", lineHeight: 1.4, background: "#fafafa", borderBottom: "1px solid #f2f2f7" }}>
                Your site needs this info to work properly. Without it, pages show placeholder content and your contact info won&apos;t be visible to customers.
              </div>
            )}

            {/* Chat body */}
            <div ref={scrollRef} style={{
              flex: 1, overflowY: "auto", padding: "16px 12px 8px",
              display: "flex", flexDirection: "column", gap: 3,
              WebkitOverflowScrolling: "touch",
            }}>
              {log.map((m, i) => {
                const isBot = m.from === "bot";
                const isLast = i === log.length - 1 || log[i + 1]?.from !== m.from;
                return isBot ? (
                  <div key={i} className="pc-ma" style={{ display: "flex", alignItems: "flex-end", gap: 6, maxWidth: "82%", marginBottom: 2 }}>
                    <StellaAvatar size={26} />
                    <div style={{
                      background: "#f2f2f7", color: "#1c1c1e", padding: "10px 14px",
                      borderRadius: 18, fontSize: 15, lineHeight: 1.45,
                      ...(isLast ? { borderBottomLeftRadius: 4 } : {}),
                    }}>{m.text}</div>
                  </div>
                ) : (
                  <div key={i} className="pc-ma" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
                    <div style={{
                      background: "#3574d1", color: "#fff", padding: "10px 14px",
                      borderRadius: 18, fontSize: 15, lineHeight: 1.45, maxWidth: "78%",
                      ...(isLast ? { borderBottomRightRadius: 4 } : {}),
                    }}>{m.text}</div>
                  </div>
                );
              })}
              {typing && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 2 }}>
                  <StellaAvatar size={26} />
                  <div style={{ background: "#f2f2f7", padding: "12px 16px", borderRadius: 18, display: "flex", gap: 5, alignItems: "center" }}>
                    <span className="pc-td" style={{ animationDelay: "0ms" }} />
                    <span className="pc-td" style={{ animationDelay: "160ms" }} />
                    <span className="pc-td" style={{ animationDelay: "320ms" }} />
                  </div>
                </div>
              )}
              <div style={{ height: 1 }} />
            </div>

            {/* Multi-select input (services) */}
            {inputReady && q?.inputType === "multi-select" && !isDone && (
              <div className="pc-ma" style={{ padding: "8px 10px 14px", borderTop: "1px solid #f2f2f7", background: "#fff", flexShrink: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                  {(q.options || []).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => toggleOption(opt)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        border: selectedOptions.includes(opt) ? "1.5px solid #3574d1" : "1.5px solid #e5e5ea",
                        background: selectedOptions.includes(opt) ? "#3574d1" : "#fff",
                        color: selectedOptions.includes(opt) ? "#fff" : "#1c1c1e",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        textAlign: "left",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={send}
                  disabled={selectedOptions.length === 0}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 10, background: "#3574d1",
                    color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                    opacity: selectedOptions.length > 0 ? 1 : 0.35,
                    transition: "opacity 0.15s",
                  }}
                >
                  Done ({selectedOptions.length} selected)
                </button>
              </div>
            )}

            {/* Text input bar */}
            {inputReady && q && q.inputType !== "multi-select" && !isDone && (
              <div className="pc-ma" style={{ padding: "8px 10px 14px", borderTop: "1px solid #f2f2f7", background: "#fff", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f2f2f7", borderRadius: 22, padding: "4px 4px 4px 16px" }}>
                  <input
                    ref={inputRef}
                    type={q.inputType}
                    placeholder={q.placeholder}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    className="pc-ci"
                    style={{ flex: 1, border: "none", background: "transparent", fontSize: 16, color: "#1c1c1e", padding: "8px 0" }}
                    autoFocus
                  />
                  <button
                    onClick={send}
                    disabled={!inputVal.trim()}
                    className="pc-sb"
                    style={{
                      width: 34, height: 34, borderRadius: 17, background: "#3574d1", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      cursor: "pointer", opacity: inputVal.trim() ? 1 : 0.25,
                      transition: "transform 0.1s ease",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                  </button>
                </div>
                {q.skipLabel && (
                  <button onClick={handleSkip} style={{ background: "none", border: "none", fontSize: 12, color: "#c7c7cc", cursor: "pointer", padding: "6px 0 0", textAlign: "center", width: "100%" }}>{q.skipLabel}</button>
                )}
              </div>
            )}

            {/* Done CTA */}
            {isDone && (
              <div className="pc-ma" style={{ padding: "8px 10px 14px", borderTop: "1px solid #f2f2f7", background: "#fff", flexShrink: 0 }}>
                <button
                  onClick={() => { closeModal(); window.location.href = "/contractor/sites"; }}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 12, background: "#3574d1",
                    color: "#fff", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  View your site
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
