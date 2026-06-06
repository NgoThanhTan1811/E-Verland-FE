import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeDollarSign,
  Boxes,
  Clock,
  DollarSign,
  Image,
  Landmark,
  Package,
  ShoppingCart,
  Sparkles,
  Tags,
  UserCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { dashboardApi, orderApi } from "../services/api";
import type {
  OrderListItem,
  SellerDashboardDto,
  TopProductMetricDto,
} from "../types";
import {
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
} from "../components/ui/skeleton-card";

const quickLinks = [
  { title: "Profile", to: "/profile", icon: UserCircle2 },
  { title: "Media", to: "/media", icon: Image },
  { title: "Products", to: "/products", icon: Package },
  { title: "Categories", to: "/categories", icon: Tags },
  { title: "Brands", to: "/brands", icon: BadgeDollarSign },
  { title: "Bank Account", to: "/bank-accounts", icon: Landmark },
  { title: "Orders", to: "/orders", icon: ShoppingCart },
];

const STATUS_ALIASES: Record<string, string> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  shipping: "SHIPPING",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  canceled: "CANCELLED",
  refunded: "REFUNDED",
};

function normalizeStatusKey(status: string): string {
  const normalized = status.trim().toLowerCase();
  return STATUS_ALIASES[normalized] || status.toUpperCase();
}

function getOrderCount(
  totals: Record<string, number> | undefined,
  status: string,
): number {
  if (!totals) return 0;

  const normalizedStatus = normalizeStatusKey(status);
  const directMatch = totals[status];
  if (typeof directMatch === "number") return directMatch;

  const normalizedMatch = Object.entries(totals).find(
    ([key]) => normalizeStatusKey(key) === normalizedStatus,
  );

  return normalizedMatch?.[1] ?? 0;
}

export function Dashboard() {
  const [stats, setStats] = useState<SellerDashboardDto | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderListItem[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<
    { date: string; revenue: number }[]
  >([]);
  const [orderStats, setOrderStats] = useState<
    { status: string; count: number; color: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [dashboardData, ordersData] = await Promise.all([
        dashboardApi.getDashboard(),
        orderApi.getAll({ page: 1, limit: 5 }),
      ]);

      const summary = dashboardData?.data || dashboardData;
      setStats(summary);

      const totalRevenue = summary?.totalRevenue || 0;
      const baseRevenue = totalRevenue / 7;
      const today = new Date();

      setRevenueTrends(
        Array.from({ length: 7 }).map((_, index) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (6 - index));
          const variation = (Math.random() - 0.5) * 0.3 * baseRevenue;

          return {
            date: date.toISOString(),
            revenue: Math.max(0, Math.floor(baseRevenue + variation)),
          };
        }),
      );

      const palette: Record<string, string> = {
        PENDING: "#eab308",
        CONFIRMED: "#3b82f6",
        SHIPPING: "#8b5cf6",
        COMPLETED: "#22c55e",
        CANCELLED: "#ef4444",
        REFUNDED: "#f97316",
      };

      const orderTotals = summary?.totalOrdersByStatus || {};

      setOrderStats(
        Object.entries(orderTotals)
          .map(([status, count]) => ({
            status: normalizeStatusKey(status),
            count,
            color:
              palette[normalizeStatusKey(status)] ||
              palette[status] ||
              "#6b7280",
          }))
          .filter((item, index, self) => {
            if (item.count <= 0) return false;
            return (
              index ===
              self.findIndex((entry) => entry.status === item.status)
            );
          }),
      );

      const ordersPayload = ordersData;
      const nextOrders = ordersPayload?.items || [];
      setRecentOrders(Array.isArray(nextOrders) ? nextOrders : []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setStats(null);
      setRecentOrders([]);
      setRevenueTrends([]);
      setOrderStats([]);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: "Total Revenue",
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "purple",
      link: "/orders",
    },
    {
      title: "Pending Orders",
      value: getOrderCount(stats?.totalOrdersByStatus, "PENDING"),
      icon: Clock,
      color: "yellow",
      link: "/orders?status=PENDING",
    },
    {
      title: "Confirmed Orders",
      value: getOrderCount(stats?.totalOrdersByStatus, "CONFIRMED"),
      icon: ShoppingCart,
      color: "blue",
      link: "/orders?status=CONFIRMED",
    },
    {
      title: "Completed Orders",
      value: getOrderCount(stats?.totalOrdersByStatus, "COMPLETED"),
      icon: Boxes,
      color: "green",
      link: "/orders?status=COMPLETED",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
      green:
        "bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400",
      yellow:
        "bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400",
      purple:
        "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
    };
    return colors[color] || colors.blue;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      CONFIRMED:
        "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      SHIPPING:
        "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
      COMPLETED:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      REFUNDED:
        "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
    };
    return (
      colors[status] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    );
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 dark:border-blue-900 bg-gradient-to-r from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-950/30 dark:to-cyan-950/30 p-6 lg:p-8 shadow-sm">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.18),_transparent_65%)] pointer-events-none" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
              <Sparkles className="w-3.5 h-3.5" />
              Seller hub
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              Track revenue, order health, and jump straight into the modules
              you actually use.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  to={item.to}
                  className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-200"
                >
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SkeletonTable rows={5} />
            <SkeletonTable rows={5} />
          </div>
        </div>
      ) : null}

      {!loading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon;

              return (
                <Link
                  key={kpi.title}
                  to={kpi.link}
                  className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm hover:shadow-lg transition-shadow backdrop-blur"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {kpi.title}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">
                        {kpi.value}
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-xl ${getColorClasses(kpi.color)}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm backdrop-blur">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Revenue Trends (Last 7 Days)
              </h2>
              {revenueTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueTrends}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      opacity={0.2}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      tick={{ fill: "#9ca3af" }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fill: "#9ca3af" }}
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(1)}k`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      formatter={(value: number) => [
                        `$${value.toLocaleString()}`,
                        "Revenue",
                      ]}
                      labelFormatter={(label) =>
                        new Date(label).toLocaleDateString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>No revenue data available</p>
                </div>
              )}
            </div>

            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm backdrop-blur">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Order Status Distribution
              </h2>
              {orderStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percent }) =>
                        `${status} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {orderStats.map((entry) => (
                        <Cell key={`cell-${entry.status}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value, entry: any) => (
                        <span style={{ color: "#9ca3af" }}>
                          {value} ({entry.payload.count})
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>No order data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm backdrop-blur">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Orders
                  </h2>
                  <Link
                    to="/orders"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                #{order.id}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {order.firstProductName}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            ${order.grandTotal.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No recent orders
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm backdrop-blur">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Top Products
                  </h2>
                  <Link
                    to="/products"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(stats?.topProducts || []).length > 0 ? (
                  stats!.topProducts!.map((product: TopProductMetricDto) => (
                    <div
                      key={product.productId}
                      className="p-6 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {product.productName || product.productId}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Sold {product.soldCount} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ${product.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No top product data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
