"use client";

import { useState } from "react";
import type { PizzaFlavor } from "@/lib/actions/settings";

export type PizzaSelection =
  | { type: "entera"; sabor: string; price: number }
  | { type: "mitad"; sabor1: string; sabor2: string; price: number };

type Props = {
  flavors: PizzaFlavor[];
  currentFlavor: string;
  onConfirm: (selection: PizzaSelection) => void;
};

type Mode = "entera" | "mitad" | null;

export default function PizzaSelector({ flavors, currentFlavor, onConfirm }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const [sabor, setSabor] = useState<string | null>(null);

  const available = flavors.filter((f) => f.available);

  function getPrice(name: string) {
    return flavors.find((f) => f.name === name)?.price ?? 0;
  }

  function handleMode(m: Mode) {
    setMode(m);
    setSabor(m === "entera" ? currentFlavor : null);
  }

  // Precio calculado en tiempo real
  const previewPrice: number | null =
    mode === "entera" && sabor
      ? getPrice(sabor)
      : null;

  function handleConfirm() {
    if (mode === "entera" && sabor && previewPrice !== null) {
      onConfirm({ type: "entera", sabor, price: previewPrice });
    }
  }

  const canConfirm = previewPrice !== null;

  return (
    <div className="px-5 pt-4 pb-2 space-y-5">

      {/* Paso 1: tipo */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          1. ¿Cómo la querés?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(["entera", "mitad"] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleMode(m)}
              className={`rounded-2xl py-3 px-2 text-sm font-semibold border-2 transition flex flex-col items-center gap-1 ${
                mode === m
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
              }`}
            >
              <span className="text-2xl">{m === "entera" ? "🍕" : "🍕✂️"}</span>
              <span>{m === "entera" ? "Entera" : "Mitad y mitad"}</span>
              <span className="text-xs font-normal text-gray-400">
                {m === "entera" ? "1 sabor" : "2 sabores"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Paso 2: entera */}
      {mode === "entera" && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            2. Elegí el sabor
          </p>
          <div className="grid grid-cols-2 gap-2">
            {available.map((f) => (
              <button
                key={f.name}
                onClick={() => setSabor(f.name)}
                className={`rounded-2xl px-3 py-2.5 text-sm font-medium border-2 text-left transition flex flex-col gap-0.5 ${
                  sabor === f.name
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
                }`}
              >
                <span>{sabor === f.name && "✓ "}{f.name}</span>
                <span className={`text-xs font-normal ${sabor === f.name ? "text-brand-400" : "text-gray-400"}`}>
                  ${f.price.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 2 y 3: mitad y mitad */}
      {mode === "mitad" && (
        <div className="space-y-4">
          {/* Sabor 1: fijo, el de la pizza seleccionada */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              2. Primera mitad
            </p>
            <div className="rounded-2xl px-3 py-2.5 text-sm font-medium border-2 border-brand-500 bg-brand-50 text-brand-600 flex flex-col gap-0.5">
              <span>✓ {currentFlavor}</span>
              <span className="text-xs font-normal text-brand-400">
                ${Math.ceil(getPrice(currentFlavor) / 2).toLocaleString("es-AR", { minimumFractionDigits: 0 })} (½)
              </span>
            </div>
          </div>

          {/* Sabor 2: elegible, excluyendo el sabor 1 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              3. Segunda mitad
            </p>
            <div className="grid grid-cols-2 gap-2">
              {available.filter((f) => f.name !== currentFlavor).map((f) => {
                const halfPrice = Math.ceil(getPrice(currentFlavor) / 2 + f.price / 2);
                return (
                  <button
                    key={f.name}
                    onClick={() => onConfirm({ type: "mitad", sabor1: currentFlavor, sabor2: f.name, price: halfPrice })}
                    className="rounded-2xl px-3 py-2.5 text-sm font-medium border-2 text-left transition flex flex-col gap-0.5 border-gray-200 bg-white text-gray-700 hover:border-brand-300 active:border-brand-500 active:bg-brand-50"
                  >
                    <span>{f.name}</span>
                    <span className="text-xs font-normal text-gray-400">
                      ${halfPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })} total
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Total preview — solo entera */}
      {mode === "entera" && previewPrice !== null && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{sabor}</span>
          <span className="font-semibold text-gray-800">
            ${previewPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
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
