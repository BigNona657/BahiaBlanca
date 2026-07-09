import { subscribe, unsubscribe } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = parseInt(id);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      subscribe(orderId, controller);

      // Heartbeat cada 25s para mantener la conexión viva en Vercel
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      // Limpieza al cerrar
      _req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe(orderId, controller);
        try { controller.close(); } catch { /* ya cerrado */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
