import { getAdminOrders } from "@/lib/actions/admin";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";

export const revalidate = 0;

const PAYMENT_LABEL = { CASH: "💵 Efectivo", TRANSFER: "🏦 Transferencia" };

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Pedidos</h1>
        <p className="text-xs text-gray-400 mt-0.5">{orders.length} pedidos en total</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-sm">Todavía no hay pedidos.</p>
        </div>
      ) : (
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
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                {/* ID + fecha */}
                <div className="shrink-0 text-center sm:text-left sm:w-16">
                  <p className="text-lg font-bold text-brand-600">#{order.id}</p>
                  <p className="text-xs text-gray-400">{dateLabel}</p>
                  <p className="text-xs text-gray-400">{timeLabel}</p>
                </div>

                {/* Info cliente */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {order.customer_name ?? order.customer_email ?? "Cliente"}
                  </p>
                  {order.phone && (
                    <p className="text-xs text-brand-500 font-medium mt-0.5">📞 {order.phone}</p>
                  )}
                  <p className="text-xs text-gray-400 truncate mt-0.5">{order.delivery_address}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {PAYMENT_LABEL[order.payment_method]}
                  </p>
                </div>

                {/* Total + estado */}
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                  <span className="text-base font-bold text-gray-800">
                    ${parseFloat(order.total).toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                  </span>
                  <OrderStatusSelect orderId={order.id} current={order.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
