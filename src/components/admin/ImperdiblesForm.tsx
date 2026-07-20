"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { saveImperdibles, type ImperdibleItem } from "@/lib/actions/settings";

const EMPTY: ImperdibleItem = { title: "", description: "", price: 0, image_data: "", stock: undefined };

export default function ImperdiblesForm({ initial }: { initial: ImperdibleItem[] }) {
  const [items, setItems] = useState<ImperdibleItem[]>(initial);
  const [activeIndex, setActiveIndex] = useState<number | null>(initial.length > 0 ? 0 : null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = activeIndex !== null ? items[activeIndex] : null;

  function updateForm(patch: Partial<ImperdibleItem>) {
    if (activeIndex === null) return;
    setItems((prev) => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], ...patch };
      return next;
    });
  }

  function addItem() {
    const next = [...items, { ...EMPTY }];
    setItems(next);
    setActiveIndex(next.length - 1);
  }

  function removeItem(i: number) {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
    setActiveIndex(next.length === 0 ? null : Math.min(i, next.length - 1));
  }

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
      updateForm({ image_data: data.url });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Error al subir imagen." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSave() {
    for (const item of items) {
      if (!item.title.trim()) { setMsg({ ok: false, text: "Todos los imperdibles deben tener título." }); return; }
      if (!item.price || item.price <= 0) { setMsg({ ok: false, text: "Todos los imperdibles deben tener precio mayor a 0." }); return; }
    }
    setMsg(null);
    startTransition(async () => {
      const res = await saveImperdibles(items);
      setMsg(res.success
        ? { ok: true, text: "Imperdibles guardados." }
        : { ok: false, text: res.error ?? "Error al guardar." }
      );
    });
  }

  return (
    <div className="space-y-4">
      {/* Tabs de items */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap" style={{ scrollbarWidth: "none" }}>
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              activeIndex === i
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-300"
            }`}
          >
            {item.title.trim() || `Plato ${i + 1}`}
            <span
              onClick={(e) => { e.stopPropagation(); removeItem(i); }}
              className={`ml-0.5 rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none transition ${
                activeIndex === i ? "bg-white/30 hover:bg-white/50 text-white" : "bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-500"
              }`}
            >
              ×
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-brand-400 text-brand-500 hover:bg-brand-50 transition"
        >
          + Agregar
        </button>
      </div>

      {/* Editor del item activo */}
      {form !== null && activeIndex !== null ? (
        <div className="space-y-4">
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
                  onClick={() => updateForm({ image_data: "" })}
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
              onChange={(e) => updateForm({ title: e.target.value })}
              placeholder="Ej: Empanadas de carne"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              rows={2}
              placeholder="Docena de empanadas jugosas..."
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
              onChange={(e) => updateForm({ price: parseFloat(e.target.value) || 0 })}
              placeholder="3500"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          {/* Stock */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Stock (opcional)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock ?? ""}
              onChange={(e) => updateForm({ stock: e.target.value === "" ? undefined : parseInt(e.target.value) })}
              placeholder="Sin límite"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">
          Agregá un plato para empezar.
        </p>
      )}

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
        {isPending ? "Guardando..." : "Guardar imperdibles"}
      </button>
    </div>
  );
}
