import { ImageResponse } from "next/og";

export const runtime = "edge";
export const revalidate = 86400; // 24 horas
export const alt = "BigNona — Comida casera a domicilio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 60%, #fed7aa 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Círculo decorativo fondo */}
        <div
          style={{
            position: "absolute",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background: "rgba(249,115,22,0.08)",
            top: "55px",
            left: "80px",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(249,115,22,0.06)",
            bottom: "40px",
            right: "100px",
            display: "flex",
          }}
        />

        {/* Contenido principal */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0px",
            zIndex: 1,
          }}
        >
          {/* Ícono sartén */}
          <div style={{ fontSize: "110px", lineHeight: 1, display: "flex" }}>🍳</div>

          {/* Nombre */}
          <div
            style={{
              fontSize: "108px",
              fontWeight: 900,
              color: "#f97316",
              letterSpacing: "-2px",
              lineHeight: 1,
              display: "flex",
              marginTop: "8px",
            }}
          >
            BigNona
          </div>

          {/* Subtítulo */}
          <div
            style={{
              fontSize: "38px",
              fontWeight: 600,
              color: "#9a3412",
              letterSpacing: "2px",
              textTransform: "uppercase",
              display: "flex",
              marginTop: "10px",
            }}
          >
            Cocina tradicional
          </div>

          {/* Separador */}
          <div
            style={{
              width: "120px",
              height: "4px",
              borderRadius: "2px",
              background: "#f97316",
              marginTop: "24px",
              display: "flex",
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: "30px",
              color: "#78350f",
              marginTop: "20px",
              display: "flex",
              gap: "24px",
              alignItems: "center",
            }}
          >
            <span>🛵 Delivery</span>
            <span style={{ color: "#f97316" }}>·</span>
            <span>🏪 Take away · Fatone 657</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
