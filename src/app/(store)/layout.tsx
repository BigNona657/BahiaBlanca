import Navbar from "@/components/store/Navbar";
import BottomNav from "@/components/store/BottomNav";
import { getAppSettings } from "@/lib/actions/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getAppSettings();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar businessName={settings.business_name} logoData={settings.logo_data} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
