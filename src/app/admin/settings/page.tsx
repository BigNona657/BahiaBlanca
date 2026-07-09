import { getAppSettings } from "@/lib/actions/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const settings = await getAppSettings();

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Configuración</h1>
        <p className="text-xs text-gray-400 mt-0.5">Logo y nombre del negocio</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}
