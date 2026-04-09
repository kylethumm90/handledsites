"use client";

import { useState, useRef } from "react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

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
  ratingScore: number;
  countScore: number;
  recencyScore: number;
  velocityScore: number;
  responseScore: number;
  tips: string[];
};

function computeGrade(place: PlaceResult): GradeResult {
  const rating = place.rating ?? 0;
  const count = place.reviewCount ?? 0;
  const reviews = place.reviews || [];

  // Rating score (0-25)
  let ratingScore = 0;
  if (rating >= 4.8) ratingScore = 25;
  else if (rating >= 4.5) ratingScore = 22;
  else if (rating >= 4.2) ratingScore = 18;
  else if (rating >= 4.0) ratingScore = 15;
  else if (rating >= 3.5) ratingScore = 10;
  else if (rating >= 3.0) ratingScore = 5;
  else ratingScore = 2;

  // Count score (0-25)
  let countScore = 0;
  if (count >= 200) countScore = 25;
  else if (count >= 100) countScore = 22;
  else if (count >= 50) countScore = 18;
  else if (count >= 25) countScore = 14;
  else if (count >= 10) countScore = 10;
  else if (count >= 5) countScore = 6;
  else countScore = 2;

  // Recency score (0-20) - based on reviews we have (up to 5)
  let recencyScore = 10; // default mid-score when we can't determine
  if (reviews.length > 0) {
    // Reviews from API are typically recent, give good score if we have any
    recencyScore = reviews.length >= 3 ? 18 : reviews.length >= 1 ? 14 : 8;
  }

  // Velocity score (0-15) - estimated reviews per month
  let velocityScore = 8; // default mid
  if (count >= 100) velocityScore = 15;
  else if (count >= 50) velocityScore = 12;
  else if (count >= 20) velocityScore = 10;
  else if (count >= 5) velocityScore = 6;
  else velocityScore = 3;

  // Response score (0-15) - we can't determine from API, use rating as proxy
  let responseScore = 8;
  if (rating >= 4.5 && count >= 20) responseScore = 14;
  else if (rating >= 4.0) responseScore = 10;
  else if (rating >= 3.5) responseScore = 6;
  else responseScore = 4;

  const score = ratingScore + countScore + recencyScore + velocityScore + responseScore;

  let letter = "F";
  let color = "#DC2626";
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

  const tips: string[] = [];
  if (rating < 4.5) tips.push("Aim for a 4.5+ rating by asking your happiest customers to leave reviews right after a job.");
  if (count < 50) tips.push(`You have ${count} reviews. Businesses with 50+ reviews rank significantly higher in local search.`);
  if (count < 10) tips.push("Under 10 reviews makes your business look new. Send a review request after every completed job.");
  if (ratingScore >= 20 && countScore < 15) tips.push("Your rating is great! Focus on volume now — more reviews = more trust.");
  if (countScore >= 18 && ratingScore < 18) tips.push("You have solid volume. Focus on delivering 5-star experiences to bring your average up.");
  if (tips.length === 0) tips.push("Your review profile is strong. Keep asking every customer for a review to maintain momentum.");

  return { letter, score, color, ratingScore, countScore, recencyScore, velocityScore, responseScore, tips };
}

export default function ReviewGrader() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInput(value: string) {
    setQuery(value);
    setSelected(null);
    setGrade(null);
    setUnlocked(false);

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
    setGrade(computeGrade(place));
    setUnlocked(false);
  }

  async function handleUnlock() {
    if (!email.trim() || !selected || !grade) return;
    setSubmitting(true);
    try {
      await fetch("/api/grader-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          business_name: selected.name,
          place_id: selected.placeId,
          rating: selected.rating,
          review_count: selected.reviewCount,
          grade: grade.letter,
          score: grade.score,
        }),
      });
      setUnlocked(true);
    } catch { /* allow unlock anyway */ setUnlocked(true); }
    setSubmitting(false);
  }

  const DARK = "#1F2937";
  const GREEN = "#2E7D32";

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <SiteNav />

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Free Tool</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: DARK, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 12 }}>
            Google Review Grader
          </h1>
          <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.6, maxWidth: 440, margin: "0 auto" }}>
            See how your Google reviews stack up. Get an instant grade and actionable tips to rank higher in local search.
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Search your business name..."
            style={{
              width: "100%", padding: "16px 18px", fontSize: 16,
              border: "2px solid #E5E7EB", borderRadius: 12,
              color: DARK, outline: "none", background: "#FAFAFA",
            }}
          />
          {searching && (
            <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9CA3AF" }}>Searching...</div>
          )}

          {/* Results dropdown */}
          {results.length > 0 && !selected && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
              marginTop: 4, background: "#fff", border: "1px solid #E5E7EB",
              borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", overflow: "hidden",
            }}>
              {results.map((r) => (
                <button
                  key={r.placeId}
                  onClick={() => handleSelect(r)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "14px 18px", border: "none", background: "transparent",
                    borderBottom: "1px solid #F3F4F6", cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600, color: DARK }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                    {r.address}
                    {r.rating && <> &middot; {r.rating} ★ ({r.reviewCount} reviews)</>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grade display */}
        {grade && selected && (
          <div style={{ marginBottom: 32 }}>
            {/* Grade card */}
            <div style={{
              border: "2px solid #E5E7EB", borderRadius: 16, overflow: "hidden",
              textAlign: "center", padding: "32px 24px 28px", marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", marginBottom: 4 }}>{selected.name}</div>
              <div style={{
                width: 100, height: 100, borderRadius: 50, margin: "0 auto 16px",
                background: grade.color, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>{grade.letter}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: DARK }}>
                {selected.rating ? `${selected.rating} ★` : "No rating"} &middot; {selected.reviewCount ?? 0} reviews
              </div>
              <div style={{ fontSize: 14, color: "#9CA3AF", marginTop: 4 }}>
                Overall score: {grade.score}/100
              </div>
            </div>

            {/* Gated content */}
            {!unlocked ? (
              <div style={{
                border: "2px solid #E5E7EB", borderRadius: 16, padding: "28px 24px",
                background: "#FAFAFA",
              }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: DARK, marginBottom: 6 }}>
                    Unlock your full report
                  </div>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.5 }}>
                    See your score breakdown, find out where you&#39;re losing points, and get personalized tips to improve.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    style={{
                      width: "100%", padding: "14px 16px", fontSize: 15,
                      border: "1px solid #E5E7EB", borderRadius: 10,
                      color: DARK, outline: "none",
                    }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email *"
                    style={{
                      width: "100%", padding: "14px 16px", fontSize: 15,
                      border: "1px solid #E5E7EB", borderRadius: 10,
                      color: DARK, outline: "none",
                    }}
                  />
                  <button
                    onClick={handleUnlock}
                    disabled={submitting || !email.trim()}
                    style={{
                      width: "100%", padding: "16px", fontSize: 16, fontWeight: 700,
                      background: GREEN, color: "#fff", border: "none", borderRadius: 10,
                      cursor: "pointer", opacity: submitting || !email.trim() ? 0.5 : 1,
                    }}
                  >
                    {submitting ? "Unlocking..." : "Get my full report"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Score breakdown */}
                <div style={{
                  border: "2px solid #E5E7EB", borderRadius: 16, padding: "24px", marginBottom: 20,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 16 }}>Score Breakdown</div>
                  {[
                    { label: "Average Rating", score: grade.ratingScore, max: 25 },
                    { label: "Review Count", score: grade.countScore, max: 25 },
                    { label: "Review Recency", score: grade.recencyScore, max: 20 },
                    { label: "Review Velocity", score: grade.velocityScore, max: 15 },
                    { label: "Engagement & Response", score: grade.responseScore, max: 15 },
                  ].map((item) => (
                    <div key={item.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, color: DARK }}>{item.label}</span>
                        <span style={{ fontWeight: 600, color: "#6B7280" }}>{item.score}/{item.max}</span>
                      </div>
                      <div style={{ height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 4,
                          background: item.score / item.max >= 0.7 ? GREEN : item.score / item.max >= 0.4 ? "#EAB308" : "#EF4444",
                          width: `${(item.score / item.max) * 100}%`,
                          transition: "width 0.5s ease",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tips */}
                <div style={{
                  border: "2px solid #E5E7EB", borderRadius: 16, padding: "24px", marginBottom: 20,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 12 }}>How to Improve</div>
                  {grade.tips.map((tip, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 10, alignItems: "flex-start",
                      padding: "10px 0",
                      borderTop: i > 0 ? "1px solid #F3F4F6" : "none",
                    }}>
                      <span style={{ color: GREEN, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div style={{
                  background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 16,
                  padding: "24px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: GREEN, marginBottom: 6 }}>
                    Want more reviews on autopilot?
                  </div>
                  <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16, lineHeight: 1.5 }}>
                    handled. helps contractors collect reviews, referrals, and repeat business — all from one dashboard.
                  </p>
                  <a href="/" style={{
                    display: "inline-block", padding: "12px 28px", fontSize: 15, fontWeight: 600,
                    background: GREEN, color: "#fff", borderRadius: 10, textDecoration: "none",
                  }}>
                    Get started free
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {!selected && !searching && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: 14 }}>
            Search for your business above to get your grade.
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
