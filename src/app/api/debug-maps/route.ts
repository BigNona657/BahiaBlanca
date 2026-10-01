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
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: -38.7183, longitude: -62.2663 } } },
        destination: { location: { latLng: { latitude: -38.72, longitude: -62.27 } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
      }),
    });
    const data = await res.json();
    results.routesapi = {
      distanceMeters: data?.routes?.[0]?.distanceMeters ?? null,
      error: data?.error ?? null,
    };
  } catch (err) {
    results.routesapi = { error: String(err) };
  }

  return NextResponse.json(results);
}
