import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Filter } from "lucide-react";
import type { OrderListItem, OrderStatus } from "../../types";
import { orderApi } from "../../services/api";

export function OrderList() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const response = await orderApi.getAll({
        page: currentPage,
        limit: 10,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      // orderApi.getAll now returns { items, totalItems, page, limit, totalPages } directly
      const nextOrders = response?.items || [];
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
      setTotalPages(response?.totalPages || 1);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "SHIPPING", label: "Shipping" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-neutral-900 mb-2">Orders</h1>
          <p className="text-neutral-600">Manage and track your orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-neutral-600">
            <Filter size={20} />
            <span className="text-sm font-medium">Filter by status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | "all");
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-neutral-500">Loading orders...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Package className="text-neutral-400 mb-4" size={48} />
            <p className="text-neutral-900 mb-1">No orders found</p>
            <p className="text-neutral-600 text-sm">
              {statusFilter !== "all"
                ? "Try a different status filter"
                : "Orders will appear here once customers place them"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Grand Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                        {order.id}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {order.shopName}
                          </p>
                          <p className="text-xs text-neutral-600">
                            {order.firstProductName}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        ${(order.grandTotal || order.totalPrice || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            order.status === "PENDING"
                              ? "bg-yellow-50 text-yellow-700"
                              : order.status === "CONFIRMED"
                                ? "bg-blue-50 text-blue-700"
                                : order.status === "SHIPPING"
                                  ? "bg-purple-50 text-purple-700"
                                  : order.status === "COMPLETED"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-sm text-neutral-900 hover:underline"
                        >
                          View Details
                        </Link>
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
