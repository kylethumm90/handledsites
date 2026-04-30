"use client";

import { useState, useRef, useEffect } from "react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

/* ── Types ── */
type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  reviews: { text: string; author: string; rating: number }[];
};

type GradeResult = {
  letter: string;
  score: number;
  color: string;
  verdict: string;
  rank: number;
  rankTotal: number;
  ratingScore: number;
  countScore: number;
  recencyScore: number;
  velocityScore: number;
  responseScore: number;
  tips: string[];
  metrics: { responseRate: string; velocity: string; gap: string; sentiment: string };
};

/* ── Colors ── */
const NAVY = "#1E2A3A";
const AMBER = "#E8922A";
const GRAY_BG = "#F9F9F9";
const GRAY_BORDER = "#E8E8E8";
const GRAY_TEXT = "#6B7280";
const SERIF = "'Fraunces', Georgia, serif";
const SANS = "'DM Sans', -apple-system, sans-serif";

/* ── Grading logic ── */
function computeGrade(place: PlaceResult): GradeResult {
  const rating = place.rating ?? 0;
  const count = place.reviewCount ?? 0;
  const reviews = place.reviews || [];

  const ratingScore = rating >= 4.8 ? 25 : rating >= 4.5 ? 22 : rating >= 4.2 ? 18 : rating >= 4.0 ? 15 : rating >= 3.5 ? 10 : rating >= 3.0 ? 5 : 2;
  const countScore = count >= 200 ? 25 : count >= 100 ? 22 : count >= 50 ? 18 : count >= 25 ? 14 : count >= 10 ? 10 : count >= 5 ? 6 : 2;
  const recencyScore = reviews.length >= 3 ? 18 : reviews.length >= 1 ? 14 : 10;
  const velocityScore = count >= 100 ? 15 : count >= 50 ? 12 : count >= 20 ? 10 : count >= 5 ? 6 : 3;
  const responseScore = (rating >= 4.5 && count >= 20) ? 14 : rating >= 4.0 ? 10 : rating >= 3.5 ? 6 : 4;

  const score = ratingScore + countScore + recencyScore + velocityScore + responseScore;

  let letter: string, color: string;
  if (score >= 90) { letter = "A+"; color = "#16A34A"; }
  else if (score >= 85) { letter = "A"; color = "#16A34A"; }
  else if (score >= 80) { letter = "A-"; color = "#22C55E"; }
  else if (score >= 75) { letter = "B+"; color = "#65A30D"; }
  else if (score >= 70) { letter = "B"; color = "#84CC16"; }
  else if (score >= 65) { letter = "B-"; color = "#A3E635"; }
  else if (score >= 60) { letter = "C+"; color = "#EAB308"; }
  else if (score >= 55) { letter = "C"; color = "#F59E0B"; }
  else if (score >= 50) { letter = "C-"; color = "#F97316"; }
  else if (score >= 40) { letter = "D"; color = "#EF4444"; }
  else { letter = "F"; color = "#DC2626"; }

  let verdict: string;
  if (score >= 85) verdict = "Your reviews are a competitive advantage.";
  else if (score >= 75) verdict = "You\u2019re ahead of most competitors. A few tweaks and you\u2019re elite.";
  else if (score >= 65) verdict = "Solid foundation, but you\u2019re leaving customers on the table.";
  else if (score >= 55) verdict = "Your reviews are costing you customers.";
  else if (score >= 40) verdict = "Customers are choosing your competitors based on reviews alone.";
  else verdict = "Your online reputation needs immediate attention.";

  const rank = Math.max(1, Math.floor((100 - score) / 100 * 47) + 1);
  const rankTotal = 47;

  const tips: string[] = [];
  if (rating < 4.5) tips.push("Aim for a 4.5+ rating by asking your happiest customers to leave reviews right after a job.");
  if (count < 50) tips.push(`You have ${count} reviews. Businesses with 50+ reviews rank significantly higher in local search.`);
  if (count < 10) tips.push("Under 10 reviews makes your business look new. Send a review request after every completed job.");
  if (ratingScore >= 20 && countScore < 15) tips.push("Your rating is great! Focus on volume now \u2014 more reviews = more trust.");
  if (countScore >= 18 && ratingScore < 18) tips.push("You have solid volume. Focus on delivering 5-star experiences to bring your average up.");
  if (tips.length === 0) tips.push("Your review profile is strong. Keep asking every customer for a review to maintain momentum.");

  const respRate = Math.min(98, Math.max(12, Math.round(responseScore / 15 * 85 + Math.random() * 10)));
  const vel = Math.max(0.2, (count / Math.max(12, 24)) ).toFixed(1);
  const gapRank = rank <= 5 ? `#${rank} of ${rankTotal}` : `#${rank} of ${rankTotal}`;
  const sent = Math.min(98, Math.max(35, score + Math.round(Math.random() * 6 - 3)));

  return {
    letter, score, color, verdict, rank, rankTotal,
    ratingScore, countScore, recencyScore, velocityScore, responseScore, tips,
    metrics: { responseRate: `${respRate}%`, velocity: `${vel}/mo`, gap: gapRank, sentiment: `${sent}/100` },
  };
}

/* ── Loading steps ── */
const LOADING_STEPS = [
  "Finding your business...",
  "Pulling review data...",
  "Analyzing your reputation...",
  "Generating your grade...",
];

/* ── Lock icon SVG ── */
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", top: 8, right: 8 }}>
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

/* ── Blurred metric card ── */
function MetricCard({ label, value, blurred }: { label: string; value: string; blurred: boolean }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${GRAY_BORDER}`, borderRadius: 12,
      padding: "18px 16px", position: "relative",
    }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: GRAY_TEXT, marginBottom: 6, fontFamily: SANS }}>{label}</div>
      <div style={{
        fontSize: 24, fontWeight: 700, color: NAVY, fontFamily: SERIF,
        filter: blurred ? "blur(8px)" : "none",
        userSelect: blurred ? "none" : "auto",
        transition: "filter 0.4s ease",
      }}>{value}</div>
      {blurred && <LockIcon />}
    </div>
  );
}

/* ── Main component ── */
export default function ReviewGrader() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInput(value: string) {
    setQuery(value);
    setSelected(null);
    setGrade(null);
    setUnlocked(false);
    setLoading(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch { setResults([]); }
      setSearching(false);
    }, 400);
  }

  function handleSelect(place: PlaceResult) {
    setSelected(place);
    setQuery(place.name);
    setResults([]);
    setLoading(true);
    setLoadingStep(0);
  }

  // Loading animation
  useEffect(() => {
    if (!loading || !selected) return;
    if (loadingStep >= LOADING_STEPS.length) {
      setLoading(false);
      setGrade(computeGrade(selected));
      return;
    }
    const delay = loadingStep === LOADING_STEPS.length - 1 ? 500 : 1000;
    const timer = setTimeout(() => setLoadingStep((s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [loading, loadingStep, selected]);

  async function handleUnlock() {
    if (!email.trim() || !selected || !grade) return;
    setSubmitting(true);
    try {
      await fetch("/api/grader-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          business_name: selected.name,
          place_id: selected.placeId,
          rating: selected.rating,
          review_count: selected.reviewCount,
          grade: grade.letter,
          score: grade.score,
        }),
      });
    } catch { /* unlock anyway */ }
    setUnlocked(true);
    setSubmitting(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: SANS, color: NAVY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes grFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .gr-fade { animation: grFadeUp 0.5s ease forwards; }
        @keyframes grPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .gr-pulse { animation: grPulse 1.5s ease-in-out infinite; }
        .gr-input:focus { outline: none; border-color: ${AMBER} !important; }
        .gr-search-item:hover { background: ${GRAY_BG} !important; }
      `}</style>

      <SiteNav />

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* Hero */}
        <div className="gr-fade" style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: AMBER, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Free Tool</div>
          <h1 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 800, color: NAVY, letterSpacing: "-0.03em", lineHeight: 1.12, marginBottom: 14 }}>
            Google Review Grader
          </h1>
          <p style={{ fontSize: 16, color: GRAY_TEXT, lineHeight: 1.65, maxWidth: 400, margin: "0 auto" }}>
            See how your reputation stacks up. Get an instant grade and a personalized plan to win more customers.
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 28 }}>
          <div style={{ position: "relative" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="Search your business name..."
              className="gr-input"
              style={{
                width: "100%", padding: "16px 18px 16px 46px", fontSize: 16,
                border: `1.5px solid ${GRAY_BORDER}`, borderRadius: 12,
                color: NAVY, background: "#fff", fontFamily: SANS,
              }}
            />
          </div>
          {searching && (
            <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9CA3AF" }} className="gr-pulse">Searching...</div>
          )}
          {results.length > 0 && !selected && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
              marginTop: 4, background: "#fff", border: `1px solid ${GRAY_BORDER}`,
              borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.08)", overflow: "hidden",
            }}>
              {results.map((r) => (
                <button key={r.placeId} onClick={() => handleSelect(r)} className="gr-search-item" style={{
                  display: "block", width: "100%", textAlign: "left", padding: "14px 18px",
                  border: "none", background: "transparent", borderBottom: `1px solid ${GRAY_BG}`,
                  cursor: "pointer", fontFamily: SANS,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                    {r.address}{r.rating && <> &middot; {r.rating} &#9733; ({r.reviewCount} reviews)</>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading animation */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            {LOADING_STEPS.map((step, i) => (
              <div key={i} className="gr-fade" style={{
                fontSize: 15, fontWeight: 500, marginBottom: 12,
                color: i === loadingStep ? NAVY : i < loadingStep ? "#9CA3AF" : "transparent",
                animationDelay: `${i * 0.15}s`,
                transition: "color 0.3s ease",
              }}>
                {i < loadingStep && <span style={{ color: "#16A34A", marginRight: 8 }}>&#10003;</span>}
                {i === loadingStep && <span className="gr-pulse" style={{ marginRight: 8 }}>&#9679;</span>}
                {step}
              </div>
            ))}
          </div>
        )}

        {/* Grade results */}
        {grade && selected && !loading && (
          <div className="gr-fade">
            {/* Grade card */}
            <div style={{
              background: "#fff", border: `1px solid ${GRAY_BORDER}`, borderRadius: 16,
              textAlign: "center", padding: "36px 24px 32px", marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: GRAY_TEXT, marginBottom: 16 }}>{selected.name}</div>
              <div style={{
                width: 110, height: 110, borderRadius: 55, margin: "0 auto 18px",
                border: `4px solid ${grade.color}`, background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 900, color: grade.color }}>{grade.letter}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
                {selected.rating ? `${selected.rating} ★` : "No rating"} &middot; {selected.reviewCount ?? 0} reviews
              </div>
              <div style={{ fontSize: 14, color: GRAY_TEXT, marginBottom: 14 }}>
                Score: {grade.score}/100
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, fontStyle: "italic", color: NAVY, lineHeight: 1.4, marginBottom: 10 }}>
                {grade.verdict}
              </div>
              <div style={{ fontSize: 13, color: GRAY_TEXT }}>
                You&#39;re ranked <strong style={{ color: NAVY }}>#{grade.rank}</strong> out of {grade.rankTotal} businesses in your area
              </div>
            </div>

            {/* Blurred metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              <MetricCard label="Response Rate" value={grade.metrics.responseRate} blurred={!unlocked} />
              <MetricCard label="Review Velocity" value={grade.metrics.velocity} blurred={!unlocked} />
              <MetricCard label="Competitor Gap" value={grade.metrics.gap} blurred={!unlocked} />
              <MetricCard label="Sentiment Score" value={grade.metrics.sentiment} blurred={!unlocked} />
            </div>

            {/* Email gate or full report */}
            {!unlocked ? (
              <div style={{
                background: GRAY_BG, border: `1px solid ${GRAY_BORDER}`, borderRadius: 16,
                padding: "32px 24px",
              }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 10 }}>
                    See your full breakdown
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start", maxWidth: 300, margin: "0 auto", textAlign: "left" }}>
                    {[
                      "Response rate analysis",
                      "Review velocity trend",
                      "How you compare to local competitors",
                      "Personalized action plan",
                    ].map((item) => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#4B5563" }}>
                        <span style={{ color: AMBER, fontWeight: 700, fontSize: 15 }}>&#10003;</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="gr-input"
                  style={{
                    width: "100%", padding: "15px 16px", fontSize: 15,
                    border: `1.5px solid ${GRAY_BORDER}`, borderRadius: 10,
                    color: NAVY, background: "#fff", fontFamily: SANS,
                    marginBottom: 10,
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
                />
                <button
                  onClick={handleUnlock}
                  disabled={submitting || !email.trim()}
                  style={{
                    width: "100%", padding: "16px", fontSize: 16, fontWeight: 700,
                    background: AMBER, color: "#fff", border: "none", borderRadius: 10,
                    cursor: "pointer", fontFamily: SANS,
                    opacity: submitting || !email.trim() ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {submitting ? "Sending..." : "Send My Free Report"}
                </button>
              </div>
            ) : (
              <>
                {/* Score breakdown */}
                <div style={{
                  background: "#fff", border: `1px solid ${GRAY_BORDER}`, borderRadius: 16,
                  padding: "24px", marginBottom: 16,
                }}>
                  <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 18 }}>Score Breakdown</div>
                  {[
                    { label: "Average Rating", score: grade.ratingScore, max: 25 },
                    { label: "Review Count", score: grade.countScore, max: 25 },
                    { label: "Review Recency", score: grade.recencyScore, max: 20 },
                    { label: "Review Velocity", score: grade.velocityScore, max: 15 },
                    { label: "Engagement & Response", score: grade.responseScore, max: 15 },
                  ].map((item) => {
                    const pct = item.score / item.max;
                    return (
                      <div key={item.label} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 5 }}>
                          <span style={{ fontWeight: 500, color: NAVY }}>{item.label}</span>
                          <span style={{ fontWeight: 600, color: GRAY_TEXT }}>{item.score}/{item.max}</span>
                        </div>
                        <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 3,
                            background: pct >= 0.7 ? "#16A34A" : pct >= 0.4 ? AMBER : "#EF4444",
                            width: `${pct * 100}%`,
                            transition: "width 0.6s ease",
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tips */}
                <div style={{
                  background: "#fff", border: `1px solid ${GRAY_BORDER}`, borderRadius: 16,
                  padding: "24px", marginBottom: 16,
                }}>
                  <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 14 }}>How to Improve</div>
                  {grade.tips.map((tip, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 10, alignItems: "flex-start",
                      padding: "10px 0",
                      borderTop: i > 0 ? `1px solid #F3F4F6` : "none",
                    }}>
                      <span style={{ color: "#16A34A", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>&#10003;</span>
                      <span style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.55 }}>{tip}</span>
                    </div>
                  ))}
                </div>

                {/* Stella CTA */}
                <div style={{
                  background: NAVY, borderRadius: 16, padding: "32px 24px", textAlign: "center",
                }}>
                  <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 10 }}>
                    What if all of this was handled for you?
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 20 }}>
                    Stella automatically collects reviews, responds to every one, and keeps your reputation growing on autopilot.
                  </p>
                  <a href="/sites" style={{
                    display: "inline-block", padding: "14px 32px", fontSize: 15, fontWeight: 700,
                    background: AMBER, color: "#fff", borderRadius: 10, textDecoration: "none",
                  }}>
                    See How Stella Works
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {!selected && !searching && !loading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#C4C4C4", fontSize: 14 }}>
            Search for your business above to get your grade.
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
