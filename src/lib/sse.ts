// Almacén en memoria de suscriptores SSE.
// Funciona en Node.js runtime (API routes normales).
// Las Edge routes crean su propio ReadableStream sin pasar por aquí.

type Controller = ReadableStreamDefaultController<Uint8Array>;
const enc = new TextEncoder();

function emit(ctrl: Controller, event: string, data: string) {
  try {
    ctrl.enqueue(enc.encode(`event: ${event}\ndata: ${data}\n\n`));
  } catch {
    // El cliente ya cerró la conexión
  }
}

// ─── Canal de estado de órdenes ──────────────────────────────────────────────

const orderChannels = new Map<number, Set<Controller>>();

export function subscribeOrder(orderId: number, ctrl: Controller) {
  if (!orderChannels.has(orderId)) orderChannels.set(orderId, new Set());
  orderChannels.get(orderId)!.add(ctrl);
}

export function unsubscribeOrder(orderId: number, ctrl: Controller) {
  orderChannels.get(orderId)?.delete(ctrl);
  if (orderChannels.get(orderId)?.size === 0) orderChannels.delete(orderId);
}

export function broadcastOrderStatus(orderId: number, status: string) {
  const subs = orderChannels.get(orderId);
  if (!subs) return;
  for (const ctrl of subs) emit(ctrl, "status", status);
}

// ─── Canal de chat por orden ─────────────────────────────────────────────────

const chatChannels = new Map<number, Set<Controller>>();

export function subscribeChat(orderId: number, ctrl: Controller) {
  if (!chatChannels.has(orderId)) chatChannels.set(orderId, new Set());
  chatChannels.get(orderId)!.add(ctrl);
}

export function unsubscribeChat(orderId: number, ctrl: Controller) {
  chatChannels.get(orderId)?.delete(ctrl);
  if (chatChannels.get(orderId)?.size === 0) chatChannels.delete(orderId);
}

export function broadcastChatMessage(
  orderId: number,
  message: { id: number; sender: string; text: string; created_at: string }
) {
  const subs = chatChannels.get(orderId);
  if (!subs) return;
  const payload = JSON.stringify(message);
  for (const ctrl of subs) emit(ctrl, "chat", payload);
}

// ─── Canal global de menú ─────────────────────────────────────────────────────

const menuSubscribers = new Set<Controller>();

export function subscribeMenu(ctrl: Controller) {
  menuSubscribers.add(ctrl);
}

export function unsubscribeMenu(ctrl: Controller) {
  menuSubscribers.delete(ctrl);
}

export function broadcastMenuUpdate() {
  for (const ctrl of menuSubscribers) emit(ctrl, "menu", "update");
}

// ─── Aliases de compatibilidad (usados por código existente) ─────────────────

/** @deprecated Usar broadcastOrderStatus */
export function broadcast(orderId: number, status: string) {
  broadcastOrderStatus(orderId, status);
}

/** @deprecated Usar subscribeOrder */
export function subscribe(orderId: number, ctrl: Controller) {
  subscribeOrder(orderId, ctrl);
}

/** @deprecated Usar unsubscribeOrder */
export function unsubscribe(orderId: number, ctrl: Controller) {
  unsubscribeOrder(orderId, ctrl);
}
