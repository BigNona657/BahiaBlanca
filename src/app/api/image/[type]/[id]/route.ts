export const dynamic = "force-dynamic";

import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;

  let imageData: string | null = null;

  try {
    if (type === "product") {
      const rows = await sql`SELECT image_data FROM products WHERE id = ${parseInt(id)} LIMIT 1`;
      imageData = rows[0]?.image_data as string | null;
    } else if (type === "category") {
      const rows = await sql`SELECT image_data FROM categories WHERE id = ${parseInt(id)} LIMIT 1`;
      imageData = rows[0]?.image_data as string | null;
    } else if (type === "setting") {
      // id puede ser "daily_menu" o "imperdibles_idx_0"
      const [key, indexStr] = id.split("_idx_");
      const rows = await sql`SELECT value FROM app_settings WHERE key = ${key} LIMIT 1`;
      if (rows[0]?.value) {
        const parsed = JSON.parse(rows[0].value as string);
        if (indexStr !== undefined) {
          imageData = Array.isArray(parsed) ? (parsed[parseInt(indexStr)]?.image_data ?? null) : null;
        } else {
          imageData = parsed?.image_data ?? null;
        }
      }
    }
  } catch {
    return new NextResponse(null, { status: 500 });
  }

  if (!imageData) return new NextResponse(null, { status: 404 });

  const mime = imageData.startsWith("data:image/png") ? "image/png"
    : imageData.startsWith("data:image/webp") ? "image/webp"
    : "image/jpeg";

  const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
