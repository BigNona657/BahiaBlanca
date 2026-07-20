import type { Metadata } from "next";
import Link from "next/link";
import { getClientOrders } from "@/lib/actions/orders";
import StatusBadge from "@/components/ui/StatusBadge";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mis pedidos",
  description: "Seguí el estado de tus pedidos en BigNona.",
  robots: { index: false, follow: false },
};

const PAYMENT_LABEL = { CASH: "💵 Efectivo", TRANSFER: "🏦 Transferencia" };

export default async function OrdersPage() {
  const orders = await getClientOrders();

  if (orders.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center gap-4">
        <span className="text-7xl">📭</span>
        <h2 className="text-xl font-bold text-gray-700">Todavía no hiciste pedidos</h2>
        <p className="text-gray-400 text-sm max-w-xs">
          Cuando hagas tu primer pedido, lo vas a poder seguir desde acá.
        </p>
        <Link
          href="/"
          className="mt-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          Ver el menú
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis pedidos</h1>

      <div className="space-y-3">
        {orders.map((order) => {
          const date = new Date(order.created_at);
          const dateLabel = date.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          const timeLabel = date.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white rounded-2xl shadow-sm p-4 hover:shadow-md active:scale-[0.99] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Izquierda: ID + fecha */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-gray-800">
                      Pedido #{order.id}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>

                  <p className="text-xs text-gray-400 mt-1">
                    {dateLabel} · {timeLabel}
                  </p>

                  <p className="text-xs text-gray-500 mt-2 truncate">
                    📍 {order.delivery_address.split(" | ")[0]}
                  </p>

                  <p className="text-xs text-gray-400 mt-0.5">
                    {PAYMENT_LABEL[order.payment_method]} ·{" "}
                    {order.item_count} {order.item_count === 1 ? "ítem" : "ítems"}
                  </p>
                </div>

                {/* Derecha: total + flecha */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-lg font-bold text-brand-600">
                    ${parseFloat(order.total).toLocaleString("es-AR", {
                      minimumFractionDigits: 0,
                    })}
                  </span>
                  <span className="text-gray-300 text-lg">›</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
