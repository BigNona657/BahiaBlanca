"use client";

import Image from "next/image";
import type { Category } from "@/types/menu";

type Props = {
  category: Category;
  onSelect: (id: number) => void;
};

export default function CategoryCard({ category, onSelect }: Props) {
  return (
    <div
      onClick={() => onSelect(category.id)}
      className="relative rounded-2xl overflow-hidden aspect-square bg-gray-100 cursor-pointer active:scale-95 transition-transform shadow-sm"
    >
      {category.image_url ? (
        <Image
          src={category.image_url}
          alt={category.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
      )}
      {/* Gradiente + nombre */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <p className="absolute bottom-3 left-3 right-3 text-white font-bold text-base leading-tight drop-shadow">
        {category.name}
      </p>
    </div>
  );
}
