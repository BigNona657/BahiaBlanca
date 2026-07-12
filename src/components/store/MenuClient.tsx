"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { Category, Product } from "@/types/menu";
import { useCart } from "@/context/CartContext";
import CategoryFilter from "./CategoryFilter";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";

type Props = {
  categories: Category[];
  products: Product[];
};

export default function MenuClient({ categories, products }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();
  const { data: session } = useSession();

  const filtered = useMemo(
    () =>
      selectedCategory === null
        ? products
        : products.filter((p) => p.category_id === selectedCategory),
    [products, selectedCategory]
  );

  const handleAddWithQty = useCallback(
    (product: Product, quantity: number, note?: string) => {
      for (let i = 0; i < quantity; i++) addToCart(product, note);
    },
    [addToCart]
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
            <ProductCard key={product.id} product={product} onOpen={setActiveProduct} />
          ))}
        </div>
      )}

      <ProductModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        onAdd={handleAddWithQty}
        isAuthenticated={!!session}
      />
    </div>
  );
}
