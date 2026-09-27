import { ImageResponse } from "next/og";

export const alt = "ATL Dog Parks — Find dog parks inside the Perimeter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background: "#052e2b",
        color: "white",
        display: "flex",
        height: "100%",
        padding: "54px",
        width: "100%",
      }}
    >
      <div
        style={{
          border: "2px solid rgba(167, 243, 208, 0.25)",
          borderRadius: "38px",
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          position: "relative",
        }}
      >
        <div
          style={{
            color: "#6ee7b7",
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Atlanta · Inside I-285
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1,
              maxWidth: 920,
            }}
          >
            Find a better place to play.
          </div>
          <div
            style={{
              color: "#d1fae5",
              display: "flex",
              fontSize: 30,
              marginTop: 26,
            }}
          >
            Fenced areas, amenities, hours, fees, and directions.
          </div>
        </div>
        <div style={{ alignItems: "center", display: "flex", fontSize: 28, fontWeight: 700 }}>
          <span
            style={{
              alignItems: "center",
              background: "#10b981",
              borderRadius: 999,
              display: "flex",
              height: 54,
              justifyContent: "center",
              marginRight: 18,
              width: 54,
            }}
          >
            🐾
          </span>
          ATL Dog Parks
        </div>
      </div>
    </div>,
    size,
  );
}
