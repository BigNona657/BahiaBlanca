import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 px-4 text-center gap-4">
      <span className="text-8xl">🍳</span>
      <h1 className="text-3xl font-bold text-gray-800">¡Ups! Página no encontrada</h1>
      <p className="text-gray-500 text-sm max-w-xs">
        Esta página no existe o fue movida. Pero la comida sigue estando buenísima.
      </p>
      <Link
        href="/"
        className="mt-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition"
      >
        Ver el menú
      </Link>
    </div>
  );
}
