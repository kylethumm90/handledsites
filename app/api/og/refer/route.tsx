import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Branded OG card for /refer/[code] share links.
 *
 * All data is passed via query params so the edge renderer doesn't need to
 * hit Supabase — /refer/[code]/page.tsx's generateMetadata builds the URL
 * with the fields already fetched server-side.
 *
 * Params:
 *   business  — business name (required)
 *   partner   — first name of the referral partner
 *   logo      — absolute URL of the business logo (optional)
 *   rating    — google star rating (e.g. "4.9")
 *   reviews   — google review count
 *   trade     — trade label ("Roofing", "HVAC", ...)
 *   city, state
 *   color     — brand color hex ("#1A56DB") — used as the accent band
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const business = (searchParams.get("business") || "").slice(0, 80) || "Your Local Contractor";
  const partner = (searchParams.get("partner") || "").slice(0, 40);
  const logo = searchParams.get("logo") || "";
  const rating = searchParams.get("rating") || "";
  const reviews = searchParams.get("reviews") || "";
  const trade = (searchParams.get("trade") || "").slice(0, 40);
  const city = (searchParams.get("city") || "").slice(0, 40);
  const state = (searchParams.get("state") || "").slice(0, 4);
  const rawColor = searchParams.get("color") || "";
  // Sanitize hex — only allow #RRGGBB
  const accent = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : "#1A56DB";

  const location = [city, state].filter(Boolean).join(", ");
  const subline = [trade, location].filter(Boolean).join(" · ");

  const initials = business
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const ratingNum = rating ? parseFloat(rating) : null;
  const filledStars = ratingNum ? Math.round(ratingNum) : 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0C1A2E",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Brand accent band */}
        <div
          style={{
            height: "12px",
            width: "100%",
            background: accent,
          }}
        />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 80px",
          }}
        >
          {/* Logo or initials */}
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              width={140}
              height={140}
              style={{
                width: "140px",
                height: "140px",
                borderRadius: "24px",
                objectFit: "cover",
                marginBottom: "32px",
                background: "#fff",
              }}
            />
          ) : (
            <div
              style={{
                width: "140px",
                height: "140px",
                borderRadius: "24px",
                background: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "32px",
              }}
            >
              <span
                style={{
                  fontSize: "56px",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-2px",
                }}
              >
                {initials}
              </span>
            </div>
          )}

          {/* Partner recommendation line */}
          {partner && (
            <p
              style={{
                fontSize: "26px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.65)",
                margin: "0 0 12px 0",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              {partner} recommends
            </p>
          )}

          {/* Business name */}
          <h1
            style={{
              fontSize: "68px",
              fontWeight: 800,
              color: "#ffffff",
              margin: "0 0 20px 0",
              textAlign: "center",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: "1000px",
            }}
          >
            {business}
          </h1>

          {/* Stars + reviews */}
          {ratingNum && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg
                    key={i}
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill={i <= filledStars ? "#F5B731" : "#3A4458"}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {ratingNum.toFixed(1)}
              </span>
              {reviews && (
                <span
                  style={{
                    fontSize: "20px",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  ({reviews} reviews)
                </span>
              )}
            </div>
          )}

          {/* Trade + location */}
          {subline && (
            <p
              style={{
                fontSize: "22px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.75)",
                margin: 0,
                textAlign: "center",
              }}
            >
              {subline}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 60px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Trusted by neighbors
          </span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            handled.sites
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
