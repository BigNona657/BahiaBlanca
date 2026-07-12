"use client";

import { useState } from "react";

export type IceCreamSelection = {
  pote: string;
  sabores: string[];
};

type Props = {
  onConfirm: (selection: IceCreamSelection) => void;
};

const POTES = [
  { label: "Pote 1 kg", value: "1kg" },
  { label: "Pote ½ kg", value: "1/2kg" },
  { label: "Pote ¼ kg", value: "1/4kg" },
];

const MAX_SABORES: Record<string, number> = {
  "1kg":   4,
  "1/2kg": 3,
  "1/4kg": 2,
};

const SABORES = [
  "Dulce de leche",
  "Chocolate",
  "Vainilla",
  "Frutilla",
  "Limón",
  "Crema del cielo",
  "Tramontana",
  "Maracuyá",
  "Menta granizada",
  "Banana split",
  "Mousse de chocolate",
  "Sambayón",
];

export default function IceCreamSelector({ onConfirm }: Props) {
  const [pote, setPote] = useState<string | null>(null);
  const [sabores, setSabores] = useState<string[]>([]);

  const maxSabores = pote ? MAX_SABORES[pote] : 0;

  function toggleSabor(sabor: string) {
    setSabores((prev) => {
      if (prev.includes(sabor)) return prev.filter((s) => s !== sabor);
      if (prev.length >= maxSabores) return prev;
      return [...prev, sabor];
    });
  }

  function handlePoteSelect(value: string) {
    setPote(value);
    setSabores([]);
  }

  const canConfirm = pote && sabores.length > 0;

  return (
    <div className="px-5 pt-4 pb-2 space-y-5">

      {/* ── Paso 1: Pote ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          1. Elegí el tamaño
        </p>
        <div className="grid grid-cols-3 gap-2">
          {POTES.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePoteSelect(p.value)}
              className={`rounded-2xl py-3 text-sm font-semibold border-2 transition ${
                pote === p.value
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
              }`}
            >
              {p.label}
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
            {sabores.length} de {maxSabores} seleccionado{sabores.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SABORES.map((s) => {
              const selected = sabores.includes(s);
              const disabled = !selected && sabores.length >= maxSabores;
              return (
                <button
                  key={s}
                  onClick={() => toggleSabor(s)}
                  disabled={disabled}
                  className={`rounded-2xl px-3 py-2.5 text-sm font-medium border-2 text-left transition ${
                    selected
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : disabled
                      ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                      : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
                  }`}
                >
                  {selected && <span className="mr-1">✓</span>}
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Confirmar ── */}
      {canConfirm && (
        <button
          onClick={() => onConfirm({ pote: pote!, sabores })}
          className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-2xl py-3 font-semibold text-sm transition"
        >
          Confirmar selección
        </button>
      )}
    </div>
  );
}
