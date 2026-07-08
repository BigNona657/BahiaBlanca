"use client";

import { useTransition } from "react";
import { updateOrderStatus, type OrderStatus } from "@/lib/actions/admin";

const STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: "PENDING",    label: "⏳ Pendiente",    color: "text-yellow-600 bg-yellow-50" },
  { value: "CONFIRMED",  label: "✅ Confirmado",   color: "text-blue-600 bg-blue-50"   },
  { value: "PREPARING",  label: "👨‍🍳 Preparando",  color: "text-purple-600 bg-purple-50"},
  { value: "DELIVERING", label: "🛵 En camino",    color: "text-orange-600 bg-orange-50"},
  { value: "DELIVERED",  label: "🏠 Entregado",    color: "text-green-600 bg-green-50" },
  { value: "CANCELLED",  label: "❌ Cancelado",    color: "text-red-600 bg-red-50"     },
];

type Props = { orderId: number; current: OrderStatus };

export default function OrderStatusSelect({ orderId, current }: Props) {
  const [isPending, startTransition] = useTransition();
  const currentMeta = STATUSES.find((s) => s.value === current)!;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as OrderStatus;
    startTransition(async () => {
      await updateOrderStatus(orderId, next);
    });
  }

  return (
    <select
      defaultValue={current}
      onChange={handleChange}
      disabled={isPending}
      className={`text-xs font-semibold rounded-full px-3 py-1.5 border-0 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-brand-400 transition
        disabled:opacity-50 ${currentMeta.color}`}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
