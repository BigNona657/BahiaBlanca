"use client";

import { useRef } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { ImperdibleItem } from "@/lib/actions/settings";

type Props = {
  items: ImperdibleItem[];
};

export default function ImperdiblesCarousel({ items }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  if (items.length === 0) return null;

  function handleAdd(item: ImperdibleItem) {
    if (!session) {
      router.push("/login?callbackUrl=%2F");
      return;
    }
    addToCart({
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
    });
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800 px-4 mb-3">🔥 Imperdibles</h2>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, i) => (
          <div key={i} className="snap-start shrink-0 w-44 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="relative w-full aspect-square bg-gray-100">
              {item.image_data ? (
                <Image src={item.image_data} alt={item.title} fill sizes="176px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
              )}
            </div>
            <div className="p-3 flex flex-col flex-1 gap-1">
              <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{item.title}</h3>
              {item.description && (
                <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
              )}
              <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                <span className="text-lg font-bold text-brand-600">
                  ${item.price.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </span>
                <button
                  onClick={() => handleAdd(item)}
                  className="bg-brand-500 text-white rounded-xl px-3 py-1.5 text-sm font-semibold active:scale-95 transition-transform"
                >
                  + Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
