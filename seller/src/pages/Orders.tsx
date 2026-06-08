import { useEffect, useState } from "react";
import { Filter, Eye, X, ShoppingCart, Download } from "lucide-react";
import { orderApi } from "../services/api";
import type {
  OrderListItem,
  OrderDetail,
  OrderStatus,
  PaymentStatus,
  OrderQueryParams,
} from "../types";
import { DateRangePicker } from "../components/DateRangePicker";
import { PaginationControls } from "../components/PaginationControls";

export function Orders() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<OrderQueryParams>({
    page: 1,
    limit: 10,
    status: undefined,
    paymentStatus: undefined,
    fromDate: undefined,
    toDate: undefined,
  });
  const [showFilters, setShowFilters] = useState(false);

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      PENDING: "Pending",
      CONFIRMED: "Confirmed",
      SHIPPING: "Shipping",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };

    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status?: PaymentStatus | number | string) => {
    if (status === undefined || status === null) return "—";
    const s = String(status);
    const labels: Record<string, string> = {
      PENDING: "Pending", PAID: "Paid", FAILED: "Failed", REFUNDED: "Refunded",
      "0": "Pending", "1": "Paid", "2": "Failed", "3": "Refunded",
    };
    return labels[s] || s;
  };

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getAll(filters);
      // orderApi.getAll now returns { items, totalItems, page, limit, totalPages } directly
      const nextOrders = response?.items || [];
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
      setTotal(response?.totalItems || 0);
      setTotalPages(response?.totalPages || 0);
    } catch (error) {
      console.error("Failed to load orders:", error);
      setOrders([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await orderApi.update({ id: orderId, status });
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        const updated = await orderApi.getById(orderId);
        const detail = updated?.data || (updated as any);
        setSelectedOrder(detail || null);
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Failed to update order status");
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      PENDING:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      CONFIRMED:
        "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      SHIPPING:
        "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
      COMPLETED:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    };
    return colors[status] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  };



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Orders
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage customer orders ({total} total)
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
            <select
              value={filters.status || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: (e.target.value as OrderStatus) || undefined,
                  page: 1,
                })
              }
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPING">Shipping</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={filters.paymentStatus || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  paymentStatus: (e.target.value as PaymentStatus) || undefined,
                  page: 1,
                })
              }
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Payment Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <DateRangePicker
              onDateRangeChange={(fromDate, toDate) => {
                setFilters((current) => ({
                  ...current,
                  fromDate: fromDate || undefined,
                  toDate: toDate || undefined,
                  page: 1,
                }));
              }}
            />

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filters</span>
            </button>

            <button
              onClick={() => {
                console.log("Export orders");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
          </div>

          {showFilters && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Advanced filters are limited by the current order API. Status,
                payment status, date range, page, and limit are supported.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading orders...
              </p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-900 dark:text-white font-medium">
              No orders found
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filters.status ||
              filters.paymentStatus ||
              filters.fromDate ||
              filters.toDate
                ? "Try adjusting your filters"
                : "Orders will appear here"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Shop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      #{order.code || order.id?.slice(0, 8) || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {order.firstProductName || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {order.shopName || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      ${(order.grandTotal || order.totalPrice || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status as OrderStatus)}`}
                      >
                        {getStatusLabel(order.status as OrderStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const response = await orderApi.getById(order.id);
                              const detail = response?.data || (response as any);
                              setSelectedOrder(detail || null);
                            } catch (e) {
                              console.error("Failed to fetch order detail:", e);
                            }
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > 0 && (
          <PaginationControls
            page={filters.page || 1}
            limit={filters.limit || 10}
            total={total}
            onPageChange={(page) => setFilters({ ...filters, page })}
            onLimitChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
            itemName="orders"
          />
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Order Details
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Order Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Order Code
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedOrder.code || selectedOrder.id?.slice(0, 8) || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Amount
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ${(selectedOrder.grandTotal || selectedOrder.totalPrice || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}
                    >
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Payment Status
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        selectedOrder.paymentStatus === "PAID"
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : selectedOrder.paymentStatus === "FAILED"
                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                            : selectedOrder.paymentStatus === "REFUNDED"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                      }`}
                    >
                      {getPaymentStatusLabel(selectedOrder.paymentStatus)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Date
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Name
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedOrder.receiverName || selectedOrder.receiver?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Phone
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedOrder.receiverPhone || selectedOrder.receiver?.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Shipping Address
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedOrder.receiverAddress || selectedOrder.receiver?.address || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {(selectedOrder.itemsSnapshot || selectedOrder.items || []).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.productName}
                        </p>
                        {item.skuValue && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.skuValue}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${((item.unitPrice ?? item.price ?? 0) * item.quantity).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ${(item.unitPrice ?? item.price ?? 0).toLocaleString()} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Update Status
                </h3>
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleUpdateStatus(
                      selectedOrder.id,
                      e.target.value as OrderStatus,
                    )
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="SHIPPING">Shipping</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
