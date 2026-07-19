import { getAppSettings, getIceCreamFlavors, getIceCreamPotes, getDailyMenus, getImperdibles } from "@/lib/actions/settings";
import { getProductsByCategory } from "@/lib/actions/menu";
import SettingsForm from "@/components/admin/SettingsForm";
import IceCreamFlavorsForm from "@/components/admin/IceCreamFlavorsForm";
import IceCreamPotesForm from "@/components/admin/IceCreamPotesForm";
import DailyMenuForm from "@/components/admin/DailyMenuForm";
import ImperdiblesForm from "@/components/admin/ImperdiblesForm";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const [settings, flavors, potes, dailyMenus, imperdibles, products] = await Promise.all([
    getAppSettings(),
    getIceCreamFlavors(),
    getIceCreamPotes(),
    getDailyMenus(),
    getImperdibles(),
    getProductsByCategory(),
  ]);

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Configuración</h1>
        <p className="text-xs text-gray-400 mt-0.5">Logo, nombre del negocio y helados</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <SettingsForm initial={settings} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-base font-bold text-gray-700 mb-1">Menú del día 🍽️</h2>
        <p className="text-xs text-gray-400 mb-4">Se muestra destacado en la parte superior del menú.</p>
        <DailyMenuForm initial={dailyMenus} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-base font-bold text-gray-700 mb-1">Imperdibles 🔥</h2>
        <p className="text-xs text-gray-400 mb-4">Seleccioná los productos que aparecen en el carrusel destacado.</p>
        <ImperdiblesForm products={products} initial={imperdibles} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-base font-bold text-gray-700 mb-1">Precios de potes 🍨</h2>
        <p className="text-xs text-gray-400 mb-4">Precio de cada tamaño de pote de helado.</p>
        <IceCreamPotesForm initial={potes} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-base font-bold text-gray-700 mb-1">Sabores de helado</h2>
        <p className="text-xs text-gray-400 mb-4">Estos son los sabores que verán los clientes al pedir helado.</p>
        <IceCreamFlavorsForm initial={flavors} />
      </div>
    </div>
  );
}
