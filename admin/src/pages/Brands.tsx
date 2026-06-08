import { useEffect, useState } from "react";
import { Search, Filter, Plus, Edit, Trash2, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { brandApi } from "../services/api";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { PaginationControls } from "../components/PaginationControls";

export function Brands() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadBrands();
  }, [page, limit]);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const response = await brandApi.getAll({ page, limit });
      const items = response.items || response.data?.items || response.data || response || [];
      setBrands(Array.isArray(items) ? items : []);
      setTotal(response.totalItems || response.data?.totalItems || items.length || 0);
    } catch (error) {
      console.error("Failed to load brands:", error);
      toast.error("Failed to load brands");
      setBrands([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };



  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;
    try {
      await brandApi.delete(id);
      toast.success("Brand deleted successfully");
      loadBrands();
    } catch (error) {
      toast.error("Failed to delete brand");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t.nav.brands || "Brands"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage product brands
          </p>
        </div>
        <button
          onClick={() => navigate("/brands/create")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {brands.length === 0 ? (
          <div className="p-8 text-center">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-900 dark:text-white font-medium">No brands found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {brand.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/brands/${brand.id}/edit`)} className="p-2 text-gray-400 hover:text-blue-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(brand.id)} className="p-2 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && total > 0 && (
          <PaginationControls
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            itemName={t.nav.brands?.toLowerCase() || "brands"}
          />
        )}
      </div>

    </div>
  );
}
