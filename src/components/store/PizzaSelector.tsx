"use client";

import { useState } from "react";
import type { PizzaFlavor } from "@/lib/actions/settings";

export type PizzaSelection =
  | { type: "entera"; sabor: string; price: number }
  | { type: "mitad"; sabor1: string; sabor2: string; price: number };

type Props = {
  flavors: PizzaFlavor[];
  currentFlavor: string | null;
  onConfirm: (selection: PizzaSelection) => void;
};

type Mode = "entera" | "mitad" | null;

export default function PizzaSelector({ flavors, currentFlavor, onConfirm }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const [sabor1, setSabor1] = useState<string | null>(null);

  const available = flavors.filter((f) => f.available);

  function getPrice(name: string) {
    return flavors.find((f) => f.name === name)?.price ?? 0;
  }

  function handleMode(m: Mode) {
    if (m === "entera" && currentFlavor) {
      onConfirm({ type: "entera", sabor: currentFlavor, price: getPrice(currentFlavor) });
      return;
    }
    setMode(m);
    setSabor1(null);
  }

  // Mitad: primera mitad ya conocida (del producto) o elegida manualmente
  const firstHalf = sabor1 ?? currentFlavor;

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

      {/* Entera sin match: elegir sabor */}
      {mode === "entera" && !currentFlavor && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            2. Elegí el sabor
          </p>
          <div className="grid grid-cols-2 gap-2">
            {available.map((f) => (
              <button
                key={f.name}
                onClick={() => onConfirm({ type: "entera", sabor: f.name, price: f.price })}
                className="rounded-2xl px-3 py-2.5 text-sm font-medium border-2 text-left transition flex flex-col gap-0.5 border-gray-200 bg-white text-gray-700 hover:border-brand-300 active:border-brand-500 active:bg-brand-50"
              >
                <span>{f.name}</span>
                <span className="text-xs font-normal text-gray-400">
                  ${f.price.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mitad y mitad */}
      {mode === "mitad" && (
        <div className="space-y-4">

          {/* Primera mitad */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              2. Primera mitad
            </p>
            {firstHalf ? (
              <div className="rounded-2xl px-3 py-2.5 text-sm font-medium border-2 border-brand-500 bg-brand-50 text-brand-600 flex flex-col gap-0.5">
                <span>✓ {firstHalf}</span>
                <span className="text-xs font-normal text-brand-400">
                  ${Math.ceil(getPrice(firstHalf) / 2).toLocaleString("es-AR", { minimumFractionDigits: 0 })} (½)
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {available.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setSabor1(f.name)}
                    className="rounded-2xl px-3 py-2.5 text-sm font-medium border-2 text-left transition flex flex-col gap-0.5 border-gray-200 bg-white text-gray-700 hover:border-brand-300 active:border-brand-500 active:bg-brand-50"
                  >
                    <span>{f.name}</span>
                    <span className="text-xs font-normal text-gray-400">
                      ${Math.ceil(f.price / 2).toLocaleString("es-AR", { minimumFractionDigits: 0 })} (½)
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Segunda mitad: solo aparece cuando ya hay primera */}
          {firstHalf && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                3. Segunda mitad
              </p>
              <div className="grid grid-cols-2 gap-2">
                {available.filter((f) => f.name !== firstHalf).map((f) => {
                  const halfPrice = Math.ceil(getPrice(firstHalf) / 2 + f.price / 2);
                  return (
                    <button
                      key={f.name}
                      onClick={() => onConfirm({ type: "mitad", sabor1: firstHalf, sabor2: f.name, price: halfPrice })}
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
          )}
        </div>
      )}

    </div>
  );
}
