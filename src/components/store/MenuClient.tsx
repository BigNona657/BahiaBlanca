"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { Category, Product } from "@/types/menu";
import type { IceCreamFlavor, IceCreamPote, ImperdibleItem, PizzaFlavor } from "@/lib/actions/settings";
import { useCart } from "@/context/CartContext";
import CategoryFilter from "./CategoryFilter";
import CategoryCard from "./CategoryCard";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import ImperdiblesCarousel from "./ImperdiblesCarousel";

type Props = {
  categories: Category[];
  products: Product[];
  iceCreamFlavors: IceCreamFlavor[];
  iceCreamPotes: IceCreamPote[];
  imperdibles: ImperdibleItem[];
  pizzaFlavors: PizzaFlavor[];
};

export default function MenuClient({ categories, products, iceCreamFlavors, iceCreamPotes, imperdibles, pizzaFlavors }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();
  const { data: session } = useSession();

  const selectedCategoryData = useMemo(
    () => categories.find((c) => c.id === selectedCategory) ?? null,
    [categories, selectedCategory]
  );

  const filtered = useMemo(
    () =>
      selectedCategory === null
        ? []
        : products.filter((p) => p.category_id === selectedCategory),
    [products, selectedCategory]
  );

  const handleAddWithQty = useCallback(
    (product: Product, quantity: number, note?: string, unitPrice?: number) => {
      for (let i = 0; i < quantity; i++) addToCart(product, note, unitPrice);
    },
    [addToCart]
  );

  return (
    <div className="flex flex-col gap-4">
      {imperdibles.length > 0 && selectedCategory === null && (
        <ImperdiblesCarousel items={imperdibles} onOpen={setActiveProduct} />
      )}

      {/* Vista: portadas de categorías */}
      {selectedCategory === null && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} onSelect={setSelectedCategory} />
          ))}
        </div>
      )}

      {/* Vista: productos de la categoría seleccionada */}
      {selectedCategory !== null && (
        <>
          {/* Header con botón volver + filtro */}
          <div className="px-4 flex items-center gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 transition"
            >
              <span className="text-lg leading-none">←</span>
              <span>Volver</span>
            </button>
            <h2 className="text-base font-bold text-gray-800">{selectedCategoryData?.name}</h2>
          </div>

          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={(id) => setSelectedCategory(id)}
          />

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="text-sm">No hay productos disponibles en esta categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} onOpen={setActiveProduct} priority={i < 4} />
              ))}
            </div>
          )}
        </>
      )}

      <ProductModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        onAdd={handleAddWithQty}
        isAuthenticated={!!session}
        iceCreamFlavors={iceCreamFlavors}
        iceCreamPotes={iceCreamPotes}
        pizzaFlavors={pizzaFlavors}
      />
    </div>
  );
}
