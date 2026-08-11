"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Category, Product } from "@/types/menu";
import type { IceCreamFlavor, IceCreamPote, ImperdibleItem, PizzaFlavor, TartaFlavor, EmpanadasFlavor } from "@/lib/actions/settings";
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
  tartaFlavors: TartaFlavor[];
  empanadasFlavors: EmpanadasFlavor[];
};

export default function MenuClient({ categories, products, iceCreamFlavors, iceCreamPotes, imperdibles, pizzaFlavors, tartaFlavors, empanadasFlavors }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/menu/stream");
    esRef.current = es;
    es.onmessage = () => router.refresh();
    return () => es.close();
  }, [router]);

  // Sincronizar con el historial del navegador para que "atrás" funcione en móvil
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      setSelectedCategory(e.state?.categoryId ?? null);
      setActiveProduct(null);
    };
    const handleGoHome = () => {
      setSelectedCategory(null);
      setActiveProduct(null);
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("go-home", handleGoHome);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("go-home", handleGoHome);
    };
  }, []);

  function selectCategory(id: number | null) {
    if (id === null) { goBack(); return; }
    window.history.pushState({ categoryId: id }, "");
    setSelectedCategory(id);
  }

  function goBack() {
    window.history.back();
  }

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
            <CategoryCard key={cat.id} category={cat} onSelect={selectCategory} />
          ))}
        </div>
      )}

      {/* Vista: productos de la categoría seleccionada */}
      {selectedCategory !== null && (
        <>
          {/* Header con botón volver + filtro */}
          <div className="px-4 flex items-center gap-3">
            <button
              onClick={goBack}
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
            onSelect={selectCategory}
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
        tartaFlavors={tartaFlavors}
        empanadasFlavors={empanadasFlavors}
      />
    </div>
  );
}
