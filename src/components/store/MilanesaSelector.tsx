"use client";

import { useState } from "react";
import type { MilanesaSettings } from "@/lib/actions/settings";

export type MilanesaSelection = {
  tipo: string;
  aCaballo: boolean;
  guarnicion: string;
  price: number;
};

type Props = {
  price: number;
  settings: MilanesaSettings;
  onConfirm: (selection: MilanesaSelection) => void;
};

export default function MilanesaSelector({ price, settings, onConfirm }: Props) {
  const [tipo, setTipo] = useState<string | null>(null);
  const [aCaballo, setACaballo] = useState(false);

  const tipos = settings.tipos.filter((t) => t.available);

  function handleConfirm() {
    if (!tipo) return;
    onConfirm({ tipo, aCaballo, guarnicion: "", price });
  }

  return (
    <div className="px-5 pt-4 pb-2 space-y-5">

      {/* Paso 1: tipo */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          1. ¿De qué la querés?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {tipos.map(({ name }) => (
            <button
              key={name}
              onClick={() => { setTipo(name); setACaballo(false); }}
              className={`rounded-2xl py-3 px-2 text-sm font-semibold border-2 transition ${
                tipo === name
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
              }`}
            >
              {tipo === name && "✓ "}{name}
            </button>
          ))}
        </div>
      </div>

      {/* Opcional: a caballo */}
      {tipo && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Adicional (opcional)
          </p>
          <button
            onClick={() => setACaballo((v) => !v)}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-medium border-2 text-left transition flex items-center justify-between ${
              aCaballo
                ? "border-brand-500 bg-brand-50 text-brand-600"
                : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
            }`}
          >
            <span>{aCaballo && "✓ "}A caballo 🍳</span>
            <span className="text-xs text-gray-400">{aCaballo ? "Incluido" : "Agregar"}</span>
          </button>
        </div>
      )}

      {/* Confirmar */}
      {tipo && (
        <>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{tipo}{aCaballo ? " a caballo" : ""}</span>
            <span className="font-semibold text-gray-800">
              ${price.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-2xl py-3 font-semibold text-sm transition"
          >
            Confirmar selección
          </button>
        </>
      )}
    </div>
  );
}
