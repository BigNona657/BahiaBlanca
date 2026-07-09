"use client";

import { useEffect, useState } from "react";
import type { OrderStatus } from "@/lib/actions/orders";
import StatusBadge from "@/components/ui/StatusBadge";

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  PENDING:    "",
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

  useEffect(() => {
    const es = new EventSource(`/api/orders/${orderId}/stream`);

    es.onmessage = (e) => {
      const next = e.data as OrderStatus;
      setStatus(next);
      const msg = STATUS_MESSAGES[next];
      if (msg) {
        setToast(msg);
        setTimeout(() => setToast(null), 5000);
      }
    };

    return () => es.close();
  }, [orderId]);

  return (
    <>
      <StatusBadge status={status} />

      {/* Toast de notificación */}
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
