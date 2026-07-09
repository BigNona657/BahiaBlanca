"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { saveAppSettings, type AppSettings } from "@/lib/actions/settings";

export default function SettingsForm({ initial }: { initial: AppSettings }) {
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir imagen.");
      setForm((p) => ({ ...p, logo_data: data.url }));
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Error al subir logo." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await saveAppSettings(form);
      setMsg(res.success
        ? { ok: true, text: "Configuración guardada." }
        : { ok: false, text: res.error ?? "Error al guardar." }
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-gray-500">Logo del negocio</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {form.logo_data ? (
              <Image src={form.logo_data} alt="logo" width={80} height={80} className="object-contain rounded-full" />
            ) : (
              <span className="text-3xl">🍽️</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border border-dashed border-brand-400 text-brand-500 rounded-xl py-2 text-sm font-medium hover:bg-brand-50 transition disabled:opacity-50"
            >
              {uploading ? "Subiendo..." : "📁 Elegir logo"}
            </button>
            {form.logo_data && (
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, logo_data: "" }))}
                className="w-full text-xs text-red-400 hover:text-red-600 transition"
              >
                Quitar logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tamaño del logo */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">
          Tamaño del logo — {form.logo_size}px
        </label>
        <input
          type="range"
          min={36}
          max={46}
          step={2}
          value={form.logo_size}
          onChange={(e) => setForm((p) => ({ ...p, logo_size: Number(e.target.value) }))}
          className="w-full accent-brand-500"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>36px</span>
          <span>46px</span>
        </div>
      </div>

      {/* Nombre */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">Nombre del negocio</label>
        <input
          value={form.business_name}
          onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))}
          required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {msg && (
        <p className={`text-sm rounded-xl px-3 py-2 ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || uploading}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition"
      >
        {isPending ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}
