export const dynamic = "force-dynamic";
// Node.js runtime — el stream hace polling a la DB cada 3s.
// Esto es necesario porque Vercel Serverless es stateless:
// cada invocación puede correr en una instancia distinta,
// por lo que un Map en memoria nunca es confiable para broadcast.

import { neon } from "@neondatabase/serverless";

const POLL_INTERVAL_MS = 3_000;
const HEARTBEAT_MS = 25_000;
const CHAT_EXPIRY_MS = 10 * 60 * 1000;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = parseInt(id);

  const sql = neon(process.env.DATABASE_URL!);

  // Estado inicial
  const [orderRow] = await sql`
    SELECT status, created_at FROM orders WHERE id = ${orderId} LIMIT 1
  `;
  if (!orderRow) {
    return new Response("Not found", { status: 404 });
  }

  const chatExpiresAt = new Date(orderRow.created_at as string).getTime() + CHAT_EXPIRY_MS;
  let lastStatus = orderRow.status as string;
  let lastMessageId = 0;

  // Obtener el último id de mensaje existente para no re-emitir histórico
  const [lastMsg] = await sql`
    SELECT COALESCE(MAX(id), 0) AS last_id FROM order_messages WHERE order_id = ${orderId}
  `;
  lastMessageId = Number(lastMsg.last_id);

  const enc = new TextEncoder();
  let pollTimer: ReturnType<typeof setInterval>;
  let heartbeatTimer: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      function send(event: string, data: string) {
        try {
          controller.enqueue(enc.encode(`event: ${event}\ndata: ${data}\n\n`));
        } catch {
          cleanup();
        }
      }

      // Emitir estado inicial
      send("status", lastStatus);

      async function poll() {
        try {
          // Verificar si el chat expiró
          if (Date.now() >= chatExpiresAt) {
            send("chat-expired", "true");
            cleanup();
            return;
          }

          // Nuevos mensajes de chat
          const newMessages = await sql`
            SELECT id, sender, text, created_at
            FROM order_messages
            WHERE order_id = ${orderId} AND id > ${lastMessageId}
            ORDER BY id ASC
          `;
          for (const msg of newMessages) {
            send("chat", JSON.stringify({
              id: msg.id,
              sender: msg.sender,
              text: msg.text,
              created_at: String(msg.created_at),
            }));
            lastMessageId = msg.id as number;
          }

          // Cambio de estado de la orden
          const [row] = await sql`
            SELECT status FROM orders WHERE id = ${orderId} LIMIT 1
          `;
          if (row && row.status !== lastStatus) {
            lastStatus = row.status as string;
            send("status", lastStatus);
          }
        } catch {
          // Error de DB: ignorar, reintentar en el próximo tick
        }
      }

      pollTimer = setInterval(poll, POLL_INTERVAL_MS);

      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(enc.encode(": ping\n\n"));
        } catch {
          cleanup();
        }
      }, HEARTBEAT_MS);
    },
    cancel() {
      cleanup();
    },
  });

  function cleanup() {
    clearInterval(pollTimer);
    clearInterval(heartbeatTimer);
  }

  req.signal.addEventListener("abort", cleanup);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
