import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ lastId: 0 }, { status: 401 });

  const rows = await sql`
    SELECT COALESCE(MAX(m.id), 0) AS last_id
    FROM order_messages m
    INNER JOIN orders o ON o.id = m.order_id
    WHERE m.sender = 'client'
      AND o.status NOT IN ('DELIVERED', 'CANCELLED')
  `;
  return NextResponse.json({ lastId: Number(rows[0].last_id) });
}
