"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { saveImperdibles } from "@/lib/actions/settings";
import type { Product } from "@/types/menu";

type Props = {
  products: Product[];
  initial: number[];
};

export default function ImperdiblesForm({ products, initial }: Props) {
  const [selected, setSelected] = useState<number[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function toggle(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await saveImperdibles(selected);
      setMsg(
        res.success
          ? { ok: true, text: "Imperdibles guardados." }
          : { ok: false, text: res.error ?? "Error al guardar." }
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
        {products.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                isSelected
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
            >
              <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                {p.image_data || p.image_url ? (
                  <Image
                    src={p.image_data || p.image_url!}
                    alt={p.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-lg">🍽️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{p.name}</p>
                <p className="text-xs text-brand-600 font-bold mt-0.5">
                  ${parseFloat(p.price).toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </p>
              </div>
              {isSelected && (
                <span className="text-brand-500 text-base shrink-0">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-gray-400">{selected.length} producto{selected.length !== 1 ? "s" : ""} seleccionado{selected.length !== 1 ? "s" : ""}</p>
      )}

      {msg && (
        <p className={`text-sm rounded-xl px-3 py-2 ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition"
      >
        {isPending ? "Guardando..." : "Guardar imperdibles"}
      </button>
    </form>
  );
}
