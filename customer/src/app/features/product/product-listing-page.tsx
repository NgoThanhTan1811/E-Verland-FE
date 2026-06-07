import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { SlidersHorizontal, Grid3x3, List, X } from "lucide-react";
import { ProductCard } from "../../shared/components/product-card";
import { Button } from "../../shared/ui/button";
import {
  productService,
  ProductResponse,
  CategoryResponse,
  BrandResponse,
} from "../../../shared/services/product.service";
import { ITEMS_PER_PAGE } from "../../shared/constants";

export function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter state from URL params
  const keyword = searchParams.get("keyword") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const brandId = searchParams.get("brandId") || "";
  const minPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : undefined;
  const page = Number(searchParams.get("page") || "1");

  const [minPriceInput, setMinPriceInput] = useState(
    searchParams.get("minPrice") || "",
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    searchParams.get("maxPrice") || "",
  );
  const [keywordInput, setKeywordInput] = useState(keyword);

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.searchProducts({
        keyword: keyword || undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
        minPrice,
        maxPrice,
        page,
        limit: ITEMS_PER_PAGE,
      });
      setProducts(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.totalItems ?? res.total ?? 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, categoryId, brandId, minPrice, maxPrice, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [cats, brnds] = await Promise.all([
          productService.getCategories(),
          productService.searchBrands(),
        ]);
        setCategories(cats || []);
        setBrands(brnds || []);
      } catch {}
    };
    fetchFilters();
  }, []);

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    setSearchParams(next);
  };

  const clearFilters = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    setKeywordInput("");
    setSearchParams({});
  };

  const applyKeywordSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (keywordInput.trim()) next.set("keyword", keywordInput.trim());
    else next.delete("keyword");
    next.delete("page");
    setSearchParams(next);
  };

  const applyPriceFilter = () => {
    const next = new URLSearchParams(searchParams);
    if (minPriceInput) next.set("minPrice", minPriceInput);
    else next.delete("minPrice");
    if (maxPriceInput) next.set("maxPrice", maxPriceInput);
    else next.delete("maxPrice");
    next.delete("page");
    setSearchParams(next);
  };

  const goToPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  };

  const hasActiveFilters =
    keyword || categoryId || brandId || minPrice || maxPrice;

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {keyword ? `Kết quả: "${keyword}"` : "Tất cả sản phẩm"}
            </h1>
            <p className="text-neutral-600">{totalItems} sản phẩm</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 border-2 border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${viewMode === "grid" ? "bg-primary text-white" : "hover:bg-neutral-100"}`}
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${viewMode === "list" ? "bg-primary text-white" : "hover:bg-neutral-100"}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <form onSubmit={applyKeywordSearch} className="mb-6 flex gap-3">
          <input
            type="search"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, thương hiệu, từ khóa..."
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-card focus:border-primary focus:outline-none"
          />
          <Button type="submit">Tìm kiếm</Button>
        </form>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {keyword && (
              <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                Từ khóa: {keyword}
                <button onClick={() => updateParam("keyword", undefined)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {categoryId && (
              <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                Danh mục:{" "}
                {categories.find((c) => c.id === categoryId)?.name ||
                  categoryId}
                <button onClick={() => updateParam("categoryId", undefined)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {brandId && (
              <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                Thương hiệu:{" "}
                {brands.find((b) => b.id === brandId)?.name || brandId}
                <button onClick={() => updateParam("brandId", undefined)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                Giá: {minPrice ? `${minPrice.toLocaleString("vi-VN")}₫` : "0"} -{" "}
                {maxPrice ? `${maxPrice.toLocaleString("vi-VN")}₫` : "∞"}
                <button
                  onClick={() => {
                    updateParam("minPrice", undefined);
                    updateParam("maxPrice", undefined);
                    setMinPriceInput("");
                    setMaxPriceInput("");
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-error hover:underline"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div
            className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}
          >
            <div className="bg-card rounded-xl p-6 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Bộ lọc</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:underline"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Danh mục</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-2 rounded"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={categoryId === cat.id}
                        onChange={() => updateParam("categoryId", cat.id)}
                        className="rounded-full"
                      />
                      <span className="text-sm flex-1">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Thương hiệu</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {brands.map((brand) => (
                    <label
                      key={brand.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-2 rounded"
                    >
                      <input
                        type="radio"
                        name="brand"
                        checked={brandId === brand.id}
                        onChange={() => updateParam("brandId", brand.id)}
                        className="rounded-full"
                      />
                      <span className="text-sm flex-1">{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Khoảng giá</h3>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="Từ"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:border-primary focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Đến"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:border-primary focus:outline-none"
                  />
                </div>
                <Button size="sm" className="w-full" onClick={applyPriceFilter}>
                  Áp dụng
                </Button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-neutral-200 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-2xl mb-2">🔍</p>
                <h3 className="text-xl font-semibold mb-2">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="text-neutral-600 mb-4">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
                <Button onClick={clearFilters}>Xóa bộ lọc</Button>
              </div>
            ) : (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-3 gap-4"
                      : "space-y-4"
                  }
                >
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => goToPage(page - 1)}
                    >
                      Trước
                    </Button>
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      const p = i + 1;
                      return (
                        <Button
                          key={p}
                          variant={p === page ? "primary" : "outline"}
                          size="sm"
                          onClick={() => goToPage(p)}
                        >
                          {p}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && <span className="px-2">...</span>}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => goToPage(page + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
