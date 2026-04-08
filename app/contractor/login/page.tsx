"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContractorLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contractor/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .si-input:focus { outline: none; border-color: #007aff !important; }
        .si-input::placeholder { color: #c7c7cc; }
        .si-btn:active { opacity: 0.85; }
        @keyframes checkPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .check-pop { animation: checkPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
      `}</style>

      <div style={s.page}>
        <div style={s.card}>
          {/* Logo */}
          <div style={s.logoRow}>
            <img src="/logo-dark.png" alt="handled." style={{ height: 28 }} />
          </div>

          {!sent ? (
            <>
              <div style={s.title}>Sign in to handled.</div>
              <div style={s.subtitle}>
                Enter your email and we&apos;ll send you a magic link. No password needed.
              </div>

              <div style={s.field}>
                <div style={s.label}>Email</div>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
                  className="si-input"
                  style={s.input}
                  autoFocus
                />
              </div>

              {error && <div style={{ fontSize: 13, color: "#ff3b30", marginBottom: 12 }}>{error}</div>}

              <button
                className="si-btn"
                onClick={handleSubmit}
                disabled={loading || !email.trim()}
                style={{
                  ...s.btn,
                  opacity: !email.trim() ? 0.4 : 1,
                  cursor: !email.trim() ? "default" : "pointer",
                }}
              >
                {loading ? "Sending..." : "Send login link"}
              </button>

              <div style={s.hint}>
                Don&apos;t have an account?{" "}
                <Link href="/" style={s.link}>Create your site</Link>
              </div>
            </>
          ) : (
            <>
              <div className="check-pop" style={s.checkCircle}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div style={{ ...s.title, marginTop: 16 }}>Check your email</div>
              <div style={s.subtitle}>
                We sent a login link to <span style={{ color: "#1c1c1e", fontWeight: 600 }}>{email}</span>. Click the link to sign in.
              </div>
              <div style={s.tipBox}>
                <div style={s.tipTitle}>Not seeing it?</div>
                <div style={s.tipText}>
                  Check your spam folder. The email comes from handled.sites and usually arrives within 30 seconds.
                </div>
              </div>
              <button
                className="si-btn"
                onClick={() => { setSent(false); setEmail(""); setError(""); }}
                style={{ ...s.btn, background: "#f2f2f7", color: "#1c1c1e" }}
              >
                Try a different email
              </button>
            </>
          )}
        </div>

        <div style={s.footer}>
          handled.
        </div>
      </div>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "-apple-system, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    background: "#fff",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    padding: "32px 24px",
  },

  logoRow: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 28,
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1c1c1e",
    letterSpacing: "-0.02em",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#8e8e93",
    lineHeight: 1.5,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
  },

  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1c1c1e",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "13px 14px",
    border: "1.5px solid #e5e5ea",
    borderRadius: 10,
    fontSize: 16,
    fontFamily: "-apple-system, sans-serif",
    color: "#1c1c1e",
    background: "#fff",
    transition: "border-color 0.15s ease",
  },

  btn: {
    width: "100%",
    padding: "14px",
    borderRadius: 10,
    background: "#007aff",
    color: "#fff",
    border: "none",
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "-apple-system, sans-serif",
    letterSpacing: "-0.01em",
    marginBottom: 16,
    transition: "opacity 0.15s ease",
  },

  hint: {
    fontSize: 13,
    color: "#8e8e93",
    textAlign: "center",
  },
  link: {
    color: "#007aff",
    fontWeight: 500,
    textDecoration: "none",
  },

  checkCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    background: "#34c759",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
  },
  tipBox: {
    background: "#f9f9f9",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 16,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1c1c1e",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: "#8e8e93",
    lineHeight: 1.45,
  },

  footer: {
    fontSize: 12,
    color: "#c7c7cc",
    marginTop: 32,
    textAlign: "center",
  },
};
