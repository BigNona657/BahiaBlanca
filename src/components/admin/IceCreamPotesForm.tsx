"use client";

import { useState, useTransition } from "react";
import { saveIceCreamPotes, type IceCreamPote } from "@/lib/actions/settings";

export default function IceCreamPotesForm({ initial }: { initial: IceCreamPote[] }) {
  const [potes, setPotes] = useState<IceCreamPote[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function handlePrice(value: string, index: number) {
    const price = parseFloat(value) || 0;
    setPotes((prev) => prev.map((p, i) => i === index ? { ...p, price } : p));
    setMsg(null);
  }

  function handleSave() {
    setMsg(null);
    startTransition(async () => {
      const res = await saveIceCreamPotes(potes);
      setMsg(res.success
        ? { ok: true, text: "Precios guardados." }
        : { ok: false, text: res.error ?? "Error al guardar." }
      );
    });
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
        {potes.map((pote, i) => (
          <div key={pote.value} className="flex items-center justify-between px-4 py-3 bg-white gap-4">
            <span className="text-sm font-medium text-gray-700 flex-1">{pote.label}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm text-gray-400">$</span>
              <input
                type="number"
                min="0"
                step="100"
                value={pote.price || ""}
                onChange={(e) => handlePrice(e.target.value, i)}
                placeholder="0"
                className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400 text-right"
              />
            </div>
          </div>
        ))}
      </div>

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
        {isPending ? "Guardando..." : "Guardar precios"}
      </button>
    </div>
  );
}
