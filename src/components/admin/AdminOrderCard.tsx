"use client";

import { useState } from "react";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import StatusBadge from "@/components/ui/StatusBadge";
import OrderChat from "@/components/store/OrderChat";
import type { getAdminOrders } from "@/lib/actions/admin";

type Order = Awaited<ReturnType<typeof getAdminOrders>>[number];

const PAYMENT_LABEL = { CASH: "💵 Efectivo", TRANSFER: "🏦 Transferencia" };

export default function AdminOrderCard({
  order,
  showSelect = false,
}: {
  order: Order;
  showSelect?: boolean;
}) {
  const [showChat, setShowChat] = useState(false);

  const date = new Date(order.created_at);
  const dateLabel = date.toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit",
  });

  const chatExpired = Date.now() - date.getTime() > 45 * 60 * 1000;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
          {order.items.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {order.items.map((item, i) => (
                <li key={i} className="text-xs text-gray-600">
                  <span className="font-medium">{item.quantity}×</span> {item.product_name}
                  {item.note && (
                    <span className="text-brand-500 ml-1">({item.note})</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
          <span className="text-base font-bold text-gray-800">
            ${parseFloat(order.total).toLocaleString("es-AR", { minimumFractionDigits: 0 })}
          </span>
          {showSelect
            ? <OrderStatusSelect orderId={order.id} current={order.status} />
            : <StatusBadge status={order.status} />
          }
          <button
            onClick={() => setShowChat((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
              chatExpired
                ? "bg-gray-100 text-gray-400"
                : "bg-brand-50 text-brand-600 hover:bg-brand-100"
            }`}
          >
            💬 {showChat ? "Cerrar chat" : "Ver chat"}
          </button>
        </div>
      </div>

      {showChat && (
        <OrderChat
          orderId={order.id}
          orderCreatedAt={order.created_at}
          senderRole="admin"
        />
      )}
    </div>
  );
}
