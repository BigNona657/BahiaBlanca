import { getAdminCategories } from "@/lib/actions/admin";
import CategoriesManager from "@/components/admin/CategoriesManager";

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();
  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Categorías</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {categories.length} categorías · se usan como filtros en el menú
        </p>
      </div>
      <CategoriesManager initial={categories} />
    </div>
  );
}
