"use server";

import { sql } from "@/lib/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type ChatMessage = {
  id: number;
  sender: "client" | "admin";
  text: string;
  created_at: string;
};

const CHAT_EXPIRY_MS = 45 * 60 * 1000; // 45 minutos

export async function isChatOpen(orderCreatedAt: string): Promise<boolean> {
  return Date.now() - new Date(orderCreatedAt).getTime() < CHAT_EXPIRY_MS;
}

export async function getChatMessages(orderId: number): Promise<ChatMessage[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const isAdmin = session.user.role === "ADMIN";

  // Verificar acceso: admin ve todo, cliente solo sus pedidos
  if (!isAdmin) {
    const rows = await sql`SELECT id FROM orders WHERE id = ${orderId} AND user_id = ${session.user.id} LIMIT 1`;
    if (!rows.length) return [];
  }

  const rows = await sql`
    SELECT id, sender, text, created_at
    FROM order_messages
    WHERE order_id = ${orderId}
    ORDER BY created_at ASC
  `;
  return rows as ChatMessage[];
}

export async function sendChatMessage(
  orderId: number,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const trimmed = text.trim();
  if (!trimmed) return { success: false, error: "Mensaje vacío." };
  if (trimmed.length > 500) return { success: false, error: "Mensaje demasiado largo." };

  const isAdmin = session.user.role === "ADMIN";

  // Verificar acceso y obtener created_at del pedido
  const orderRows = isAdmin
    ? await sql`SELECT created_at FROM orders WHERE id = ${orderId} LIMIT 1`
    : await sql`SELECT created_at FROM orders WHERE id = ${orderId} AND user_id = ${session.user.id} LIMIT 1`;

  if (!orderRows.length) return { success: false, error: "Pedido no encontrado." };

  if (!(await isChatOpen(orderRows[0].created_at as string))) {
    return { success: false, error: "El chat de este pedido ha expirado." };
  }

  const sender = isAdmin ? "admin" : "client";
  await sql`
    INSERT INTO order_messages (order_id, sender, text)
    VALUES (${orderId}, ${sender}, ${trimmed})
  `;

  return { success: true };
}
