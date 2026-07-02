import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Plus, Trash2, ArrowLeft, Upload } from "lucide-react";
import type {
  CreateProductDto,
  ProductVariant,
  CreateProductSku,
  ProductAttribute,
  CategoryItem,
} from "../../types";
import { categoryApi, mediaApi, productApi, skuApi } from "../../services/api";
import { toast } from "sonner";

export function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
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
  });

  const [newImage, setNewImage] = useState("");
  const [pendingCategoryId, setPendingCategoryId] = useState("");
  const [newVariant, setNewVariant] = useState<ProductVariant>({
    value: "",
    options: [],
  });
  const [newVariantOption, setNewVariantOption] = useState("");
  const [newSKU, setNewSKU] = useState<CreateProductSku>({
    value: "",
    price: 0,
    stock: 0,
    image: "",
  });
  const [newAttribute, setNewAttribute] = useState<ProductAttribute>({
    name: "",
    value: "",
  });

  const normalizeMediaPath = (result: any): string[] => {
    const data = result?.data ?? result;
    if (Array.isArray(data)) {
      return data.map((item) => item?.path || item?.filePath || item?.url || item?.location || item?.mediaPath || "");
    }
    const singlePath = data?.path || data?.filePath || data?.url || data?.location || data?.mediaPath || "";
    return singlePath ? [singlePath] : [];
  };

  const unwrapCategories = (response: any): CategoryItem[] => {
    const payload = response?.data ?? response;
    return (
      payload?.items || payload?.categories || payload?.data || payload || []
    );
  };

  interface CategoryNode extends CategoryItem {
    children: CategoryNode[];
    depth: number;
  }

  const categoryTreeOptions = useMemo(() => {
    const map = new Map<string, CategoryNode>();
    categories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [], depth: 0 });
    });

    const getParentId = (cat: any) =>
      cat.parentCategoryId || cat.parentCateId || cat.parentId || null;

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

    const assignDepth = (nodes: CategoryNode[], d: number) => {
      nodes.forEach((n) => {
        n.depth = d;
        if (n.children.length > 0) assignDepth(n.children, d + 1);
      });
    };
    assignDepth(roots, 0);

    const flattened: CategoryNode[] = [];
    const recurse = (nodes: CategoryNode[]) => {
      nodes.forEach((n) => {
        flattened.push(n);
        if (n.children.length > 0) recurse(n.children);
      });
    };
    recurse(roots);
    return flattened;
  }, [categories]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoryApi.getAll();
      setCategories(unwrapCategories(response));
    } catch (error) {
      console.error("Failed to load categories:", error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImageFiles || selectedImageFiles.length === 0) {
      toast.error("Choose image files first");
      return;
    }

    try {
      setUploadingImage(true);
      const result = await mediaApi.upload({
        files: selectedImageFiles,
        resourceType: "products",
        mediaType: 0,
      });
      const paths = normalizeMediaPath(result);
      if (!paths || paths.length === 0) {
        throw new Error("Media upload did not return any file paths");
      }

      setFormData({
        ...formData,
        images: [...formData.images, ...paths],
      });
      setSelectedImageFiles([]);
      toast.success("Images uploaded to Media");
    } catch (error) {
      console.error("Failed to upload media:", error);
      toast.error("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const response = await productApi.getById(id);
      const product = response.data;
      setFormData({
        name: product.name || "",
        basePrice: product.basePrice || 0,
        virtualPrice: product.virtualPrice || 0,
        brandId: product.brandId || "",
        images: product.images || [],
        variants: product.variants || [],
        description: product.description || "",
        sizeGuide: product.sizeGuide || "",
        provinceId: product.provinceId,
        districtId: product.districtId,
        wardId: product.wardId,
        status: product.status,
        categories: product.categoryIds || [],
        skus:
          product.skus?.map((sku: any) => ({
            id: sku.id,
            value: sku.skuCode || sku.value || "",
            price: sku.price || 0,
            stock: sku.stock || 0,
            image: sku.url || sku.image || "",
          })) || [],
        attributes: product.attributes || [],
      });
    } catch (error) {
      console.error("Failed to load product:", error);
      alert("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (isEdit) {
        await productApi.update({
          ...formData,
          id: id!,
          updatedById: "seller",
        });

        // 1. If user provided variants but NO manual SKUs, auto-generate SKUs
        if (formData.skus.length === 0 && formData.variants.length > 0) {
          try {
            await skuApi.addSkusToProduct(id!, {
              variants: formData.variants.map((v) => ({ key: v.value, values: v.options })),
              stock: formData.stock || 0,
            });
          } catch (error) {
            console.error("Failed to generate SKUs:", error);
            toast.error("Failed to auto-generate SKUs from variants.");
          }
        } else {
          // 2. Otherwise, sync manual SKUs list
          // Fetch existing to handle deletions
          let currentSkuIds: string[] = [];
          try {
            const currentProductResp = await productApi.getById(id!);
            const currentProduct = currentProductResp.data || currentProductResp;
            currentSkuIds = (currentProduct.skus || []).map((s: any) => s.id).filter(Boolean);
          } catch (e) {
            console.error("Failed to fetch current SKUs for deletion sync", e);
          }

          const formSkuIds = formData.skus.map((s) => s.id).filter(Boolean);
          const skusToDelete = currentSkuIds.filter((skuId) => !formSkuIds.includes(skuId));

          // Delete removed SKUs
          for (const skuId of skusToDelete) {
            try { await skuApi.deleteSku(skuId); } catch (e) { console.error(e); }
          }

          // Create or Update SKUs
          for (const sku of formData.skus) {
            if (sku.id) {
              try {
                await skuApi.updateSku(sku.id, {
                  skuCode: sku.value,
                  price: sku.price,
                  stock: sku.stock,
                  url: sku.image,
                  isActive: true,
                  optionValues: {},
                });
              } catch (e) { console.error("Update SKU failed:", e); }
            } else {
              try {
                await skuApi.createSku({
                  skuCode: sku.value,
                  productId: id!,
                  price: sku.price,
                  stock: sku.stock,
                  url: sku.image,
                  isActive: true,
                  optionValues: {},
                });
              } catch (e) { console.error("Create SKU failed:", e); }
            }
          }
        }
      } else {
        await productApi.create({ ...formData, createdById: "seller" });
      }

      navigate("/products");
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    if (newImage.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImage.trim()],
      });
      setNewImage("");
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const addCategory = () => {
    if (
      pendingCategoryId.trim() &&
      !formData.categories.includes(pendingCategoryId.trim())
    ) {
      setFormData({
        ...formData,
        categories: [...formData.categories, pendingCategoryId.trim()],
      });
      setPendingCategoryId("");
    }
  };

  const removeCategory = (category: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((c) => c !== category),
    });
  };

  const addVariant = () => {
    if (newVariant.value.trim() && newVariant.options.length > 0) {
      setFormData({
        ...formData,
        variants: [...formData.variants, newVariant],
      });
      setNewVariant({ value: "", options: [] });
    }
  };

  const addVariantOption = () => {
    if (newVariantOption.trim()) {
      setNewVariant({
        ...newVariant,
        options: [...newVariant.options, newVariantOption.trim()],
      });
      setNewVariantOption("");
    }
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const addSKU = () => {
    if (newSKU.value.trim()) {
      setFormData({ ...formData, skus: [...formData.skus, newSKU] });
      setNewSKU({ value: "", price: 0, stock: 0, image: "" });
    }
  };

  const removeSKU = (index: number) => {
    setFormData({
      ...formData,
      skus: formData.skus.filter((_, i) => i !== index),
    });
  };

  const addAttribute = () => {
    if (newAttribute.name.trim() && newAttribute.value.trim()) {
      setFormData({
        ...formData,
        attributes: [...formData.attributes, newAttribute],
      });
      setNewAttribute({ name: "", value: "" });
    }
  };

  const removeAttribute = (index: number) => {
    setFormData({
      ...formData,
      attributes: formData.attributes.filter((_, i) => i !== index),
    });
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Loading product...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/products")}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-neutral-900 mb-2">
            {isEdit ? "Edit Product" : "Create Product"}
          </h1>
          <p className="text-neutral-600">
            {isEdit
              ? "Update product details"
              : "Add a new product to your catalog"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Enter product name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Base Price *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      basePrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Virtual Price *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.virtualPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      virtualPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Brand ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.brandId}
                  onChange={(e) =>
                    setFormData({ ...formData, brandId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="brand-id"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Enter product description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Size Guide (optional)
              </label>
              <textarea
                value={formData.sizeGuide}
                onChange={(e) =>
                  setFormData({ ...formData, sizeGuide: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Enter size guide information"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">Images</h2>

          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Upload size={16} />
                Upload image to Media first, then save the returned path
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    setSelectedImageFiles(e.target.files ? Array.from(e.target.files) : [])
                  }
                  className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={uploadingImage}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Upload size={16} />
                  {uploadingImage ? "Uploading..." : "Upload to Media"}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Enter media path"
              />
              <button
                type="button"
                onClick={addImage}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">Location</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Province ID *
              </label>
              <input
                type="text"
                required
                value={formData.provinceId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    provinceId: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                District ID *
              </label>
              <input
                type="text"
                required
                value={formData.districtId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    districtId: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Ward ID *
              </label>
              <input
                type="text"
                required
                value={formData.wardId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    wardId: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">Categories</h2>

          <div className="space-y-4">
            <div className="flex gap-2">
              <select
                value={pendingCategoryId}
                onChange={(e) => setPendingCategoryId(e.target.value)}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                disabled={categoriesLoading}
              >
                <option value="">Select category name</option>
                {categoryTreeOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {"\u00A0\u00A0".repeat(category.depth)}
                    {category.depth > 0 ? "↳ " : ""}
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addCategory}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.categories.map((categoryId, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full text-sm"
                >
                  {categoryNameById.get(categoryId) || categoryId}
                  <button
                    type="button"
                    onClick={() => removeCategory(categoryId)}
                    className="hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">Variants</h2>

          <div className="space-y-4">
            <div className="border border-neutral-200 rounded-lg p-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newVariant.value}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, value: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Variant name (e.g., Color, Size)"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVariantOption}
                    onChange={(e) => setNewVariantOption(e.target.value)}
                    className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="Option (e.g., Red, Large)"
                  />
                  <button
                    type="button"
                    onClick={addVariantOption}
                    className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                  >
                    Add Option
                  </button>
                </div>

                {newVariant.options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newVariant.options.map((option, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-neutral-100 rounded-full text-sm"
                      >
                        {option}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addVariant}
                  className="w-full px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
                >
                  Add Variant
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {formData.variants.map((variant, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-4 border border-neutral-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      {variant.value}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {variant.options.join(", ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SKUs */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">SKUs</h2>

          <div className="space-y-4">
            <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
              <input
                type="text"
                value={newSKU.value}
                onChange={(e) =>
                  setNewSKU({ ...newSKU, value: e.target.value })
                }
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="SKU code"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={newSKU.price}
                  onChange={(e) =>
                    setNewSKU({
                      ...newSKU,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Price"
                />
                <input
                  type="number"
                  value={newSKU.stock}
                  onChange={(e) =>
                    setNewSKU({
                      ...newSKU,
                      stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Stock"
                />
              </div>

              <button
                type="button"
                onClick={addSKU}
                className="w-full px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
              >
                Add SKU
              </button>
            </div>

            <div className="space-y-2">
              {formData.skus.map((sku, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{sku.value}</p>
                    <p className="text-sm text-neutral-600">
                      Price: ${sku.price.toFixed(2)} | Stock: {sku.stock}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSKU(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">Attributes</h2>

          <div className="space-y-4">
            <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
              <input
                type="text"
                value={newAttribute.name}
                onChange={(e) =>
                  setNewAttribute({ ...newAttribute, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Attribute name (e.g., Material, Weight)"
              />
              <input
                type="text"
                value={newAttribute.value}
                onChange={(e) =>
                  setNewAttribute({ ...newAttribute, value: e.target.value })
                }
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Attribute value (e.g., Cotton, 500g)"
              />
              <button
                type="button"
                onClick={addAttribute}
                className="w-full px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
              >
                Add Attribute
              </button>
            </div>

            <div className="space-y-2">
              {formData.attributes.map((attr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{attr.name}</p>
                    <p className="text-sm text-neutral-600">{attr.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttribute(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="px-6 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : isEdit
                ? "Update Product"
                : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
