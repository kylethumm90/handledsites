import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SERVICE_DESCRIPTIONS } from "@/lib/constants";
import WebsiteContactForm from "./WebsiteContactForm";

export const revalidate = 60;

type SiteData = {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  email: string | null;
  city: string;
  state: string;
  trade: string;
  services: string[];
  logo_url: string | null;
  about_bio: string | null;
  google_review_url: string | null;
  hours_start: number;
  hours_end: number;
  badge_licensed: boolean;
  badge_free_estimates: boolean;
  badge_emergency: boolean;
  badge_family_owned: boolean;
  review_count: number | null;
  avg_rating: number | null;
  years_in_business: number | null;
  service_areas: string[] | null;
  license_number: string | null;
  hero_tagline: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_google: string | null;
  social_nextdoor: string | null;
};

async function getSiteData(slug: string): Promise<SiteData | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("sites_full")
    .select("*")
    .eq("slug", slug)
    .eq("type", "website")
    .eq("is_active", true)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    business_name: data.business_name,
    owner_name: data.owner_name,
    phone: data.business_phone,
    email: data.business_email,
    city: data.city,
    state: data.state,
    trade: data.trade,
    services: data.services || [],
    logo_url: data.logo_url,
    about_bio: data.about_bio,
    google_review_url: data.google_review_url,
    hours_start: data.hours_start ?? 7,
    hours_end: data.hours_end ?? 19,
    badge_licensed: data.badge_licensed ?? false,
    badge_free_estimates: data.badge_free_estimates ?? false,
    badge_emergency: data.badge_emergency ?? false,
    badge_family_owned: data.badge_family_owned ?? false,
    review_count: data.review_count,
    avg_rating: data.avg_rating,
    years_in_business: data.years_in_business,
    service_areas: data.service_areas,
    license_number: data.license_number,
    hero_tagline: data.hero_tagline,
    social_facebook: data.social_facebook,
    social_instagram: data.social_instagram,
    social_google: data.social_google,
    social_nextdoor: data.social_nextdoor,
  };
}

function fmtPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

function ownerInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const site = await getSiteData(params.slug);
  if (!site) return { title: "Not Found" };
  const title = `${site.business_name} | ${site.trade} in ${site.city}, ${site.state}`;
  const description = site.about_bio || `${site.trade} services in ${site.city}, ${site.state}. Call ${fmtPhone(site.phone)} for a free estimate.`;
  return {
    title, description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function WebsitePage({ params }: { params: { slug: string } }) {
  const site = await getSiteData(params.slug);
  if (!site) notFound();

  const heroTitle = site.hero_tagline || `${site.trade} Services in ${site.city}, ${site.state}`;
  const heroSub = [
    site.badge_licensed && "Licensed & insured",
    site.years_in_business && `${site.years_in_business} years serving ${site.city}`,
    site.review_count && `${site.review_count} five-star reviews`,
  ].filter(Boolean).join(" · ") || `Professional ${site.trade.toLowerCase()} services`;

  const trustBadges = [
    site.badge_licensed && "Licensed & insured",
    site.badge_free_estimates && "Free estimates",
    site.badge_emergency && "24/7 emergency service",
    site.badge_family_owned && "Family owned",
  ].filter(Boolean) as string[];

  const whyUsCards = [
    site.badge_emergency && { icon: "⚡", title: "Same-day service", desc: `When you need ${site.trade.toLowerCase()} help fast, you can't wait. We keep same-day slots available.` },
    { icon: "💰", title: "Upfront pricing", desc: "You get a flat quote before we start. No surprises on the invoice." },
    site.badge_family_owned && { icon: "🏡", title: "Family owned", desc: "Not a franchise. Not a call center. You talk to us directly, every time." },
    site.badge_licensed && { icon: "🛡️", title: "Licensed & insured", desc: "Fully licensed and insured for your protection and peace of mind." },
    { icon: "✅", title: "100% guaranteed", desc: "If you're not satisfied, we make it right. No questions, no hassle." },
  ].filter(Boolean).slice(0, 4) as { icon: string; title: string; desc: string }[];

  const filteredServices = site.services.filter((s) => s !== "Free Estimates");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.business_name,
    telephone: `+1${site.phone}`,
    email: site.email,
    address: { "@type": "PostalAddress", addressLocality: site.city, addressRegion: site.state },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      itemListElement: site.services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s } })),
    },
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WEBSITE_CSS }} />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="ws">
        {/* Nav */}
        <nav className="ws-nav">
          <div className="ws-container ws-nav-inner">
            <div className="ws-nav-logo">
              {site.logo_url ? (
                <img src={site.logo_url} alt={site.business_name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
              ) : (
                <div className="ws-nav-logo-icon">
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{ownerInitials(site.business_name)}</span>
                </div>
              )}
              <span className="ws-nav-name">{site.business_name}</span>
            </div>
            <div className="ws-nav-right">
              {site.license_number && <span className="ws-nav-license">Lic. {site.license_number}</span>}
              <a className="ws-btn-call" href={`tel:${site.phone}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                {fmtPhone(site.phone)}
              </a>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="ws-hero">
          <div className="ws-container ws-hero-inner">
            <div>
              <div className="ws-hero-badge"><div className="ws-badge-dot" /> Available now</div>
              <h1 className="ws-hero-h1">{heroTitle}</h1>
              <p className="ws-hero-sub">{heroSub}</p>
              <div className="ws-hero-ctas">
                <a className="ws-btn-primary" href={`tel:${site.phone}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  Call Now — Free Estimate
                </a>
                <a className="ws-btn-secondary" href="#quote">Get a Quote Online</a>
              </div>
              {trustBadges.length > 0 && (
                <div className="ws-hero-trust">
                  {trustBadges.map((b) => (
                    <div key={b} className="ws-trust-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      {b}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Proof Bar */}
        {(site.review_count || site.years_in_business) && (
          <div className="ws-proof-bar">
            <div className="ws-container ws-proof-inner">
              {site.review_count && (
                <>
                  <div className="ws-proof-item">
                    <div><div className="ws-proof-num">{site.review_count}</div><div className="ws-proof-label">Google reviews</div></div>
                  </div>
                  <div className="ws-proof-divider" />
                </>
              )}
              {site.avg_rating && (
                <>
                  <div className="ws-proof-item">
                    <div className="ws-stars">★★★★★</div>
                    <div><div className="ws-proof-num">{site.avg_rating}</div><div className="ws-proof-label">avg rating</div></div>
                  </div>
                  <div className="ws-proof-divider" />
                </>
              )}
              {site.years_in_business && (
                <>
                  <div className="ws-proof-item">
                    <div><div className="ws-proof-num">{site.years_in_business}</div><div className="ws-proof-label">years serving<br/>{site.city}</div></div>
                  </div>
                  <div className="ws-proof-divider" />
                </>
              )}
              {site.badge_emergency && (
                <div className="ws-proof-item">
                  <div><div className="ws-proof-num">24/7</div><div className="ws-proof-label">emergency<br/>service</div></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services */}
        {filteredServices.length > 0 && (
          <section className="ws-section ws-section-alt">
            <div className="ws-container">
              <div className="ws-section-label">What we do</div>
              <h2 className="ws-section-title">{site.trade} services for every situation</h2>
              <p className="ws-section-sub">From emergency repairs to new installations, we handle it all with the same standard of care.</p>
              <div className="ws-services-grid">
                {filteredServices.map((s) => (
                  <a key={s} className="ws-service-card" href="#quote">
                    <div className="ws-service-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="24" height="24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div className="ws-service-name">{s}</div>
                    <div className="ws-service-desc">{SERVICE_DESCRIPTIONS[s] || `Professional ${s.toLowerCase()} services for your home or business.`}</div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why Us */}
        {whyUsCards.length > 0 && (
          <section className="ws-section">
            <div className="ws-container">
              <div className="ws-section-label">Why {site.business_name}</div>
              <h2 className="ws-section-title">The {site.trade.toLowerCase()} company {site.city} trusts</h2>
              <p className="ws-section-sub">{site.years_in_business ? `We've built our reputation one job at a time for ${site.years_in_business} years.` : "We've built our reputation one job at a time."} Here&apos;s what that means for you.</p>
              <div className="ws-why-grid">
                {whyUsCards.map((c) => (
                  <div key={c.title} className="ws-why-card">
                    <div className="ws-why-icon">{c.icon}</div>
                    <div className="ws-why-title">{c.title}</div>
                    <div className="ws-why-desc">{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* About */}
        {site.about_bio && (
          <section className="ws-section ws-section-alt">
            <div className="ws-container">
              <div className="ws-about-inner">
                <div className="ws-about-photo-wrap">
                  {site.logo_url ? (
                    <img src={site.logo_url} alt={site.business_name} className="ws-about-photo" />
                  ) : (
                    <div className="ws-about-photo-placeholder">
                      <span style={{ fontSize: 48, fontWeight: 800 }}>{ownerInitials(site.business_name)}</span>
                    </div>
                  )}
                  {site.years_in_business && (
                    <div className="ws-years-badge">
                      <div className="ws-years-num">{site.years_in_business}</div>
                      <div className="ws-years-label">years in<br/>business</div>
                    </div>
                  )}
                </div>
                <div className="ws-about-content">
                  <div className="ws-section-label">Our story</div>
                  <h2 className="ws-section-title" style={{ marginBottom: 16 }}>About {site.business_name}</h2>
                  <p>{site.about_bio}</p>
                  <div className="ws-owner-sig">
                    <div className="ws-owner-avatar">{ownerInitials(site.owner_name)}</div>
                    <div>
                      <div className="ws-owner-name">{site.owner_name}</div>
                      <div className="ws-owner-title">Owner, {site.business_name}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Reviews */}
        {site.google_review_url && (
          <section className="ws-section">
            <div className="ws-container" style={{ textAlign: "center" }}>
              <div className="ws-section-label">What customers say</div>
              <h2 className="ws-section-title">Real reviews from real neighbors</h2>
              {site.review_count && site.avg_rating && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "16px 0 24px" }}>
                  <div className="ws-stars" style={{ fontSize: 20 }}>★★★★★</div>
                  <span style={{ fontSize: 22, fontWeight: 800 }}>{site.avg_rating}</span>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{site.review_count} reviews</span>
                </div>
              )}
              <a className="ws-btn-outline" href={site.google_review_url} target="_blank" rel="noopener noreferrer">
                See all reviews on Google
              </a>
            </div>
          </section>
        )}

        {/* Contact Form */}
        <section className="ws-section ws-form-section" id="quote">
          <div className="ws-container ws-form-inner">
            <div className="ws-form-left">
              <div className="ws-section-label" style={{ color: "rgba(255,255,255,0.5)" }}>Get a quote</div>
              <h2>Ready to get started?</h2>
              <p>Fill out the form and we&apos;ll reach out within the hour during business hours.</p>
              <div className="ws-form-promises">
                <div className="ws-promise">
                  <div className="ws-promise-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                  Fast response during business hours
                </div>
                <div className="ws-promise">
                  <div className="ws-promise-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                  Free estimate, no obligation
                </div>
                {site.badge_emergency && (
                  <div className="ws-promise">
                    <div className="ws-promise-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                    24/7 emergency service available
                  </div>
                )}
              </div>
            </div>
            <WebsiteContactForm siteId={site.id} services={filteredServices} />
          </div>
        </section>

        {/* Service Area */}
        {site.service_areas && site.service_areas.length > 0 && (
          <section className="ws-section ws-section-alt">
            <div className="ws-container">
              <div className="ws-section-label">Where we work</div>
              <h2 className="ws-section-title">Serving {site.city} and surrounding areas</h2>
              <div className="ws-area-grid">
                {site.service_areas.map((area) => (
                  <div key={area} className="ws-area-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {area}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="ws-footer">
          <div className="ws-container">
            <div className="ws-footer-inner">
              <div className="ws-footer-brand">
                <div className="ws-nav-name" style={{ color: "#fff", fontSize: 18, marginBottom: 8 }}>{site.business_name}</div>
                <p style={{ fontSize: 13, lineHeight: 1.65, maxWidth: 260, color: "rgba(255,255,255,0.6)" }}>
                  Professional {site.trade.toLowerCase()} services for {site.city} and surrounding areas.
                </p>
                {site.license_number && <p style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Lic. {site.license_number}</p>}
                <WebsiteSocialLinks
                  facebook={site.social_facebook}
                  instagram={site.social_instagram}
                  google={site.social_google}
                  nextdoor={site.social_nextdoor}
                />
              </div>
              <div className="ws-footer-col">
                <h4>Services</h4>
                <ul>{filteredServices.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
              <div className="ws-footer-col">
                <h4>Contact</h4>
                <ul>
                  <li>{fmtPhone(site.phone)}</li>
                  <li>{site.city}, {site.state}</li>
                  {site.email && <li>{site.email}</li>}
                </ul>
              </div>
            </div>
            <div className="ws-footer-bottom">
              <span>&copy; {new Date().getFullYear()} {site.business_name}. All rights reserved.</span>
              <a href="https://handledsites.com" style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Powered by handled.</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function WebsiteSocialLinks({ facebook, instagram, google, nextdoor }: { facebook: string | null; instagram: string | null; google: string | null; nextdoor: string | null }) {
  const links = [
    { url: facebook, icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
    { url: instagram, icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
    { url: google, icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
    { url: nextdoor, icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg> },
  ].filter((l) => l.url);
  if (links.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
      {links.map((link, i) => (
        <a key={i} href={link.url!} target="_blank" rel="noopener noreferrer" className="ws-social-link">
          {link.icon}
        </a>
      ))}
    </div>
  );
}

const WEBSITE_CSS = `
.ws { font-family: 'Plus Jakarta Sans', sans-serif; color: #0C1A2E; background: #fff; font-size: 16px; line-height: 1.6; }
.ws *, .ws *::before, .ws *::after { box-sizing: border-box; margin: 0; padding: 0; }
.ws img { display: block; max-width: 100%; }
.ws a { color: inherit; text-decoration: none; }
.ws-container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }

.ws-nav { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 1px solid #E5E7EB; padding: 14px 0; }
.ws-nav-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.ws-nav-logo { display: flex; align-items: center; gap: 10px; }
.ws-nav-logo-icon { width: 36px; height: 36px; background: #1A56DB; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.ws-nav-name { font-size: 17px; font-weight: 800; color: #0C1A2E; }
.ws-nav-right { display: flex; align-items: center; gap: 10px; }
.ws-nav-license { font-size: 11px; color: #6B7280; display: none; }
.ws-btn-call { display: inline-flex; align-items: center; gap: 7px; background: #F97316; color: #fff; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 15px; white-space: nowrap; }
.ws-btn-call:hover { background: #C2550D; }

.ws-hero { background: linear-gradient(135deg, #0C1A2E 0%, #1a2d4a 100%); color: #fff; padding: 60px 0 50px; position: relative; overflow: hidden; }
.ws-hero-inner { position: relative; z-index: 1; }
.ws-hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); margin-bottom: 16px; width: fit-content; }
.ws-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: ws-pulse 2s infinite; }
@keyframes ws-pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
.ws-hero-h1 { font-size: clamp(28px, 5vw, 46px); font-weight: 800; line-height: 1.15; margin-bottom: 14px; }
.ws-hero-sub { font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 28px; line-height: 1.6; }
.ws-hero-ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 28px; }
.ws-btn-primary { display: inline-flex; align-items: center; gap: 8px; background: #F97316; color: #fff; padding: 14px 26px; border-radius: 10px; font-weight: 700; font-size: 16px; }
.ws-btn-primary:hover { background: #C2550D; }
.ws-btn-secondary { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.25); padding: 14px 22px; border-radius: 10px; font-weight: 600; font-size: 15px; }
.ws-btn-secondary:hover { background: rgba(255,255,255,0.2); }
.ws-hero-trust { display: flex; flex-wrap: wrap; gap: 16px; }
.ws-trust-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: rgba(255,255,255,0.75); font-weight: 500; }
.ws-trust-item svg { color: #22c55e; }

.ws-proof-bar { background: #1A56DB; padding: 16px 0; }
.ws-proof-inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 24px 36px; }
.ws-proof-item { display: flex; align-items: center; gap: 8px; color: #fff; }
.ws-proof-num { font-size: 20px; font-weight: 800; }
.ws-proof-label { font-size: 12px; opacity: 0.8; font-weight: 500; line-height: 1.3; }
.ws-proof-divider { width: 1px; height: 28px; background: rgba(255,255,255,0.25); }
.ws-stars { display: flex; gap: 2px; color: #FBBF24; font-size: 14px; }

.ws-section { padding: 64px 0; }
.ws-section-alt { background: #F9FAFB; }
.ws-section-label { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #1A56DB; margin-bottom: 10px; }
.ws-section-title { font-size: clamp(24px, 4vw, 36px); font-weight: 800; color: #0C1A2E; margin-bottom: 12px; line-height: 1.2; }
.ws-section-sub { font-size: 16px; color: #6B7280; max-width: 520px; margin-bottom: 40px; }

.ws-services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.ws-service-card { display: block; background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px; transition: box-shadow 0.2s, transform 0.2s; }
.ws-service-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
.ws-service-icon { width: 48px; height: 48px; background: #EBF2FF; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
.ws-service-icon svg { color: #1A56DB; }
.ws-service-name { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
.ws-service-desc { font-size: 13px; color: #6B7280; line-height: 1.55; }

.ws-why-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
.ws-why-card { text-align: center; padding: 28px 20px; background: #fff; border-radius: 16px; border: 1px solid #E5E7EB; }
.ws-why-icon { font-size: 32px; margin-bottom: 12px; }
.ws-why-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
.ws-why-desc { font-size: 13px; color: #6B7280; line-height: 1.55; }

.ws-about-inner { display: grid; grid-template-columns: 1fr; gap: 36px; align-items: center; }
.ws-about-photo-wrap { position: relative; }
.ws-about-photo { width: 100%; max-width: 380px; aspect-ratio: 1; object-fit: cover; border-radius: 16px; }
.ws-about-photo-placeholder { width: 100%; max-width: 380px; aspect-ratio: 1; border-radius: 16px; background: linear-gradient(135deg, #CBD5E1, #94A3B8); display: flex; align-items: center; justify-content: center; color: #fff; }
.ws-years-badge { position: absolute; bottom: 20px; right: 0; background: #F97316; color: #fff; padding: 14px 18px; border-radius: 16px; text-align: center; box-shadow: 0 4px 16px rgba(249,115,22,0.35); }
.ws-years-num { font-size: 28px; font-weight: 800; line-height: 1; }
.ws-years-label { font-size: 11px; font-weight: 600; opacity: 0.9; }
.ws-about-content p { font-size: 15px; color: #374151; margin-bottom: 16px; line-height: 1.7; }
.ws-owner-sig { display: flex; align-items: center; gap: 12px; margin-top: 24px; }
.ws-owner-avatar { width: 48px; height: 48px; border-radius: 50%; background: #1A56DB; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; color: #fff; flex-shrink: 0; }
.ws-owner-name { font-weight: 700; font-size: 15px; }
.ws-owner-title { font-size: 12px; color: #6B7280; }

.ws-btn-outline { display: inline-flex; align-items: center; gap: 7px; border: 1.5px solid #1A56DB; color: #1A56DB; padding: 11px 22px; border-radius: 10px; font-weight: 600; font-size: 14px; }
.ws-btn-outline:hover { background: #EBF2FF; }

.ws-form-section { background: #0C1A2E; color: #fff; }
.ws-form-inner { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: start; }
.ws-form-left h2 { font-size: clamp(24px, 4vw, 36px); font-weight: 800; margin-bottom: 14px; }
.ws-form-left p { font-size: 15px; color: rgba(255,255,255,0.65); margin-bottom: 28px; line-height: 1.65; }
.ws-form-promises { display: flex; flex-direction: column; gap: 12px; }
.ws-promise { display: flex; align-items: center; gap: 10px; font-size: 14px; color: rgba(255,255,255,0.8); }
.ws-promise-icon { width: 28px; height: 28px; border-radius: 50%; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.ws-area-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-top: 28px; }
.ws-area-pill { background: #fff; border: 1px solid #E5E7EB; border-radius: 20px; padding: 8px 16px; font-size: 13px; font-weight: 500; color: #374151; text-align: center; display: flex; align-items: center; gap: 6px; justify-content: center; }
.ws-area-pill svg { color: #1A56DB; }

.ws-footer { background: #0C1A2E; color: rgba(255,255,255,0.6); padding: 36px 0 24px; }
.ws-footer-inner { display: grid; grid-template-columns: 1fr; gap: 28px; margin-bottom: 28px; }
.ws-footer-brand { }
.ws-footer-col h4 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(255,255,255,0.9); margin-bottom: 12px; }
.ws-footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.ws-footer-col ul li { font-size: 13px; }
.ws-footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; font-size: 12px; }

@media(min-width: 640px) {
  .ws-nav-license { display: block; }
  .ws-about-inner { grid-template-columns: 1fr 1fr; }
  .ws-form-inner { grid-template-columns: 1fr 1fr; }
  .ws-footer-inner { grid-template-columns: 2fr 1fr 1fr; }
  .ws-about-photo, .ws-about-photo-placeholder { max-width: 100%; }
  .ws-years-badge { right: -12px; }
}

.ws-form-card { background: #fff; border-radius: 16px; padding: 28px; }
.ws-form-card h3 { font-size: 18px; font-weight: 700; color: #0C1A2E; margin-bottom: 20px; }
.ws-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ws-form-group { margin-bottom: 14px; }
.ws-form-group label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 5px; letter-spacing: 0.04em; text-transform: uppercase; }
.ws-form-group input, .ws-form-group select { width: 100%; border: 1.5px solid #E5E7EB; border-radius: 10px; padding: 11px 14px; font-size: 15px; font-family: inherit; color: #0C1A2E; background: #fff; outline: none; }
.ws-form-group input:focus, .ws-form-group select:focus { border-color: #1A56DB; }
.ws-btn-submit { width: 100%; background: #F97316; color: #fff; border: none; padding: 15px; border-radius: 10px; font-size: 16px; font-weight: 700; font-family: inherit; cursor: pointer; margin-top: 4px; }
.ws-btn-submit:hover { background: #C2550D; }
.ws-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.ws-social-link { color: rgba(255,255,255,0.5); transition: color 0.15s; }
.ws-social-link:hover { color: rgba(255,255,255,0.8); }
@media(min-width: 768px) { .ws-form-row { grid-template-columns: 1fr 1fr; } }
`;
