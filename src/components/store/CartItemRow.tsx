"use client";

import Image from "next/image";
import type { CartItem } from "@/context/CartContext";

type Props = {
  item: CartItem;
  onAdd: () => void;
  onDecrement: () => void;
  onRemove: () => void;
};

export default function CartItemRow({ item, onAdd, onDecrement, onRemove }: Props) {
  const { product, quantity } = item;
  const subtotal = parseFloat(product.price) * quantity;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Imagen */}
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
        {(product.image_data || product.image_url) ? (
          <Image
            src={product.image_data || product.image_url!}
            alt={product.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
        <p className="text-xs text-gray-400">
          ${parseFloat(product.price).toLocaleString("es-AR")} c/u
        </p>
        {item.note && (
          <p className="text-xs text-brand-500 mt-0.5 leading-snug">{item.note}</p>
        )}

        {/* Controles de cantidad */}
        <div className="flex items-center gap-2 mt-1.5">
          <button
            onClick={onDecrement}
            className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center text-lg leading-none hover:border-brand-400 hover:text-brand-500 transition"
          >
            −
          </button>
          <span className="text-sm font-bold w-5 text-center">{quantity}</span>
          <button
            onClick={onAdd}
            disabled={product.stock !== undefined && quantity >= product.stock}
            className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-lg leading-none hover:bg-brand-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Subtotal + eliminar */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-sm font-bold text-gray-800">
          ${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
        </span>
        <button
          onClick={onRemove}
          className="text-xs text-red-400 hover:text-red-600 transition"
        >
          Quitar
        </button>
      </div>
    </div>
  );
}
