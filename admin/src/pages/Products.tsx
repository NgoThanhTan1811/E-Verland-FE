import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { productApi } from "../services/api";
import type {
  ProductListItem,
  ProductStatus,
  ProductQueryParams,
} from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { PaginationControls } from "../components/PaginationControls";

export function Products() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ProductQueryParams>({
    page: 1,
    limit: 10,
    status: undefined,
    name: "",
  });
  
  const [moderation, setModeration] = useState<{
    isOpen: boolean;
    action: "hide" | "restore" | "delete";
    productId: string;
    reason: string;
  }>({ isOpen: false, action: "hide", productId: "", reason: "" });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getAll(filters);
      const products = response.items || response.data?.products || response.data?.items || [];
      setProducts(Array.isArray(products) ? products : []);
      setTotal(response.totalItems || response.data?.totalItems || 0);
    } catch (error: any) {
      console.error("Failed to load products:", error);
      // Handle ProductNotFound as empty list instead of error
      if (error?.message?.includes("ProductNotFound")) {
        setProducts([]);
        setTotal(0);
      } else {
        setProducts([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const executeModeration = async () => {
    const { action, productId, reason } = moderation;
    if (!reason.trim()) {
      toast.error("Moderation reason is required");
      return;
    }
    
    try {
      if (action === "hide") await productApi.hide(productId, reason);
      if (action === "restore") await productApi.restore(productId, reason);
      if (action === "delete") await productApi.delete(productId, reason);
      
      toast.success(`Product ${action}d successfully`);
      setModeration({ ...moderation, isOpen: false, reason: "" });
      loadProducts();
    } catch (error) {
      console.error(`Failed to ${action} product:`, error);
      toast.error(`Failed to ${action} product`);
    }
  };

  const getStatusColor = (status: ProductStatus) => {
    const colors: Record<ProductStatus, string> = {
      Published:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      Inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      Draft:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      OutOfStock: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    };
    return colors[status];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t.products.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t.products.subtitle} ({total} {t.products.total})
          </p>
        </div>
        <Link
          to="/products/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t.products.createProduct}
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.products.searchPlaceholder}
              value={filters.name}
              onChange={(e) =>
                setFilters({ ...filters, name: e.target.value, page: 1 })
              }
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filters.status || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: (e.target.value as ProductStatus) || undefined,
                  page: 1,
                })
              }
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.products.allStatus}</option>
              <option value="Published">{t.products.active}</option>
              <option value="Inactive">{t.products.inactive}</option>
              <option value="Draft">{t.products.draft}</option>
              <option value="OutOfStock">{t.products.banned}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                {t.common.loading}
              </p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <Package className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-900 dark:text-white font-medium">
              {t.products.noProductsFound}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filters.name || filters.status
                ? t.products.adjustFilters
                : t.products.noProductsMessage}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.products.product}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.products.name}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.products.basePrice}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.products.virtualPrice}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.products.rating}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.products.sold}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.products.status}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.products.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {product.basePrice?.toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {product.virtualPrice?.toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {(product.averageRate || 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {product.soldCount}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.status)}`}
                      >
                        {product.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/products/${product.id}`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title={t.products.viewDetails}
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <Link
                          to={`/products/${product.id}/edit`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title={t.products.edit}
                        >
                          <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <button
                          onClick={() => setModeration({ isOpen: true, action: "hide", productId: product.id, reason: "" })}
                          className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-950 rounded-lg transition-colors"
                          title="Hide Product"
                        >
                          <EyeOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        </button>
                        <button
                          onClick={() => setModeration({ isOpen: true, action: "restore", productId: product.id, reason: "" })}
                          className="p-2 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition-colors"
                          title="Restore Product"
                        >
                          <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </button>
                        <button
                          onClick={() => setModeration({ isOpen: true, action: "delete", productId: product.id, reason: "" })}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                          title={t.products.delete}
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <PaginationControls
            page={filters.page || 1}
            limit={filters.limit || 10}
            total={total}
            onPageChange={(page) => setFilters({ ...filters, page })}
            itemName={t.products.title.toLowerCase()}
          />
        )}
      </div>

      {/* Moderation Modal */}
      {moderation.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
              {moderation.action} Product
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for this moderation action.
            </p>
            <textarea
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              rows={3}
              placeholder="Enter reason..."
              value={moderation.reason}
              onChange={(e) => setModeration({ ...moderation, reason: e.target.value })}
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700"
                onClick={() => setModeration({ ...moderation, isOpen: false, reason: "" })}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 text-white rounded-lg capitalize ${
                  moderation.action === "delete" ? "bg-red-600 hover:bg-red-700" :
                  moderation.action === "hide" ? "bg-yellow-600 hover:bg-yellow-700" :
                  "bg-green-600 hover:bg-green-700"
                }`}
                onClick={executeModeration}
              >
                {moderation.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
