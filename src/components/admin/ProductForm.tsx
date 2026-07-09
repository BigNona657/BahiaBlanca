"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createProduct, updateProduct, type ProductFormData } from "@/lib/actions/admin";
import type { Category } from "@/types/menu";

type Props = {
  categories: Category[];
  initial?: ProductFormData & { id?: number };
};

const EMPTY: ProductFormData = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  image_url: "",
  available: true,
};

export default function ProductForm({ categories, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ProductFormData>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!initial?.id;

  function handleField(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir imagen");
      setForm((prev) => ({ ...prev, image_url: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.category_id) {
      setError("Seleccioná una categoría.");
      return;
    }

    startTransition(async () => {
      const res = isEdit
        ? await updateProduct(initial!.id!, form)
        : await createProduct(form);

      if (res.success) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setError(res.error ?? "Error al guardar.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Nombre */}
      <Field label="Nombre del producto *">
        <input
          name="name"
          required
          placeholder="Milanesa napolitana"
          value={form.name}
          onChange={handleField}
          className={inputCls}
        />
      </Field>

      {/* Descripción */}
      <Field label="Descripción">
        <textarea
          name="description"
          rows={2}
          placeholder="Con papas fritas y ensalada..."
          value={form.description}
          onChange={handleField}
          className={`${inputCls} resize-none`}
        />
      </Field>

      {/* Precio + Categoría */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Precio (ARS) *">
          <input
            name="price"
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="2800"
            value={form.price}
            onChange={handleField}
            className={inputCls}
          />
        </Field>
        <Field label="Categoría *">
          <select
            name="category_id"
            required
            value={form.category_id}
            onChange={handleField}
            className={inputCls}
          >
            <option value="">Seleccionar...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Imagen */}
      <Field label="Imagen del producto">
        <div className="flex items-center gap-3">
          {/* Preview */}
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
            {form.image_url ? (
              <Image
                src={form.image_url}
                alt="preview"
                fill
                sizes="80px"
                className="object-cover"
                onError={() => setForm((p) => ({ ...p, image_url: "" }))}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            {/* Upload desde dispositivo */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border border-dashed border-brand-400 text-brand-500 rounded-xl py-2 text-sm font-medium hover:bg-brand-50 transition disabled:opacity-50"
            >
              {uploading ? "Subiendo..." : "📁 Elegir imagen"}
            </button>

            {/* O pegar URL */}
            <input
              name="image_url"
              type="url"
              placeholder="O pegá una URL..."
              value={form.image_url}
              onChange={handleField}
              className={inputCls}
            />
          </div>
        </div>
      </Field>

      {/* Disponible */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          name="available"
          checked={form.available}
          onChange={handleField}
          className="w-4 h-4 accent-brand-500"
        />
        <span className="text-sm text-gray-700">Disponible al publicar</span>
      </label>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || uploading}
          className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition"
        >
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}
