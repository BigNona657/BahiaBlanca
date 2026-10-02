import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { type DeliveryConfig, DEFAULT_DELIVERY_CONFIG } from "@/lib/delivery";

const CITY_SUFFIX = "Bahía Blanca, Buenos Aires, Argentina";

type DeliveryResult =
  | { deliverable: true; fee: number; distance_km: number; free: false; mode: string }
  | { deliverable: true; fee: 0; distance_km: null; free: true; reason: string }
  | { deliverable: false; error: string; distance_km?: number };

function normalizeAddress(address: string): string {
  const cleaned = address
    .replace(/,?\s*bah[ií]a\s+blanca.*$/i, "")
    .trim();
  return `${cleaned || address.trim()}, ${CITY_SUFFIX}`;
}

function sanitizeForLog(value: string): string {
  return value.replace(/[\r\n\t\0]/g, " ").replace(/[^\x20-\x7E\u00C0-\u024F]/g, "?").slice(0, 150);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function callRoutesAPI(
  destination: string,
  apiKey: string
): Promise<{ distanceMeters: number } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    console.log("[delivery-cost] Routes API calling:", sanitizeForLog(destination));
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: -38.7183, longitude: -62.2663 } } },
        destination: { address: destination },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
      }),
    });
    clearTimeout(timeout);
    const data = await res.json();
    console.log("[delivery-cost] Routes API response:", JSON.stringify(data).slice(0, 200));
    const distanceMeters = data?.routes?.[0]?.distanceMeters;
    if (typeof distanceMeters === "number") return { distanceMeters };
    return null;
  } catch (err) {
    clearTimeout(timeout);
    console.warn("[delivery-cost] Routes API FAILED:", String(err));
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

  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.PLACES_API_KEY;
  if (!apiKey) {
    const result: DeliveryResult = { deliverable: true, fee: 0, distance_km: null, free: true, reason: "config" };
    return NextResponse.json(result);
  }

  let resolvedLat = hasCoords ? lat : NaN;
  let resolvedLng = hasCoords ? lng : NaN;

  if (!hasCoords && hasAddress) {
    const normalizedAddress = normalizeAddress(rawAddress!);
    console.log("[delivery-cost] Iniciando geocode para:", sanitizeForLog(normalizedAddress));
    const geocodeUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    geocodeUrl.searchParams.set("address", normalizedAddress);
    geocodeUrl.searchParams.set(
      "components",
      "administrative_area:Buenos Aires|country:AR"
    );
    geocodeUrl.searchParams.set("region", "ar");
    geocodeUrl.searchParams.set("language", "es");
    geocodeUrl.searchParams.set("key", apiKey);

    try {
      const geoRes = await fetch(geocodeUrl.toString());
      const geoData = await geoRes.json();
      const firstResult = geoData.results?.[0];

      const validTypes = ["street_address", "premise", "subpremise", "route", "intersection"];
      const isSpecificAddress = firstResult?.types?.some((t: string) => validTypes.includes(t));

      console.log(
        "[delivery-cost] Geocode status:", geoData.status,
        "| types:", firstResult?.types ?? "none",
        "| isSpecific:", isSpecificAddress,
        "| location:", firstResult?.geometry?.location ?? "none",
        "| dir:", sanitizeForLog(normalizedAddress)
      );

      if (geoData.status === "OK" && firstResult?.geometry?.location && isSpecificAddress) {
        resolvedLat = firstResult.geometry.location.lat;
        resolvedLng = firstResult.geometry.location.lng;
      } else {
        console.warn(
          "[delivery-cost] Geocode sin dirección específica:",
          geoData.status,
          "| types:", firstResult?.types,
          "| msg:", geoData.error_message || "N/A"
        );
      }
    } catch (err) {
      console.warn("[delivery-cost] Error en la petición a Geocode:", err);
    }
  }

  let routeResult: { distanceMeters: number } | null = null;
  let mode = "address";

  if (!isNaN(resolvedLat) && !isNaN(resolvedLng)) {
    // Haversine con factor 1.3 para estimar ruta real desde distancia en línea recta
    const straightKm = haversineKm(-38.7183, -62.2663, resolvedLat, resolvedLng);
    const estimatedMeters = Math.round(straightKm * 1.4 * 1000);
    console.log("[delivery-cost] Haversine:", straightKm.toFixed(3), "km → estimado:", estimatedMeters, "m");
    routeResult = { distanceMeters: estimatedMeters };
    mode = hasCoords ? "coords" : "geocoded";
  }

  if (!routeResult && hasAddress) {
    const destination = normalizeAddress(rawAddress!);
    const result = await callRoutesAPI(destination, apiKey);
    if (result) {
      routeResult = result;
      mode = "address";
    } else {
      console.warn("[delivery-cost] Routes (address) failed | destination:", sanitizeForLog(destination));
    }
  }

  if (!routeResult) {
    const result: DeliveryResult = {
      deliverable: false,
      error: "No pudimos calcular la ruta a esa ubicación. Verificá que sea una calle válida de Bahía Blanca.",
    };
    return NextResponse.json(result);
  }

  const distance_km = routeResult.distanceMeters / 1000;

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
