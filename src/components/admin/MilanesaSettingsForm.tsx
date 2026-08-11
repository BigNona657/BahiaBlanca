"use client";

import { useState, useTransition } from "react";
import { saveMilanesaSettings, type MilanesaSettings, type MilanesaOption } from "@/lib/actions/settings";

type SectionKey = keyof MilanesaSettings;

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "tipos", label: "Tipos" },
  { key: "variantes", label: "Variantes" },
  { key: "guarniciones", label: "Guarniciones" },
];

export default function MilanesaSettingsForm({ initial }: { initial: MilanesaSettings }) {
  const [data, setData] = useState<MilanesaSettings>(initial);
  const [inputs, setInputs] = useState<Record<SectionKey, string>>({ tipos: "", variantes: "", guarniciones: "" });
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function addItem(key: SectionKey) {
    const trimmed = inputs[key].trim();
    if (!trimmed || data[key].some((f) => f.name === trimmed)) return;
    setData((prev) => ({ ...prev, [key]: [...prev[key], { name: trimmed, available: true }] }));
    setInputs((prev) => ({ ...prev, [key]: "" }));
    setMsg(null);
  }

  function toggle(key: SectionKey, name: string) {
    setData((prev) => ({
      ...prev,
      [key]: prev[key].map((f) => f.name === name ? { ...f, available: !f.available } : f),
    }));
    setMsg(null);
  }

  function remove(key: SectionKey, name: string) {
    setData((prev) => ({ ...prev, [key]: prev[key].filter((f) => f.name !== name) }));
    setMsg(null);
  }

  function handleSave() {
    setMsg(null);
    startTransition(async () => {
      const res = await saveMilanesaSettings(data);
      setMsg(res.success
        ? { ok: true, text: "Configuración guardada." }
        : { ok: false, text: res.error ?? "Error al guardar." }
      );
    });
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map(({ key, label }) => (
        <div key={key}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
          <div className="flex gap-2 mb-2">
            <input
              value={inputs[key]}
              onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(key); } }}
              placeholder={`Agregar ${label.toLowerCase().slice(0, -1)}`}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="button"
              onClick={() => addItem(key)}
              disabled={!inputs[key].trim()}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl px-4 text-sm font-semibold transition"
            >
              + Agregar
            </button>
          </div>
          {data[key].length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">Sin opciones.</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
              {data[key].map((f: MilanesaOption) => (
                <div key={f.name} className="flex items-center gap-3 px-4 py-3 bg-white">
                  <span className={`text-sm flex-1 min-w-0 truncate ${f.available ? "text-gray-800" : "text-gray-400 line-through"}`}>
                    {f.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggle(key, f.name)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${f.available ? "bg-brand-500" : "bg-gray-200"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${f.available ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(key, f.name)}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

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
        {isPending ? "Guardando..." : "Guardar configuración"}
      </button>
    </div>
  );
}
