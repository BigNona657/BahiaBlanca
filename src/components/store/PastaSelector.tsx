"use client";

import { useState } from "react";

const PASTAS = ["Sorrentinos", "Ravioles", "Capelletis"];
const SALSAS = ["Bolognesa", "Filetto", "Pomarola", "A la Crema"];

export type PastaSelection = {
  pasta: string;
  salsa: string;
  price: number;
};

type Props = {
  price: number;
  onConfirm: (selection: PastaSelection) => void;
};

export default function PastaSelector({ price, onConfirm }: Props) {
  const [pasta, setPasta] = useState<string | null>(null);
  const [salsa, setSalsa] = useState<string | null>(null);

  const canConfirm = !!pasta && !!salsa;

  function handleConfirm() {
    if (!pasta || !salsa) return;
    onConfirm({ pasta, salsa, price });
  }

  return (
    <div className="px-5 pt-4 pb-2 space-y-5">
      {/* Paso 1: tipo de pasta */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          1. Elegí la pasta
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PASTAS.map((p) => (
            <button
              key={p}
              onClick={() => setPasta(p)}
              className={`rounded-2xl py-3 px-2 text-sm font-semibold border-2 transition flex flex-col items-center gap-1 ${
                pasta === p
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
              }`}
            >
              <span className="text-2xl">🍝</span>
              <span>{p}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Paso 2: salsa */}
      {pasta && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            2. Elegí la salsa
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SALSAS.map((s) => (
              <button
                key={s}
                onClick={() => setSalsa(s)}
                className={`rounded-2xl px-3 py-2.5 text-sm font-medium border-2 text-left transition ${
                  salsa === s
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
                }`}
              >
                {salsa === s && "✓ "}{s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {canConfirm && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{pasta} con salsa {salsa}</span>
          <span className="font-semibold text-gray-800">
            ${price.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
          </span>
        </div>
      )}

      {canConfirm && (
        <button
          onClick={handleConfirm}
          className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-2xl py-3 font-semibold text-sm transition"
        >
          Confirmar selección
        </button>
      )}
    </div>
  );
}
