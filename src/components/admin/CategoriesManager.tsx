"use client";

import { useState, useTransition, useRef } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryImage,
} from "@/lib/actions/settings";
import type { Category } from "@/types/menu";

export default function CategoriesManager({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState(initial);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createCategory(newName.trim());
      if (res.success) {
        setNewName("");
        setCategories((prev) => [
          ...prev,
          { id: Date.now(), name: newName.trim(), slug: "", image_url: null, image_data: null, sort_order: prev.length + 1 },
        ]);
      } else {
        setError(res.error ?? "Error al crear.");
      }
    });
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setError(null);
  }

  function handleUpdate(e: React.FormEvent, id: number) {
    e.preventDefault();
    if (!editingName.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await updateCategory(id, editingName.trim());
      if (res.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name: editingName.trim() } : c))
        );
        setEditingId(null);
      } else {
        setError(res.error ?? "Error al actualizar.");
      }
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteCategory(id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        setError(res.error ?? "Error al eliminar.");
      }
    });
  }

  async function handleImageChange(id: number, file: File) {
    if (file.size > 3 * 1024 * 1024) {
      setError("La imagen supera el límite de 3MB.");
      return;
    }
    setUploadingId(id);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Error al subir.");
      const saveRes = await updateCategoryImage(id, data.url);
      if (!saveRes.success) throw new Error(saveRes.error);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, image_url: data.url } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen.");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        {categories.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No hay categorías todavía.</p>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 px-4 py-3">

            {/* Imagen / botón subir */}
            <div
              className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 cursor-pointer group"
              onClick={() => fileInputRefs.current[cat.id]?.click()}
            >
              {(cat.image_data || cat.image_url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.image_data || cat.image_url!}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                {uploadingId === cat.id ? (
                  <span className="text-white text-xs">...</span>
                ) : (
                  <span className="text-white text-lg">📷</span>
                )}
              </div>
              <input
                ref={(el) => { fileInputRefs.current[cat.id] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageChange(cat.id, file);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Nombre / edición */}
            {editingId === cat.id ? (
              <form onSubmit={(e) => handleUpdate(e, cat.id)} className="flex-1 flex gap-2">
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 border border-brand-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded-xl font-medium disabled:opacity-50"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
                <button
                  onClick={() => startEdit(cat)}
                  className="text-xs text-brand-500 hover:text-brand-700 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={isPending}
                  className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition"
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Crear nueva */}
      <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm p-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nueva categoría..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button
          type="submit"
          disabled={isPending || !newName.trim()}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 rounded-xl text-sm font-semibold transition"
        >
          + Agregar
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}
    </div>
  );
}
