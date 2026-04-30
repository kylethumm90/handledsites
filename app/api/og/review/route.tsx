import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Branded OG card for a single review shared from /contractor/reputation.
 *
 * All data is passed via query params so the edge renderer doesn't need to
 * hit Supabase — /reviews/[slug]/page.tsx's generateMetadata builds this
 * URL with the fields already fetched server-side. Same convention as
 * /api/og/refer.
 *
 * Params:
 *   business — business name (required-ish; falls back to placeholder)
 *   reviewer — reviewer name as already abbreviated for display ("Jeff S.")
 *   rating   — integer 1-5; missing/0 hides the star row
 *   text     — review excerpt, already truncated by the caller
 *   logo     — absolute URL of the business logo (optional)
 *   color    — brand accent hex (#RRGGBB); defaults to #1A56DB
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const business =
    (searchParams.get("business") || "").slice(0, 80) || "Your Local Contractor";
  const reviewer = (searchParams.get("reviewer") || "").slice(0, 40);
  const rating = Math.max(
    0,
    Math.min(5, parseInt(searchParams.get("rating") || "0", 10) || 0)
  );
  const text = (searchParams.get("text") || "").slice(0, 280);
  const logo = searchParams.get("logo") || "";
  const rawColor = searchParams.get("color") || "";
  const accent = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : "#1A56DB";

  const initials = business
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

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
        <div style={{ height: "12px", width: "100%", background: accent }} />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 80px",
          }}
        >
          {/* Star row */}
          {rating > 0 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "32px",
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill={i <= rating ? "#F5B731" : "#3A4458"}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          )}

          {/* Quote — open quote glyph + body */}
          <div
            style={{
              display: "flex",
              fontSize: "44px",
              fontWeight: 500,
              color: "#ffffff",
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              marginBottom: "28px",
              maxWidth: "1040px",
            }}
          >
            <span
              style={{
                color: accent,
                fontSize: "80px",
                lineHeight: 1,
                marginRight: "12px",
                marginTop: "-8px",
              }}
            >
              “
            </span>
            <span style={{ display: "block" }}>{text || "An incredible experience from start to finish."}</span>
          </div>

          {/* Reviewer attribution */}
          {reviewer && (
            <p
              style={{
                fontSize: "26px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                margin: 0,
              }}
            >
              — {reviewer}
            </p>
          )}
        </div>

        {/* Footer: business identity + handled. wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 60px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                width={48}
                height={48}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  objectFit: "cover",
                  background: "#fff",
                }}
              />
            ) : (
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-1px",
                  }}
                >
                  {initials}
                </span>
              </div>
            )}
            <span
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              {business}
            </span>
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            handled.
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Aggressive cache: FB / X scrape once and reuse for days. The
        // params fully describe the image, so we never need to bust.
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    }
  );
}
