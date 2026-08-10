"use client";

import { useState, useTransition } from "react";
import { saveTartaFlavors, type TartaFlavor } from "@/lib/actions/settings";

export default function TartaFlavorsForm({ initial }: { initial: TartaFlavor[] }) {
  const [flavors, setFlavors] = useState<TartaFlavor[]>(initial);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function addFlavor() {
    const trimmed = name.trim();
    if (!trimmed || flavors.some((f) => f.name === trimmed)) return;
    setFlavors((prev) => [...prev, { name: trimmed, available: true }]);
    setName("");
    setMsg(null);
  }

  function toggleAvailable(fname: string) {
    setFlavors((prev) => prev.map((f) => f.name === fname ? { ...f, available: !f.available } : f));
    setMsg(null);
  }

  function removeFlavor(fname: string) {
    setFlavors((prev) => prev.filter((f) => f.name !== fname));
    setMsg(null);
  }

  function handleSave() {
    setMsg(null);
    startTransition(async () => {
      const res = await saveTartaFlavors(flavors);
      setMsg(res.success
        ? { ok: true, text: "Sabores guardados." }
        : { ok: false, text: res.error ?? "Error al guardar." }
      );
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFlavor(); } }}
          placeholder="Ej: Carne"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button
          type="button"
          onClick={addFlavor}
          disabled={!name.trim()}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl px-4 text-sm font-semibold transition"
        >
          + Agregar
        </button>
      </div>

      {flavors.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No hay sabores cargados.</p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
          {flavors.map((f) => (
            <div key={f.name} className="flex items-center gap-3 px-4 py-3 bg-white">
              <span className={`text-sm flex-1 min-w-0 truncate ${f.available ? "text-gray-800" : "text-gray-400 line-through"}`}>
                {f.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleAvailable(f.name)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${f.available ? "bg-brand-500" : "bg-gray-200"}`}
                  aria-label={f.available ? "Pausar" : "Activar"}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${f.available ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <button
                  type="button"
                  onClick={() => removeFlavor(f.name)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
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
