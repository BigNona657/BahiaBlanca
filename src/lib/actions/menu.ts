"use server";

import { unstable_cache } from "next/cache";
import { sql } from "@/lib/db/client";
import type { Category, Product } from "@/types/menu";

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const rows = await sql`
      SELECT id, name, slug, image_url, image_data, sort_order
      FROM categories
      ORDER BY sort_order ASC
    `;
    return rows as Category[];
  },
  ["categories"],
  { tags: ["menu", "categories"] }
);

export const getProductsByCategory = unstable_cache(
  async (categoryId?: number): Promise<Product[]> => {
    if (categoryId) {
      const rows = await sql`
        SELECT id, category_id, name, slug, description, price, image_url, image_data, available, sort_order, stock
        FROM products
        WHERE available = TRUE AND category_id = ${categoryId}
        ORDER BY sort_order ASC, name ASC
      `;
      return rows as Product[];
    }

    const rows = await sql`
      SELECT id, category_id, name, slug, description, price, image_url, image_data, available, sort_order, stock
      FROM products
      WHERE available = TRUE
      ORDER BY category_id ASC, sort_order ASC, name ASC
    `;
    return rows as Product[];
  },
  ["products"],
  { tags: ["menu", "products"] }
);
