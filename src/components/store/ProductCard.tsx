"use client";

import type { Product } from "@/types/menu";

type Props = {
  product: Product;
  onOpen: (product: Product) => void;
  priority?: boolean;
};

export default function ProductCard({ product, onOpen, priority = false }: Props) {
  const price = parseFloat(product.price);
  const isOutOfStock = product.stock !== undefined && product.stock !== null && product.stock <= 0;

  return (
    <div
      onClick={() => !isOutOfStock && onOpen(product)}
      className={`bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col transition-transform ${
        isOutOfStock ? "opacity-60 cursor-not-allowed" : "active:scale-95 cursor-pointer"
      }`}
    >
      <div className="relative w-full aspect-square bg-gray-100">
        {(product.image_url || true) ? (
          // Siempre mostrar imagen: base64 inline (si existe), URL externa, o API route
          // image_data ya no viene en el listado — se carga solo en el modal
          <img
            src={product.image_url || `/api/image/product/${product.id}`}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🍽️
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1 gap-1">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-400 line-clamp-2">{product.description}</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-brand-600">
            ${price.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
          </span>
          {isOutOfStock ? (
            <span className="bg-gray-300 text-gray-500 rounded-xl px-3 py-1.5 text-sm font-semibold">
              Agotado
            </span>
          ) : (
            <span className="bg-brand-500 text-white rounded-xl px-3 py-1.5 text-sm font-semibold">
              + Agregar
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
