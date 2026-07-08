"use client";

import type { Category } from "@/types/menu";

type Props = {
  categories: Category[];
  selected: number | null;
  onSelect: (id: number | null) => void;
};

export default function CategoryFilter({ categories, selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
          selected === null
            ? "bg-brand-500 text-white shadow-sm"
            : "bg-white text-gray-600 border border-gray-200 hover:border-brand-300"
        }`}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
            selected === cat.id
              ? "bg-brand-500 text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:border-brand-300"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
