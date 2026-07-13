"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import type { DailyMenu } from "@/lib/actions/settings";

const DAILY_PRODUCT_ID = -1; // ID virtual para el menú del día

export default function DailyMenuCard({ menu }: { menu: DailyMenu }) {
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const total = menu.price * qty;

  function handleAdd() {
    if (!session) {
      router.push("/login?callbackUrl=%2F");
      return;
    }
    // Construimos un producto virtual con los datos del menú del día
    addToCart({
      id: DAILY_PRODUCT_ID,
      category_id: 0,
      name: `Menú del día: ${menu.title}`,
      slug: "menu-del-dia",
      description: menu.description,
      price: String(menu.price),
      image_url: null,
      image_data: menu.image_data || null,
      available: true,
      sort_order: 0,
    });
    // Agregar qty - 1 veces más (ya se agregó 1 arriba)
    for (let i = 1; i < qty; i++) {
      addToCart({
        id: DAILY_PRODUCT_ID,
        category_id: 0,
        name: `Menú del día: ${menu.title}`,
        slug: "menu-del-dia",
        description: menu.description,
        price: String(menu.price),
        image_url: null,
        image_data: menu.image_data || null,
        available: true,
        sort_order: 0,
      });
    }
    setQty(1);
  }

  return (
    <div className="mx-4 mb-6 rounded-3xl overflow-hidden shadow-md bg-white border border-brand-100">
      {/* Imagen */}
      {menu.image_data ? (
        <div className="relative w-full h-48 sm:h-56">
          <Image
            src={menu.image_data}
            alt={menu.title}
            fill
            sizes="(max-width: 1024px) 100vw, 960px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <span className="absolute top-3 left-3 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            🍽️ Menú del día
          </span>
        </div>
      ) : (
        <div className="w-full h-32 bg-brand-50 flex items-center justify-center">
          <span className="text-5xl">🍽️</span>
        </div>
      )}

      {/* Contenido */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 leading-tight">{menu.title}</h2>
        {menu.description && (
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{menu.description}</p>
        )}

        {/* Precio + cantidad + botón */}
        <div className="flex items-center gap-3 mt-4">
          {/* Selector cantidad */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-2 py-1 shrink-0">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-xl bg-white shadow-sm text-gray-700 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
            >
              −
            </button>
            <span className="w-5 text-center font-semibold text-gray-800 text-sm">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-8 h-8 rounded-xl bg-white shadow-sm text-gray-700 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
            >
              +
            </button>
          </div>

          {/* Botón agregar */}
          <button
            onClick={handleAdd}
            className="flex-1 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-2xl py-3 text-sm font-bold flex items-center justify-between px-4 transition"
          >
            {session ? (
              <>
                <span>Agregar al carrito</span>
                <span>${total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}</span>
              </>
            ) : (
              <span className="w-full text-center">Iniciá sesión para agregar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
