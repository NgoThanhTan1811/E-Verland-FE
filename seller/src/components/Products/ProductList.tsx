import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import type { ProductListItem } from "../../types";
import { productApi } from "../../services/api";

export function ProductList() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadProducts();
  }, [currentPage, searchQuery]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const response = await productApi.getAll({
        page: currentPage,
        limit: 10,
        name: searchQuery,
      });
      const payload = response.data as any;
      setProducts(payload?.products || payload?.items || payload?.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await productApi.delete(id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-neutral-900 mb-2">Products</h1>
          <p className="text-neutral-600">Manage your product catalog</p>
        </div>
        <Link
          to="/products/create"
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <Plus size={20} />
          Create Product
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-neutral-500">Loading products...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Package className="text-neutral-400 mb-4" size={48} />
            <p className="text-neutral-900 mb-1">No products found</p>
            <p className="text-neutral-600 text-sm">
              {searchQuery
                ? "Try a different search term"
                : "Get started by creating your first product"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Base Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Virtual Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-neutral-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {product.soldCount} sold ·{" "}
                          {product.averageRate.toFixed(1)} ★
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        ${product.basePrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        ${product.virtualPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            product.status === "ACTIVE"
                              ? "bg-green-50 text-green-700"
                              : product.status === "INACTIVE"
                                ? "bg-red-50 text-red-700"
                                : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {product.images.length} images
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/edit/${product.id}`}
                            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
              <p className="text-sm text-neutral-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-neutral-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-neutral-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
