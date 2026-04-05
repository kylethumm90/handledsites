import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Review } from "@/lib/supabase";
import ReviewWallClient from "./ReviewWallClient";

export const revalidate = 60;

type SiteData = {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  city: string;
  state: string;
  trade: string;
  logo_url: string | null;
  google_review_url: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
};

async function getSiteData(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data: site } = await supabase
    .from("sites_full")
    .select("*")
    .eq("slug", slug)
    .eq("type", "review_wall")
    .eq("is_active", true)
    .single();
  if (!site) return null;

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("business_id", site.business_id)
    .order("review_date", { ascending: false });

  // Merge in google_reviews if available
  const googleReviews: Review[] = (site.google_reviews || []).map((r: { text: string; author: string; rating: number }, i: number) => ({
    id: `google-${i}`,
    created_at: new Date().toISOString(),
    business_id: site.business_id,
    reviewer_name: r.author,
    rating: r.rating,
    review_text: r.text,
    review_date: new Date().toISOString().split("T")[0],
    source: "google",
    is_featured: false,
  }));

  const allReviews = [...(reviews || []), ...googleReviews] as Review[];
  // Deduplicate by reviewer name (google_reviews may overlap with manual reviews)
  const seen = new Set<string>();
  const dedupedReviews = allReviews.filter((r) => {
    const key = `${r.reviewer_name}-${r.rating}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    site: {
      id: site.id,
      business_name: site.business_name,
      owner_name: site.owner_name,
      phone: site.business_phone,
      city: site.city,
      state: site.state,
      trade: site.trade,
      logo_url: site.logo_url,
      google_review_url: site.google_review_url,
      google_place_id: site.google_place_id,
      google_rating: site.google_rating,
      google_review_count: site.google_review_count,
    } as SiteData,
    reviews: dedupedReviews,
  };
}

function fmtPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await getSiteData(params.slug);
  if (!result) return { title: "Not Found" };
  const { site, reviews } = result;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : site.google_rating?.toString() || "5.0";
  const title = `${site.business_name} Reviews | ${site.trade} in ${site.city}, ${site.state}`;
  const description = `See what ${site.city} homeowners are saying about ${site.business_name}. ${reviews.length} reviews with a ${avgRating} star average.`;
  return {
    title, description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function ReviewWallPage({ params }: { params: { slug: string } }) {
  const result = await getSiteData(params.slug);
  if (!result) notFound();
  const { site, reviews } = result;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : site.google_rating?.toString() || "5.0";
  const totalCount = reviews.length || site.google_review_count || 0;
  const recommendedPct = reviews.length > 0
    ? Math.round((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100)
    : 100;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.business_name,
    telephone: `+1${site.phone}`,
    address: { "@type": "PostalAddress", addressLocality: site.city, addressRegion: site.state },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: totalCount,
    },
  };

  const initials = site.business_name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style dangerouslySetInnerHTML={{ __html: REVIEW_WALL_CSS }} />

      <div className="rw">
        {/* Hero */}
        <section className="rw-hero">
          <div className="rw-container">
            {site.logo_url ? (
              <img src={site.logo_url} alt={site.business_name} className="rw-hero-logo" />
            ) : (
              <div className="rw-hero-initials">{initials}</div>
            )}
            <h1 className="rw-hero-name">{site.business_name}</h1>
            <p className="rw-hero-trade">{site.trade} &middot; {site.city}, {site.state}</p>
          </div>
        </section>

        {/* Stats bar */}
        <section className="rw-stats-bar">
          <div className="rw-container rw-stats-inner">
            <div className="rw-stat">
              <span className="rw-stat-num">{avgRating}</span>
              <div className="rw-stars-row">
                {[1,2,3,4,5].map((i) => (
                  <svg key={i} className={`rw-star ${i <= Math.round(Number(avgRating)) ? "rw-star-filled" : ""}`} viewBox="0 0 20 20" width="20" height="20">
                    <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27 5.06 16.7l.94-5.49-4-3.9 5.53-.8z"/>
                  </svg>
                ))}
              </div>
            </div>
            <div className="rw-stat-divider" />
            <div className="rw-stat">
              <span className="rw-stat-num">{totalCount}</span>
              <span className="rw-stat-label">reviews</span>
            </div>
            <div className="rw-stat-divider" />
            <div className="rw-stat">
              <svg viewBox="0 0 24 24" width="20" height="20" className="rw-google-icon">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="rw-stat-label">Google Reviews</span>
            </div>
          </div>
          <div className="rw-container" style={{ textAlign: "center", marginTop: 16 }}>
            <a href={`tel:${site.phone}`} className="rw-call-btn">
              Call {fmtPhone(site.phone)}
            </a>
          </div>
        </section>

        {/* Reviews */}
        <ReviewWallClient
          reviews={reviews}
          businessName={site.business_name}
          googlePlaceId={site.google_place_id}
          avgRating={avgRating}
          totalCount={totalCount}
          recommendedPct={recommendedPct}
          phone={site.phone}
          city={site.city}
          state={site.state}
        />

        {/* Footer */}
        <footer className="rw-footer">
          <p className="rw-footer-name">{site.business_name} &middot; {site.city}, {site.state}</p>
          <a href={`tel:${site.phone}`} className="rw-footer-phone">{fmtPhone(site.phone)}</a>
          <a href="https://handledsites.com" className="rw-footer-powered">Powered by handled.</a>
        </footer>

        {/* Mobile sticky call bar */}
        <div className="rw-mobile-call">
          <a href={`tel:${site.phone}`} className="rw-mobile-call-btn">
            Call {fmtPhone(site.phone)}
          </a>
        </div>
      </div>
    </>
  );
}

const REVIEW_WALL_CSS = `
.rw { font-family: 'Plus Jakarta Sans', sans-serif; color: #0C1A2E; background: #FAFAF9; min-height: 100vh; padding-bottom: 72px; }
.rw *, .rw *::before, .rw *::after { box-sizing: border-box; margin: 0; padding: 0; }
.rw img { display: block; max-width: 100%; }
.rw a { color: inherit; text-decoration: none; }
.rw-container { max-width: 960px; margin: 0 auto; padding: 0 20px; }

.rw-hero { background: #0C1A2E; padding: 48px 0 40px; text-align: center; }
.rw-hero-logo { width: 72px; height: 72px; border-radius: 14px; object-fit: cover; margin: 0 auto 16px; }
.rw-hero-initials { width: 72px; height: 72px; border-radius: 14px; background: #1A56DB; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; font-weight: 800; color: #fff; }
.rw-hero-name { font-size: clamp(28px, 5vw, 42px); font-weight: 800; color: #fff; margin-bottom: 6px; letter-spacing: -0.02em; }
.rw-hero-trade { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.5); }

.rw-stats-bar { background: #fff; border-bottom: 1px solid #E5E7EB; padding: 28px 0; }
.rw-stats-inner { display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; }
.rw-stat { display: flex; align-items: center; gap: 8px; }
.rw-stat-num { font-size: 28px; font-weight: 800; color: #0C1A2E; }
.rw-stat-label { font-size: 14px; color: #6B7280; font-weight: 500; }
.rw-stat-divider { width: 1px; height: 28px; background: #E5E7EB; }
.rw-stars-row { display: flex; gap: 2px; }
.rw-star { fill: #E5E7EB; }
.rw-star-filled { fill: #F59E0B; }
.rw-google-icon { flex-shrink: 0; }
.rw-call-btn { display: inline-flex; align-items: center; gap: 6px; background: #0C1A2E; color: #fff; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; }
.rw-call-btn:hover { background: #162544; }

.rw-section { padding: 40px 0 0; }
.rw-section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #6B7280; margin-bottom: 20px; }

.rw-filter-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.rw-filters { display: flex; gap: 6px; flex-wrap: wrap; }
.rw-filter { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1.5px solid #E5E7EB; background: #fff; color: #6B7280; cursor: pointer; transition: all 0.15s; }
.rw-filter:hover { border-color: #0C1A2E; color: #0C1A2E; }
.rw-filter-active { background: #0C1A2E; color: #fff; border-color: #0C1A2E; }
.rw-sort { font-size: 13px; color: #6B7280; border: 1.5px solid #E5E7EB; border-radius: 8px; padding: 6px 12px; background: #fff; font-family: inherit; cursor: pointer; }

.rw-featured-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 32px; }
.rw-featured-card { background: #fff; border: 1px solid #E5E7EB; border-left: 3px solid #1A56DB; border-radius: 12px; padding: 24px; }
.rw-featured-card .rw-review-text { font-size: 16px; line-height: 1.7; }

.rw-masonry { column-count: 1; column-gap: 16px; }
.rw-review-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; break-inside: avoid; margin-bottom: 16px; transition: transform 0.2s, box-shadow 0.2s; }
.rw-review-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
.rw-review-stars { display: flex; gap: 2px; margin-bottom: 12px; }
.rw-review-text { font-size: 14px; color: #374151; line-height: 1.65; margin-bottom: 16px; }
.rw-read-more { color: #1A56DB; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: none; padding: 0; }
.rw-review-footer { display: flex; align-items: center; gap: 10px; }
.rw-reviewer-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0; }
.rw-reviewer-name { font-size: 13px; font-weight: 600; color: #0C1A2E; }
.rw-reviewer-date { font-size: 12px; color: #9CA3AF; }

.rw-stats-footer { background: #0C1A2E; padding: 40px 0; margin-top: 40px; }
.rw-stats-footer-inner { display: flex; align-items: center; justify-content: center; gap: 32px; flex-wrap: wrap; color: #fff; text-align: center; }
.rw-sf-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.rw-sf-num { font-size: 28px; font-weight: 800; }
.rw-sf-label { font-size: 12px; color: rgba(255,255,255,0.6); font-weight: 500; }
.rw-sf-cta { text-align: center; margin-top: 20px; }
.rw-sf-btn { display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid rgba(255,255,255,0.3); color: #fff; padding: 10px 22px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.rw-sf-btn:hover { background: rgba(255,255,255,0.1); }

.rw-footer { padding: 32px 0 16px; text-align: center; }
.rw-footer-name { font-size: 14px; font-weight: 600; color: #0C1A2E; margin-bottom: 4px; }
.rw-footer-phone { font-size: 13px; color: #6B7280; display: block; margin-bottom: 12px; }
.rw-footer-powered { font-size: 11px; color: #D1D5DB; }

.rw-mobile-call { display: none; position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: #fff; border-top: 1px solid #E5E7EB; z-index: 50; }
.rw-mobile-call-btn { display: block; width: 100%; text-align: center; background: #0C1A2E; color: #fff; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: 700; }

@media(max-width: 639px) {
  .rw-mobile-call { display: block; }
}
@media(min-width: 640px) {
  .rw-featured-grid { grid-template-columns: 1fr 1fr; }
  .rw-masonry { column-count: 2; }
}
@media(min-width: 900px) {
  .rw-masonry { column-count: 3; }
}
`;
