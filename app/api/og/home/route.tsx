import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET() {
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
            maxWidth: "960px",
          }}
        >
          {/* Brand mark */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              backgroundColor: "#12151f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "28px",
            }}
          >
            <span
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "white",
              }}
            >
              h.
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "52px",
              fontWeight: "bold",
              color: "white",
              margin: "0 0 12px 0",
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            More calls. Five minutes. Free.
          </h1>

          {/* Sub-headline */}
          <p
            style={{
              fontSize: "24px",
              color: "#9aa0b8",
              margin: "0",
              textAlign: "center",
              maxWidth: "700px",
              lineHeight: 1.4,
            }}
          >
            Free mobile business card websites for home service contractors
          </p>
        </div>

        {/* Branding */}
        <p
          style={{
            fontSize: "18px",
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
