"use client";

import { useState, useCallback } from "react";
import type { ContractorSite } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";

type Props = { sites: ContractorSite[] };

/* ─── helpers ─── */
const F = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif";
const MONO = "'SF Mono', 'Fira Code', 'Cascadia Mono', 'Menlo', monospace";
const EASE = "cubic-bezier(0.25,0.1,0.25,1)";

function siteUrl(site: ContractorSite): string {
  if (site.type === "quiz_funnel") return `/q/${site.slug}`;
  if (site.type === "review_funnel") return `/r/${site.slug}`;
  if (site.type === "website") return `/s/${site.slug}`;
  if (site.type === "review_wall") return `/reviews/${site.slug}`;
  return `/${site.slug}`;
}

function fmtNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

const SITE_META: Record<string, { label: string; icon: JSX.Element }> = {
  business_card: {
    label: "Business Card",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="M8 10h.01M8 14h8M8 17h5" />
      </svg>
    ),
  },
  quiz_funnel: {
    label: "Quiz Funnel",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  review_funnel: {
    label: "Review Funnel",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  review_wall: {
    label: "Review Wall",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  website: {
    label: "Website",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
};

/* ─── Copy button ─── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, [text]);

  return (
    <button
      onClick={copy}
      aria-label="Copy URL"
      style={{
        width: 28, height: 28, borderRadius: 7,
        border: "none", cursor: "pointer",
        background: copied ? "rgba(52,199,89,0.1)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: `all 0.2s ${EASE}`,
        flexShrink: 0,
      }}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}

/* ─── Lock icon for URL bar ─── */
const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aeaeb2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

/* ─── External link arrow ─── */
const OpenLink = ({ href }: { href: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="hs-open-link"
    style={{
      fontSize: 13, fontWeight: 500, color: "#0071e3",
      textDecoration: "none",
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "5px 10px", borderRadius: 8,
      transition: `all 0.2s ${EASE}`,
    }}
  >
    Open
    <svg className="hs-open-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transition: `transform 0.2s ${EASE}` }}>
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  </a>
);

/* ─── URL bar ─── */
const UrlBar = ({ url }: { url: string }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 6,
    background: "rgba(0,0,0,0.025)", borderRadius: 10,
    padding: "6px 6px 6px 10px",
    minWidth: 0, flex: 1,
  }}>
    <LockIcon />
    <span style={{
      fontFamily: MONO, fontSize: 11, color: "#86868b",
      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      flex: 1, minWidth: 0,
    }}>
      {url}
    </span>
    <CopyBtn text={url} />
  </div>
);

/* ─── Stat ─── */
const Stat = ({ value, label }: { value: string; label: string }) => (
  <div style={{ textAlign: "right" }}>
    <div style={{
      fontSize: 17, fontWeight: 600, color: "#1d1d1f",
      fontVariantNumeric: "tabular-nums", lineHeight: 1,
    }}>{value}</div>
    <div style={{
      fontSize: 10, fontWeight: 500, color: "#aeaeb2",
      textTransform: "uppercase", letterSpacing: "0.04em",
      marginTop: 2,
    }}>{label}</div>
  </div>
);

/* ─── Live badge ─── */
const LiveBadge = () => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 11, fontWeight: 500, color: "#34C759",
  }}>
    <span className="hs-live-dot" style={{
      width: 6, height: 6, borderRadius: 3,
      background: "#34C759",
      boxShadow: "0 0 6px rgba(52,199,89,0.4)",
    }} />
    Live
  </span>
);

/* ─── Chevron icon ─── */
const ChevronDown = ({ expanded }: { expanded: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aeaeb2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: `transform 0.3s ${EASE}`, transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/* ─── Site Card wrapper ─── */
function SiteCard({
  site,
  index,
  children,
}: {
  site: ContractorSite;
  index: number;
  children?: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const expandable = !!children;
  const meta = SITE_META[site.type] || SITE_META.business_card;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://handledsites.com";
  const fullUrl = `${baseUrl}${siteUrl(site)}`;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => !expanded && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: hover || expanded ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.72)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        borderRadius: 20,
        border: hover || expanded ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(0,0,0,0.04)",
        padding: "18px 20px",
        transition: `all 0.5s ${EASE}`,
        transform: pressed ? "scale(0.985)" : hover && !expanded ? "scale(1.005)" : "scale(1)",
        boxShadow: hover || expanded ? "0 8px 40px rgba(0,0,0,0.06)" : "0 1px 4px rgba(0,0,0,0.02)",
        cursor: expandable && !expanded ? "pointer" : "default",
        animation: `hsCardIn 0.5s ${EASE} both`,
        animationDelay: `${index * 60}ms`,
      }}
      onClick={() => { if (expandable && !expanded) setExpanded(true); }}
    >
      {/* Top row: icon + title + live + open */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div
          className="hs-icon-box"
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(145deg, rgba(0,0,0,0.03), rgba(0,0,0,0.06))",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            transition: `transform 0.5s ${EASE}`,
            transform: hover ? "rotate(-3deg)" : "rotate(0)",
          }}
        >
          {meta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 600, color: "#1d1d1f",
            letterSpacing: "-0.02em", lineHeight: 1.2,
          }}>{meta.label}</div>
        </div>
        <LiveBadge />
        <OpenLink href={siteUrl(site)} />
        {expandable && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{
              width: 28, height: 28, borderRadius: 7,
              border: "none", background: expanded ? "rgba(0,0,0,0.04)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
              transition: `all 0.2s ${EASE}`,
            }}
          >
            <ChevronDown expanded={expanded} />
          </button>
        )}
      </div>

      {/* Bottom row: URL bar + stats */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <UrlBar url={fullUrl} />
        {site.review_count != null && site.review_count > 0 && (
          <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
            <Stat value={fmtNum(site.review_count)} label="Reviews" />
            {site.avg_rating != null && (
              <Stat value={site.avg_rating.toFixed(1)} label="Rating" />
            )}
          </div>
        )}
      </div>

      {/* Expandable content */}
      {expandable && (
        <div style={{
          maxHeight: expanded ? 600 : 0,
          opacity: expanded ? 1 : 0,
          overflow: "hidden",
          transition: `max-height 0.4s ${EASE}, opacity 0.3s ${EASE}`,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Business card settings panel ─── */
function BusinessCardSettings({ site }: { site: ContractorSite }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [bannerMessage, setBannerMessage] = useState(site.banner_message);
  const [hoursStart, setHoursStart] = useState(site.hours_start);
  const [hoursEnd, setHoursEnd] = useState(site.hours_end);
  const [badgeLicensed, setBadgeLicensed] = useState(site.badge_licensed);
  const [badgeFreeEstimates, setBadgeFreeEstimates] = useState(site.badge_free_estimates);
  const [badgeEmergency, setBadgeEmergency] = useState(site.badge_emergency);
  const [badgeFamilyOwned, setBadgeFamilyOwned] = useState(site.badge_family_owned);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://handledsites.com";
  const qrUrl = `${baseUrl}/qr/${site.slug}`;

  const handleSave = async () => {
    setSaving(true); setMessage("");
    try {
      const res = await fetch(`/api/contractor/sites/${site.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner_message: bannerMessage, hours_start: hoursStart, hours_end: hoursEnd,
          badge_licensed: badgeLicensed, badge_free_estimates: badgeFreeEstimates,
          badge_emergency: badgeEmergency, badge_family_owned: badgeFamilyOwned,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Saved!");
      setTimeout(() => setMessage(""), 2000);
    } catch { setMessage("Error saving"); }
    finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.025)",
    padding: "9px 12px", fontSize: 14, color: "#1d1d1f",
    fontFamily: F, outline: "none",
    transition: `border 0.2s ${EASE}`,
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 500, color: "#86868b",
    marginBottom: 5, letterSpacing: "0.01em",
  };

  return (
    <div style={{
      marginTop: 18, paddingTop: 18,
      borderTop: "1px solid rgba(0,0,0,0.04)",
      display: "grid", gap: 20,
      gridTemplateColumns: "1fr auto",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Banner message</label>
          <input
            type="text"
            value={bannerMessage}
            onChange={(e) => setBannerMessage(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Hours start</label>
            <select value={hoursStart} onChange={(e) => setHoursStart(Number(e.target.value))} style={inputStyle}>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Hours end</label>
            <select value={hoursEnd} onChange={(e) => setHoursEnd(Number(e.target.value))} style={inputStyle}>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Trust badges</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
            {[
              { label: "Licensed & Insured", value: badgeLicensed, set: setBadgeLicensed },
              { label: "Free estimates", value: badgeFreeEstimates, set: setBadgeFreeEstimates },
              { label: "24/7 emergency", value: badgeEmergency, set: setBadgeEmergency },
              { label: "Family owned", value: badgeFamilyOwned, set: setBadgeFamilyOwned },
            ].map((b) => (
              <label key={b.label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={b.value} onChange={(e) => b.set(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: "#0071e3" }} />
                <span style={{ fontSize: 13, color: "#1d1d1f" }}>{b.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 20px", borderRadius: 10,
              background: "#0071e3", color: "#fff",
              fontSize: 13, fontWeight: 600, border: "none",
              cursor: "pointer", opacity: saving ? 0.5 : 1,
              transition: `all 0.2s ${EASE}`,
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {message && (
            <span style={{
              fontSize: 12, fontWeight: 500,
              color: message.includes("Error") ? "#FF3B30" : "#34C759",
            }}>{message}</span>
          )}
        </div>
      </div>

      {/* QR code */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{
          padding: 12, borderRadius: 14,
          background: "#fff", border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}>
          <QRCodeSVG value={qrUrl} size={100} level="M" />
        </div>
        <CopyBtn text={qrUrl} />
        <p style={{
          fontSize: 10, color: "#aeaeb2", textAlign: "center",
          maxWidth: 120, lineHeight: 1.4, margin: 0,
        }}>
          Print on flyers, decals, or business cards
        </p>
      </div>
    </div>
  );
}

/* ─── Main export ─── */
export default function ContractorSitesEditor({ sites }: Props) {
  const liveSites = sites.length;

  return (
    <div style={{ fontFamily: F }}>
      <style>{`
        @keyframes hsCardIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes hsLivePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .hs-live-dot { animation: hsLivePulse 2s ease-in-out infinite; }
        .hs-open-link:hover { background: rgba(0,113,227,0.06); }
        .hs-open-link:hover .hs-open-arrow { transform: translate(1px, -1px); }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 28,
      }}>
        <div>
          <h1 style={{
            fontSize: 34, fontWeight: 700, color: "#1d1d1f",
            letterSpacing: "-0.03em", lineHeight: 1.1, margin: 0,
          }}>Your Sites</h1>
          <p style={{
            fontSize: 15, fontWeight: 400, color: "#86868b",
            margin: "6px 0 0",
          }}>Manage and preview everything in one place.</p>
        </div>
        <div style={{ display: "flex", gap: 24, paddingTop: 6 }}>
          <Stat value={String(liveSites)} label="Sites Live" />
        </div>
      </div>

      {sites.length === 0 ? (
        <div style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(40px) saturate(180%)",
          borderRadius: 20, border: "1px solid rgba(0,0,0,0.04)",
          padding: 48, textAlign: "center",
        }}>
          <p style={{ fontSize: 15, color: "#86868b", margin: 0 }}>No sites yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sites.map((site, i) => (
            <SiteCard key={site.id} site={site} index={i}>
              {site.type === "business_card" && <BusinessCardSettings site={site} />}
            </SiteCard>
          ))}
        </div>
      )}
    </div>
  );
}
