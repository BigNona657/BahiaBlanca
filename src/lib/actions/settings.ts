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

export type IceCreamFlavor = {
  name: string;
  available: boolean;
};

export type IceCreamPote = {
  label: string;
  value: string;
  price: number;
};

export type DailyMenuItem = {
  title: string;
  description: string;
  price: number;
  image_data: string;
  active: boolean;
};

// Legacy — se mantiene para compatibilidad con DailyMenuCard
export type DailyMenu = DailyMenuItem & { day?: number };

export const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const EMPTY_MENU_ITEM: DailyMenuItem = { title: "", description: "", price: 0, image_data: "", active: false };

const DEFAULT_POTES: IceCreamPote[] = [
  { label: "Pote 1 kg",  value: "1kg",   price: 0 },
  { label: "Pote ½ kg", value: "1/2kg", price: 0 },
  { label: "Pote ¼ kg", value: "1/4kg", price: 0 },
];

const DEFAULT_FLAVORS: IceCreamFlavor[] = [
  { name: "Dulce de leche", available: true },
  { name: "Chocolate", available: true },
  { name: "Vainilla", available: true },
  { name: "Frutilla", available: true },
  { name: "Limón", available: true },
  { name: "Crema del cielo", available: true },
  { name: "Tramontana", available: true },
  { name: "Maracuyá", available: true },
  { name: "Menta granizada", available: true },
  { name: "Banana split", available: true },
  { name: "Mousse de chocolate", available: true },
  { name: "Sambayón", available: true },
];

export async function getAppSettings(): Promise<AppSettings> {
  const rows = await sql`SELECT key, value FROM app_settings`;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    business_name: (map.business_name as string) ?? "BigNona",
    logo_data: (map.logo_data as string) ?? "",
    logo_size: Number(map.logo_size ?? 36),
  };
}

export async function getIceCreamFlavors(): Promise<IceCreamFlavor[]> {
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'ice_cream_flavors' LIMIT 1`;
  if (!rows.length) return DEFAULT_FLAVORS;
  try {
    const parsed = JSON.parse(rows[0].value as string);
    // Migrar formato viejo (string[]) al nuevo
    if (Array.isArray(parsed) && typeof parsed[0] === "string") {
      return (parsed as string[]).map((name) => ({ name, available: true }));
    }
    return parsed as IceCreamFlavor[];
  } catch {
    return DEFAULT_FLAVORS;
  }
}

export async function saveIceCreamFlavors(
  flavors: IceCreamFlavor[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado." };
  try {
    const value = JSON.stringify(flavors);
    await sql`
      INSERT INTO app_settings (key, value) VALUES ('ice_cream_flavors', ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}
    `;
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar los sabores." };
  }
}

export async function getIceCreamPotes(): Promise<IceCreamPote[]> {
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'ice_cream_potes' LIMIT 1`;
  if (!rows.length) return DEFAULT_POTES;
  try {
    return JSON.parse(rows[0].value as string) as IceCreamPote[];
  } catch {
    return DEFAULT_POTES;
  }
}

export async function saveIceCreamPotes(
  potes: IceCreamPote[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado." };
  try {
    const value = JSON.stringify(potes);
    await sql`
      INSERT INTO app_settings (key, value) VALUES ('ice_cream_potes', ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}
    `;
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar los precios." };
  }
}

export async function getDailyMenus(): Promise<DailyMenuItem[]> {
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'daily_menus' LIMIT 1`;
  if (rows.length) {
    try {
      return JSON.parse(rows[0].value as string) as DailyMenuItem[];
    } catch {}
  }
  // Migrar formato viejo si existe
  const old = await sql`SELECT value FROM app_settings WHERE key = 'daily_menu' LIMIT 1`;
  if (old.length) {
    try {
      const parsed = JSON.parse(old[0].value as string) as DailyMenu;
      const menus = Array.from({ length: 7 }, () => ({ ...EMPTY_MENU_ITEM }));
      const today = new Date().getDay();
      menus[today] = { title: parsed.title, description: parsed.description, price: parsed.price, image_data: parsed.image_data, active: parsed.active };
      return menus;
    } catch {}
  }
  return Array.from({ length: 7 }, () => ({ ...EMPTY_MENU_ITEM }));
}

export async function getDailyMenu(): Promise<DailyMenu | null> {
  const menus = await getDailyMenus();
  const today = new Date().getDay();
  const menu = menus[today];
  if (!menu || !menu.active || !menu.title) return null;
  return { ...menu, day: today };
}

export async function saveDailyMenus(
  menus: DailyMenuItem[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado." };
  try {
    const value = JSON.stringify(menus);
    await sql`
      INSERT INTO app_settings (key, value) VALUES ('daily_menus', ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}
    `;
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar los menús." };
  }
}

/** @deprecated usar getDailyMenus / saveDailyMenus */
export async function saveDailyMenu(
  menu: DailyMenu
): Promise<{ success: boolean; error?: string }> {
  const menus = await getDailyMenus();
  const today = new Date().getDay();
  menus[today] = { title: menu.title, description: menu.description, price: menu.price, image_data: menu.image_data, active: menu.active };
  return saveDailyMenus(menus);
}

export async function getImperdibles(): Promise<number[]> {
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'imperdibles' LIMIT 1`;
  if (!rows.length) return [];
  try {
    return JSON.parse(rows[0].value as string) as number[];
  } catch {
    return [];
  }
}

export async function saveImperdibles(
  ids: number[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado." };
  try {
    const value = JSON.stringify(ids);
    await sql`
      INSERT INTO app_settings (key, value) VALUES ('imperdibles', ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}
    `;
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar los imperdibles." };
  }
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
