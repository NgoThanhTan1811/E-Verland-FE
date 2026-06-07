import { useState, useEffect, useRef } from "react";
import { Search, Package, ShoppingCart, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { productApi, orderApi } from "../services/api";
import type { ProductListItem, OrderListItem } from "../types";

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setProducts([]);
      setOrders([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      searchAll();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const searchAll = async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes] = await Promise.all([
        productApi.getAll({ page: 1, limit: 10, name: query }),
        orderApi.getAll({ page: 1, limit: 10, code: query }),
      ]);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
    setIsOpen(false);
    setQuery("");
  };

  const handleOrderClick = (orderId: string) => {
    navigate(`/orders?id=${orderId}`);
    setIsOpen(false);
    setQuery("");
  };

  const hasResults = products.length > 0 || orders.length > 0;

  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products, orders..."
          className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setProducts([]);
              setOrders([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Searching...
              </p>
            </div>
          ) : hasResults ? (
            <>
              {/* Products Section */}
              {products.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Products ({products.length})
                  </div>
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                    >
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          $
                          {(product.virtualPrice || product.basePrice).toFixed(
                            2,
                          )}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          product.status === "ACTIVE"
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {product.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Orders Section */}
              {orders.length > 0 && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-800">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Orders ({orders.length})
                  </div>
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleOrderClick(order.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.shopName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ${order.grandTotal.toFixed(2)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                            : order.status === "COMPLETED"
                              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                        }`}
                      >
                        {order.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No results found for "{query}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
