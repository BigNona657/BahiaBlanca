"use client";

import { useState } from "react";
import type { PizzaFlavor } from "@/lib/actions/settings";

export type PizzaSelection =
  | { type: "entera"; sabor: string; price: number }
  | { type: "mitad"; sabor1: string; sabor2: string; price: number };

type Props = {
  flavors: PizzaFlavor[];
  onConfirm: (selection: PizzaSelection) => void;
};

type Mode = "entera" | "mitad" | null;

export default function PizzaSelector({ flavors, onConfirm }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const [sabor, setSabor] = useState<string | null>(null);
  const [sabor1, setSabor1] = useState<string | null>(null);
  const [sabor2, setSabor2] = useState<string | null>(null);

  const available = flavors.filter((f) => f.available);

  function getPrice(name: string) {
    return flavors.find((f) => f.name === name)?.price ?? 0;
  }

  function handleMode(m: Mode) {
    setMode(m);
    setSabor(null);
    setSabor1(null);
    setSabor2(null);
  }

  // Precio calculado en tiempo real
  const previewPrice: number | null =
    mode === "entera" && sabor
      ? getPrice(sabor)
      : mode === "mitad" && sabor1 && sabor2
      ? Math.ceil(getPrice(sabor1) / 2 + getPrice(sabor2) / 2)
      : null;

  function handleConfirm() {
    if (mode === "entera" && sabor && previewPrice !== null) {
      onConfirm({ type: "entera", sabor, price: previewPrice });
    } else if (mode === "mitad" && sabor1 && sabor2 && previewPrice !== null) {
      onConfirm({ type: "mitad", sabor1, sabor2, price: previewPrice });
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
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              2. Primera mitad
            </p>
            <div className="grid grid-cols-2 gap-2">
              {available.map((f) => {
                const disabled = sabor2 === f.name;
                return (
                  <button
                    key={f.name}
                    onClick={() => !disabled && setSabor1(f.name)}
                    disabled={disabled}
                    className={`rounded-2xl px-3 py-2.5 text-sm font-medium border-2 text-left transition flex flex-col gap-0.5 ${
                      sabor1 === f.name
                        ? "border-brand-500 bg-brand-50 text-brand-600"
                        : disabled
                        ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
                    }`}
                  >
                    <span>{sabor1 === f.name && "✓ "}{f.name}</span>
                    <span className={`text-xs font-normal ${sabor1 === f.name ? "text-brand-400" : disabled ? "text-gray-200" : "text-gray-400"}`}>
                      ${Math.ceil(f.price / 2).toLocaleString("es-AR", { minimumFractionDigits: 0 })} (½)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              3. Segunda mitad
            </p>
            <div className="grid grid-cols-2 gap-2">
              {available.map((f) => {
                const disabled = sabor1 === f.name;
                return (
                  <button
                    key={f.name}
                    onClick={() => !disabled && setSabor2(f.name)}
                    disabled={disabled}
                    className={`rounded-2xl px-3 py-2.5 text-sm font-medium border-2 text-left transition flex flex-col gap-0.5 ${
                      sabor2 === f.name
                        ? "border-brand-500 bg-brand-50 text-brand-600"
                        : disabled
                        ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
                    }`}
                  >
                    <span>{sabor2 === f.name && "✓ "}{f.name}</span>
                    <span className={`text-xs font-normal ${sabor2 === f.name ? "text-brand-400" : disabled ? "text-gray-200" : "text-gray-400"}`}>
                      ${Math.ceil(f.price / 2).toLocaleString("es-AR", { minimumFractionDigits: 0 })} (½)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Total preview */}
      {previewPrice !== null && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {mode === "mitad" && sabor1 && sabor2
              ? `½ ${sabor1} + ½ ${sabor2}`
              : sabor}
          </span>
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
