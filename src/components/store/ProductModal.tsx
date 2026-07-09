"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/menu";

type Props = {
  product: Product | null;
  onClose: () => void;
  onAdd: (product: Product, quantity: number) => void;
  isAuthenticated: boolean;
};

export default function ProductModal({ product, onClose, onAdd, isAuthenticated }: Props) {
  const [qty, setQty] = useState(1);
  const router = useRouter();

  // Resetear cantidad al abrir un producto nuevo
  useEffect(() => {
    if (product) setQty(1);
  }, [product]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (product) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  const handleAdd = useCallback(() => {
    if (!product) return;
    if (!isAuthenticated) {
      onClose();
      router.push("/login?callbackUrl=%2F");
      return;
    }
    onAdd(product, qty);
    onClose();
  }, [product, qty, onAdd, onClose, isAuthenticated, router]);

  if (!product) return null;

  const price = parseFloat(product.price);
  const total = price * qty;
  const hasImage = !!(product.image_data || product.image_url);

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Imagen: 50dvh ── */}
        <div className="relative w-full shrink-0" style={{ height: "50dvh" }}>
          {hasImage ? (
            <Image
              src={product.image_data || product.image_url!}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 448px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-7xl">
              🍽️
            </div>
          )}

          {/* Botón cerrar sobre la imagen */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center text-lg leading-none hover:bg-black/60 transition"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* ── Contenido scrolleable ── */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Nombre + descripción */}
          <div className="px-5 pt-5 pb-4 flex-1">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h2>
            {product.description ? (
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{product.description}</p>
            ) : (
              <p className="mt-2 text-sm text-gray-400 italic">Sin descripción.</p>
            )}
          </div>

          {/* ── Barra inferior fija: cantidad + precio + botón ── */}
          <div className="px-5 py-4 border-t border-gray-100 bg-white">
            <div className="flex items-center justify-between gap-4">
              {/* Selector de cantidad */}
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

              {/* Botón agregar con precio total */}
              <button
                onClick={handleAdd}
                className="flex-1 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-2xl py-3 font-semibold text-sm flex items-center justify-between px-4 transition"
              >
                {isAuthenticated ? (
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
  );
}
