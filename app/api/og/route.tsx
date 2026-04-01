import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name") || "Business Name";
  const trade = searchParams.get("trade") || "Home Services";
  const city = searchParams.get("city") || "";
  const state = searchParams.get("state") || "";

  const location = [city, state].filter(Boolean).join(", ");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#12151f",
          fontFamily: "sans-serif",
        }}
      >
        {/* Card surface */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1a1e2e",
            borderRadius: "24px",
            padding: "60px 80px",
            maxWidth: "900px",
          }}
        >
          {/* Initials avatar */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "#12151f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "white",
              }}
            >
              {name
                .split(/\s+/)
                .slice(0, 2)
                .map((w: string) => w[0]?.toUpperCase() || "")
                .join("")}
            </span>
          </div>

          {/* Business name */}
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "white",
              margin: "0 0 8px 0",
              textAlign: "center",
            }}
          >
            {name}
          </h1>

          {/* Trade */}
          <p
            style={{
              fontSize: "24px",
              color: "#9aa0b8",
              margin: "0 0 4px 0",
            }}
          >
            {trade}
          </p>

          {/* Location */}
          {location && (
            <p
              style={{
                fontSize: "20px",
                color: "#9aa0b8",
                margin: "0",
              }}
            >
              {location}
            </p>
          )}
        </div>

        {/* Branding */}
        <p
          style={{
            fontSize: "16px",
            color: "#9aa0b855",
            marginTop: "32px",
          }}
        >
          handled.sites
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
