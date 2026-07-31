import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ count: 0 }, { status: 401 });

  const rows = await sql`
    SELECT COUNT(*) AS count FROM orders
    WHERE status NOT IN ('DELIVERED', 'CANCELLED')
  `;
  return NextResponse.json({ count: Number(rows[0].count) });
}
