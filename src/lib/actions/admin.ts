"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db/client";
import { broadcast } from "@/lib/sse";
import type { Product, Category } from "@/types/menu";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "DELIVERING"
  | "DELIVERED"
  | "CANCELLED";

export type AdminOrder = {
  id: number;
  status: OrderStatus;
  payment_method: "CASH" | "TRANSFER";
  delivery_address: string;
  phone: string | null;
  total: string;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
};

export type AdminProduct = Product & { category_name: string };

export type ProductFormData = {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  available: boolean;
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const rows = await sql`
    SELECT
      o.id, o.status, o.payment_method, o.delivery_address,
      o.phone, o.total, o.created_at,
      u.name  AS customer_name,
      u.email AS customer_email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
  `;
  return rows as AdminOrder[];
}

export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<{ success: boolean }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return { success: false };

  await sql`
    UPDATE orders SET status = ${status}, updated_at = NOW()
    WHERE id = ${orderId}
  `;
  broadcast(orderId, status);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  return { success: true };
}

export async function getAdminStats() {
  const [ordersToday, activeProducts, revenueToday] = await Promise.all([
    sql`SELECT COUNT(*) AS count FROM orders WHERE created_at::date = CURRENT_DATE`,
    sql`SELECT COUNT(*) AS count FROM products WHERE available = TRUE`,
    sql`SELECT COALESCE(SUM(total), 0) AS total FROM orders
        WHERE created_at::date = CURRENT_DATE AND status != 'CANCELLED'`,
  ]);
  return {
    ordersToday: Number(ordersToday[0].count),
    activeProducts: Number(activeProducts[0].count),
    revenueToday: parseFloat(revenueToday[0].total as string),
  };
}

// ─── Products ─────────────────────────────────────────────────────────────────

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const rows = await sql`
    SELECT
      p.id, p.category_id, p.name, p.slug, p.description,
      p.price, p.image_url, p.available, p.sort_order,
      c.name AS category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ORDER BY c.sort_order ASC, p.sort_order ASC, p.name ASC
  `;
  return rows as AdminProduct[];
}

export async function createProduct(
  data: ProductFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    const slug = slugify(data.name);
    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) return { success: false, error: "Precio inválido." };

    await sql`
      INSERT INTO products (category_id, name, slug, description, price, image_url, available)
      VALUES (
        ${parseInt(data.category_id)},
        ${data.name.trim()},
        ${slug},
        ${data.description.trim() || null},
        ${price},
        ${data.image_url.trim() || null},
        ${data.available}
      )
    `;

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    // Slug duplicado
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { success: false, error: "Ya existe un producto con ese nombre." };
    }
    return { success: false, error: "No se pudo guardar el producto." };
  }
}

export async function toggleProductAvailability(
  productId: number,
  current: boolean
): Promise<{ success: boolean }> {
  try {
    await assertAdmin();
    await sql`
      UPDATE products SET available = ${!current}, updated_at = NOW()
      WHERE id = ${productId}
    `;
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deleteProduct(
  productId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    // Verificar que no tenga order_items asociados
    const refs = await sql`
      SELECT COUNT(*) AS count FROM order_items WHERE product_id = ${productId}
    `;
    if (Number(refs[0].count) > 0) {
      return {
        success: false,
        error: "No se puede eliminar: el producto tiene pedidos asociados. Pausalo en su lugar.",
      };
    }

    await sql`DELETE FROM products WHERE id = ${productId}`;
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar el producto." };
  }
}

export async function updateProduct(
  productId: number,
  data: ProductFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) return { success: false, error: "Precio inválido." };

    await sql`
      UPDATE products SET
        category_id  = ${parseInt(data.category_id)},
        name         = ${data.name.trim()},
        description  = ${data.description.trim() || null},
        price        = ${price},
        image_url    = ${data.image_url.trim() || null},
        available    = ${data.available},
        updated_at   = NOW()
      WHERE id = ${productId}
    `;

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo actualizar el producto." };
  }
}

export async function getAdminCategories(): Promise<Category[]> {
  const rows = await sql`SELECT id, name, slug, image_url, sort_order FROM categories ORDER BY sort_order ASC`;
  return rows as Category[];
}
