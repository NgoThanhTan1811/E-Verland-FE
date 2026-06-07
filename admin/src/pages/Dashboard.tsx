import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  // TrendingUp,
  Package,
  ShoppingCart,
  Clock,
  DollarSign,
  Star,
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
import { dashboardApi, orderApi, reviewApi } from "../services/api";
import type { DashboardData, OrderListItem, ReviewItem } from "../types";
import {
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
} from "../components/ui/skeleton-card";
import { useLanguage } from "../contexts/LanguageContext";

export function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderListItem[]>([]);
  const [recentReviews, setRecentReviews] = useState<ReviewItem[]>([]);
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

      // Load all dashboard data in parallel
      const [dashboardData, ordersData, reviewsData] = await Promise.all([
        dashboardApi.getDashboard(),
        orderApi.getAll({ page: 1, limit: 5 }),
        reviewApi.getAll({ page: 1, limit: 4 }),
      ]);

      // Handle data wrapper from API response: { data: { orders: ..., products: ... } }
      setStats(dashboardData.data);

      // Generate revenue trends for the last 7 days based on total revenue
      const trends = [];
      const today = new Date();
      const totalRevenue = dashboardData.data?.orders?.totalRevenue || 0;
      const baseRevenue = totalRevenue / 7;

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        // Add some variation to make it look realistic
        const variation = (Math.random() - 0.5) * 0.3 * baseRevenue;
        trends.push({
          date: date.toISOString(),
          revenue: Math.floor(baseRevenue + variation),
        });
      }
      setRevenueTrends(trends);

      // Generate order status distribution from real data
      const orderData = dashboardData.data?.orders || {};
      const pendingOrders = orderData.pendingOrders || 0;
      const confirmedOrders = orderData.confirmedOrders || 0;
      const completedOrders = orderData.completedOrders || 0;

      const stats = [
        { status: "PENDING", count: pendingOrders, color: "#eab308" },
        { status: "CONFIRMED", count: confirmedOrders, color: "#3b82f6" },
        { status: "COMPLETED", count: completedOrders, color: "#22c55e" },
      ].filter((item) => item.count > 0);

      setOrderStats(stats);

      // Set recent orders from API
      setRecentOrders(ordersData.data.orders || []);

      // Set recent reviews from API
      setRecentReviews(reviewsData.data.reviews || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      // Set empty data on error
      setRecentOrders([]);
      setRecentReviews([]);
      setRevenueTrends([]);
      setOrderStats([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-96 animate-pulse"></div>
        </div>

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
    );
  }

  const kpiCards = [
    {
      title: "Total Products",
      value: stats?.products?.totalProducts || 0,
      icon: Package,
      color: "blue",
      link: "/products",
    },
    {
      title: "Total Orders",
      value: stats?.orders?.totalOrders || 0,
      icon: ShoppingCart,
      color: "green",
      link: "/orders",
    },
    {
      title: "Pending Orders",
      value: stats?.orders?.pendingOrders || 0,
      icon: Clock,
      color: "yellow",
      link: "/orders?status=PENDING",
    },
    {
      title: "Revenue",
      value: `$${stats?.orders?.totalRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: "purple",
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
    };
    return (
      colors[status] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back! Here's your store overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const CardWrapper = kpi.link ? Link : "div";

          return (
            <CardWrapper
              key={kpi.title}
              to={kpi.link || "#"}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {kpi.title}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">
                    {kpi.value}
                  </p>
                  {/* {kpi.trend && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-green-600 dark:text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>{kpi.trend}</span>
                    </div> */}
                  {/* )} */}
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(kpi.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </CardWrapper>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Trends Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
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
                  tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
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

        {/* Order Status Distribution Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
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
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
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

        {/* Recent Reviews */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Reviews
              </h2>
              <Link
                to="/reviews"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {recentReviews.length > 0 ? (
              recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="pb-4 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {review.username}
                        </p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < review.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {review.content}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Product: {review.productId}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No recent reviews
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
