import { getCategories, getProductsByCategory } from "@/lib/actions/menu";
import MenuClient from "@/components/store/MenuClient";

export const revalidate = 60; // ISR: revalida cada 60 segundos

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProductsByCategory(),
  ]);

  return (
    <div className="max-w-5xl mx-auto py-4">
      {/* Hero */}
      <div className="px-4 mb-5">
        <h1 className="text-2xl font-bold text-gray-800">
          ¿Qué querés comer hoy? 🍽️
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Pedidos con entrega a domicilio
        </p>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-xl px-3 py-1.5">
            🚲 Envíos a domicilio
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-xl px-3 py-1.5">
            🛄 Take away • Fatone 657
          </span>
        </div>
      </div>

      {/* Menú interactivo */}
      <MenuClient categories={categories} products={products} />
    </div>
  );
}
