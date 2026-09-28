"use client";

import { useState, useTransition } from "react";
import { saveDeliveryConfig, type DeliveryConfig } from "@/lib/actions/settings";

export default function DeliverySettingsForm({ initial }: { initial: DeliveryConfig }) {
  const [form, setForm] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: Number(e.target.value) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await saveDeliveryConfig(form);
      setMsg(res.success
        ? { ok: true, text: "Configuración guardada." }
        : { ok: false, text: res.error ?? "Error al guardar." }
      );
    });
  }

  const exampleFee = Math.round(form.base_fee + 3 * form.price_per_km);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Costo base ($)</label>
          <input
            name="base_fee"
            type="number"
            min={0}
            step={100}
            value={form.base_fee}
            onChange={handleChange}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <p className="text-xs text-gray-400">Costo fijo por cada envío</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Precio por km ($)</label>
          <input
            name="price_per_km"
            type="number"
            min={0}
            step={100}
            value={form.price_per_km}
            onChange={handleChange}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <p className="text-xs text-gray-400">Se multiplica por la distancia</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Envío gratis desde ($)</label>
          <input
            name="free_from"
            type="number"
            min={0}
            step={1000}
            value={form.free_from}
            onChange={handleChange}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <p className="text-xs text-gray-400">0 = nunca gratis por monto</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Cobertura máxima (km)</label>
          <input
            name="max_km"
            type="number"
            min={0}
            step={1}
            value={form.max_km}
            onChange={handleChange}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <p className="text-xs text-gray-400">0 = sin límite de distancia</p>
        </div>
      </div>

      <div className="bg-brand-50 rounded-xl px-4 py-3 text-sm text-brand-700">
        <p className="font-semibold mb-1">Vista previa</p>
        <p>Envío a 3 km → <span className="font-bold">${exampleFee.toLocaleString("es-AR")}</span></p>
        {form.free_from > 0 && (
          <p>Gratis en pedidos de <span className="font-bold">${form.free_from.toLocaleString("es-AR")}</span> o más</p>
        )}
        {form.max_km > 0 && (
          <p>Cobertura hasta <span className="font-bold">{form.max_km} km</span></p>
        )}
      </div>

      {msg && (
        <p className={`text-sm rounded-xl px-3 py-2 ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition"
      >
        {isPending ? "Guardando..." : "Guardar configuración de envío"}
      </button>
    </form>
  );
}
