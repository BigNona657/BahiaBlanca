import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const productId = form.get("productId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }

    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen supera el límite de 3MB. Intentá con una imagen más pequeña." },
        { status: 413 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Si viene productId, actualiza directamente en la DB
    if (productId) {
      await sql`UPDATE products SET image_data = ${dataUrl} WHERE id = ${parseInt(productId)}`;
    }

    return NextResponse.json({ url: dataUrl });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json(
      { error: "Error interno al procesar la imagen." },
      { status: 500 }
    );
  }
}
