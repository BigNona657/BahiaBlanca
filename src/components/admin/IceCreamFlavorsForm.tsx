"use client";

import { useState, useTransition } from "react";
import { saveIceCreamFlavors, type IceCreamFlavor } from "@/lib/actions/settings";

export default function IceCreamFlavorsForm({ initial }: { initial: IceCreamFlavor[] }) {
  const [flavors, setFlavors] = useState<IceCreamFlavor[]>(initial);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function addFlavor() {
    const trimmed = input.trim();
    if (!trimmed || flavors.some((f) => f.name === trimmed)) return;
    setFlavors((prev) => [...prev, { name: trimmed, available: true }]);
    setInput("");
    setMsg(null);
  }

  function removeFlavor(name: string) {
    setFlavors((prev) => prev.filter((f) => f.name !== name));
    setMsg(null);
  }

  function toggleAvailable(name: string) {
    setFlavors((prev) =>
      prev.map((f) => f.name === name ? { ...f, available: !f.available } : f)
    );
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

  const available = flavors.filter((f) => f.available).length;

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

      {/* Contador */}
      {flavors.length > 0 && (
        <p className="text-xs text-gray-400">
          {available} de {flavors.length} disponibles
        </p>
      )}

      {/* Lista de sabores */}
      {flavors.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No hay sabores cargados.</p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
          {flavors.map((f) => (
            <div key={f.name} className="flex items-center justify-between px-4 py-3 bg-white gap-3">
              <span className={`text-sm flex-1 ${f.available ? "text-gray-800" : "text-gray-400 line-through"}`}>
                {f.name}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle disponibilidad */}
                <button
                  type="button"
                  onClick={() => toggleAvailable(f.name)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    f.available ? "bg-brand-500" : "bg-gray-200"
                  }`}
                  aria-label={f.available ? "Pausar sabor" : "Activar sabor"}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    f.available ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>

                {/* Eliminar */}
                <button
                  type="button"
                  onClick={() => removeFlavor(f.name)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                  aria-label={`Eliminar ${f.name}`}
                >
                  ×
                </button>
              </div>
            </div>
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
