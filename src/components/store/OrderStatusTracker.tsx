"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderStatus } from "@/lib/actions/orders";
import StatusBadge from "@/components/ui/StatusBadge";

const FINAL_STATUSES: OrderStatus[] = ["DELIVERED", "CANCELLED"];

const STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  CONFIRMED:  "✅ Tu pedido fue confirmado.",
  PREPARING:  "👨‍🍳 Tu pedido está siendo preparado.",
  DELIVERING: "🛵 ¡Tu pedido está en camino!",
  DELIVERED:  "🏠 ¡Tu pedido fue entregado!",
  CANCELLED:  "❌ Tu pedido fue cancelado.",
};

export default function OrderStatusTracker({
  orderId,
  initialStatus,
}: {
  orderId: number;
  initialStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [toast, setToast] = useState<string | null>(null);
  const currentStatus = useRef<OrderStatus>(initialStatus);

  function playStatusBeep() {
    try {
      const ctx = new AudioContext();
      [{ f: 520, t: 0 }, { f: 660, t: 0.2 }].forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.2);
      });
    } catch {}
  }

  useEffect(() => {
    // No arrancar polling si ya está en estado final
    if (FINAL_STATUSES.includes(currentStatus.current)) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/stream`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const next = data.status as OrderStatus;

        if (next !== currentStatus.current) {
          currentStatus.current = next;
          setStatus(next);

          const msg = STATUS_MESSAGES[next];
          if (msg) {
            playStatusBeep();
            setToast(msg);
            setTimeout(() => setToast(null), 5000);
          }

          // Detener polling al llegar a estado final
          if (FINAL_STATUSES.includes(next)) clearInterval(interval);
        }
      } catch {
        // Error de red: ignorar, reintentar en el próximo tick
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <>
      <StatusBadge status={status} />

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap">
            {toast}
          </div>
        </div>
      )}
    </>
  );
}
