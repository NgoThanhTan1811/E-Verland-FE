import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Upload, X, Image } from "lucide-react";
import { mediaApi, productApi, categoryApi, skuApi } from "../services/api";
import { MediaImage } from "../components/MediaImage";
import type { CreateProductDto, ProductStatus, ProductVariant, CategoryItem } from "../types";
import { toast } from "sonner";

export function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<CreateProductDto>({
    name: "",
    basePrice: 0,
    virtualPrice: 0,
    brandId: "",
    images: [],
    variants: [],
    description: "",
    sizeGuide: "",
    provinceId: undefined,
    districtId: undefined,
    wardId: undefined,
    status: "DRAFT",
    categories: [],
    skus: [],
    attributes: [],
    stock: 1,
  });

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [skus, setSkus] = useState<
    {
      id: string;
      value?: string;
      price: number;
      stock: number;
      url?: string;
      skuCode?: string;
      isActive?: boolean;
      optionValues?: Record<string, string>;
    }[]
  >([]);
  const [originalSkus, setOriginalSkus] = useState<any[]>([]);
  const [originalVariants, setOriginalVariants] = useState<ProductVariant[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState("");

  interface CategoryNode extends CategoryItem {
    children: CategoryNode[];
    depth: number;
  }

  const categoryTreeOptions = useMemo(() => {
    const map = new Map<string, CategoryNode>();
    categories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [], depth: 0 });
    });

    const getParentId = (cat: any) => {
      return cat.parentCategoryId || cat.parentCateId || cat.parentId || null;
    };

    const roots: CategoryNode[] = [];
    categories.forEach((cat) => {
      const node = map.get(cat.id)!;
      const parentId = getParentId(cat);
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const assignDepth = (nodes: CategoryNode[], currentDepth: number) => {
      nodes.forEach((node) => {
        node.depth = currentDepth;
        if (node.children.length > 0) {
          assignDepth(node.children, currentDepth + 1);
        }
      });
    };
    assignDepth(roots, 0);

    const flattened: CategoryNode[] = [];
    const recurse = (nodes: CategoryNode[]) => {
      nodes.forEach((node) => {
        flattened.push(node);
        if (node.children.length > 0) {
          recurse(node.children);
        }
      });
    };
    recurse(roots);
    return flattened;
  }, [categories]);

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => {
      map.set(cat.id, cat.name);
    });
    return map;
  }, [categories]);

  useEffect(() => {
    loadCategories();
    if (isEdit && id) {
      loadProduct(id);
    }
  }, [id, isEdit]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoryApi.getAll();
      const payload = response?.data ?? response;
      const list =
        payload?.items || payload?.categories || payload?.data || payload || [];
      setCategories(list);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const addCategory = () => {
    if (
      pendingCategoryId &&
      !formData.categories.includes(pendingCategoryId)
    ) {
      setFormData({
        ...formData,
        categories: [...formData.categories, pendingCategoryId],
      });
      setPendingCategoryId("");
    }
  };

  const removeCategory = (categoryIdToRemove: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((cId) => cId !== categoryIdToRemove),
    });
  };

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      const response = await productApi.getById(productId);
      const product: any = response?.data || response;
      if (!product) {
        throw new Error("No product data returned");
      }
      setFormData({
        name: product.name || "",
        basePrice: product.basePrice ?? 0,
        virtualPrice: product.virtualPrice ?? 0,
        brandId: product.brandId || "",
        images: product.images || product.imageUrls || [],
        variants: product.variants || [],
        description: product.description || "",
        sizeGuide: product.sizeGuide || "",
        provinceId: product.provinceId,
        districtId: product.districtId,
        wardId: product.wardId,
        status: product.status || "DRAFT",
        categories: product.categoryIds
          ? product.categoryIds
          : Array.isArray(product.categories)
            ? product.categories.map((c: any) => (typeof c === "object" ? c.id : c))
            : [],
        skus:
          (product.skus || []).map((sku: any) => ({
            value: sku.value || "",
            price: sku.price ?? 0,
            stock: sku.stock ?? 0,
            image: sku.image || "",
          })) || [],
        attributes: Array.isArray(product.attributes)
          ? product.attributes
          : product.attributes && typeof product.attributes === "object"
            ? Object.entries(product.attributes).map(([name, value]) => ({
              name,
              value: String(value),
            }))
            : [],
        stock: product.totalStock ?? product.stock ?? 1,
      });
      const loadedSkus = product.skus || [];
      setSkus(loadedSkus);
      setOriginalSkus(JSON.parse(JSON.stringify(loadedSkus))); // Deep copy
      setOriginalVariants(product.variants || []);
    } catch (error) {
      console.error("Failed to load product:", error);
      alert("Failed to load product. Returning to product list.");
      navigate("/products"); // Navigate back on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const cleanedFormData = {
        ...formData,
        images: formData.images.filter(img => img && img.trim() !== ""),
      };

      if (isEdit && id) {
        await productApi.update({ ...cleanedFormData, id });

        // Check if variants have structurally changed
        const variantsChanged = JSON.stringify(originalVariants) !== JSON.stringify(formData.variants);

        if (variantsChanged && formData.variants.length > 0) {
          // Map variants to the structure expected by the C# backend
          const mappedVariants = cleanedFormData.variants.map((v) => ({
            key: v.value,
            values: v.options || [],
          }));
          await skuApi.addSkusToProduct(id, {
            variants: mappedVariants,
            stock: cleanedFormData.stock ?? 1,
          });
          toast.success("Product updated and SKUs regenerated successfully");
        } else if (skus.length > 0) {
          // Save existing SKUs if they haven't structurally changed
            // Only update SKUs that have actually changed
            const skusToUpdate = skus.filter((sku, index) => {
              const original = originalSkus[index];
              if (!original) return true; // New SKU?
              return (
                sku.skuCode !== original.skuCode ||
                sku.price !== original.price ||
                sku.stock !== original.stock ||
                sku.isActive !== original.isActive ||
                sku.url !== original.url
              );
            });

            if (skusToUpdate.length > 0) {
              await Promise.all(
                skusToUpdate.map((sku) => {
                  const skuPayload: any = {
                    skuCode: sku.skuCode || null,
                    price: sku.price ?? 0,
                    stock: sku.stock ?? 0,
                    isActive: sku.isActive ?? true,
                    optionValues: sku.optionValues || null,
                    url: sku.url ? sku.url.trim() : "",
                  };
                  return skuApi.updateSku(sku.id, skuPayload);
                })
              );
              toast.success("Product and SKUs updated successfully");
            } else {
              toast.success("Product updated successfully");
            }
          } else {
            toast.success("Product updated successfully");
          }

          // Reload data instead of navigating back
          await loadProduct(id);
        } else {
        await productApi.create(cleanedFormData);
        toast.success("Product created successfully");
        navigate("/products");
      }

    } catch (error) {
      console.error("Failed to save product:", error);
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { value: "", options: [""] }],
    });
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: string | string[],
  ) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const addAttribute = () => {
    setFormData({
      ...formData,
      attributes: [...formData.attributes, { name: "", value: "" }],
    });
  };

  const removeAttribute = (index: number) => {
    setFormData({
      ...formData,
      attributes: formData.attributes.filter((_, i) => i !== index),
    });
  };

  const updateAttribute = (
    index: number,
    field: "name" | "value",
    value: string,
  ) => {
    const newAttributes = [...formData.attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setFormData({ ...formData, attributes: newAttributes });
  };

  const normalizeMediaPath = (result: any) => {
    const data = result?.data ?? result;
    return (
      data?.path ||
      data?.filePath ||
      data?.url ||
      data?.location ||
      data?.mediaPath ||
      ""
    );
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      toast.error("Choose an image file first");
      return;
    }

    try {
      setUploadingImage(true);
      const result = await mediaApi.upload({
        file: selectedImageFile,
        resourceType: "products",
        mediaType: 0,
      });
      const path = normalizeMediaPath(result);
      if (!path) {
        throw new Error("Media upload did not return a file path");
      }

      setFormData({
        ...formData,
        images: [...formData.images, path],
      });
      setSelectedImageFile(null);
      toast.success("Image uploaded to Media");
    } catch (error) {
      console.error("Failed to upload media:", error);
      toast.error("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/products")}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {isEdit ? "Edit Product" : "Create Product"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base Price *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      basePrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Virtual Price *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.virtualPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      virtualPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ProductStatus,
                  })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active (Published)</option>
                <option value="INACTIVE">Inactive</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Categories
          </h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <select
                value={pendingCategoryId}
                onChange={(e) => setPendingCategoryId(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                disabled={categoriesLoading}
              >
                <option value="">Select Category</option>
                {categoryTreeOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {"\u00A0\u00A0".repeat(cat.depth)}
                    {cat.depth > 0 ? "↳ " : ""}
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addCategory}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                Add
              </button>
            </div>

            {formData.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.categories.map((catId) => (
                  <span
                    key={catId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full border border-blue-100 dark:border-blue-900/30"
                  >
                    {categoryNameMap.get(catId) || "Unknown Category"}
                    <button
                      type="button"
                      onClick={() => removeCategory(catId)}
                      className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No categories selected yet.
              </p>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Product Images
          </h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Upload className="w-4 h-4" />
                Upload image to Media first, then save the returned path
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedImageFile(e.target.files?.[0] || null)
                  }
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={uploadingImage}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingImage ? "Uploading..." : "Upload to Media"}
                </button>
              </div>
            </div>

            {formData.images.map((image, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
                <MediaImage
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className="w-12 h-12 rounded-lg object-cover bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shrink-0"
                  fallback={
                    <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 border border-gray-300 dark:border-gray-600">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  }
                />
                <input
                  type="text"
                  value={image}
                  onChange={(e) => {
                    const newImages = [...formData.images];
                    newImages[index] = e.target.value;
                    setFormData({ ...formData, images: newImages });
                  }}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="media path returned by Media module"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newImages = formData.images.filter(
                      (_, i) => i !== index,
                    );
                    setFormData({ ...formData, images: newImages });
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, images: [...formData.images, ""] })
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Media Path
            </button>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Variants
          </h2>
          <div className="space-y-4">
            {formData.variants.map((variant, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Variant {index + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Variant Name
                  </label>
                  <input
                    type="text"
                    value={variant.value}
                    onChange={(e) =>
                      updateVariant(index, "value", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Color, Size"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={variant.options.join(", ")}
                    onChange={(e) =>
                      updateVariant(
                        index,
                        "options",
                        e.target.value.split(",").map((o) => o.trim()),
                      )
                    }
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Red, Blue, Green"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Variant
            </button>
          </div>
        </div>

        {/* SKUs list (Only in Edit mode) */}
        {isEdit && skus.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Manage Product Classifications (SKUs)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Configure pricing, stock levels, and active status for each variation.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Classification</th>
                    <th className="px-4 py-3">Image URL</th>
                    <th className="px-4 py-3">SKU Code</th>
                    <th className="px-4 py-3">Price *</th>
                    <th className="px-4 py-3">Stock *</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {skus.map((sku, index) => {
                    const optionsText = Object.entries(sku.optionValues || {})
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ");

                    return (
                      <tr key={sku.id || index} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                        <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">
                          {optionsText || sku.skuCode || "Default SKU"}
                        </td>
                        <td className="px-4 py-3.5">
                          <input
                            type="text"
                            value={sku.url || ""}
                            onChange={(e) => {
                              const updated = [...skus];
                              updated[index] = { ...updated[index], url: e.target.value };
                              setSkus(updated);
                            }}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg w-32 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                            placeholder="Image URL"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <input
                            type="text"
                            value={sku.skuCode || ""}
                            onChange={(e) => {
                              const updated = [...skus];
                              updated[index] = { ...updated[index], skuCode: e.target.value };
                              setSkus(updated);
                            }}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg w-32 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                            placeholder="Code"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={sku.price}
                            onChange={(e) => {
                              const updated = [...skus];
                              updated[index] = { ...updated[index], price: parseFloat(e.target.value) || 0 };
                              setSkus(updated);
                            }}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg w-28 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <input
                            type="number"
                            required
                            min="0"
                            value={sku.stock}
                            onChange={(e) => {
                              const updated = [...skus];
                              updated[index] = { ...updated[index], stock: parseInt(e.target.value, 10) || 0 };
                              setSkus(updated);
                            }}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg w-24 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sku.isActive}
                              onChange={(e) => {
                                const updated = [...skus];
                                updated[index] = { ...updated[index], isActive: e.target.checked };
                                setSkus(updated);
                              }}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span className="ms-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                              {sku.isActive ? "Active" : "Inactive"}
                            </span>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attributes */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Attributes
          </h2>
          <div className="space-y-3">
            {formData.attributes.map((attribute, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={attribute.name}
                  onChange={(e) =>
                    updateAttribute(index, "name", e.target.value)
                  }
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Attribute name (e.g., Material)"
                />
                <input
                  type="text"
                  value={attribute.value}
                  onChange={(e) =>
                    updateAttribute(index, "value", e.target.value)
                  }
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Attribute value (e.g., Cotton)"
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAttribute}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Attribute
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            {loading
              ? "Saving..."
              : isEdit
                ? "Update Product"
                : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
