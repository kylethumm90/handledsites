"use client";

import { useState } from "react";
import type { Review } from "@/lib/supabase";

type Props = {
  reviews: Review[];
  businessName: string;
  googlePlaceId: string | null;
  avgRating: string;
  totalCount: number;
  recommendedPct: number;
  phone: string;
  city: string;
  state: string;
};

const AVATAR_COLORS = ["#1A56DB", "#0F3BAA", "#F97316", "#10b981", "#6366f1", "#ec4899", "#ef4444", "#14b8a6"];
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatReviewDate(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="rw-review-stars">
      {[1,2,3,4,5].map((i) => (
        <svg key={i} className={`rw-star ${i <= rating ? "rw-star-filled" : ""}`} viewBox="0 0 20 20" width="16" height="16">
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27 5.06 16.7l.94-5.49-4-3.9 5.53-.8z"/>
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review, featured }: { review: Review; featured?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.review_text.length > 200;
  const displayText = isLong && !expanded
    ? review.review_text.slice(0, 200) + "..."
    : review.review_text;
  const initials = review.reviewer_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className={featured ? "rw-featured-card" : "rw-review-card"}>
      <StarRow rating={review.rating} />
      <p className="rw-review-text">
        &ldquo;{displayText}&rdquo;
      </p>
      {isLong && (
        <button className="rw-read-more" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
      <div className="rw-review-footer" style={{ marginTop: isLong ? 12 : 0 }}>
        <div className="rw-reviewer-avatar" style={{ background: avatarColor(review.reviewer_name) }}>
          {initials}
        </div>
        <div>
          <div className="rw-reviewer-name">{review.reviewer_name}</div>
          <div className="rw-reviewer-date">{formatReviewDate(review.review_date)}</div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewWallClient({
  reviews,
  googlePlaceId,
  avgRating,
  totalCount,
  recommendedPct,
}: Props) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const featuredReviews = reviews.filter((r) => r.is_featured);

  let filteredReviews = reviews;
  if (filter === "5") filteredReviews = reviews.filter((r) => r.rating === 5);
  else if (filter === "4") filteredReviews = reviews.filter((r) => r.rating === 4);
  else if (filter === "3") filteredReviews = reviews.filter((r) => r.rating <= 3);

  if (sort === "newest") filteredReviews = [...filteredReviews].sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime());
  else if (sort === "highest") filteredReviews = [...filteredReviews].sort((a, b) => b.rating - a.rating);
  else if (sort === "lowest") filteredReviews = [...filteredReviews].sort((a, b) => a.rating - b.rating);

  const filters = [
    { key: "all", label: "All" },
    { key: "5", label: "5 star" },
    { key: "4", label: "4 star" },
    { key: "3", label: "3 star & below" },
  ];

  return (
    <div className="rw-container">
      {/* Featured */}
      {featuredReviews.length > 0 && filter === "all" && (
        <section className="rw-section">
          <div className="rw-section-label">Featured Reviews</div>
          <div className="rw-featured-grid">
            {featuredReviews.map((r) => (
              <ReviewCard key={r.id} review={r} featured />
            ))}
          </div>
        </section>
      )}

      {/* Filter bar */}
      <section className="rw-section">
        <div className="rw-filter-bar">
          <div className="rw-filters">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rw-filter ${filter === f.key ? "rw-filter-active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select className="rw-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </select>
        </div>

        {/* Masonry grid */}
        <div className="rw-section-label">All Reviews</div>
        {filteredReviews.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9CA3AF", padding: "40px 0", fontSize: 14 }}>No reviews match this filter.</p>
        ) : (
          <div className="rw-masonry">
            {filteredReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </section>

      {/* Stats footer */}
      <div className="rw-stats-footer">
        <div className="rw-stats-footer-inner">
          <div className="rw-sf-stat">
            <div className="rw-sf-num">{avgRating}</div>
            <div className="rw-sf-label">Average rating</div>
          </div>
          <div className="rw-sf-stat">
            <div className="rw-sf-num">{totalCount}</div>
            <div className="rw-sf-label">Total reviews</div>
          </div>
          <div className="rw-sf-stat">
            <div className="rw-sf-num">{recommendedPct}%</div>
            <div className="rw-sf-label">Recommended</div>
          </div>
        </div>
        {googlePlaceId && (
          <div className="rw-sf-cta">
            <a className="rw-sf-btn" href={`https://www.google.com/maps/place/?q=place_id:${googlePlaceId}`} target="_blank" rel="noopener noreferrer">
              See our reviews on Google
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
