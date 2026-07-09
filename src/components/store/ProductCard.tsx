"use client";

import Image from "next/image";
import type { Product } from "@/types/menu";

type Props = {
  product: Product;
  onOpen: (product: Product) => void;
};

export default function ProductCard({ product, onOpen }: Props) {
  const price = parseFloat(product.price);

  return (
    <div
      onClick={() => onOpen(product)}
      className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col active:scale-95 transition-transform cursor-pointer"
    >
      <div className="relative w-full aspect-square bg-gray-100">
        {(product.image_data || product.image_url) ? (
          <Image
            src={product.image_data || product.image_url!}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
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
          <span className="bg-brand-500 text-white rounded-xl px-3 py-1.5 text-sm font-semibold">
            + Agregar
          </span>
        </div>
      </div>
    </div>
  );
}
