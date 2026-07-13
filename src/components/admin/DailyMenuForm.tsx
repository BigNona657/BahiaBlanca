"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { saveDailyMenu, type DailyMenu } from "@/lib/actions/settings";

const EMPTY: DailyMenu = {
  title: "",
  description: "",
  price: 0,
  image_data: "",
  active: true,
};

export default function DailyMenuForm({ initial }: { initial: DailyMenu | null }) {
  const [form, setForm] = useState<DailyMenu>(initial ?? EMPTY);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir imagen.");
      setForm((p) => ({ ...p, image_data: data.url }));
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Error al subir imagen." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSave() {
    if (!form.title.trim()) { setMsg({ ok: false, text: "El título es obligatorio." }); return; }
    if (!form.price || form.price <= 0) { setMsg({ ok: false, text: "El precio debe ser mayor a 0." }); return; }
    setMsg(null);
    startTransition(async () => {
      const res = await saveDailyMenu(form);
      setMsg(res.success
        ? { ok: true, text: "Menú del día guardado." }
        : { ok: false, text: res.error ?? "Error al guardar." }
      );
    });
  }

  return (
    <div className="space-y-4">
      {/* Toggle activo */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm font-medium text-gray-700">Mostrar menú del día</span>
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.active ? "bg-brand-500" : "bg-gray-200"}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </label>

      {/* Imagen */}
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
          {form.image_data ? (
            <Image src={form.image_data} alt="preview" fill className="object-cover" sizes="96px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full border border-dashed border-brand-400 text-brand-500 rounded-xl py-2 text-sm font-medium hover:bg-brand-50 transition disabled:opacity-50"
          >
            {uploading ? "Subiendo..." : "📁 Elegir imagen"}
          </button>
          {form.image_data && (
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, image_data: "" }))}
              className="w-full text-xs text-red-400 hover:text-red-600 transition"
            >
              Quitar imagen
            </button>
          )}
        </div>
      </div>

      {/* Título */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">Título *</label>
        <input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Ej: Milanesa napolitana con papas"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {/* Descripción */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={2}
          placeholder="Incluye ensalada y bebida..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
        />
      </div>

      {/* Precio */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">Precio (ARS) *</label>
        <input
          type="number"
          min="0"
          step="100"
          value={form.price || ""}
          onChange={(e) => setForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
          placeholder="3500"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {msg && (
        <p className={`text-sm rounded-xl px-3 py-2 ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>
          {msg.text}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || uploading}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition"
      >
        {isPending ? "Guardando..." : "Guardar menú del día"}
      </button>
    </div>
  );
}
