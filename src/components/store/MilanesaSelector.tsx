"use client";

import { useState } from "react";
import type { MilanesaSettings } from "@/lib/actions/settings";

export type MilanesaSelection = {
  tipo: string;
  variante: string;
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
  const [variante, setVariante] = useState<string | null>(null);
  const [guarnicion, setGuarnicion] = useState<string | null>(null);

  const tipos = settings.tipos.filter((t) => t.available);
  const variantes = settings.variantes.filter((v) => v.available);
  const guarniciones = settings.guarniciones.filter((g) => g.available);

  const canConfirm = !!tipo && !!variante && !!guarnicion;

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
              onClick={() => { setTipo(name); setVariante(null); setGuarnicion(null); }}
              className={`rounded-2xl py-3 px-2 text-sm font-semibold border-2 transition flex flex-col items-center gap-1 ${
                tipo === name
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
              }`}
            >
              <span>{name}</span>
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
            {variantes.map(({ name }) => (
              <button
                key={name}
                onClick={() => { setVariante(name); setGuarnicion(null); }}
                className={`rounded-2xl px-4 py-2.5 text-sm font-medium border-2 text-left transition ${
                  variante === name
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
                }`}
              >
                {variante === name && "✓ "}{name}
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
            {guarniciones.map(({ name }) => (
              <button
                key={name}
                onClick={() => setGuarnicion(name)}
                className={`rounded-2xl px-3 py-2.5 text-sm font-medium border-2 text-left transition ${
                  guarnicion === name
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
                }`}
              >
                {guarnicion === name && "✓ "}{name}
              </button>
            ))}
          </div>
        </div>
      )}

      {canConfirm && (
        <>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{tipo} — {variante} — {guarnicion}</span>
            <span className="font-semibold text-gray-800">
              ${price.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
            </span>
          </div>
          <button
            onClick={() => onConfirm({ tipo: tipo!, variante: variante!, guarnicion: guarnicion!, price })}
            className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-2xl py-3 font-semibold text-sm transition"
          >
            Confirmar selección
          </button>
        </>
      )}
    </div>
  );
}
