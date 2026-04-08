"use client";

import { useState } from "react";

/* ── SVG Icons ── */
const CheckDot = () => (
  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#FFF6E8", color: "#E08A1E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5.5L4 7.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </span>
);

const MinusDot = () => (
  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#F0EDE6", color: "#9B9789", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  </span>
);

const FreeIcon = () => (
  <svg width="36" height="36" fill="none" viewBox="0 0 36 36"><rect x="4" y="9" width="28" height="18" rx="3" stroke="#9B9789" strokeWidth="2"/><circle cx="14" cy="18" r="4" stroke="#9B9789" strokeWidth="1.5" fill="#E4E0D6"/><path d="M22 15h6" stroke="#9B9789" strokeWidth="1.5" strokeLinecap="round"/><path d="M22 19h4" stroke="#9B9789" strokeWidth="1.5" strokeLinecap="round"/></svg>
);

const ProIcon = () => (
  <svg width="36" height="36" fill="none" viewBox="0 0 36 36"><rect x="4" y="6" width="28" height="24" rx="3" stroke="#E08A1E" strokeWidth="2"/><path d="M4 13h28" stroke="#E08A1E" strokeWidth="2"/><circle cx="9" cy="9.5" r="1.2" fill="#E08A1E"/><circle cx="13" cy="9.5" r="1.2" fill="#E08A1E"/><circle cx="17" cy="9.5" r="1.2" fill="#E08A1E"/><path d="M10 19h16" stroke="#FFF6E8" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 23h10" stroke="#FFF6E8" strokeWidth="1.5" strokeLinecap="round"/></svg>
);

const ToolboxIcon = () => (
  <svg width="36" height="36" fill="none" viewBox="0 0 36 36"><rect x="4" y="14" width="28" height="16" rx="3" stroke="#E08A1E" strokeWidth="2"/><path d="M13 14V10a5 5 0 0 1 10 0v4" stroke="#E08A1E" strokeWidth="2" strokeLinecap="round"/><path d="M4 20h28" stroke="#E08A1E" strokeWidth="1.5"/><rect x="15" y="17" width="6" height="6" rx="1.5" fill="#FFF6E8" stroke="#E08A1E" strokeWidth="1.2"/></svg>
);

/* ── Feature list item ── */
function Feat({ children, off }: { children: React.ReactNode; off?: boolean }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "13.5px", color: off ? "#9B9789" : "#6D6A60", lineHeight: 1.45 }}>
      {off ? <MinusDot /> : <CheckDot />}
      {children}
    </li>
  );
}

/* ── FAQ Item ── */
function FaqItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ borderBottom: "1.5px solid #F0EDE6", padding: "18px 0", cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15, fontWeight: 600, color: "#1C1B18" }}>
        {q}
        <span style={{ width: 24, height: 24, borderRadius: "50%", background: open ? "#FFF6E8" : "#F0EDE6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: open ? "#E08A1E" : "#6D6A60", transition: "transform 0.3s, background 0.3s", transform: open ? "rotate(45deg)" : "none", flexShrink: 0 }}>+</span>
      </div>
      <div style={{ maxHeight: open ? 200 : 0, overflow: "hidden", transition: "max-height 0.35s ease", fontSize: 14, color: "#6D6A60", lineHeight: 1.7, paddingTop: open ? 12 : 0 }}>{a}</div>
    </div>
  );
}

/* ── Main Component ── */
export default function PricingClient() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const proPrice = billing === "annual" ? "$23" : "$29";
  const toolboxPrice = billing === "annual" ? "$63" : "$79";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .pc-fade { opacity: 0; transform: translateY(16px); animation: pc-up 0.55s ease forwards; }
        @keyframes pc-up { to { opacity: 1; transform: translateY(0); } }
        .pc-card { transition: transform 0.3s, box-shadow 0.3s; }
        .pc-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(28,27,24,0.07); }
        .pc-card.pc-pop:hover { box-shadow: 0 14px 40px rgba(28,27,24,0.13); }
        .pc-cta-light:hover { background: #E4E0D6 !important; }
        .pc-cta-amber:hover { background: #C47518 !important; }
        .pc-nav-link:hover { color: #1C1B18 !important; }
        .pc-nav-cta:hover { background: #2E2D29 !important; }
        .pc-final-btn:hover { background: #C47518 !important; }
        .pc-ut-btn:hover { background: #353B4D !important; }
        @media (max-width: 820px) {
          .pc-grid { grid-template-columns: 1fr !important; max-width: 400px !important; margin: 0 auto !important; }
          .pc-proof { grid-template-columns: 1fr !important; }
          .pc-proof-item { border-right: none !important; border-bottom: 1.5px solid #E4E0D6 !important; }
          .pc-proof-item:last-child { border-bottom: none !important; }
          .pc-upgrade { flex-direction: column !important; text-align: center !important; padding: 28px 24px !important; }
          .pc-hero-h1 { font-size: 34px !important; }
          .pc-nav { padding: 16px 20px !important; }
          .pc-nav-hide { display: none !important; }
          .pc-feat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Grain overlay */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`, pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", color: "#1C1B18", background: "#FAF8F4", minHeight: "100vh" }}>

        {/* Nav */}
        <nav className="pc-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", maxWidth: 1080, margin: "0 auto" }}>
          <a href="/" style={{ fontSize: 24, fontWeight: 800, color: "#1C1B18", letterSpacing: "-0.8px", textDecoration: "none" }}>handled<span style={{ color: "#E08A1E" }}>.</span></a>
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <a className="pc-nav-link pc-nav-hide" href="/" style={{ fontSize: 14, color: "#6D6A60", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}>How it works</a>
            <a className="pc-nav-link pc-nav-hide" href="/pricing" style={{ fontSize: 14, color: "#6D6A60", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}>Pricing</a>
            <a className="pc-nav-cta" href="/" style={{ background: "#252A3A", color: "#fff", padding: "10px 22px", borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "background 0.2s" }}>Get started free</a>
          </div>
        </nav>

        {/* Hero */}
        <section className="pc-fade" style={{ textAlign: "center", padding: "72px 24px 12px", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#E08A1E", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Pricing</div>
          <h1 className="pc-hero-h1" style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-1.6px", lineHeight: 1.08, marginBottom: 16 }}>
            Your business page.<br /><span style={{ color: "#E08A1E" }}>Your rules.</span>
          </h1>
          <p style={{ fontSize: 17, color: "#6D6A60", lineHeight: 1.6, maxWidth: 440, margin: "0 auto" }}>
            A site, a phone number, and everything you need to talk to your customers. Start free, upgrade when you&#39;re ready.
          </p>
        </section>

        {/* Toggle */}
        <div className="pc-fade" style={{ display: "flex", justifyContent: "center", margin: "36px auto 44px", gap: 4, background: "#F0EDE6", borderRadius: 100, padding: 4, width: "fit-content", animationDelay: "0.1s" }}>
          <button onClick={() => setBilling("monthly")} style={{ padding: "10px 28px", borderRadius: 100, border: "none", fontFamily: "inherit", fontSize: 14, cursor: "pointer", background: billing === "monthly" ? "#fff" : "transparent", color: billing === "monthly" ? "#1C1B18" : "#6D6A60", fontWeight: billing === "monthly" ? 600 : 500, boxShadow: billing === "monthly" ? "0 2px 8px rgba(0,0,0,0.06)" : "none", transition: "all 0.25s" }}>Monthly</button>
          <button onClick={() => setBilling("annual")} style={{ padding: "10px 28px", borderRadius: 100, border: "none", fontFamily: "inherit", fontSize: 14, cursor: "pointer", background: billing === "annual" ? "#fff" : "transparent", color: billing === "annual" ? "#1C1B18" : "#6D6A60", fontWeight: billing === "annual" ? 600 : 500, boxShadow: billing === "annual" ? "0 2px 8px rgba(0,0,0,0.06)" : "none", transition: "all 0.25s", position: "relative" }}>
            Annual <span style={{ position: "absolute", top: -7, right: -6, background: "#E08A1E", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 100 }}>-20%</span>
          </button>
        </div>

        {/* Cards Grid */}
        <div className="pc-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: 960, margin: "0 auto", padding: "0 28px" }}>

          {/* FREE */}
          <div className="pc-card pc-fade" style={{ background: "#fff", border: "1.5px solid #E4E0D6", borderRadius: 16, padding: "32px 28px 28px", display: "flex", flexDirection: "column", position: "relative", animationDelay: "0.08s" }}>
            <div style={{ marginBottom: 18 }}><FreeIcon /></div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: "#9B9789", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>handled.sites</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
              <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-1.5px", color: "#1C1B18", lineHeight: 1 }}>Free</span>
            </div>
            <div style={{ fontSize: "14.5px", color: "#6D6A60", marginBottom: 24, lineHeight: 1.5, minHeight: 44 }}>A digital business card you can share with any customer in 30 seconds. No tech skills needed.</div>
            <a className="pc-cta-light" href="/" style={{ display: "block", width: "100%", padding: "14px 0", borderRadius: 10, fontSize: 15, fontWeight: 600, textAlign: "center", textDecoration: "none", marginBottom: 24, background: "#F0EDE6", color: "#1C1B18", border: "1.5px solid #E4E0D6", transition: "all 0.2s" }}>Build your card</a>
            <div style={{ height: "1.5px", background: "#F0EDE6", marginBottom: 20 }} />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B9789", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500, marginBottom: 14 }}>What you get</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 11, flex: 1, padding: 0 }}>
              <Feat>Digital business card</Feat>
              <Feat>Tap-to-call and text buttons</Feat>
              <Feat>QR code you can print or share</Feat>
              <Feat>Your services and service area</Feat>
              <Feat>Basic page view stats</Feat>
              <Feat off>handled. branding shown</Feat>
            </ul>
          </div>

          {/* PRO */}
          <div className="pc-card pc-fade" style={{ background: "#fff", border: "1.5px solid #E4E0D6", borderRadius: 16, padding: "32px 28px 28px", display: "flex", flexDirection: "column", position: "relative", animationDelay: "0.18s" }}>
            <div style={{ marginBottom: 18 }}><ProIcon /></div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: "#9B9789", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Pro</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
              <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-1.5px", color: "#1C1B18", lineHeight: 1 }}>{proPrice}</span>
              <span style={{ fontSize: 15, color: "#9B9789", fontWeight: 500 }}>/mo</span>
            </div>
            <div style={{ fontSize: "14.5px", color: "#6D6A60", marginBottom: 24, lineHeight: 1.5, minHeight: 44 }}>A real one-page website with your own domain, a review wall, and lead funnels. Look like an established business.</div>
            <a className="pc-cta-light" href="/contractor/settings" style={{ display: "block", width: "100%", padding: "14px 0", borderRadius: 10, fontSize: 15, fontWeight: 600, textAlign: "center", textDecoration: "none", marginBottom: 24, background: "#F0EDE6", color: "#1C1B18", border: "1.5px solid #E4E0D6", transition: "all 0.2s" }}>Upgrade to Pro</a>
            <div style={{ height: "1.5px", background: "#F0EDE6", marginBottom: 20 }} />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B9789", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500, marginBottom: 14 }}>Everything free +</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 11, flex: 1, padding: 0 }}>
              <Feat>One-page website for your business</Feat>
              <Feat>Custom call to actions</Feat>
              <Feat>Your own domain name</Feat>
              <Feat>No handled. branding</Feat>
              <Feat>Review wall on your site</Feat>
              <Feat>Quiz funnels built for your trade</Feat>
              <Feat>Full traffic and lead analytics</Feat>
              <Feat>SMS alerts for views and new leads</Feat>
            </ul>
          </div>

          {/* TOOLBOX */}
          <div className="pc-card pc-pop pc-fade" style={{ background: "#fff", border: "2.5px solid #E08A1E", borderRadius: 16, padding: "32px 28px 28px", display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 6px 24px rgba(28,27,24,0.1)", animationDelay: "0.28s" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#E08A1E", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 100, whiteSpace: "nowrap" }}>Most popular</div>
            <div style={{ marginBottom: 18 }}><ToolboxIcon /></div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600, color: "#E08A1E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>handled. toolbox</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
              <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-1.5px", color: "#1C1B18", lineHeight: 1 }}>{toolboxPrice}</span>
              <span style={{ fontSize: 15, color: "#9B9789", fontWeight: 500 }}>/mo</span>
            </div>
            <div style={{ fontSize: "14.5px", color: "#6D6A60", marginBottom: 24, lineHeight: 1.5, minHeight: 44 }}>Your own business number, two-way texting, and everything you need to get reviews, referrals, and repeat customers.</div>
            <a className="pc-cta-amber" href="/contractor/settings" style={{ display: "block", width: "100%", padding: "14px 0", borderRadius: 10, fontSize: 15, fontWeight: 600, textAlign: "center", textDecoration: "none", marginBottom: 24, background: "#E08A1E", color: "#fff", border: "1.5px solid #E08A1E", transition: "all 0.2s" }}>Get started</a>
            <div style={{ height: "1.5px", background: "#F0EDE6", marginBottom: 20 }} />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B9789", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500, marginBottom: 14 }}>Everything pro +</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 11, flex: 1, padding: 0 }}>
              <Feat>Your own business phone number</Feat>
              <Feat>Two-way texting with customers</Feat>
              <Feat>Missed call auto text-back</Feat>
              <Feat>One-tap review request button</Feat>
              <Feat>Reputation funnel with feedback filter</Feat>
              <Feat>One-tap referral ask button</Feat>
              <Feat>Quick-reply text templates</Feat>
              <Feat>Past customer reactivation list</Feat>
              <Feat>Manage everything from one dashboard</Feat>
            </ul>
          </div>
        </div>

        {/* Bottom sections */}
        <div style={{ maxWidth: 960, margin: "56px auto 0", padding: "0 28px" }}>

          {/* Proof Bar */}
          <div className="pc-proof pc-fade" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: "#fff", border: "1.5px solid #E4E0D6", borderRadius: 16, overflow: "hidden", marginBottom: 56, animationDelay: "0.4s" }}>
            {[
              { num: "60 sec", label: "Zero to live" },
              { num: "$0", label: "To get started. No card needed." },
              { num: "0", label: "Contracts. Cancel anytime." },
            ].map((p, i) => (
              <div key={i} className="pc-proof-item" style={{ padding: "24px 20px", textAlign: "center", borderRight: i < 2 ? "1.5px solid #E4E0D6" : "none" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#1C1B18", letterSpacing: "-0.5px", marginBottom: 2 }}>{p.num}</div>
                <div style={{ fontSize: 12, color: "#9B9789", fontWeight: 500 }}>{p.label}</div>
              </div>
            ))}
          </div>

          {/* Upgrade Tease */}
          <div className="pc-upgrade pc-fade" style={{ background: "#FFF6E8", border: "1.5px solid rgba(224,138,30,0.15)", borderRadius: 16, padding: "36px 40px", display: "flex", flexDirection: "column", gap: 24, marginBottom: 56, animationDelay: "0.45s" }}>
            <div style={{ textAlign: "left", width: "100%" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#E08A1E", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Coming soon</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1C1B18", letterSpacing: "-0.6px", marginBottom: 6 }}>handled. Front Office</div>
              <div style={{ fontSize: 14, color: "#6D6A60", lineHeight: 1.55, marginBottom: 20 }}>Stop losing jobs to slow follow-up. Front Office is your AI-powered team that works 24/7 so you don&#39;t have to.</div>
              <div className="pc-feat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 20 }}>
                {[
                  { text: "Ava texts back new leads in seconds and books the appointment for you", bold: true },
                  { text: "Stella collects 5-star reviews after every job and sends referral requests automatically", bold: true },
                  { text: "Missed call text-back, no-show recovery, and past customer reactivation", bold: false },
                  { text: "Call recording, AI transcripts, and full pipeline analytics", bold: false },
                ].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "13.5px", color: "#6D6A60", lineHeight: 1.4 }}>
                    <span style={{ color: "#E08A1E", fontWeight: 700, flexShrink: 0 }}>&#10003;</span>
                    <span style={f.bold ? { fontWeight: 600, color: "#1C1B18" } : undefined}>{f.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ fontSize: 14, color: "#1C1B18" }}>
                  <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px" }}>Starting at $149</span>
                  <span style={{ color: "#9B9789", fontWeight: 500 }}>/mo</span>
                </div>
                <span style={{ fontSize: 12, color: "#9B9789" }}>Flat rate. Unlimited leads. 24/7 coverage. English + Spanish.</span>
              </div>
            </div>
            <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 12 }}>
              <a className="pc-ut-btn" href="#" style={{ background: "#252A3A", color: "#fff", padding: "12px 28px", borderRadius: 100, fontSize: 14, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", transition: "background 0.2s", flexShrink: 0 }}>Join the waitlist</a>
              <span style={{ fontSize: 12, color: "#EAA84A" }}>Be first in line when we launch.</span>
            </div>
          </div>

          {/* FAQ */}
          <div style={{ maxWidth: 580, margin: "0 auto", paddingBottom: 48 }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.8px", textAlign: "center", marginBottom: 32 }}>Questions we get a lot</div>
            {[
              { q: "How fast can I get my page up?", a: "About 60 seconds. You answer a few questions about your business in a simple step-by-step flow and your page builds itself. No app to download, no dashboard to figure out." },
              { q: "I already have a website. Do I need this?", a: "The free tier is a digital business card, not a replacement for your website. It\u2019s the thing you text a customer or print on a QR code. If you want an actual website with your own domain and a review wall, that\u2019s the Pro plan at $29/mo." },
              { q: "What\u2019s the phone number for?", a: "On the Toolbox plan, you get a real local business number. Calls and texts come straight to your phone. Missed a call? Your number auto-texts them back. You can also text customers from it to ask for reviews, referrals, or just follow up on a quote." },
              { q: "I\u2019m not great with tech. Is this hard?", a: "If you can fill out a form, you can use handled. Setup is a simple step-by-step conversation. Just answer a few questions and you\u2019re live. We built this for guys on a roof, not guys at a desk." },
              { q: "What trades does this work for?", a: "HVAC, roofing, solar, plumbing, electrical, landscaping, painting, pest control, general contracting, and more. If customers call or text you for work, handled. is built for you." },
              { q: "Can I upgrade or downgrade later?", a: "Anytime. Upgrades kick in immediately. Downgrades happen at the end of your billing cycle. No penalties." },
            ].map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} open={faqOpen === i} onClick={() => setFaqOpen(faqOpen === i ? null : i)} />
            ))}
          </div>

          {/* Final CTA */}
          <div className="pc-fade" style={{ background: "#252A3A", borderRadius: 16, padding: "52px 32px", textAlign: "center", marginBottom: 80, position: "relative", overflow: "hidden", animationDelay: "0.5s" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 40% 40%, rgba(224,138,30,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-1px", marginBottom: 8, position: "relative" }}>Your page is 60 seconds away.</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 28, position: "relative" }}>Free. No credit card. No tech skills required.</p>
            <a className="pc-final-btn" href="/" style={{ display: "inline-block", background: "#E08A1E", color: "#fff", padding: "14px 36px", borderRadius: 100, fontSize: 15, fontWeight: 600, textDecoration: "none", transition: "background 0.2s", position: "relative" }}>Build your free page</a>
            <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.35)", position: "relative" }}>Join hundreds of contractors already on handled.</div>
          </div>

        </div>
      </div>
    </>
  );
}
