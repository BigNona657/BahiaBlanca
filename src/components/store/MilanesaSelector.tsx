"use client";

import { useState } from "react";

const TIPOS = [
  { label: "De pollo", emoji: "🐔" },
  { label: "De carne", emoji: "🥩" },
];
const VARIANTES = ["Simple", "Simple con queso", "Napolitana", "A caballo"];
const GUARNICIONES = ["Papas fritas", "Puré de papas", "Puré mixto", "Ensalada", "Sola"];

export type MilanesaSelection = {
  tipo: string;
  variante: string;
  guarnicion: string;
  price: number;
};

type Props = {
  price: number;
  onConfirm: (selection: MilanesaSelection) => void;
};

export default function MilanesaSelector({ price, onConfirm }: Props) {
  const [tipo, setTipo] = useState<string | null>(null);
  const [variante, setVariante] = useState<string | null>(null);
  const [guarnicion, setGuarnicion] = useState<string | null>(null);

  const canConfirm = !!tipo && !!variante && !!guarnicion;

  function handleConfirm() {
    if (!tipo || !variante || !guarnicion) return;
    onConfirm({ tipo, variante, guarnicion, price });
  }

  return (
    <div className="px-5 pt-4 pb-2 space-y-5">

      {/* Paso 1: tipo */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          1. ¿De qué la querés?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS.map(({ label, emoji }) => (
            <button
              key={label}
              onClick={() => setTipo(label)}
              className={`rounded-2xl py-3 px-2 text-sm font-semibold border-2 transition flex flex-col items-center gap-1 ${
                tipo === label
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Paso 2: variante */}
      {tipo && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            2. ¿Cómo la querés?
          </p>
          <div className="grid grid-cols-1 gap-2">
            {VARIANTES.map((v) => (
              <button
                key={v}
                onClick={() => setVariante(v)}
                className={`rounded-2xl px-4 py-2.5 text-sm font-medium border-2 text-left transition ${
                  variante === v
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
                }`}
              >
                {variante === v && "✓ "}{v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 3: guarnición */}
      {variante && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            3. Elegí la guarnición
          </p>
          <div className="grid grid-cols-2 gap-2">
            {GUARNICIONES.map((g) => (
              <button
                key={g}
                onClick={() => setGuarnicion(g)}
                className={`rounded-2xl px-3 py-2.5 text-sm font-medium border-2 text-left transition ${
                  guarnicion === g
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
                }`}
              >
                {guarnicion === g && "✓ "}{g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {canConfirm && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{tipo} — {variante} — {guarnicion}</span>
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
