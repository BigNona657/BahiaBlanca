import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input");

  if (!input) return NextResponse.json({ predictions: [] });

  const apiKey = process.env.PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ predictions: [] });

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", `${input}, Bahía Blanca`);
  url.searchParams.set("components", "country:ar");
  url.searchParams.set("types", "address");
  url.searchParams.set("language", "es");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const data = await res.json();

  return NextResponse.json({
    predictions: (data.predictions ?? []).map((p: { description: string; place_id: string }) => ({
      description: p.description,
      place_id: p.place_id,
    })),
  });
}
