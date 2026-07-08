import Link from "next/link";
import { getAdminCategories } from "@/lib/actions/admin";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const categories = await getAdminCategories();

  return (
    <div className="space-y-5 max-w-lg">
      {/* Header */}
      <div>
        <Link
          href="/admin/products"
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          ← Volver a productos
        </Link>
        <h1 className="text-xl font-bold text-gray-800 mt-1">Nuevo producto</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
