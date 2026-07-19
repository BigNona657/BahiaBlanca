"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { saveDailyMenus, type DailyMenuItem } from "@/lib/actions/settings";
import { DAYS_OF_WEEK } from "@/lib/constants";

const EMPTY: DailyMenuItem = { title: "", description: "", price: 0, image_data: "", active: false };

export default function DailyMenuForm({ initial }: { initial: DailyMenuItem[] }) {
  const todayIndex = new Date().getDay();
  const [menus, setMenus] = useState<DailyMenuItem[]>(initial);
  const [activeDay, setActiveDay] = useState(todayIndex);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = menus[activeDay] ?? { ...EMPTY };

  function updateForm(patch: Partial<DailyMenuItem>) {
    setMenus((prev) => {
      const next = [...prev];
      next[activeDay] = { ...form, ...patch };
      return next;
    });
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
    if (form.active && !form.title.trim()) {
      setMsg({ ok: false, text: "El título es obligatorio si el menú está activo." });
      return;
    }
    if (form.active && (!form.price || form.price <= 0)) {
      setMsg({ ok: false, text: "El precio debe ser mayor a 0 si el menú está activo." });
      return;
    }
    setMsg(null);
    startTransition(async () => {
      const res = await saveDailyMenus(menus);
      setMsg(res.success
        ? { ok: true, text: "Menús guardados." }
        : { ok: false, text: res.error ?? "Error al guardar." }
      );
    });
  }

  return (
    <div className="space-y-4">
      {/* Tabs días */}
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {DAYS_OF_WEEK.map((day, i) => {
          const m = menus[i] ?? EMPTY;
          const isToday = i === todayIndex;
          const hasContent = !!m.title;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveDay(i)}
              className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                activeDay === i
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-300"
              }`}
            >
              <span>{day.slice(0, 3)}</span>
              <span className="text-[10px] font-normal opacity-80">
                {isToday ? "hoy" : hasContent ? (m.active ? "✓" : "—") : "vacío"}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 font-medium">{DAYS_OF_WEEK[activeDay]}</p>

      {/* Toggle activo */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm font-medium text-gray-700">Mostrar este día</span>
        <button
          type="button"
          onClick={() => updateForm({ active: !form.active })}
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
          placeholder="Ej: Milanesa napolitana con papas"
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
          onChange={(e) => updateForm({ price: parseFloat(e.target.value) || 0 })}
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
        {isPending ? "Guardando..." : "Guardar menús"}
      </button>
    </div>
  );
}
