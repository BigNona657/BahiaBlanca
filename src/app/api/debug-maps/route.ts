import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No API key configured" });

  const results: Record<string, unknown> = { keyPrefix: apiKey.slice(0, 8) + "..." };

  try {
    const geoUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    geoUrl.searchParams.set("address", "Italia 128, Bahia Blanca, Argentina");
    geoUrl.searchParams.set("key", apiKey);
    const res = await fetch(geoUrl.toString(), { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    results.geocode = {
      status: data.status,
      error_message: data.error_message ?? null,
      first_types: data.results?.[0]?.types ?? null,
      location: data.results?.[0]?.geometry?.location ?? null,
    };
  } catch (err) {
    results.geocode = { error: String(err) };
  }

  try {
    const dmUrl = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    dmUrl.searchParams.set("origins", "-38.7183,-62.2663");
    dmUrl.searchParams.set("destinations", "-38.72,-62.27");
    dmUrl.searchParams.set("key", apiKey);
    const res = await fetch(dmUrl.toString(), { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    results.distancematrix = {
      status: data.status,
      error_message: data.error_message ?? null,
      element_status: data.rows?.[0]?.elements?.[0]?.status ?? null,
      distance: data.rows?.[0]?.elements?.[0]?.distance ?? null,
    };
  } catch (err) {
    results.distancematrix = { error: String(err) };
  }

  return NextResponse.json(results);
}
