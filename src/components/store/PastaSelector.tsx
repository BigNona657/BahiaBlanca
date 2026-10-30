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
  productName: string;
  onConfirm: (selection: PastaSelection) => void;
};

function detectPasta(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("sorrentino")) return "Sorrentinos";
  if (n.includes("raviole")) return "Ravioles";
  if (n.includes("capelleti")) return "Capelletis";
  return null;
}

export default function PastaSelector({ price, productName, onConfirm }: Props) {
  const fixedPasta = detectPasta(productName);
  const [pasta, setPasta] = useState<string | null>(fixedPasta);
  const [salsa, setSalsa] = useState<string | null>(null);

  function handleConfirm(selectedSalsa: string) {
    const p = pasta ?? fixedPasta;
    if (!p) return;
    onConfirm({ pasta: p, salsa: selectedSalsa, price });
  }

  return (
    <div className="px-5 pt-4 pb-2 space-y-5">
      {/* Paso 1: tipo de pasta — solo si no está fijo por el producto */}
      {!fixedPasta && (
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
      )}

      {/* Paso de salsa */}
      {pasta && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {fixedPasta ? "Elegí la salsa" : "2. Elegí la salsa"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SALSAS.map((s) => (
              <button
                key={s}
                onClick={() => { setSalsa(s); handleConfirm(s); }}
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
    </div>
  );
}
