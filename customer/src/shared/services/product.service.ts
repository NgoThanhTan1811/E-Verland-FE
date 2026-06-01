import { apiRequest } from "./api-client";

export interface ProductSearchParams {
  keyword?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  brandId?: string;
  brand?: { id: string; name: string; slug?: string; logo?: string };
  sellerId?: string;
  sellerName?: string;
  categoryId?: string;
  category?: { id: string; name: string; slug?: string };
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  stock?: number;
  imageUrl?: string;
  imageUrls?: string[];
  images: string[];
  skus?: SkuResponse[];
  status?: number;
}

export interface SkuResponse {
  id: string;
  productId: string;
  skuCode?: string;
  skuValue: string;
  price: number;
  stock: number;
}

export interface CategoryResponse {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  icon?: string;
  productCount?: number;
}

export interface BrandResponse {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
}

export interface ProductSearchResponse {
  items: ProductResponse[];
  total: number;
  totalItems?: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const normalizeList = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const items = record.items ?? record.data ?? record.results;
    if (Array.isArray(items)) return items as T[];
  }
  return [];
};

const normalizeSearchResponse = (data: unknown): ProductSearchResponse => {
  if (Array.isArray(data)) {
    return {
      items: data as ProductResponse[],
      total: data.length,
      totalItems: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const nested =
      record.data && typeof record.data === "object"
        ? (record.data as Record<string, unknown>)
        : undefined;
    const items =
      record.items ?? record.results ?? nested?.items ?? nested?.results;
    const itemList = Array.isArray(items) ? (items as ProductResponse[]) : [];
    const totalItems =
      (typeof record.totalItems === "number" && record.totalItems) ||
      (typeof nested?.totalItems === "number" && nested.totalItems) ||
      (typeof record.total === "number" && record.total) ||
      (typeof nested?.total === "number" && nested.total) ||
      itemList.length;
    const limit =
      (typeof record.limit === "number" && record.limit) ||
      (typeof nested?.limit === "number" && nested.limit) ||
      itemList.length;
    const page =
      (typeof record.page === "number" && record.page) ||
      (typeof nested?.page === "number" && nested.page) ||
      1;
    const totalPages =
      (typeof record.totalPages === "number" && record.totalPages) ||
      (typeof nested?.totalPages === "number" && nested.totalPages) ||
      (limit > 0 ? Math.max(1, Math.ceil(totalItems / limit)) : 1);

    return {
      items: itemList,
      total: totalItems,
      totalItems,
      page,
      limit,
      totalPages,
      hasNext:
        (typeof record.hasNext === "boolean" && record.hasNext) ||
        (typeof nested?.hasNext === "boolean" && nested.hasNext) ||
        page < totalPages,
      hasPrevious:
        (typeof record.hasPrevious === "boolean" && record.hasPrevious) ||
        (typeof nested?.hasPrevious === "boolean" && nested.hasPrevious) ||
        page > 1,
    };
  }

  return {
    items: [],
    total: 0,
    totalItems: 0,
    page: 1,
    limit: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };
};

export const productService = {
  searchProducts: (params: ProductSearchParams) => {
    const query = new URLSearchParams();
    if (params.keyword) query.set("keyword", params.keyword);
    if (params.categoryId) query.set("categoryId", params.categoryId);
    if (params.brandId) query.set("brandId", params.brandId);
    if (params.minPrice !== undefined)
      query.set("minPrice", String(params.minPrice));
    if (params.maxPrice !== undefined)
      query.set("maxPrice", String(params.maxPrice));
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    return apiRequest<unknown>(`/Product/p/search?${query.toString()}`).then(
      normalizeSearchResponse,
    );
  },

  getProduct: (id: string) => apiRequest<ProductResponse>(`/product/${id}`),

  getCategories: async () => {
    const res = await apiRequest<unknown>("/Category");
    return normalizeList<CategoryResponse>(res);
  },

  getCategory: (id: string) => apiRequest<CategoryResponse>(`/Category/${id}`),

  searchBrands: async (keyword?: string) => {
    const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
    const res = await apiRequest<unknown>(`/Brand/search/brand${query}`);
    return normalizeList<BrandResponse>(res);
  },

  getBrand: (id: string) => apiRequest<BrandResponse>(`/Brand/${id}`),

  getSku: (id: string) => apiRequest<SkuResponse>(`/Sku/${id}`),
};
