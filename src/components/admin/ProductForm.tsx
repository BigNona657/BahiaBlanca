"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createProduct, type ProductFormData } from "@/lib/actions/admin";
import type { Category } from "@/types/menu";

const EMPTY: ProductFormData = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  image_url: "",
  available: true,
};

export default function ProductForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ProductFormData>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  function handleField(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.category_id) {
      setError("Seleccioná una categoría.");
      return;
    }

    startTransition(async () => {
      const res = await createProduct(form);
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

      {/* URL imagen */}
      <Field label="URL de imagen">
        <input
          name="image_url"
          type="url"
          placeholder="https://..."
          value={form.image_url}
          onChange={handleField}
          className={inputCls}
        />
      </Field>

      {/* Preview imagen */}
      {form.image_url && (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
          <Image
            src={form.image_url}
            alt="preview"
            fill
            sizes="96px"
            className="object-cover"
            onError={() => setForm((p) => ({ ...p, image_url: "" }))}
          />
        </div>
      )}

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

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Acciones */}
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
          disabled={isPending}
          className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition"
        >
          {isPending ? "Guardando..." : "Guardar producto"}
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
