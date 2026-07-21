"use client";

import { useState } from "react";

const SABORES = [
  "Carne",
  "Jamón y queso",
  "Pollo",
  "Humita",
  "Verdura",
  "Cebolla y queso",
  "Cantimpalo y queso",
  "Salame y queso",
];

export type EmpanadasSelection = {
  sabores: Record<string, number>;
  total: number;
  price: number;
};

type Props = {
  pricePerDozen: number;
  unitsPerPrice?: number;
  initial?: Record<string, number>;
  onConfirm: (selection: EmpanadasSelection) => void;
};

export default function EmpanadasSelector({ pricePerDozen, unitsPerPrice = 12, initial, onConfirm }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>(initial ?? {});

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const pricePerUnit = pricePerDozen / unitsPerPrice;
  const calculatedPrice = Math.ceil(pricePerUnit * total);

  function change(sabor: string, delta: number) {
    setCounts((prev) => {
      const next = (prev[sabor] ?? 0) + delta;
      if (next <= 0) {
        const { [sabor]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [sabor]: next };
    });
  }

  function handleConfirm() {
    if (total === 0) return;
    onConfirm({ sabores: counts, total, price: calculatedPrice });
  }

  return (
    <div className="px-5 pt-4 pb-2 space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Elegí tus sabores
      </p>

      <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
        {SABORES.map((sabor) => {
          const qty = counts[sabor] ?? 0;
          return (
            <div key={sabor} className="flex items-center justify-between px-4 py-3 bg-white gap-3">
              <span className="text-sm text-gray-800 flex-1">{sabor}</span>
              <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-2 py-1 shrink-0">
                <button
                  type="button"
                  onClick={() => change(sabor, -1)}
                  disabled={qty === 0}
                  className="w-7 h-7 rounded-xl bg-white shadow-sm text-gray-700 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-semibold text-gray-800">{qty}</span>
                <button
                  type="button"
                  onClick={() => change(sabor, 1)}
                  className="w-7 h-7 rounded-xl bg-white shadow-sm text-gray-700 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{total} empanada{total !== 1 ? "s" : ""}</span>
          <span className="font-semibold text-gray-800">
            ${calculatedPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={total === 0}
        className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40 text-white rounded-2xl py-3 font-semibold text-sm transition"
      >
        Confirmar selección
      </button>
    </div>
  );
}
