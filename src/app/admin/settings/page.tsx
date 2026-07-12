import { getAppSettings, getIceCreamFlavors, getIceCreamPotes } from "@/lib/actions/settings";
import SettingsForm from "@/components/admin/SettingsForm";
import IceCreamFlavorsForm from "@/components/admin/IceCreamFlavorsForm";
import IceCreamPotesForm from "@/components/admin/IceCreamPotesForm";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const [settings, flavors, potes] = await Promise.all([
    getAppSettings(),
    getIceCreamFlavors(),
    getIceCreamPotes(),
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
