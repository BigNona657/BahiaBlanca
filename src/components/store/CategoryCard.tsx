"use client";

import type { Category } from "@/types/menu";

type Props = {
  category: Category;
  onSelect: (id: number) => void;
};

export default function CategoryCard({ category, onSelect }: Props) {
  const src = category.image_data || category.image_url;

  return (
    <div
      onClick={() => onSelect(category.id)}
      className="relative rounded-2xl overflow-hidden aspect-square bg-gray-100 cursor-pointer active:scale-95 transition-transform shadow-sm"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <p className="absolute bottom-3 left-3 right-3 text-white font-bold text-base leading-tight drop-shadow">
        {category.name}
      </p>
    </div>
  );
}
