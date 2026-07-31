import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ lastId: 0, newCount: 0 }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const since = parseInt(searchParams.get("since") ?? "0");

  const rows = await sql`
    SELECT
      COALESCE(MAX(m.id), 0) AS last_id,
      COUNT(CASE WHEN m.id > ${since} THEN 1 END) AS new_count
    FROM order_messages m
    INNER JOIN orders o ON o.id = m.order_id
    WHERE m.sender = 'admin'
      AND o.user_id = ${session.user.id}
      AND o.status NOT IN ('DELIVERED', 'CANCELLED')
  `;
  return NextResponse.json({
    lastId: Number(rows[0].last_id),
    newCount: Number(rows[0].new_count),
  });
}
