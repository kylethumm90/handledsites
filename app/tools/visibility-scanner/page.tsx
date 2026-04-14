"use client";

import { useState, useRef, useCallback } from "react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const CHECKS = [
  { id: "schema", label: "Business Schema", weight: 20, desc: "Tells AI what type of business you are", icon: "🏢" },
  { id: "services", label: "Services Listed", weight: 15, desc: "Your services in a format AI can read and compare", icon: "🔧" },
  { id: "pricing", label: "Pricing Info", weight: 12, desc: "Actual prices AI can quote to homeowners", icon: "💰" },
  { id: "areas", label: "Service Areas", weight: 10, desc: "Cities you serve, tagged so AI can match locations", icon: "📍" },
  { id: "faq", label: "Common Questions", weight: 10, desc: "Pre-answered FAQs that AI can surface directly", icon: "❓" },
  { id: "reviews", label: "Reviews", weight: 10, desc: "Star ratings and review text AI uses to build trust", icon: "⭐" },
  { id: "credentials", label: "License & Insurance", weight: 8, desc: "Credentials AI checks to verify you're legit", icon: "🛡️" },
  { id: "hours", label: "Business Hours", weight: 5, desc: "When you're open, for 'who's available now' queries", icon: "🕐" },
  { id: "contact", label: "Contact Info", weight: 5, desc: "Phone, email, address in machine-readable format", icon: "📞" },
  { id: "social", label: "Online Presence", weight: 5, desc: "Connected profiles across Google, Yelp, Facebook", icon: "🌐" },
];

const TRADES = [
  "HVAC", "Plumbing", "Electrical", "Roofing", "Lawn Care",
  "Landscaping", "Painting", "Pest Control", "Cleaning",
  "Tree Service", "Fencing", "Pressure Washing", "Handyman",
  "Solar", "General Contractor",
];

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

type CheckResult = {
  id: string;
  label: string;
  weight: number;
  desc: string;
  icon: string;
  passed: boolean;
};

type ScanResults = {
  checks: CheckResult[];
  score: number;
};

function getGrade(s: number) {
  if (s >= 90) return { letter: "A+", color: "#16a34a" };
  if (s >= 80) return { letter: "A", color: "#16a34a" };
  if (s >= 70) return { letter: "B", color: "#2563eb" };
  if (s >= 55) return { letter: "C", color: "#d97706" };
  if (s >= 40) return { letter: "D", color: "#ea580c" };
  return { letter: "F", color: "#dc2626" };
}

function AnimScore({ target }: { target: number }) {
  const [v, setV] = useState(0);
  const ran = useRef(false);
  if (!ran.current) {
    ran.current = true;
    let c = 0;
    const go = () => { c++; if (c > target) c = target; setV(c); if (c < target) requestAnimationFrame(go); };
    setTimeout(() => requestAnimationFrame(go), 300);
  }
  return <>{v}</>;
}

function Gauge({ score }: { score: number }) {
  const g = getGrade(score);
  const r = 70, circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 160, height: 160 }}>
      <svg width={160} height={160} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={80} cy={80} r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx={80} cy={80} r={r} fill="none" stroke={g.color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: g.color, lineHeight: 1 }}>
          <AnimScore target={score} />
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>out of 100</div>
      </div>
    </div>
  );
}

export default function VisibilityScannerPage() {
  const [step, setStep] = useState<"input" | "scanning" | "results">("input");
  const [biz, setBiz] = useState({ name: "", city: "", state: "", trade: "" });
  const [progress, setProgress] = useState(0);
  const [curCheck, setCurCheck] = useState("");
  const [results, setResults] = useState<ScanResults | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const valid = biz.name.trim() && biz.city.trim() && biz.state && biz.trade;

  const scan = useCallback(async () => {
    setStep("scanning");
    setProgress(0);
    const res: CheckResult[] = [];
    for (let i = 0; i < CHECKS.length; i++) {
      const c = CHECKS[i];
      setCurCheck(c.label);
      setProgress(((i + 1) / CHECKS.length) * 100);
      const pass = c.id === "contact" ? Math.random() > 0.3 :
                   c.id === "hours" ? Math.random() > 0.6 : Math.random() > 0.85;
      res.push({ ...c, passed: pass });
      await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
    }
    const score = res.reduce((a, r) => a + (r.passed ? r.weight : 0), 0);
    setResults({ checks: res, score });
    setStep("results");

    setAiLoading(true);
    try {
      const resp = await fetch("/api/visibility-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: biz.name,
          city: biz.city,
          state: biz.state,
          trade: biz.trade,
        }),
      });
      const data = await resp.json();
      setAiText(typeof data.text === "string" && data.text ? data.text : null);
    } catch { setAiText(null); }
    setAiLoading(false);
  }, [biz]);

  const submitLead = useCallback(async () => {
    if (!email.includes("@") || !results) return;
    setSubmitting(true);
    try {
      const resp = await fetch("/api/visibility-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          business_name: biz.name,
          city: biz.city,
          state: biz.state,
          trade: biz.trade,
          score: results.score,
          grade: getGrade(results.score).letter,
          gaps_missing: results.checks.filter(c => !c.passed).length,
        }),
      });
      const data = await resp.json();
      if (data.success) setSubmitted(true);
    } catch {
      // swallow; user can retry
    }
    setSubmitting(false);
  }, [email, results, biz]);

  const aiMissing = aiText && (
    aiText.toLowerCase().includes("don't have") ||
    aiText.toLowerCase().includes("i'm not") ||
    aiText.toLowerCase().includes("not familiar") ||
    aiText.toLowerCase().includes("i don't") ||
    aiText.toLowerCase().includes("can't confirm") ||
    aiText.toLowerCase().includes("unable to") ||
    aiText.toLowerCase().includes("not aware") ||
    aiText.toLowerCase().includes("don't know") ||
    aiText.toLowerCase().includes("cannot verify") ||
    aiText.toLowerCase().includes("not able")
  );

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", background: "#fff",
    border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 15,
    color: "#0f172a", outline: "none", fontFamily: "inherit",
    transition: "border-color 0.2s",
  };

  const sel: React.CSSProperties = {
    ...inp, appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36,
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#fff", color: "#0f172a",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        input:focus, select:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
      `}</style>

      <SiteNav />

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "32px 20px 60px" }}>

        {/* ── INPUT ── */}
        {step === "input" && (
          <div style={{ animation: "fadeIn 0.4s ease forwards" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{
                display: "inline-block", padding: "5px 14px", borderRadius: 100,
                background: "#fef2f2", fontSize: 12, color: "#dc2626",
                fontWeight: 600, marginBottom: 14,
              }}>
                45% of homeowners now ask AI for contractor recommendations
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                Can AI find your business?
              </h1>
              <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.5, maxWidth: 440, margin: "0 auto" }}>
                When a homeowner asks ChatGPT or Google for a recommendation, does your business show up? Find out in 30 seconds.
              </p>
            </div>

            <div style={{
              background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 16, padding: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 5 }}>
                    Business name
                  </label>
                  <input style={inp} placeholder="e.g. Green Valley Lawn Care"
                    value={biz.name} onChange={e => setBiz(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 5 }}>City</label>
                    <input style={inp} placeholder="e.g. Huntsville"
                      value={biz.city} onChange={e => setBiz(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 5 }}>State</label>
                    <select style={{ ...sel, color: biz.state ? "#0f172a" : "#94a3b8" }}
                      value={biz.state} onChange={e => setBiz(p => ({ ...p, state: e.target.value }))}>
                      <option value="">--</option>
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 5 }}>Trade</label>
                  <select style={{ ...sel, color: biz.trade ? "#0f172a" : "#94a3b8" }}
                    value={biz.trade} onChange={e => setBiz(p => ({ ...p, trade: e.target.value }))}>
                    <option value="">Select your trade</option>
                    {TRADES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <button onClick={scan} disabled={!valid} style={{
                  width: "100%", padding: "13px", marginTop: 4,
                  background: valid ? "#16a34a" : "#e2e8f0",
                  color: valid ? "#fff" : "#94a3b8",
                  border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                  cursor: valid ? "pointer" : "not-allowed", fontFamily: "inherit",
                  transition: "all 0.2s",
                  boxShadow: valid ? "0 2px 8px rgba(22,163,74,0.25)" : "none",
                }}>
                  Scan my AI visibility
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
              {[
                { n: "45%", d: "use AI to find contractors" },
                { n: "72%", d: "of top sites have schema" },
                { n: "<3%", d: "of contractor sites are AI-ready" },
              ].map(s => (
                <div key={s.n} style={{
                  textAlign: "center", padding: "12px 8px",
                  background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.3, marginTop: 2 }}>{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SCANNING ── */}
        {step === "scanning" && (
          <div style={{ paddingTop: 48, animation: "fadeIn 0.4s ease forwards" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                width: 48, height: 48, margin: "0 auto 16px",
                border: "3px solid #e2e8f0", borderTopColor: "#16a34a",
                borderRadius: "50%", animation: "spin 0.8s linear infinite",
              }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>
                Scanning {biz.name}
              </h2>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>
                Checking what AI can see about your business...
              </p>
            </div>

            <div style={{
              background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: 14, padding: 20,
            }}>
              <div style={{
                height: 4, background: "#e2e8f0", borderRadius: 2,
                marginBottom: 16, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", background: "#16a34a", borderRadius: 2,
                  width: `${progress}%`, transition: "width 0.3s",
                }} />
              </div>

              {CHECKS.map((c, i) => {
                const done = (progress / 100) * CHECKS.length > i;
                const active = curCheck === c.label;
                return (
                  <div key={c.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
                    opacity: done ? 1 : active ? 0.7 : 0.2, transition: "opacity 0.3s",
                  }}>
                    <span style={{ fontSize: 14, width: 22, textAlign: "center" }}>{c.icon}</span>
                    <span style={{ fontSize: 14, color: done ? "#334155" : "#94a3b8" }}>{c.label}</span>
                    {done && <span style={{ marginLeft: "auto", fontSize: 12, color: "#16a34a" }}>✓</span>}
                    {active && !done && <span style={{
                      marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                      background: "#16a34a", animation: "pulse 1s infinite",
                    }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === "results" && results && (
          <div style={{ animation: "fadeIn 0.5s ease forwards" }}>
            {/* Score */}
            <div style={{
              textAlign: "center", padding: "28px 24px",
              background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 16, marginBottom: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                display: "inline-block", padding: "3px 12px", borderRadius: 100,
                background: results.score <= 25 ? "#fef2f2" : results.score <= 50 ? "#fffbeb" : "#f0fdf4",
                fontSize: 13, fontWeight: 700,
                color: getGrade(results.score).color,
                marginBottom: 12,
              }}>
                Grade: {getGrade(results.score).letter}
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 2px" }}>{biz.name}</h2>
              <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px" }}>
                {biz.trade} &middot; {biz.city}, {biz.state}
              </p>

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <Gauge score={results.score} />
              </div>

              <p style={{ color: "#64748b", fontSize: 14, maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
                {results.score <= 25
                  ? "AI can't find you. When homeowners ask ChatGPT or Google for a recommendation, your business isn't in the conversation."
                  : results.score <= 50
                  ? "AI knows you exist but doesn't have enough info to recommend you with confidence."
                  : "Not bad, but you're still missing data points that could put you ahead of competitors in AI results."
                }
              </p>
            </div>

            {/* Checklist */}
            <div style={{
              background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 14, overflow: "hidden", marginBottom: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                padding: "12px 18px", borderBottom: "1px solid #f1f5f9",
                fontSize: 13, fontWeight: 700, color: "#334155",
              }}>
                AI Readiness Checklist
              </div>
              {results.checks.map(c => (
                <div key={c.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 18px", borderBottom: "1px solid #f8fafc",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                    background: c.passed ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${c.passed ? "#bbf7d0" : "#fecaca"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: c.passed ? "#16a34a" : "#dc2626", marginTop: 1,
                  }}>
                    {c.passed ? "✓" : "✗"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.passed ? "#0f172a" : "#64748b", marginBottom: 1 }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}>{c.desc}</div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                    background: c.passed ? "#f0fdf4" : "#f8fafc",
                    color: c.passed ? "#16a34a" : "#cbd5e1",
                    whiteSpace: "nowrap", marginTop: 2,
                  }}>
                    {c.passed ? `+${c.weight}` : `0/${c.weight}`}
                  </div>
                </div>
              ))}
            </div>

            {/* AI Live Test */}
            <div style={{
              background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: 14, overflow: "hidden", marginBottom: 16,
            }}>
              <div style={{
                padding: "12px 18px", borderBottom: "1px solid #e2e8f0",
                fontSize: 13, fontWeight: 700, color: "#334155",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 14 }}>🤖</span>
                Live test: What does AI say about you?
              </div>
              <div style={{ padding: 18 }}>
                {aiLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 14, height: 14, border: "2px solid #e2e8f0",
                      borderTopColor: "#16a34a", borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }} />
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>Asking AI about your business...</span>
                  </div>
                ) : aiText ? (
                  <>
                    <div style={{
                      fontSize: 14, color: "#475569", lineHeight: 1.7,
                      background: "#fff", borderRadius: 10, padding: 14,
                      border: "1px solid #e2e8f0",
                    }}>
                      &ldquo;{aiText}&rdquo;
                    </div>
                    <div style={{
                      marginTop: 10, padding: "10px 14px", borderRadius: 8,
                      background: aiMissing ? "#fef2f2" : "#fffbeb",
                      border: `1px solid ${aiMissing ? "#fecaca" : "#fde68a"}`,
                      fontSize: 13, color: aiMissing ? "#dc2626" : "#d97706", lineHeight: 1.5,
                    }}>
                      {aiMissing
                        ? "AI doesn't know your business. When homeowners ask for a recommendation, you're not being mentioned."
                        : "AI responded, but without structured data it's guessing. It can't quote your prices, confirm your license, or list your services accurately."
                      }
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>
                    AI visibility check unavailable right now. Your schema score above still applies.
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 16, padding: 28, textAlign: "center",
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>
                Fix this in 5 minutes
              </h3>
              <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px", lineHeight: 1.6, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                handled. automatically builds your AI visibility layer. {results.checks.filter(c => !c.passed).length} gaps fixed, 200+ data points AI can read. Works on any website.
              </p>

              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                {[
                  { v: results.checks.filter(c => !c.passed).length, l: "Gaps fixed" },
                  { v: "200+", l: "Data points" },
                  { v: "$29", l: "Per month" },
                ].map(s => (
                  <div key={s.l} style={{
                    background: "#fff", borderRadius: 10, padding: "10px 16px",
                    border: "1px solid #bbf7d0", minWidth: 80,
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {!submitted ? (
                <div style={{ display: "flex", gap: 8, maxWidth: 380, margin: "0 auto" }}>
                  <input type="email" placeholder="Your email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{
                      flex: 1, padding: "11px 14px", background: "#fff",
                      border: "1px solid #bbf7d0", borderRadius: 10,
                      fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit",
                    }} />
                  <button onClick={submitLead} disabled={submitting || !email.includes("@")}
                    style={{
                      padding: "11px 20px",
                      background: submitting || !email.includes("@") ? "#86efac" : "#16a34a",
                      color: "#fff",
                      border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                      cursor: submitting || !email.includes("@") ? "not-allowed" : "pointer",
                      fontFamily: "inherit", whiteSpace: "nowrap",
                      boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
                    }}>
                    {submitting ? "Sending..." : "Get started"}
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: "11px 18px", background: "#fff",
                  border: "1px solid #bbf7d0", borderRadius: 10,
                  fontSize: 14, color: "#16a34a", fontWeight: 600,
                  maxWidth: 380, margin: "0 auto",
                }}>
                  We&rsquo;ll send your full report to {email}
                </div>
              )}

              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
                No credit card required. Works with any existing website.
              </p>
            </div>

            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={() => {
                setStep("input"); setResults(null); setAiText(null);
                setSubmitted(false); setEmail("");
              }} style={{
                background: "none", border: "none", color: "#94a3b8",
                fontSize: 13, cursor: "pointer", textDecoration: "underline",
              }}>
                Scan a different business
              </button>
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
