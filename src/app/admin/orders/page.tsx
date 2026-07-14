import { getAdminOrders } from "@/lib/actions/admin";
import AdminOrderCard from "@/components/admin/AdminOrderCard";

export const revalidate = 0;

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
          active.map((order) => <AdminOrderCard key={order.id} order={order} showSelect />)
        )}
      </section>

      {/* ── Historial ── */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            Historial ({completed.length})
          </h2>
          {completed.map((order) => <AdminOrderCard key={order.id} order={order} />)}
        </section>
      )}
    </div>
  );
}
