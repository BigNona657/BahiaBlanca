"use client";

import { useState, useTransition } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/settings";
import type { Category } from "@/types/menu";

export default function CategoriesManager({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState(initial);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createCategory(newName.trim());
      if (res.success) {
        setNewName("");
        // Recarga optimista: agrega con id temporal, el revalidatePath actualiza
        setCategories((prev) => [
          ...prev,
          { id: Date.now(), name: newName.trim(), slug: "", image_url: null, sort_order: prev.length + 1 },
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

  return (
    <div className="space-y-4">
      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        {categories.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No hay categorías todavía.</p>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
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
