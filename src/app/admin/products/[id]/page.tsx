import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminProducts, getAdminCategories } from "@/lib/actions/admin";
import ProductForm from "@/components/admin/ProductForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getAdminCategories(),
  ]);

  const product = products.find((p) => p.id === parseInt(id));
  if (!product) notFound();

  const initial = {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    price: product.price,
    category_id: String(product.category_id),
    image_url: product.image_url ?? "",
    image_data: product.image_data ?? null,
    available: product.available,
  };

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <Link
          href="/admin/products"
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          ← Volver a productos
        </Link>
        <h1 className="text-xl font-bold text-gray-800 mt-1">Editar producto</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <ProductForm categories={categories} initial={initial} />
      </div>
    </div>
  );
}
