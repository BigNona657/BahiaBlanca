"use server";

import { revalidatePath, revalidateTag } from "next/cache";
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

export type PizzaFlavor = {
  name: string;
  available: boolean;
  price: number;
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
  stock?: number;
};

// Legacy — se mantiene para compatibilidad con DailyMenuCard
export type DailyMenu = DailyMenuItem & { day?: number };

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

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

// Trae todos los settings de una sola query — usar en la página principal
export async function getAllSettings(): Promise<{
  appSettings: AppSettings;
  iceCreamFlavors: IceCreamFlavor[];
  iceCreamPotes: IceCreamPote[];
  pizzaFlavors: PizzaFlavor[];
  tartaFlavors: TartaFlavor[];
  empanadasFlavors: EmpanadasFlavor[];
  milanesaSettings: MilanesaSettings;
  imperdibles: ImperdibleItem[];
  dailyMenu: DailyMenu | null;
}> {
  const rows = await sql`SELECT key, value FROM app_settings`;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value as string]));

  const appSettings: AppSettings = {
    business_name: map.business_name ?? "BigNona",
    logo_data: map.logo_data ?? "",
    logo_size: Number(map.logo_size ?? 36),
  };

  let iceCreamFlavors: IceCreamFlavor[] = DEFAULT_FLAVORS;
  try {
    if (map.ice_cream_flavors) {
      const parsed = JSON.parse(map.ice_cream_flavors);
      if (Array.isArray(parsed) && typeof parsed[0] === "string") {
        iceCreamFlavors = (parsed as string[]).map((name) => ({ name, available: true }));
      } else {
        iceCreamFlavors = parsed;
      }
    }
  } catch {}

  let iceCreamPotes: IceCreamPote[] = DEFAULT_POTES;
  try { if (map.ice_cream_potes) iceCreamPotes = JSON.parse(map.ice_cream_potes); } catch {}

  let pizzaFlavors: PizzaFlavor[] = [];
  try { if (map.pizza_flavors) pizzaFlavors = JSON.parse(map.pizza_flavors); } catch {}

  let tartaFlavors: TartaFlavor[] = DEFAULT_TARTA_FLAVORS;
  try { if (map.tarta_flavors) tartaFlavors = JSON.parse(map.tarta_flavors); } catch {}

  let empanadasFlavors: EmpanadasFlavor[] = DEFAULT_EMPANADAS_FLAVORS;
  try { if (map.empanadas_flavors) empanadasFlavors = JSON.parse(map.empanadas_flavors); } catch {}

  let milanesaSettings: MilanesaSettings = DEFAULT_MILANESA_SETTINGS;
  try { if (map.milanesa_settings) milanesaSettings = JSON.parse(map.milanesa_settings); } catch {}

  let imperdibles: ImperdibleItem[] = [];
  try {
    if (map.imperdibles) {
      const parsed = JSON.parse(map.imperdibles);
      if (Array.isArray(parsed) && (parsed.length === 0 || typeof parsed[0] !== "number")) {
        // Excluir image_data — se carga bajo demanda via /api/image/setting/imperdibles_idx_N
        imperdibles = parsed.map((item: ImperdibleItem, _i: number) => ({ ...item, image_data: "" }));
      }
    }
  } catch {}

  let dailyMenu: DailyMenu | null = null;
  try {
    const menusRaw = map.daily_menus ?? map.daily_menu;
    if (menusRaw) {
      const parsed = JSON.parse(menusRaw);
      const today = getTodayArgentina();
      const menu = Array.isArray(parsed) && parsed[today] ? parsed[today] : parsed;
      // Excluir image_data — se carga bajo demanda via /api/image/setting/daily_menus_idx_N
      if (menu?.active && menu?.title) dailyMenu = { ...menu, image_data: "", day: today };
    }
  } catch {}

  return { appSettings, iceCreamFlavors, iceCreamPotes, pizzaFlavors, tartaFlavors, empanadasFlavors, milanesaSettings, imperdibles, dailyMenu };
}

export type TartaFlavor = {
  name: string;
  available: boolean;
};

const DEFAULT_TARTA_FLAVORS: TartaFlavor[] = [
  { name: "Carne", available: true },
  { name: "Verdura", available: true },
];

export type MilanesaOption = { name: string; available: boolean; price?: number };

export type MilanesaSettings = {
  tipos: MilanesaOption[];
  variantes: MilanesaOption[];
  guarniciones: MilanesaOption[];
};

const DEFAULT_MILANESA_SETTINGS: MilanesaSettings = {
  tipos: [
    { name: "De pollo", available: true },
    { name: "De carne", available: true },
  ],
  variantes: [
    { name: "Simple", available: true },
    { name: "Simple con queso", available: true },
    { name: "Napolitana", available: true },
    { name: "A caballo", available: true },
  ],
  guarniciones: [
    { name: "Papas fritas", available: true },
    { name: "Puré de papas", available: true },
    { name: "Puré mixto", available: true },
    { name: "Ensalada", available: true },
    { name: "Sola", available: true },
  ],
};

export async function getMilanesaSettings(): Promise<MilanesaSettings> {
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'milanesa_settings' LIMIT 1`;
  if (!rows.length) return DEFAULT_MILANESA_SETTINGS;
  try { return JSON.parse(rows[0].value as string) as MilanesaSettings; } catch { return DEFAULT_MILANESA_SETTINGS; }
}

export async function saveMilanesaSettings(
  data: MilanesaSettings
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado." };
  try {
    const value = JSON.stringify(data);
    await sql`
      INSERT INTO app_settings (key, value) VALUES ('milanesa_settings', ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}
    `;
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar la configuración." };
  }
}

export type EmpanadasFlavor = {
  name: string;
  available: boolean;
};

const DEFAULT_EMPANADAS_FLAVORS: EmpanadasFlavor[] = [
  { name: "Carne", available: true },
  { name: "Jamón y queso", available: true },
  { name: "Pollo", available: true },
  { name: "Humita", available: true },
  { name: "Verdura", available: true },
  { name: "Cebolla y queso", available: true },
  { name: "Cantimpalo y queso", available: true },
  { name: "Salame y queso", available: true },
];

export async function getEmpanadasFlavors(): Promise<EmpanadasFlavor[]> {
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'empanadas_flavors' LIMIT 1`;
  if (!rows.length) return DEFAULT_EMPANADAS_FLAVORS;
  try { return JSON.parse(rows[0].value as string) as EmpanadasFlavor[]; } catch { return DEFAULT_EMPANADAS_FLAVORS; }
}

export async function saveEmpanadasFlavors(
  flavors: EmpanadasFlavor[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado." };
  try {
    const value = JSON.stringify(flavors);
    await sql`
      INSERT INTO app_settings (key, value) VALUES ('empanadas_flavors', ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}
    `;
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar los sabores." };
  }
}

export async function getTartaFlavors(): Promise<TartaFlavor[]> {
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'tarta_flavors' LIMIT 1`;
  if (!rows.length) return DEFAULT_TARTA_FLAVORS;
  try { return JSON.parse(rows[0].value as string) as TartaFlavor[]; } catch { return DEFAULT_TARTA_FLAVORS; }
}

export async function saveTartaFlavors(
  flavors: TartaFlavor[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado." };
  try {
    const value = JSON.stringify(flavors);
    await sql`
      INSERT INTO app_settings (key, value) VALUES ('tarta_flavors', ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}
    `;
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar los sabores." };
  }
}

export async function getPizzaFlavors(): Promise<PizzaFlavor[]> {
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'pizza_flavors' LIMIT 1`;
  if (!rows.length) return [];
  try {
    return JSON.parse(rows[0].value as string) as PizzaFlavor[];
  } catch {
    return [];
  }
}

export async function savePizzaFlavors(
  flavors: PizzaFlavor[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado." };
  try {
    const value = JSON.stringify(flavors);
    await sql`
      INSERT INTO app_settings (key, value) VALUES ('pizza_flavors', ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}
    `;
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar los sabores." };
  }
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

function getTodayArgentina(): number {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  ).getDay();
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
      const today = getTodayArgentina();
      menus[today] = { title: parsed.title, description: parsed.description, price: parsed.price, image_data: parsed.image_data, active: parsed.active };
      return menus;
    } catch {}
  }
  return Array.from({ length: 7 }, () => ({ ...EMPTY_MENU_ITEM }));
}

export async function getDailyMenu(): Promise<DailyMenu | null> {
  const menus = await getDailyMenus();
  const today = getTodayArgentina();
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
  const today = getTodayArgentina();
  menus[today] = { title: menu.title, description: menu.description, price: menu.price, image_data: menu.image_data, active: menu.active };
  return saveDailyMenus(menus);
}

export type ImperdibleItem = {
  title: string;
  description: string;
  price: number;
  image_data: string;
  stock?: number;
};

export async function getImperdibles(): Promise<ImperdibleItem[]> {
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'imperdibles' LIMIT 1`;
  if (!rows.length) return [];
  try {
    const parsed = JSON.parse(rows[0].value as string);
    // Migrar formato viejo (array de IDs numéricos)
    if (Array.isArray(parsed) && (parsed.length === 0 || typeof parsed[0] === "number")) return [];
    return parsed as ImperdibleItem[];
  } catch {
    return [];
  }
}

export async function decrementDailyMenuStock(
  dayIndex: number
): Promise<void> {
  const menus = await getDailyMenus();
  const menu = menus[dayIndex];
  if (!menu || menu.stock === undefined || menu.stock <= 0) return;
  menus[dayIndex] = { ...menu, stock: menu.stock - 1 };
  const value = JSON.stringify(menus);
  await sql`
    INSERT INTO app_settings (key, value) VALUES ('daily_menus', ${value})
    ON CONFLICT (key) DO UPDATE SET value = ${value}
  `;
  revalidatePath("/");
}

export async function decrementImperdibleStock(
  index: number
): Promise<void> {
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'imperdibles' LIMIT 1`;
  if (!rows.length) return;
  const items: ImperdibleItem[] = JSON.parse(rows[0].value as string);
  const item = items[index];
  if (!item || item.stock === undefined || item.stock <= 0) return;
  items[index] = { ...item, stock: item.stock - 1 };
  const value = JSON.stringify(items);
  await sql`
    INSERT INTO app_settings (key, value) VALUES ('imperdibles', ${value})
    ON CONFLICT (key) DO UPDATE SET value = ${value}
  `;
  revalidatePath("/");
}

export async function saveImperdibles(
  items: ImperdibleItem[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado." };
  try {
    const value = JSON.stringify(items);
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
    revalidateTag("app-settings");
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

export async function updateCategoryImage(
  id: number,
  imageData: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
    await sql`UPDATE categories SET image_data = ${imageData} WHERE id = ${id}`;
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar la imagen." };
  }
}
