import Navbar from "@/components/store/Navbar";
import BottomNav from "@/components/store/BottomNav";
import { getAppSettings } from "@/lib/actions/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getAppSettings();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar businessName={settings.business_name} logoData={settings.logo_data} logoSize={settings.logo_size} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomNav />

      {/* Botón flotante de WhatsApp */}
      <a
        href="https://wa.me/542914648646"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-24 right-4 md:bottom-6 z-40 w-14 h-14 bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 rounded-full shadow-lg flex items-center justify-center transition-transform"
      >
        <svg viewBox="0 0 32 32" width="28" height="28" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.469 2.027 7.77L0 32l8.43-2.007A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.771-1.853l-.486-.29-5.004 1.192 1.234-4.868-.317-.5A13.267 13.267 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.862c-.398-.199-2.354-1.162-2.719-1.294-.365-.133-.631-.199-.897.199-.265.398-1.03 1.294-1.263 1.56-.232.265-.465.298-.863.1-.398-.2-1.681-.62-3.203-1.977-1.184-1.057-1.983-2.362-2.215-2.76-.232-.398-.025-.613.174-.811.179-.178.398-.465.597-.697.2-.232.266-.398.398-.664.133-.265.067-.497-.033-.697-.1-.199-.897-2.162-1.229-2.96-.324-.777-.653-.672-.897-.684l-.764-.013c-.265 0-.697.1-1.063.497-.365.398-1.394 1.362-1.394 3.322s1.427 3.854 1.626 4.12c.2.265 2.808 4.287 6.804 6.014.951.41 1.693.655 2.271.839.954.304 1.823.261 2.51.158.765-.114 2.354-.962 2.686-1.891.332-.93.332-1.727.232-1.892-.099-.164-.365-.264-.763-.463z"/>
        </svg>
      </a>
    </div>
  );
}
