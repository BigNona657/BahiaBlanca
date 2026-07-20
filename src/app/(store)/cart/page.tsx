import type { Metadata } from "next";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Tu carrito",
  description: "Revisá y confirmá tu pedido en BigNona.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartClient />;
}
