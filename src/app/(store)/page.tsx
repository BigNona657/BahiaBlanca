import { getCategories, getProductsByCategory } from "@/lib/actions/menu";
import { getIceCreamFlavors, getIceCreamPotes, getDailyMenu } from "@/lib/actions/settings";
import MenuClient from "@/components/store/MenuClient";
import DailyMenuCard from "@/components/store/DailyMenuCard";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, products, iceCreamFlavors, iceCreamPotes, dailyMenu] = await Promise.all([
    getCategories(),
    getProductsByCategory(),
    getIceCreamFlavors(),
    getIceCreamPotes(),
    getDailyMenu(),
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

      {/* Menú del día */}
      {dailyMenu?.active && <DailyMenuCard menu={dailyMenu} />}

      <MenuClient categories={categories} products={products} iceCreamFlavors={iceCreamFlavors} iceCreamPotes={iceCreamPotes} />
    </div>
  );
}
