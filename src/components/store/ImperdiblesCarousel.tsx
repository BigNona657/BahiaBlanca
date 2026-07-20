"use client";

import { useState } from "react";
import Image from "next/image";
import type { ImperdibleItem } from "@/lib/actions/settings";
import type { Product } from "@/types/menu";

type Props = {
  items: ImperdibleItem[];
  onOpen: (product: Product) => void;
};

export default function ImperdiblesCarousel({ items, onOpen }: Props) {
  const stocks = items.map((item) => item.stock);

  function toProduct(item: ImperdibleItem): Product {
    return {
      id: -(Math.abs(item.title.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) + 1000),
      category_id: 0,
      name: item.title,
      slug: item.title.toLowerCase().replace(/\s+/g, "-"),
      description: item.description,
      price: String(item.price),
      image_url: null,
      image_data: item.image_data || null,
      available: true,
      sort_order: 0,
      stock: item.stock,
    };
  }

  if (items.length === 0) return null;

  function handleOpen(item: ImperdibleItem, i: number) {
    const stock = stocks[i];
    if (stock !== undefined && stock <= 0) return;
    onOpen(toProduct(item));
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800 px-4 mb-3">🔥 Imperdibles</h2>
      <div
        className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, i) => {
          const stock = stocks[i];
          const agotado = stock !== undefined && stock <= 0;
          return (
            <div
              key={i}
              onClick={() => handleOpen(item, i)}
              className={`snap-start shrink-0 w-44 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col transition-transform cursor-pointer ${agotado ? "opacity-80" : "active:scale-95"}`}
            >
              <div className="relative w-full aspect-square bg-gray-100">
                {item.image_data ? (
                  <Image src={item.image_data} alt={item.title} fill sizes="176px" className="object-cover" priority={i < 2} loading={i < 2 ? undefined : "lazy"} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                )}
                {agotado && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-500/90 text-white text-xs font-bold px-4 py-1.5 rotate-[-20deg] shadow-lg tracking-wide">
                      AGOTADO
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1 gap-1">
                <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{item.title}</h3>
                {item.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
                )}
                {stock !== undefined && (
                  <p className="text-[10px] text-gray-400">Stock: <span className={stock <= 0 ? "text-red-500 font-semibold" : "text-gray-600 font-semibold"}>{stock}</span></p>
                )}
                <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-brand-600">
                    ${item.price.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                  </span>
                  <span className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                    agotado ? "bg-gray-200 text-gray-400" : "bg-brand-500 text-white"
                  }`}>
                    {agotado ? "Agotado" : "+ Agregar"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
