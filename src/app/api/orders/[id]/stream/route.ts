export const runtime = "edge";
export const dynamic = "force-dynamic";

import { subscribeOrder, unsubscribeOrder, subscribeChat, unsubscribeChat } from "@/lib/sse";

const CHAT_EXPIRY_MS = 10 * 60 * 1000; // 10 minutos
const HEARTBEAT_MS = 25_000; // cada 25s para evitar timeout de Vercel

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = parseInt(id);

  // Calcular cuánto tiempo queda de chat (para cerrar el stream a tiempo)
  const orderCreatedAt = req.headers.get("x-order-created-at");
  const chatExpiresIn = orderCreatedAt
    ? Math.max(0, CHAT_EXPIRY_MS - (Date.now() - new Date(orderCreatedAt).getTime()))
    : CHAT_EXPIRY_MS;

  let orderCtrl: ReadableStreamDefaultController<Uint8Array>;
  let chatCtrl: ReadableStreamDefaultController<Uint8Array>;
  let heartbeatTimer: ReturnType<typeof setInterval>;
  let chatExpiryTimer: ReturnType<typeof setTimeout>;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      orderCtrl = controller;
      chatCtrl = controller;

      subscribeOrder(orderId, orderCtrl);
      subscribeChat(orderId, chatCtrl);

      // Heartbeat: comentario SSE vacío para mantener la conexión
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": ping\n\n"));
        } catch {
          cleanup();
        }
      }, HEARTBEAT_MS);

      // Cerrar el stream cuando expire el chat
      chatExpiryTimer = setTimeout(() => {
        try {
          controller.enqueue(
            new TextEncoder().encode(`event: chat-expired\ndata: true\n\n`)
          );
        } catch {}
        cleanup();
      }, chatExpiresIn);
    },
    cancel() {
      cleanup();
    },
  });

  function cleanup() {
    clearInterval(heartbeatTimer);
    clearTimeout(chatExpiryTimer);
    unsubscribeOrder(orderId, orderCtrl);
    unsubscribeChat(orderId, chatCtrl);
  }

  // Cerrar si el cliente desconecta
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
