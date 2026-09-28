import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { type DeliveryConfig, DEFAULT_DELIVERY_CONFIG } from "@/lib/delivery";

const ORIGIN = "Vicente Fatone 657, Bahía Blanca, Buenos Aires, Argentina";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const subtotal = Number(searchParams.get("subtotal") ?? "0");

  if (!address) return NextResponse.json({ error: "Falta dirección" }, { status: 400 });

  const rows = await sql`SELECT value FROM app_settings WHERE key = 'delivery_config' LIMIT 1`;
  let config: DeliveryConfig = DEFAULT_DELIVERY_CONFIG;
  try {
    if (rows[0]?.value) config = JSON.parse(rows[0].value as string);
  } catch {}

  // Envío gratis por monto
  if (config.free_from > 0 && subtotal >= config.free_from) {
    return NextResponse.json({ fee: 0, distance_km: null, free: true, reason: "monto" });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    // Sin API key configurada: devolver costo 0 para no bloquear el pedido
    return NextResponse.json({ fee: 0, distance_km: null, free: true, reason: "config" });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", ORIGIN);
  url.searchParams.set("destinations", `${address}, Bahía Blanca, Buenos Aires, Argentina`);
  url.searchParams.set("units", "metric");
  url.searchParams.set("key", apiKey);

  const gmRes = await fetch(url.toString());
  const gmData = await gmRes.json();

  const element = gmData?.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") {
    // Si Google no puede calcular la distancia, permitir el pedido sin costo de envío calculado
    console.warn("[delivery-cost] Google status:", element?.status, "| destination:", `${address}, Bahía Blanca`);
    return NextResponse.json({ fee: 0, distance_km: null, free: true, reason: "no_route" });
  }

  const distance_km = element.distance.value / 1000;

  if (config.max_km > 0 && distance_km > config.max_km) {
    return NextResponse.json({ error: "Fuera de zona de cobertura", distance_km }, { status: 422 });
  }

  const fee = Math.round(config.base_fee + distance_km * config.price_per_km);

  return NextResponse.json({ fee, distance_km: Math.round(distance_km * 10) / 10, free: false });
}
