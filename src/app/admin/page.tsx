import { getAdminOrders, getAdminStats } from "@/lib/actions/admin";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";

export const revalidate = 0; // siempre fresco en el panel admin

const PAYMENT_LABEL = { CASH: "💵 Efectivo", TRANSFER: "🏦 Transferencia" };

export default async function AdminDashboard() {
  const [orders, stats] = await Promise.all([getAdminOrders(true), getAdminStats()]);

  return (
    <div className="space-y-6">
      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Pedidos hoy"      value={String(stats.ordersToday)} />
        <StatCard label="Productos activos" value={String(stats.activeProducts)} />
        <StatCard
          label="Ingresos hoy"
          value={`$${stats.revenueToday.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* ── Tabla de pedidos ── */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-3">
          Pedidos activos
          <span className="ml-2 text-sm font-normal text-gray-400">({orders.length})</span>
        </h2>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-sm">No hay pedidos pendientes. ¡Todo al día!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                {/* ID + fecha */}
                <div className="shrink-0 text-center sm:text-left sm:w-16">
                  <p className="text-lg font-bold text-brand-600">#{order.id}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Info cliente */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {order.customer_name ?? order.customer_email ?? "Cliente"}
                  </p>
                  {order.phone && (
                    <p className="text-xs text-brand-500 font-medium mt-0.5">📞 {order.phone}</p>
                  )}
                  <p className="text-xs text-gray-400 truncate">{order.delivery_address}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {PAYMENT_LABEL[order.payment_method]}
                  </p>
                </div>

                {/* Total + selector estado */}
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                  <span className="text-base font-bold text-gray-800">
                    ${parseFloat(order.total).toLocaleString("es-AR", {
                      minimumFractionDigits: 0,
                    })}
                  </span>
                  <OrderStatusSelect orderId={order.id} current={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm ${className}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-brand-600 mt-1">{value}</p>
    </div>
  );
}
