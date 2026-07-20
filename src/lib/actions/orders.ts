"use server";

import { sql } from "@/lib/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { CartItem } from "@/context/CartContext";
import { decrementDailyMenuStock, decrementImperdibleStock, getImperdibles } from "@/lib/actions/settings";

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
  if (!session?.user?.id) return { success: false, error: "Debés iniciar sesión para hacer un pedido." };

  const deliveryAddress = formData.deliveryType === "TAKEAWAY"
    ? "Take away · Fatone 657"
    : [
        `${formData.street} ${formData.streetNumber}`.trim(),
        formData.apartment ? `Piso/Depto: ${formData.apartment}` : null,
        formData.notes ? `Aclaraciones: ${formData.notes}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

  if (!deliveryAddress.trim()) return { success: false, error: "Ingresá una dirección de entrega." };
  if (!formData.phone.trim()) return { success: false, error: "Ingresá un teléfono de contacto." };

  const specialItems = items.filter((i) => i.product.id < 0);
  const regularItems = items.filter((i) => i.product.id > 0);

  const subtotal = items.reduce(
    (sum, i) => sum + parseFloat(i.product.price) * i.quantity,
    0
  );
  const total = subtotal;

  // Armar nota con los ítems especiales (menú del día e imperdibles)
  const specialNote = specialItems.length
    ? specialItems
        .map((i) => `${i.quantity}x ${i.product.name}${i.note ? ` (${i.note})` : ""}`)
        .join(", ")
    : null;

  try {
    const userId = session.user.id;

    const orderRows = await sql`
      INSERT INTO orders (user_id, status, payment_method, delivery_address, phone, subtotal, delivery_fee, total, notes)
      VALUES (${userId}, 'PENDING', ${formData.paymentMethod}, ${deliveryAddress}, ${formData.phone}, ${subtotal}, 0, ${total}, ${specialNote})
      RETURNING id
    `;
    const orderId = orderRows[0].id as number;

    for (const item of regularItems) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, note)
        VALUES (${orderId}, ${item.product.id}, ${item.quantity}, ${parseFloat(item.product.price)}, ${item.note ?? null})
      `;
    }

    // Descontar stock de ítems especiales
    const today = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
    ).getDay();
    const imperdibles = await getImperdibles();

    for (const item of specialItems) {
      if (item.product.id === -1) {
        // Menú del día — descontar qty veces
        for (let i = 0; i < item.quantity; i++) {
          await decrementDailyMenuStock(today);
        }
      } else {
        // Imperdible — buscar por ID generado
        const idx = imperdibles.findIndex(
          (imp) =>
            -(Math.abs(imp.title.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) + 1000) ===
            item.product.id
        );
        if (idx !== -1) {
          for (let i = 0; i < item.quantity; i++) {
            await decrementImperdibleStock(idx);
          }
        }
      }
    }

    return { success: true, orderId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[createOrder] ERROR:", msg);
    return { success: false, error: `Error: ${msg}` };
  }
}
