import Link from "next/link";
import { getClientOrderDetail } from "@/lib/actions/orders";
import StatusBadge from "@/components/ui/StatusBadge";
import OrderStatusTracker from "@/components/store/OrderStatusTracker";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
};

const PAYMENT_LABEL = { CASH: "💵 Efectivo contra entrega", TRANSFER: "🏦 Transferencia bancaria" };

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { new: newParam } = await searchParams;
  const orderId = parseInt(id);
  const isNew = newParam === "1";

  const order = await getClientOrderDetail(orderId);

  // getClientOrderDetail ya verifica que el pedido pertenezca al usuario en sesión
  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center gap-3">
        <span className="text-5xl">🔍</span>
        <p className="font-semibold text-gray-700">Pedido no encontrado</p>
        <p className="text-sm text-gray-400">
          Este pedido no existe o no pertenece a tu cuenta.
        </p>
        <Link href="/orders" className="mt-2 text-brand-500 font-medium text-sm">
          Ver mis pedidos
        </Link>
      </div>
    );
  }

  const date = new Date(order.created_at);
  const dateLabel = date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div>
        <Link href="/orders" className="text-xs text-gray-400 hover:text-gray-600 transition">
          ← Mis pedidos
        </Link>
        <div className="flex items-center justify-between mt-2 gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-gray-800">
            {isNew ? "¡Pedido confirmado! 🎉" : `Pedido #${order.id}`}
          </h1>
          <OrderStatusTracker orderId={order.id} initialStatus={order.status} />
        </div>
        <p className="text-xs text-gray-400 mt-1 capitalize">
          {dateLabel} · {timeLabel}
        </p>
      </div>

      {/* Mensaje de nuevo pedido */}
      {isNew && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
          <p className="text-sm text-green-700 font-medium">
            Recibimos tu pedido. En breve nos ponemos en contacto para coordinar la entrega.
          </p>
        </div>
      )}

      {/* Ítems */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700">
            Detalle del pedido
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-brand-500 bg-brand-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                  {item.quantity}
                </span>
                <span className="text-sm text-gray-700 truncate">{item.product_name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-800 shrink-0">
                ${(parseFloat(item.unit_price) * item.quantity).toLocaleString("es-AR", {
                  minimumFractionDigits: 0,
                })}
              </span>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="px-4 py-3 border-t border-gray-100 space-y-1.5 bg-gray-50">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>
              ${parseFloat(order.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Envío</span>
            <span className="text-green-600 font-medium">Gratis</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-800 pt-1 border-t border-gray-200">
            <span>Total</span>
            <span className="text-brand-600">
              ${parseFloat(order.total).toLocaleString("es-AR", { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Info de entrega */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-700">Entrega</h2>
        <InfoRow icon="📍" label="Dirección" value={order.delivery_address.replace(/ \| /g, "\n")} />
        <InfoRow icon="💳" label="Pago" value={PAYMENT_LABEL[order.payment_method]} />
      </div>

      {/* CTA */}
      <Link
        href="/"
        className="block w-full text-center bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3.5 rounded-xl transition"
      >
        Hacer otro pedido
      </Link>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-base shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-700 whitespace-pre-line">{value}</p>
      </div>
    </div>
  );
}
