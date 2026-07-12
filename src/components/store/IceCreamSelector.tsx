"use client";

import { useState } from "react";
import type { IceCreamFlavor, IceCreamPote } from "@/lib/actions/settings";

export type IceCreamSelection = {
  pote: string;
  sabores: string[];
  price: number;
};

type Props = {
  potes: IceCreamPote[];
  sabores: IceCreamFlavor[];
  onConfirm: (selection: IceCreamSelection) => void;
};

const MAX_SABORES: Record<string, number> = {
  "1kg":   4,
  "1/2kg": 3,
  "1/4kg": 2,
};

export default function IceCreamSelector({ potes, sabores, onConfirm }: Props) {
  const [pote, setPote] = useState<IceCreamPote | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const available = sabores.filter((s) => s.available);
  const maxSabores = pote ? (MAX_SABORES[pote.value] ?? 2) : 0;

  function toggleSabor(name: string) {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((s) => s !== name);
      if (prev.length >= maxSabores) return prev;
      return [...prev, name];
    });
  }

  function handlePoteSelect(p: IceCreamPote) {
    setPote(p);
    setSelected([]);
  }

  const canConfirm = pote && selected.length > 0;

  return (
    <div className="px-5 pt-4 pb-2 space-y-5">

      {/* ── Paso 1: Pote ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          1. Elegí el tamaño
        </p>
        <div className="grid grid-cols-3 gap-2">
          {potes.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePoteSelect(p)}
              className={`rounded-2xl py-3 px-2 text-sm font-semibold border-2 transition flex flex-col items-center gap-0.5 ${
                pote?.value === p.value
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
              }`}
            >
              <span>{p.label}</span>
              {p.price > 0 && (
                <span className={`text-xs font-normal ${pote?.value === p.value ? "text-brand-400" : "text-gray-400"}`}>
                  ${p.price.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Paso 2: Sabores ── */}
      {pote && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            2. Elegí hasta {maxSabores} sabor{maxSabores > 1 ? "es" : ""}
          </p>
          <p className="text-xs text-gray-400 mb-2">
            {selected.length} de {maxSabores} seleccionado{selected.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {available.map(({ name }) => {
              const isSelected = selected.includes(name);
              const disabled = !isSelected && selected.length >= maxSabores;
              return (
                <button
                  key={name}
                  onClick={() => toggleSabor(name)}
                  disabled={disabled}
                  className={`rounded-2xl px-3 py-2.5 text-sm font-medium border-2 text-left transition ${
                    isSelected
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : disabled
                      ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                      : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
                  }`}
                >
                  {isSelected && <span className="mr-1">✓</span>}
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Confirmar ── */}
      {canConfirm && (
        <button
          onClick={() => onConfirm({ pote: pote!.label, sabores: selected, price: pote!.price })}
          className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-2xl py-3 font-semibold text-sm transition"
        >
          Confirmar selección
        </button>
      )}
    </div>
  );
}
