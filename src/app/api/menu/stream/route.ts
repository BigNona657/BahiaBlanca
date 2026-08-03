import { subscribeMenu, unsubscribeMenu } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
      subscribeMenu(controller);
    },
    cancel() {
      unsubscribeMenu(controller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
