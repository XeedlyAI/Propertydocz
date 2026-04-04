import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PropertyDocz — HOA Document Ordering Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Decorative accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, transparent, #38b6ff, transparent)",
            display: "flex",
          }}
        />

        {/* Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "rgba(56, 182, 255, 0.12)",
            marginBottom: "32px",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#38b6ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 7h-3a2 2 0 0 1-2-2V2" />
            <path d="M21 6v6.5c0 .8-.7 1.5-1.5 1.5h-7c-.8 0-1.5-.7-1.5-1.5v-9c0-.8.7-1.5 1.5-1.5H17Z" />
            <path d="M7 8v8.8c0 .3.2.6.4.8.2.2.5.4.8.4H15" />
            <path d="M3 12v8.8c0 .3.2.6.4.8.2.2.5.4.8.4H11" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: "56px",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-1px",
            marginBottom: "16px",
          }}
        >
          PropertyDocz
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: "24px",
            fontWeight: 400,
            color: "rgba(255,255,255,0.5)",
            marginBottom: "48px",
          }}
        >
          HOA Document Ordering Platform
        </div>

        {/* Document type badges */}
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          {["Resale Certificates", "Payoff Letters", "Lender Questionnaires", "Governing Docs"].map(
            (doc) => (
              <div
                key={doc}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: "9999px",
                  background: "rgba(56, 182, 255, 0.08)",
                  border: "1px solid rgba(56, 182, 255, 0.2)",
                  color: "#38b6ff",
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                {doc}
              </div>
            )
          )}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            fontSize: "16px",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          propertydocz.com
        </div>
      </div>
    ),
    { ...size }
  );
}
