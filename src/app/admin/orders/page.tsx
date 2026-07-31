import { getAdminOrders } from "@/lib/actions/admin";
import AdminOrderCard from "@/components/admin/AdminOrderCard";
import NewOrderNotifier from "@/components/admin/NewOrderNotifier";
import { sql } from "@/lib/db/client";

export const revalidate = 0;

export default async function AdminOrdersPage() {
  const [orders, chatRows] = await Promise.all([
    getAdminOrders(),
    sql`
      SELECT COALESCE(MAX(m.id), 0) AS last_id
      FROM order_messages m
      INNER JOIN orders o ON o.id = m.order_id
      WHERE m.sender = 'client'
        AND o.status NOT IN ('DELIVERED', 'CANCELLED')
    `,
  ]);

  const active    = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const completed = orders.filter((o) => o.status === "DELIVERED" || o.status === "CANCELLED");
  const initialLastChatId = Number(chatRows[0].last_id);

  return (
    <div className="space-y-6">
      <NewOrderNotifier initialCount={active.length} initialLastChatId={initialLastChatId} />
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
