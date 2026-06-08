import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Package,
  MapPin,
  Tag,
  Heart,
  Eye,
  ShoppingCart,
  Star,
} from "lucide-react";
import { productApi } from "../services/api";
import type { ProductDetail as ProductDetailType } from "../types";

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetailType | null>(null);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      const response = await productApi.getById(productId);
      setProduct(response.data || response);
    } catch (error) {
      console.error("Failed to load product:", error);
      alert("Failed to load product. Returning to product list.");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Published:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      Inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      Draft:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      OutOfStock: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    };
    return colors[status] || colors.Inactive;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white font-medium">
            Product not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </button>
        </div>
        <Link
          to={`/products/${product.id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Edit2 className="w-5 h-5" />
          Edit Product
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Product Images
            </h2>
            <div className="space-y-4">
              {(product.images || []).map((image, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
                >
                  <img
                    src={image}
                    alt={`${product.name} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ))}
              {(product.images || []).length === 0 && (
                <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {product.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  ID: {product.id}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(product.status)}`}
              >
                {product.status}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Rating
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(product.averageRate || 0).toFixed(1)} ({product.ratingCount || 0})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sold
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {product.soldCount}
                  </p>
                </div>
              </div>
              {/* <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Views
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {product.viewCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Likes
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {product.likeCount}
                  </p>
                </div>
              </div> */}
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Base Price
                </p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {product.basePrice.toLocaleString()} VND
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Virtual Price
                </p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {product.virtualPrice.toLocaleString()} VND
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Min Price
                </p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {product.minPrice.toLocaleString()} VND
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Max Price
                </p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {product.maxPrice.toLocaleString()} VND
                </p>
              </div>
            </div>

            {/* Stock & Availability */}
            <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Stock
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {product.totalStock} units
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Availability
                </p>
                <p className="text-lg font-semibold">
                  <span
                    className={
                      product.isAvailable
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {product.isAvailable ? "Available" : "Out of Stock"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Approved
                </p>
                <p className="text-lg font-semibold">
                  <span
                    className={
                      product.isApproved
                        ? "text-green-600 dark:text-green-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }
                  >
                    {product.isApproved ? "Yes" : "Pending"}
                  </span>
                </p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Brand & Location */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Brand & Location
            </h2>
            <div className="space-y-4">
              {product.brandName && (
                <div className="flex items-center gap-3">
                  {product.brandLogo && (
                    <img
                      src={product.brandLogo}
                      alt={product.brandName}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
                    />
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Brand
                    </p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {product.brandName}
                    </p>
                  </div>
                </div>
              )}
              {product.provinceName && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Location
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {[
                        product.wardName,
                        product.districtName,
                        product.provinceName,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          {(product.categories || []).length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Categories
              </h2>
              <div className="flex flex-wrap gap-2">
                {(product.categories || []).map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  >
                    {category.logo && (
                      <img
                        src={category.logo}
                        alt={category.name}
                        className="w-6 h-6 rounded"
                      />
                    )}
                    <span className="text-gray-900 dark:text-white">
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variants */}
          {(product.variants || []).length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Variants
              </h2>
              <div className="space-y-4">
                {(product.variants || []).map((variant, index) => (
                  <div key={index}>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {variant.value}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(variant.options || []).map((option, optIndex) => (
                        <span
                          key={optIndex}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attributes */}
          {(product.attributes || []).length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Attributes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(product.attributes || []).map((attribute, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {attribute.name}:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {attribute.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SKUs */}
          {(product.skus || []).length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                SKUs ({(product.skus || []).length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        SKU Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Image
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {(product.skus || []).map((sku) => (
                      <tr key={sku.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {sku.value}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {sku.price.toLocaleString()} VND
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {sku.stock}
                        </td>
                        <td className="px-4 py-3">
                          {sku.image ? (
                            <img
                              src={sku.image}
                              alt={sku.value}
                              className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Size Guide */}
          {product.sizeGuide && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Size Guide
              </h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {product.sizeGuide}
              </p>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
}
