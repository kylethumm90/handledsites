"use client";

import { useState } from "react";

type Review = { text: string; author: string; rating: number };

type Props = {
  referralCode: string;
  partnerFirstName: string;
  partnerFullName: string;
  businessName: string;
  logoUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  reviews: Review[];
};

const StarSVG = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#f5b731" : "#e0dfd8"}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
}

export default function ReferralClient(props: Props) {
  const { referralCode, partnerFirstName, businessName, logoUrl, rating, reviewCount, reviews } = props;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_code: referralCode, name: name.trim(), phone: phone.trim(), message: message.trim() || null }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const F = "'DM Sans', -apple-system, sans-serif";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f6", fontFamily: F }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes rfFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .rf-fade { animation: rfFadeUp 0.5s ease both; }
        .rf-fade-delay { animation: rfFadeUp 0.5s ease 0.15s both; }
        .rf-input:focus { border-color: #2d7a3a !important; box-shadow: 0 0 0 3px rgba(45,122,58,0.08) !important; }
        .rf-btn:hover { background: #333 !important; }
        .rf-btn:active { transform: scale(0.985); }
      `}</style>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 20px" }}>
        {/* Badge */}
        <div style={{ textAlign: "center", padding: "24px 0 0" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#eef6ee", color: "#2d7a3a",
            fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 20,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Personal referral
          </span>
        </div>

        {/* Form Card */}
        <div className="rf-fade" style={{
          background: "#fff", borderRadius: 16, padding: "32px 28px", marginTop: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)",
        }}>
          {!done ? (
            <>
              <div style={{ fontSize: 21, fontWeight: 500, lineHeight: 1.35, color: "#111", marginBottom: 20, letterSpacing: "-0.02em" }}>
                Hey, you must be <span style={{ color: "#2d7a3a" }}>{partnerFirstName}&#39;s</span> friend. Let&#39;s talk!
              </div>

              {/* Company row */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", background: "#fafaf8", borderRadius: 12,
                marginBottom: 28, border: "1px solid #f0efe9",
              }}>
                {logoUrl ? (
                  <img src={logoUrl} alt={businessName} style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} />
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: "#1a3a5c",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em",
                  }}>{initials(businessName)}</div>
                )}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#111", marginBottom: 2 }}>{businessName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#777" }}>
                    <span style={{ display: "flex", gap: 1 }}>
                      {[1,2,3,4,5].map(i => <StarSVG key={i} filled={i <= Math.round(rating || 0)} />)}
                    </span>
                    {rating && <>{rating} &middot; {reviewCount || 0} reviews</>}
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#444", marginBottom: 6 }}>Your Name</label>
                    <input className="rf-input" value={name} onChange={e => setName(e.target.value)} placeholder="First and last name" required
                      style={{ width: "100%", padding: "12px 14px", border: "1px solid #e0dfd8", borderRadius: 10, fontSize: 15, fontFamily: F, color: "#1a1a1a", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#444", marginBottom: 6 }}>Mobile Phone Number</label>
                    <input className="rf-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-5555" required
                      style={{ width: "100%", padding: "12px 14px", border: "1px solid #e0dfd8", borderRadius: 10, fontSize: 15, fontFamily: F, color: "#1a1a1a", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s" }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#444", marginBottom: 6 }}>Message</label>
                  <textarea className="rf-input" value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. I need to get a quote, what's your pricing?"
                    style={{ width: "100%", padding: "12px 14px", border: "1px solid #e0dfd8", borderRadius: 10, fontSize: 15, fontFamily: F, color: "#1a1a1a", outline: "none", resize: "vertical", minHeight: 100, transition: "border-color 0.2s, box-shadow 0.2s" }} />
                </div>
                {error && <div style={{ fontSize: 13, color: "#e53e3e" }}>{error}</div>}
                <button className="rf-btn" type="submit" disabled={submitting}
                  style={{ width: "100%", padding: 14, background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 500, fontFamily: F, cursor: "pointer", transition: "background 0.2s, transform 0.15s", opacity: submitting ? 0.6 : 1, marginTop: 4 }}>
                  {submitting ? "Sending..." : "Get in touch"}
                </button>
              </form>
              <div style={{ textAlign: "center", fontSize: 12, color: "#999", marginTop: 12, lineHeight: 1.5 }}>
                {businessName} will reach out shortly. Your info is only shared with them.
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: "#eef6ee",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d7a3a" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 500, color: "#111", marginBottom: 8 }}>You&#39;re all set!</h3>
              <p style={{ fontSize: 14, color: "#777", lineHeight: 1.5 }}>
                {businessName} will be in touch shortly.<br />Thanks for trusting {partnerFirstName}&#39;s recommendation.
              </p>
            </div>
          )}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="rf-fade-delay" style={{ padding: "40px 0 32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20, fontSize: 15, fontWeight: 500, color: "#555" }}>
              What people are saying on
              <svg width="60" height="20" viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
                <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
                <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C119.25 34.32 129.24 25 141.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
                <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
                <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
                <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
                <path d="M35.29 41.19V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49-.01z" fill="#4285F4"/>
              </svg>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: reviews.length > 1 ? "1fr 1fr" : "1fr", gap: 12 }}>
              {reviews.map((review, i) => (
                <div key={i} style={{
                  background: "#fff", borderRadius: 14, padding: 20,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)", border: "1px solid #f0efe9",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ display: "flex", gap: 1 }}>
                      {[1,2,3,4,5].map(s => <StarSVG key={s} filled={s <= review.rating} />)}
                    </span>
                    <GoogleIcon />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#222", marginBottom: 8 }}>{review.author}</div>
                  <div style={{
                    fontSize: 13, color: "#666", lineHeight: 1.6,
                    display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                  }}>{review.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "16px 0 32px", borderTop: "1px solid #eeedea" }}>
          <span style={{ fontSize: 12, color: "#bbb" }}>powered by <span style={{ fontWeight: 500, color: "#999" }}>handled.</span></span>
        </div>
      </div>
    </div>
  );
}
