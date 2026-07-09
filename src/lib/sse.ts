// Store en memoria de canales SSE activos: orderId → Set de controllers
// Se comparte entre la API route del stream y updateOrderStatus

type Controller = ReadableStreamDefaultController<Uint8Array>;

const channels = new Map<number, Set<Controller>>();

export function subscribe(orderId: number, controller: Controller) {
  if (!channels.has(orderId)) channels.set(orderId, new Set());
  channels.get(orderId)!.add(controller);
}

export function unsubscribe(orderId: number, controller: Controller) {
  channels.get(orderId)?.delete(controller);
  if (channels.get(orderId)?.size === 0) channels.delete(orderId);
}

export function broadcast(orderId: number, status: string) {
  const subs = channels.get(orderId);
  if (!subs) return;
  const data = new TextEncoder().encode(`data: ${status}\n\n`);
  for (const ctrl of subs) {
    try {
      ctrl.enqueue(data);
    } catch {
      subs.delete(ctrl);
    }
  }
}
