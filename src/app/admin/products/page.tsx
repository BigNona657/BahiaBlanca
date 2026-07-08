import Link from "next/link";
import { getAdminProducts } from "@/lib/actions/admin";
import ProductsTable from "@/components/admin/ProductsTable";

export const revalidate = 0;

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  const available = products.filter((p) => p.available).length;
  const paused = products.length - available;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Productos</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {available} disponibles · {paused} pausados
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shrink-0"
        >
          + Agregar
        </Link>
      </div>

      {/* Tabla */}
      <ProductsTable products={products} />
    </div>
  );
}
