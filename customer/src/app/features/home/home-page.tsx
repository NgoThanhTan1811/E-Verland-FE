import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { ProductCard } from "../../shared/components/product-card";
import { Button } from "../../shared/ui/button";
import {
  productService,
  ProductResponse,
  CategoryResponse,
} from "../../../shared/services/product.service";

const HERO_BANNERS = [
  {
    id: "1",
    title: "Flash Sale hôm nay",
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop",
    link: "/products",
  },
  {
    id: "2",
    title: "Laptop giảm đến 50%",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=400&fit=crop",
    link: "/products",
  },
  {
    id: "3",
    title: "Thời trang mùa mới",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=400&fit=crop",
    link: "/products",
  },
];

export function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productService.searchProducts({ page: 1, limit: 12 }),
          productService.getCategories(),
        ]);
        setProducts(productsRes.items || []);
        setCategories(categoriesRes || []);
      } catch {
        // silently fail - show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const nextBanner = () =>
    setCurrentBanner((prev) => (prev + 1) % HERO_BANNERS.length);
  const prevBanner = () =>
    setCurrentBanner(
      (prev) => (prev - 1 + HERO_BANNERS.length) % HERO_BANNERS.length,
    );

  const flashSaleProducts = products
    .filter((p) => p.discount && p.discount > 0)
    .slice(0, 6);
  const recommendedProducts = products.slice(0, 6);
  const featuredProducts = products.slice(0, 12);

  return (
    <div className="bg-neutral-50">
      {/* Hero Banner */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="relative rounded-xl overflow-hidden">
            <div className="aspect-[3/1] relative">
              <img
                src={HERO_BANNERS[currentBanner].image}
                alt={HERO_BANNERS[currentBanner].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                <div className="container mx-auto px-4">
                  <div className="max-w-xl text-white">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                      {HERO_BANNERS[currentBanner].title}
                    </h1>
                    <p className="text-lg mb-6">
                      Khuyến mãi lớn - Giảm giá đến 50%
                    </p>
                    <Link to={HERO_BANNERS[currentBanner].link}>
                      <Button size="lg">Mua ngay</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={prevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {HERO_BANNERS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentBanner ? "bg-white w-8" : "bg-white/50"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-background py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-6">Danh mục nổi bật</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-neutral-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  to={`/products?categoryId=${category.id}`}
                  className="group flex flex-col items-center p-4 bg-card rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
                >
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-10 h-10 object-contain mb-2"
                    />
                  ) : (
                    <div className="text-4xl mb-2">🛍️</div>
                  )}
                  <div className="text-center text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Flash Sale */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-error to-warning rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 fill-current" />
                <div>
                  <h2 className="text-2xl font-bold">Flash Sale</h2>
                  <p className="text-sm opacity-90">Ưu đãi hôm nay</p>
                </div>
              </div>
              <Link to="/products">
                <Button variant="secondary">Xem tất cả</Button>
              </Link>
            </div>
          </div>
          {flashSaleProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {flashSaleProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-neutral-600">
              Chưa có sản phẩm khuyến mãi để hiển thị.
            </div>
          )}
        </div>
      </section>

      {/* Recommended Products */}
      <section className="bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Gợi ý hôm nay</h2>
            <Link to="/products" className="text-primary hover:underline">
              Xem tất cả
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-neutral-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-neutral-600">
              Chưa có gợi ý sản phẩm để hiển thị.
            </div>
          )}
        </div>
      </section>

      {/* Deal Banners */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              to="/products"
              className="group relative rounded-xl overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=300&fit=crop"
                alt="Laptop Sale"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center p-8">
                <div className="text-white">
                  <h3 className="text-2xl font-bold mb-2">Laptop Sale</h3>
                  <p className="mb-4">Giảm đến 50%</p>
                  <Button variant="secondary">Mua ngay</Button>
                </div>
              </div>
            </Link>

            <Link
              to="/products"
              className="group relative rounded-xl overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=300&fit=crop"
                alt="Fashion Sale"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center p-8">
                <div className="text-white">
                  <h3 className="text-2xl font-bold mb-2">Thời trang Hot</h3>
                  <p className="mb-4">Xu hướng mới nhất</p>
                  <Button variant="secondary">Khám phá</Button>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* All Products */}
      <section className="bg-background py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-6">Tất cả sản phẩm</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-neutral-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link to="/products">
                  <Button variant="outline" size="lg">
                    Xem thêm sản phẩm
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <h3 className="text-xl font-semibold mb-2">
                Chưa có sản phẩm để hiển thị
              </h3>
              <p className="text-neutral-600 mb-4">
                Hệ thống hiện chưa trả về danh sách sản phẩm cho trang chủ.
              </p>
              <Link to="/products">
                <Button>Xem toàn bộ sản phẩm</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
