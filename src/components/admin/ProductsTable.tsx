"use client";

import { useTransition, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Link from "next/link";
import {
  toggleProductAvailability,
  deleteProduct,
  type AdminProduct,
} from "@/lib/actions/admin";

export default function ProductsTable({ products }: { products: AdminProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
        <p className="text-4xl mb-2">🍽️</p>
        <p className="text-sm">No hay productos cargados todavía.</p>
        <Link
          href="/admin/products/new"
          className="mt-4 inline-block text-sm text-brand-500 font-medium hover:underline"
        >
          Agregar el primero →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Desktop table */}
      <table className="w-full text-sm hidden md:table">
        <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Producto</th>
            <th className="px-4 py-3 text-left">Categoría</th>
            <th className="px-4 py-3 text-right">Precio</th>
            <th className="px-4 py-3 text-center">Estado</th>
            <th className="px-4 py-3 text-center" colSpan={2}>Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {products.map((p) => (
          <ProductMobileCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

function ProductRow({ product: p }: { product: AdminProduct }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    startTransition(async () => {
      await toggleProductAvailability(p.id, p.available);
    });
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      const res = await deleteProduct(p.id);
      if (!res.success) setError(res.error ?? "Error al eliminar.");
    });
  }

  return (
    <tr className={`hover:bg-gray-50 transition ${isPending ? "opacity-50" : ""}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
            {p.image_url ? (
              <Image src={p.image_url} alt={p.name} fill sizes="40px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-800">{p.name}</p>
            {p.description && (
              <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.description}</p>
            )}
            {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500">{p.category_name}</td>
      <td className="px-4 py-3 text-right font-semibold text-gray-800">
        ${parseFloat(p.price).toLocaleString("es-AR", { minimumFractionDigits: 0 })}
      </td>
      <td className="px-4 py-3 text-center">
        <AvailabilityToggle available={p.available} onToggle={handleToggle} disabled={isPending} />
      </td>
      <td className="px-4 py-3 text-center">
        <Link
          href={`/admin/products/${p.id}`}
          className="text-xs text-brand-500 hover:text-brand-700 transition"
        >
          Editar
        </Link>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
}

function ProductMobileCard({ product: p }: { product: AdminProduct }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    startTransition(async () => {
      await toggleProductAvailability(p.id, p.available);
    });
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteProduct(p.id);
      if (!res.success) setError(res.error ?? "Error al eliminar.");
    });
  }

  return (
    <div className={`flex items-center gap-3 p-4 ${isPending ? "opacity-50" : ""}`}>
      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
        {p.image_url ? (
          <Image src={p.image_url} alt={p.name} fill sizes="56px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{p.name}</p>
        <p className="text-xs text-gray-400">{p.category_name}</p>
        <p className="text-sm font-bold text-brand-600 mt-0.5">
          ${parseFloat(p.price).toLocaleString("es-AR", { minimumFractionDigits: 0 })}
        </p>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <AvailabilityToggle available={p.available} onToggle={handleToggle} disabled={isPending} />
        <Link
          href={`/admin/products/${p.id}`}
          className="text-xs text-brand-500 hover:text-brand-700"
        >
          Editar
        </Link>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

function AvailabilityToggle({
  available,
  onToggle,
  disabled,
}: {
  available: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      title={available ? "Pausar producto" : "Activar producto"}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-40 ${
        available ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          available ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
