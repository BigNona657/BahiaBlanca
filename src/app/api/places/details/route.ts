import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("place_id");

  if (!placeId) {
    return NextResponse.json({ error: "El parámetro 'place_id' es requerido." }, { status: 400 });
  }

  const apiKey = process.env.PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Servicio no configurado." }, { status: 503 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "geometry,formatted_address");
  url.searchParams.set("language", "es");
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "OK" || !data.result?.geometry?.location) {
      return NextResponse.json(
        { error: "No se pudieron obtener las coordenadas de esa dirección." },
        { status: 422 }
      );
    }

    const { lat, lng } = data.result.geometry.location;
    const formatted_address: string = data.result.formatted_address ?? "";

    return NextResponse.json({ lat, lng, formatted_address });
  } catch {
    return NextResponse.json(
      { error: "Error al conectar con el servicio de mapas." },
      { status: 503 }
    );
  }
}
