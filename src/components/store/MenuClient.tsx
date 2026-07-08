"use client";

import { useState, useMemo } from "react";
import type { Category, Product } from "@/types/menu";
import { useCart } from "@/context/CartContext";
import CategoryFilter from "./CategoryFilter";
import ProductCard from "./ProductCard";

type Props = {
  categories: Category[];
  products: Product[];
};

export default function MenuClient({ categories, products }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { addToCart } = useCart();

  const filtered = useMemo(
    () =>
      selectedCategory === null
        ? products
        : products.filter((p) => p.category_id === selectedCategory),
    [products, selectedCategory]
  );

  return (
    <div className="flex flex-col gap-4">
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-sm">No hay productos disponibles en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addToCart} />
          ))}
        </div>
      )}
    </div>
  );
}
