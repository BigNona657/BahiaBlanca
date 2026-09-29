import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { type DeliveryConfig, DEFAULT_DELIVERY_CONFIG } from "@/lib/delivery";

const ORIGIN_COORDS = "-38.7183,-62.2663";
const ORIGIN_ADDRESS = "Vicente Fatone 657, Bahía Blanca, Buenos Aires, Argentina";
const CITY_SUFFIX = "Bahía Blanca, Buenos Aires, Argentina";

type GMElement = { status: string; distance?: { value: number } };
type GMRow = { elements: GMElement[] };

type DeliveryResult =
  | { deliverable: true; fee: number; distance_km: number; free: false; mode: string }
  | { deliverable: true; fee: 0; distance_km: null; free: true; reason: string }
  | { deliverable: false; error: string; distance_km?: number };

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
  return value.replace(/[\r\n\t\0]/g, " ").replace(/[^\x20-\x7E\u00C0-\u024F]/g, "?").slice(0, 150);
}

async function callDistanceMatrix(
  origin: string,
  destination: string,
  apiKey: string
): Promise<GMElement | null> {
  const gmUrl = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  gmUrl.searchParams.set("origins", origin);
  gmUrl.searchParams.set("destinations", destination);
  gmUrl.searchParams.set("units", "metric");
  gmUrl.searchParams.set("key", apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(gmUrl.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    return (data?.rows as GMRow[])?.[0]?.elements?.[0] ?? null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const rawSubtotal = searchParams.get("subtotal");
  const subtotal = rawSubtotal !== null ? Number(rawSubtotal) : 0;
  if (isNaN(subtotal) || subtotal < 0) {
    return NextResponse.json(
      { error: "El parámetro 'subtotal' debe ser un número válido." },
      { status: 400 }
    );
  }

  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");
  const rawAddress = searchParams.get("address");

  const lat = rawLat !== null ? Number(rawLat) : NaN;
  const lng = rawLng !== null ? Number(rawLng) : NaN;
  const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  const hasAddress = !!rawAddress && rawAddress.trim().length >= 5;

  if (!hasCoords && !hasAddress) {
    return NextResponse.json(
      { error: "Proporcioná coordenadas (lat/lng) o una dirección de al menos 5 caracteres." },
      { status: 400 }
    );
  }

  const rows = await sql`SELECT value FROM app_settings WHERE key = 'delivery_config' LIMIT 1`;
  let config: DeliveryConfig = DEFAULT_DELIVERY_CONFIG;
  try {
    if (rows[0]?.value) config = JSON.parse(rows[0].value as string);
  } catch {}

  if (config.free_from > 0 && subtotal >= config.free_from) {
    const result: DeliveryResult = { deliverable: true, fee: 0, distance_km: null, free: true, reason: "monto" };
    return NextResponse.json(result);
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    const result: DeliveryResult = { deliverable: true, fee: 0, distance_km: null, free: true, reason: "config" };
    return NextResponse.json(result);
  }

  let element: GMElement | null = null;
  let mode = "address";

  if (hasCoords) {
    element = await callDistanceMatrix(ORIGIN_COORDS, `${lat},${lng}`, apiKey);
    if (element?.status === "OK" && element.distance) {
      mode = "coords";
    } else {
      console.warn("[delivery-cost] coords fallback triggered, status:", element?.status);
      element = null;
    }
  }

  if (!element && hasAddress) {
    const destination = buildDestinationFromAddress(rawAddress!.trim());
    element = await callDistanceMatrix(ORIGIN_ADDRESS, destination, apiKey);
    if (element?.status === "OK" && element.distance) {
      mode = "address";
    } else {
      console.warn(
        "[delivery-cost] address attempt failed, status:", element?.status,
        "| destination:", sanitizeForLog(destination)
      );
      element = null;
    }
  }

  if (!element || element.status !== "OK" || !element.distance) {
    const result: DeliveryResult = {
      deliverable: false,
      error: "No pudimos calcular la ruta a esa ubicación. Verificá que sea una calle válida de Bahía Blanca.",
    };
    return NextResponse.json(result);
  }

  const distance_km = element.distance.value / 1000;

  if (config.max_km > 0 && distance_km > config.max_km) {
    const result: DeliveryResult = {
      deliverable: false,
      error: `La dirección está fuera de la zona de cobertura (máximo ${config.max_km} km).`,
      distance_km: Math.round(distance_km * 10) / 10,
    };
    return NextResponse.json(result);
  }

  const fee = Math.round(config.base_fee + distance_km * config.price_per_km);

  const result: DeliveryResult = {
    deliverable: true,
    fee,
    distance_km: Math.round(distance_km * 10) / 10,
    free: false,
    mode,
  };
  return NextResponse.json(result);
}
