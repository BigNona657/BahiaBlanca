"use client";

import { useState, useTransition } from "react";
import { saveIceCreamFlavors } from "@/lib/actions/settings";

export default function IceCreamFlavorsForm({ initial }: { initial: string[] }) {
  const [flavors, setFlavors] = useState<string[]>(initial);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function addFlavor() {
    const trimmed = input.trim();
    if (!trimmed || flavors.includes(trimmed)) return;
    setFlavors((prev) => [...prev, trimmed]);
    setInput("");
    setMsg(null);
  }

  function removeFlavor(flavor: string) {
    setFlavors((prev) => prev.filter((f) => f !== flavor));
    setMsg(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); addFlavor(); }
  }

  function handleSave() {
    setMsg(null);
    startTransition(async () => {
      const res = await saveIceCreamFlavors(flavors);
      setMsg(res.success
        ? { ok: true, text: "Sabores guardados." }
        : { ok: false, text: res.error ?? "Error al guardar." }
      );
    });
  }

  return (
    <div className="space-y-4">
      {/* Input para agregar */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ej: Pistacho"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button
          type="button"
          onClick={addFlavor}
          disabled={!input.trim()}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl px-4 text-sm font-semibold transition"
        >
          + Agregar
        </button>
      </div>

      {/* Lista de sabores */}
      {flavors.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No hay sabores cargados.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {flavors.map((f) => (
            <span
              key={f}
              className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-700 text-sm rounded-xl px-3 py-1.5"
            >
              {f}
              <button
                type="button"
                onClick={() => removeFlavor(f)}
                className="text-brand-400 hover:text-red-500 transition font-bold leading-none"
                aria-label={`Quitar ${f}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {msg && (
        <p className={`text-sm rounded-xl px-3 py-2 ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>
          {msg.text}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition"
      >
        {isPending ? "Guardando..." : "Guardar sabores"}
      </button>
    </div>
  );
}
