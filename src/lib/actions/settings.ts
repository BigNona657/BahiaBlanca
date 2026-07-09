"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db/client";

export type AppSettings = {
  business_name: string;
  logo_data: string;
  logo_size: number;
};

export async function getAppSettings(): Promise<AppSettings> {
  const rows = await sql`SELECT key, value FROM app_settings`;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    business_name: (map.business_name as string) ?? "BigNona",
    logo_data: (map.logo_data as string) ?? "",
    logo_size: Number(map.logo_size ?? 36),
  };
}

export async function saveAppSettings(
  data: Partial<AppSettings>
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado." };

  try {
    for (const [key, value] of Object.entries(data)) {
      await sql`
        INSERT INTO app_settings (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = ${value}
      `;
    }
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar la configuración." };
  }
}

// ─── Categories CRUD ──────────────────────────────────────────────────────────

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
}

export async function createCategory(
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
    const slug = name.toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    await sql`
      INSERT INTO categories (name, slug, sort_order)
      VALUES (${name.trim()}, ${slug}, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))
    `;
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate"))
      return { success: false, error: "Ya existe una categoría con ese nombre." };
    return { success: false, error: "No se pudo crear la categoría." };
  }
}

export async function updateCategory(
  id: number,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
    const slug = name.toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    await sql`UPDATE categories SET name = ${name.trim()}, slug = ${slug} WHERE id = ${id}`;
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo actualizar la categoría." };
  }
}

export async function deleteCategory(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
    const refs = await sql`SELECT COUNT(*) AS count FROM products WHERE category_id = ${id}`;
    if (Number(refs[0].count) > 0)
      return { success: false, error: "Tiene productos asociados. Eliminá o reasigná los productos primero." };

    await sql`DELETE FROM categories WHERE id = ${id}`;
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar la categoría." };
  }
}
