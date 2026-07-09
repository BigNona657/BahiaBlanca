import { getAdminOrders } from "@/lib/actions/admin";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import StatusBadge from "@/components/ui/StatusBadge";

export const revalidate = 0;

const PAYMENT_LABEL = { CASH: "💵 Efectivo", TRANSFER: "🏦 Transferencia" };

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  const active    = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const completed = orders.filter((o) => o.status === "DELIVERED" || o.status === "CANCELLED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Pedidos</h1>
        <p className="text-xs text-gray-400 mt-0.5">{orders.length} pedidos en total</p>
      </div>

      {/* ── Activos ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Activos ({active.length})
        </h2>
        {active.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
            <p className="text-3xl mb-1">✅</p>
            <p className="text-sm">No hay pedidos activos.</p>
          </div>
        ) : (
          active.map((order) => <OrderCard key={order.id} order={order} showSelect />)
        )}
      </section>

      {/* ── Historial ── */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            Historial ({completed.length})
          </h2>
          {completed.map((order) => <OrderCard key={order.id} order={order} />)}
        </section>
      )}
    </div>
  );
}

function OrderCard({
  order,
  showSelect = false,
}: {
  order: Awaited<ReturnType<typeof getAdminOrders>>[number];
  showSelect?: boolean;
}) {
  const date = new Date(order.created_at);
  const dateLabel = date.toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="shrink-0 text-center sm:text-left sm:w-16">
        <p className="text-lg font-bold text-brand-600">#{order.id}</p>
        <p className="text-xs text-gray-400">{dateLabel}</p>
        <p className="text-xs text-gray-400">{timeLabel}</p>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {order.customer_name ?? order.customer_email ?? "Cliente"}
        </p>
        {order.phone && (
          <p className="text-xs text-brand-500 font-medium mt-0.5">📞 {order.phone}</p>
        )}
        <p className="text-xs text-gray-400 truncate mt-0.5">{order.delivery_address}</p>
        <p className="text-xs text-gray-400 mt-0.5">{PAYMENT_LABEL[order.payment_method]}</p>
      </div>

      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
        <span className="text-base font-bold text-gray-800">
          ${parseFloat(order.total).toLocaleString("es-AR", { minimumFractionDigits: 0 })}
        </span>
        {showSelect
          ? <OrderStatusSelect orderId={order.id} current={order.status} />
          : <StatusBadge status={order.status} />
        }
      </div>
    </div>
  );
}
