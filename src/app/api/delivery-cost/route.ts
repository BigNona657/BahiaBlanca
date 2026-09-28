import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { type DeliveryConfig, DEFAULT_DELIVERY_CONFIG } from "@/lib/delivery";

const ORIGIN = "Vicente Fatone 657, Bahía Blanca, Buenos Aires, Argentina";
const CITY_SUFFIX = "Bahía Blanca, Buenos Aires, Argentina";

// Evita duplicar la ciudad si la dirección ya la incluye
function buildDestination(address: string): string {
  const normalized = address.toLowerCase();
  if (normalized.includes("bahía blanca") || normalized.includes("bahia blanca")) {
    return address.trim();
  }
  return `${address.trim()}, ${CITY_SUFFIX}`;
}

// Sanitiza el input para logs (elimina saltos de línea y caracteres de control)
function sanitizeForLog(value: string): string {
  return value.replace(/[\r\n\t]/g, " ").slice(0, 200);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // ── Validación de parámetros ──────────────────────────────────────────────
  const rawAddress = searchParams.get("address");
  if (!rawAddress || !rawAddress.trim()) {
    return NextResponse.json(
      { error: "El parámetro 'address' es requerido." },
      { status: 400 }
    );
  }

  const address = rawAddress.trim();

  if (address.length < 5) {
    return NextResponse.json(
      { error: "La dirección es demasiado corta. Ingresá calle y número." },
      { status: 400 }
    );
  }

  const rawSubtotal = searchParams.get("subtotal");
  const subtotal = rawSubtotal !== null ? Number(rawSubtotal) : 0;
  if (isNaN(subtotal) || subtotal < 0) {
    return NextResponse.json(
      { error: "El parámetro 'subtotal' debe ser un número válido." },
      { status: 400 }
    );
  }

  // ── Config de envío ───────────────────────────────────────────────────────
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'delivery_config' LIMIT 1`;
  let config: DeliveryConfig = DEFAULT_DELIVERY_CONFIG;
  try {
    if (rows[0]?.value) config = JSON.parse(rows[0].value as string);
  } catch {}

  // Envío gratis por monto
  if (config.free_from > 0 && subtotal >= config.free_from) {
    return NextResponse.json({ fee: 0, distance_km: null, free: true, reason: "monto" });
  }

  // ── Google Distance Matrix ────────────────────────────────────────────────
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ fee: 0, distance_km: null, free: true, reason: "config" });
  }

  const destination = buildDestination(address);

  const gmUrl = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  gmUrl.searchParams.set("origins", ORIGIN);
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

  const element = (gmData?.rows as { elements: { status: string; distance: { value: number } }[] }[])?.[0]?.elements?.[0];

  if (!element || element.status !== "OK") {
    console.warn("[delivery-cost] Google status:", element?.status, "| destination:", sanitizeForLog(destination));
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

  return NextResponse.json({ fee, distance_km: Math.round(distance_km * 10) / 10, free: false });
}
