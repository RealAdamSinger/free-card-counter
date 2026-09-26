import { ImageResponse } from "next/og";

export const alt = "Free Blackjack Card Counter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card, generated at build time. Matches the app's casino theme.
export default function Image() {
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
          background:
            "linear-gradient(135deg, #0b2a1c 0%, #123f2a 60%, #071c13 100%)",
          color: "#eaf3ee",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: 18, marginBottom: 40 }}>
          {["A", "K", "Q", "J", "10"].map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 104,
                height: 146,
                borderRadius: 14,
                background: "#f7faf8",
                color: "#10261c",
                fontSize: 56,
                fontWeight: 700,
                boxShadow: "0 10px 28px rgba(0,0,0,0.45)",
              }}
            >
              {c}
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "#ffd700",
            letterSpacing: -1,
          }}
        >
          Free Card Counter
        </div>
        <div
          style={{
            fontSize: 34,
            marginTop: 18,
            color: "rgba(234,243,238,0.8)",
          }}
        >
          Blackjack card counting, free and online
        </div>
      </div>
    ),
    { ...size }
  );
}
