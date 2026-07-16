"use client";

import { useRef } from "react";
import type { Product } from "@/types/menu";
import ProductCard from "./ProductCard";

type Props = {
  products: Product[];
  onOpen: (product: Product) => void;
};

export default function ImperdiblesCarousel({ products, onOpen }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800 px-4 mb-3">🔥 Imperdibles</h2>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((product) => (
          <div key={product.id} className="snap-start shrink-0 w-44">
            <ProductCard product={product} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </div>
  );
}
