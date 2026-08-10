import type { Metadata } from "next";
import CartClient from "./CartClient";
import { getTartaFlavors } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu carrito",
  description: "Revisá y confirmá tu pedido en BigNona.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const tartaFlavors = await getTartaFlavors();
  return <CartClient tartaFlavors={tartaFlavors} />;
}
