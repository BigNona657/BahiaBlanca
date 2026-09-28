import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { type DeliveryConfig, DEFAULT_DELIVERY_CONFIG } from "@/lib/delivery";

// Coordenadas fijas del origen (Vicente Fatone 657, Bahía Blanca)
const ORIGIN_COORDS = "-38.7183,-62.2663";
const ORIGIN_ADDRESS = "Vicente Fatone 657, Bahía Blanca, Buenos Aires, Argentina";
const CITY_SUFFIX = "Bahía Blanca, Buenos Aires, Argentina";

function buildDestinationFromAddress(address: string): string {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  const street = parts[0];
  const cityIndex = parts.findIndex((p) =>
    p.toLowerCase().includes("bah") && p.toLowerCase().includes("blanca")
  );
  if (cityIndex !== -1) return [street, ...parts.slice(cityIndex)].join(", ");
  return `${street}, ${CITY_SUFFIX}`;
}

function sanitizeForLog(value: string): string {
  return value.replace(/[\r\n\t]/g, " ").slice(0, 200);
}

async function fetchDistanceMatrix(destination: string, apiKey: string) {
  const gmUrl = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  gmUrl.searchParams.set("origins", ORIGIN_ADDRESS);
  gmUrl.searchParams.set("destinations", destination);
  gmUrl.searchParams.set("units", "metric");
  gmUrl.searchParams.set("key", apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(gmUrl.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // ── Validación de subtotal ────────────────────────────────────────────────
  const rawSubtotal = searchParams.get("subtotal");
  const subtotal = rawSubtotal !== null ? Number(rawSubtotal) : 0;
  if (isNaN(subtotal) || subtotal < 0) {
    return NextResponse.json(
      { error: "El parámetro 'subtotal' debe ser un número válido." },
      { status: 400 }
    );
  }

  // ── Validación de coordenadas o dirección ─────────────────────────────────
  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");
  const rawAddress = searchParams.get("address");

  const lat = rawLat !== null ? Number(rawLat) : NaN;
  const lng = rawLng !== null ? Number(rawLng) : NaN;
  const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  if (!hasCoords && (!rawAddress || rawAddress.trim().length < 5)) {
    return NextResponse.json(
      { error: "Proporcioná coordenadas (lat/lng) o una dirección válida." },
      { status: 400 }
    );
  }

  // ── Config de envío ───────────────────────────────────────────────────────
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'delivery_config' LIMIT 1`;
  let config: DeliveryConfig = DEFAULT_DELIVERY_CONFIG;
  try {
    if (rows[0]?.value) config = JSON.parse(rows[0].value as string);
  } catch {}

  if (config.free_from > 0 && subtotal >= config.free_from) {
    return NextResponse.json({ fee: 0, distance_km: null, free: true, reason: "monto" });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ fee: 0, distance_km: null, free: true, reason: "config" });
  }

  // ── Calcular distancia ────────────────────────────────────────────────────
  // Modo 1: coordenadas exactas (más preciso, sin ambigüedad de geocodificación)
  // Modo 2: fallback por texto de dirección
  const destination = hasCoords
    ? `${lat},${lng}`
    : buildDestinationFromAddress(rawAddress!.trim());

  // Si usamos coords, el origen también va como coords para mayor precisión
  const gmUrl = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  gmUrl.searchParams.set("origins", hasCoords ? ORIGIN_COORDS : ORIGIN_ADDRESS);
  gmUrl.searchParams.set("destinations", destination);
  gmUrl.searchParams.set("units", "metric");
  gmUrl.searchParams.set("key", apiKey);

  let gmData: Record<string, unknown>;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const gmRes = await fetch(gmUrl.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    gmData = await gmRes.json();
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "El servicio de mapas tardó demasiado. Intentá de nuevo." : "Error al conectar con el servicio de mapas." },
      { status: 503 }
    );
  }

  type GMElement = { status: string; distance: { value: number } };
  type GMRow = { elements: GMElement[] };
  const element = (gmData?.rows as GMRow[])?.[0]?.elements?.[0];

  if (!element || element.status !== "OK") {
    console.warn(
      "[delivery-cost] Google status:", element?.status,
      "| mode:", hasCoords ? "coords" : "address",
      "| destination:", sanitizeForLog(destination)
    );
    return NextResponse.json(
      { error: "No encontramos esa dirección. Verificá que sea una calle válida de Bahía Blanca." },
      { status: 422 }
    );
  }

  const distance_km = element.distance.value / 1000;

  if (config.max_km > 0 && distance_km > config.max_km) {
    return NextResponse.json(
      { error: `La dirección está fuera de la zona de cobertura (máximo ${config.max_km} km).`, distance_km },
      { status: 422 }
    );
  }

  const fee = Math.round(config.base_fee + distance_km * config.price_per_km);

  return NextResponse.json({
    fee,
    distance_km: Math.round(distance_km * 10) / 10,
    free: false,
    mode: hasCoords ? "coords" : "address",
  });
}
