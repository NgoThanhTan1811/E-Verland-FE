import { useEffect, useState } from "react";
import { Search, Filter, Eye, X, ShoppingCart, Download } from "lucide-react";
import { orderApi } from "../services/api";
import type {
    OrderListItem,
    OrderDetail,
    OrderStatus,
    OrderQueryParams,
    OrderItemSnapshot,
} from "../types";
import { DateRangePicker } from "../components/DateRangePicker";
import { useLanguage } from "../contexts/LanguageContext";
import { PaginationControls } from "../components/PaginationControls";

export function Orders() {
    const { t } = useLanguage();
    const [orders, setOrders] = useState<OrderListItem[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState<OrderQueryParams>({
        page: 1,
        limit: 10,
        status: undefined,
        code: "",
        startDate: undefined,
        endDate: undefined,
    });
    const [orderItem, setOrderItem] = useState<OrderItemSnapshot>();
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadOrders();
    }, [filters]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response: any = await orderApi.getAll(filters);
            const orders = response.items || response.data?.items || response.data?.orders || response.orders || [];
            setOrders(Array.isArray(orders) ? orders : []);
            setTotal(response.totalItems || response.data?.totalItems || 0);
        } catch (error) {
            console.error("Failed to load orders:", error);
            setOrders([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
        try {
            await orderApi.update({ id: orderId, status });
            loadOrders();
            if (selectedOrder?.id === orderId) {
                const updated: any = await orderApi.getById(orderId);
                setSelectedOrder(updated.data || updated);
            }
        } catch (error) {
            console.error("Failed to update order status:", error);
            alert("Failed to update order status");
        }
    };

    const getStatusColor = (status: OrderStatus | string) => {
        const colors: Record<string, string> = {
            Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
            Confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
            Shipping: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
            Completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
            Canceled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
        };
        return colors[status as string] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {t.orders.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {t.orders.subtitle} ({total} {t.orders.total})
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t.orders.searchPlaceholder}
                                value={filters.code}
                                onChange={(e) =>
                                    setFilters({ ...filters, code: e.target.value, page: 1 })
                                }
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Status Filter */}
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
                            <option value="">{t.orders.allStatus}</option>
                            <option value="Pending">{t.orders.pending}</option>
                            <option value="Confirmed">{t.orders.confirmed}</option>
                            <option value="Shipping">{t.orders.shipping}</option>
                            <option value="Completed">{t.orders.completed}</option>
                            <option value="Canceled">{t.orders.cancelled}</option>
                        </select>

                        {/* Date Range */}
                        <DateRangePicker
                            onDateRangeChange={(startDate, endDate) => {
                                setFilters({
                                    ...filters,
                                    startDate: startDate || undefined,
                                    endDate: endDate || undefined,
                                    page: 1,
                                });
                            }}
                        />

                        {/* Advanced Filters Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            <span className="text-sm">{t.orders.filters}</span>
                        </button>

                        {/* Export Button */}
                        <button
                            onClick={() => {
                                // Handle export to CSV
                                console.log("Export orders");
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span className="text-sm">{t.orders.export}</span>
                        </button>
                    </div>

                    {/* Advanced Filters Panel */}
                    {showFilters && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Payment Method
                                    </label>
                                    <select
                                        value={filters.paymentMethod || ""}
                                        onChange={(e) =>
                                            setFilters({ ...filters, paymentMethod: e.target.value || undefined, page: 1 })
                                        }
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All</option>
                                        <option value="OnlineBanking">Online Banking</option>
                                        <option value="COD">COD</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Payment Status
                                    </label>
                                    <select
                                        value={filters.paymentStatus || ""}
                                        onChange={(e) =>
                                            setFilters({ ...filters, paymentStatus: e.target.value || undefined, page: 1 })
                                        }
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Success">Success</option>
                                        <option value="Failed">Failed</option>
                                        <option value="Refunded">Refunded</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Orders Table */}
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
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                        <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-900 dark:text-white font-medium">
                            {t.orders.noOrdersFound}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {filters.code || filters.status
                                ? t.orders.adjustFilters
                                : t.orders.ordersWillAppear}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t.orders.orderCode}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t.orders.product}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t.orders.total}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t.orders.status}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t.orders.created}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t.orders.actions}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {order.code}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-900 dark:text-white">
                                                    {order.firstProductName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {order.grandTotal.toLocaleString()} VND
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status as OrderStatus)}`}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={async () => {
                                                        const response: any = await orderApi.getById(order.id);
                                                        setSelectedOrder(response.data || response);
                                                    }}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                    title={t.orders.viewDetails}
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

                {/* Pagination */}
                {!loading && total > 0 && (
                    <PaginationControls
                        page={filters.page || 1}
                        limit={filters.limit || 10}
                        total={total}
                        onPageChange={(page) => setFilters({ ...filters, page })}
                        itemName={t.orders.title.toLowerCase()}
                    />
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {t.orders.orderDetails}
                            </h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Order Info */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                                    {t.orders.orderInfo}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {t.orders.orderCode}
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {selectedOrder.code}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {t.orders.totalAmount}
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            ${selectedOrder.grandTotal.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {t.orders.status}
                                        </p>
                                        <span
                                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}
                                        >
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {t.orders.date}
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {new Date(selectedOrder.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                                    {t.orders.customerInfo}
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {t.orders.customerName}
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {selectedOrder.receiverName || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {t.orders.phone}
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {selectedOrder.receiverPhone || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {t.orders.shippingAddress}
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {selectedOrder.receiverAddress || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                                    {t.orders.orderItems}
                                </h3>
                                <div className="space-y-3">
                                    {selectedOrder.itemsSnapshot.map((item) => (
                                        <div
                                            key={item.id}
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
                                                    {t.orders.quantity}: {item.quantity}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    ${(item.price * item.quantity).toLocaleString()}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    ${item.price.toLocaleString()} {t.orders.each}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Update Status */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                                    {t.orders.updateStatus}
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
                                    <option value="">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Shipping">Shipping</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Canceled">Canceled</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
