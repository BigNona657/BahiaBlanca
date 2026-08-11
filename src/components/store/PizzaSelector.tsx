"use client";

import { useState } from "react";
import type { PizzaFlavor } from "@/lib/actions/settings";

export type PizzaSelection =
  | { type: "entera"; sabor: string; price: number }
  | { type: "mitad"; sabor1: string; sabor2: string; price: number };

type Props = {
  flavors: PizzaFlavor[];
  currentFlavor: { name: string; price: number; matchedFlavor: string | null };
  onConfirm: (selection: PizzaSelection) => void;
};

type Mode = "entera" | "mitad" | null;

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function PizzaSelector({ flavors, currentFlavor, onConfirm }: Props) {
  const [mode, setMode] = useState<Mode>(null);

  const available = flavors.filter((f) => f.available);

  function handleMode(m: Mode) {
    if (m === "entera") {
      onConfirm({ type: "entera", sabor: currentFlavor.name, price: currentFlavor.price });
      return;
    }
    setMode(m);
  }

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

      {/* Mitad y mitad */}
      {mode === "mitad" && (
        <div className="space-y-4">
          {/* Primera mitad: siempre el sabor de la card */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              2. Primera mitad
            </p>
            <div className="rounded-2xl px-3 py-2.5 text-sm font-medium border-2 border-brand-500 bg-brand-50 text-brand-600 flex flex-col gap-0.5">
              <span>✓ {currentFlavor.name}</span>
              <span className="text-xs font-normal text-brand-400">
                ${Math.ceil(currentFlavor.price / 2).toLocaleString("es-AR", { minimumFractionDigits: 0 })} (½)
              </span>
            </div>
          </div>

          {/* Segunda mitad: elegir de la lista */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              3. Segunda mitad
            </p>
            <div className="grid grid-cols-2 gap-2">
              {available.filter((f) => f.name !== currentFlavor.matchedFlavor).map((f) => {
                const halfPrice = Math.ceil(currentFlavor.price / 2 + f.price / 2);
                return (
                  <button
                    key={f.name}
                    onClick={() => onConfirm({ type: "mitad", sabor1: currentFlavor.name, sabor2: f.name, price: halfPrice })}
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

    </div>
  );
}
