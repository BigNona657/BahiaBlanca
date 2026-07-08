import type { OrderStatus } from "@/lib/actions/orders";

const STATUS_MAP: Record<OrderStatus, { label: string; icon: string; cls: string }> = {
  PENDING:    { label: "Pendiente",   icon: "⏳", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  CONFIRMED:  { label: "Confirmado",  icon: "✅", cls: "bg-blue-50   text-blue-700   border-blue-200"   },
  PREPARING:  { label: "En cocina",   icon: "👨‍🍳", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  DELIVERING: { label: "En camino",   icon: "🛵", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  DELIVERED:  { label: "Entregado",   icon: "🏠", cls: "bg-green-50  text-green-700  border-green-200"  },
  CANCELLED:  { label: "Cancelado",   icon: "❌", cls: "bg-red-50    text-red-700    border-red-200"    },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, icon, cls } = STATUS_MAP[status] ?? STATUS_MAP.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      {icon} {label}
    </span>
  );
}
