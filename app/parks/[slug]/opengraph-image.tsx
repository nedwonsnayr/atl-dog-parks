import { ImageResponse } from "next/og";
import { getParkBySlug } from "@/lib/parks";

export const alt = "Atlanta dog park listing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ParkOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const park = getParkBySlug(slug);
  const name = park?.name ?? "ATL Dog Parks";
  const neighborhood = park?.neighborhood ?? "Atlanta";

  return new ImageResponse(
    <div
      style={{
        background: "#052e2b",
        color: "white",
        display: "flex",
        height: "100%",
        padding: "64px",
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
          padding: "58px",
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
          {neighborhood} · Atlanta
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: name.length > 28 ? 66 : 82,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            {name}
          </div>
          <div style={{ color: "#d1fae5", display: "flex", fontSize: 29, marginTop: 24 }}>
            Amenities, hours, directions, and verified park details
          </div>
        </div>
        <div style={{ alignItems: "center", display: "flex", fontSize: 26, fontWeight: 700 }}>
          <span style={{ display: "flex", fontSize: 36, marginRight: 15 }}>🐾</span>
          ATL Dog Parks
        </div>
      </div>
    </div>,
    size,
  );
}
