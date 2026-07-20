import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Ingresá a BigNona para hacer tu pedido de comida casera a domicilio.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginClient />;
}
