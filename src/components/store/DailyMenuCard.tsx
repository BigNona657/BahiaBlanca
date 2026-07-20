"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import type { DailyMenu } from "@/lib/actions/settings";

const DAILY_PRODUCT_ID = -1;

export default function DailyMenuCard({ menu }: { menu: DailyMenu }) {
  const [qty, setQty] = useState(1);
  const isAgotado = menu.stock !== undefined && menu.stock <= 0;
  const [modalOpen, setModalOpen] = useState(false);
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const total = menu.price * qty;

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setModalOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function buildProduct() {
    return {
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
      stock: menu.stock,
    };
  }

  function handleAdd() {
    if (!session) {
      router.push("/login?callbackUrl=%2F");
      return;
    }
    if (isAgotado) return;
    const product = buildProduct();
    for (let i = 0; i < qty; i++) addToCart(product);
    setQty(1);
  }

  function handleAddFromModal() {
    if (isAgotado) return;
    handleAdd();
    setModalOpen(false);
  }

  return (
    <>
      <div className="mx-4 mb-6 rounded-3xl overflow-hidden shadow-md bg-white border border-brand-100">
        {/* Imagen — clickeable para abrir modal */}
        {menu.image_data ? (
          <div
            className="relative w-full h-48 sm:h-56 cursor-zoom-in"
            onClick={() => setModalOpen(true)}
          >
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
            {/* Hint de zoom */}
            <span className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
              🔍 Ver foto
            </span>
            {/* Cinta agotado */}
            {isAgotado && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-red-500/90 text-white text-sm font-bold px-6 py-2 rotate-[-20deg] shadow-lg tracking-wide">
                  AGOTADO
                </div>
              </div>
            )}
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

          {menu.stock !== undefined && (
            <p className="text-xs text-gray-400 mt-1">Stock disponible: <span className={menu.stock <= 0 ? "text-red-500 font-semibold" : "text-gray-600 font-semibold"}>{menu.stock}</span></p>
          )}

          <div className="flex items-center gap-3 mt-4">
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

            <button
              onClick={handleAdd}
              disabled={isAgotado}
              className="flex-1 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-3 text-sm font-bold flex items-center justify-between px-4 transition"
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

      {/* ── Modal imagen expandida ── */}
      {modalOpen && menu.image_data && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
            style={{ maxHeight: "92dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen: 50dvh */}
            <div className="relative w-full shrink-0" style={{ height: "50dvh" }}>
              <Image
                src={menu.image_data}
                alt={menu.title}
                fill
                sizes="(max-width: 640px) 100vw, 448px"
                className="object-cover"
                priority
              />
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center text-lg leading-none hover:bg-black/60 transition"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex flex-col flex-1 overflow-y-auto">
              <div className="px-5 pt-5 pb-2 flex-1">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{menu.title}</h2>
                {menu.description ? (
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{menu.description}</p>
                ) : (
                  <p className="mt-2 text-sm text-gray-400 italic">Sin descripción.</p>
                )}
              </div>

              {/* Barra inferior */}
              <div className="px-5 py-4 border-t border-gray-100 bg-white">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-2 py-1">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-xl bg-white shadow-sm text-gray-700 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-semibold text-gray-800">{qty}</span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="w-8 h-8 rounded-xl bg-white shadow-sm text-gray-700 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddFromModal}
                    disabled={isAgotado}
                    className="flex-1 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-3 font-semibold text-sm flex items-center justify-between px-4 transition"
                  >
                    {session ? (
                      <>
                        <span>Agregar al carrito</span>
                        <span className="font-bold">
                          ${total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                        </span>
                      </>
                    ) : (
                      <span className="w-full text-center">Iniciá sesión para agregar</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
