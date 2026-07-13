"use server";

import { sql } from "@/lib/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { CartItem } from "@/context/CartContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CheckoutFormData = {
  customerName: string;
  phone: string;
  deliveryType: "DELIVERY" | "TAKEAWAY";
  street: string;
  streetNumber: string;
  apartment: string;
  notes: string;
  paymentMethod: "CASH" | "TRANSFER";
};

export type CheckoutResult =
  | { success: true; orderId: number }
  | { success: false; error: string };

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "DELIVERING"
  | "DELIVERED"
  | "CANCELLED";

export type ClientOrder = {
  id: number;
  status: OrderStatus;
  payment_method: "CASH" | "TRANSFER";
  delivery_address: string;
  total: string;
  created_at: string;
  item_count: number;
};

export type ClientOrderDetail = ClientOrder & {
  subtotal: string;
  delivery_fee: string;
  notes: string | null;
  items: {
    product_name: string;
    quantity: number;
    unit_price: string;
    note: string | null;
  }[];
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getClientOrders(): Promise<ClientOrder[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const rows = await sql`
    SELECT
      o.id,
      o.status,
      o.payment_method,
      o.delivery_address,
      o.total,
      o.created_at,
      COUNT(oi.id)::int AS item_count
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = ${session.user.id}
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;
  return rows as ClientOrder[];
}

export async function getClientOrderDetail(
  orderId: number
): Promise<ClientOrderDetail | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const orderRows = await sql`
    SELECT
      o.id, o.status, o.payment_method, o.delivery_address,
      o.total, o.subtotal, o.delivery_fee, o.notes, o.created_at,
      COUNT(oi.id)::int AS item_count
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.id = ${orderId} AND o.user_id = ${session.user.id}
    GROUP BY o.id
    LIMIT 1
  `;

  if (!orderRows.length) return null;

  const itemRows = await sql`
    SELECT
      p.name AS product_name,
      oi.quantity,
      oi.unit_price,
      oi.note
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ${orderId}
    ORDER BY oi.id ASC
  `;

  return {
    ...(orderRows[0] as Omit<ClientOrderDetail, "items">),
    items: itemRows as ClientOrderDetail["items"],
  };
}

// ─── createOrder ──────────────────────────────────────────────────────────────

export async function createOrder(
  formData: CheckoutFormData,
  items: CartItem[]
): Promise<CheckoutResult> {
  if (!items.length) return { success: false, error: "El carrito está vacío." };

  const session = await getServerSession(authOptions);

  const deliveryAddress = formData.deliveryType === "TAKEAWAY"
    ? "Take away · Fatone 657"
    : [
        `${formData.street} ${formData.streetNumber}`.trim(),
        formData.apartment ? `Piso/Depto: ${formData.apartment}` : null,
        formData.notes ? `Aclaraciones: ${formData.notes}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

  const subtotal = items.reduce(
    (sum, i) => sum + parseFloat(i.product.price) * i.quantity,
    0
  );
  const total = subtotal;

  try {
    let userId: string;

    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      const guestEmail = `guest_${formData.phone.replace(/\D/g, "")}@bignona.guest`;
      const existing = await sql`SELECT id FROM users WHERE email = ${guestEmail} LIMIT 1`;
      if (existing.length > 0) {
        userId = existing[0].id as string;
      } else {
        const created = await sql`
          INSERT INTO users (name, email, role)
          VALUES (${formData.customerName}, ${guestEmail}, 'CLIENT')
          RETURNING id
        `;
        userId = created[0].id as string;
      }
    }

    const orderRows = await sql`
      INSERT INTO orders (user_id, status, payment_method, delivery_address, phone, subtotal, delivery_fee, total)
      VALUES (${userId}, 'PENDING', ${formData.paymentMethod}, ${deliveryAddress}, ${formData.phone}, ${subtotal}, 0, ${total})
      RETURNING id
    `;
    const orderId = orderRows[0].id as number;

    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, note)
        VALUES (${orderId}, ${item.product.id}, ${item.quantity}, ${parseFloat(item.product.price)}, ${item.note ?? null})
      `;
    }

    return { success: true, orderId };
  } catch (err) {
    console.error("[createOrder]", err);
    return { success: false, error: "No se pudo guardar el pedido. Intentá de nuevo." };
  }
}
