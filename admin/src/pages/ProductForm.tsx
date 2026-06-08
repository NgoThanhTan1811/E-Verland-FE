import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import {
  productApi,
  locationApi,
  categoryApi,
  brandApi,
} from "../services/api";
import type {
  CreateProductDto,
  ProductStatus,
  ProductVariant,
  Province,
  District,
  Ward,
  ProductCategory,
  Brand,
} from "../types";
import { generateSKUs } from "../utils/product";

export function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedLevel0Category, setSelectedLevel0Category] = useState<
    string | null
  >(null);
  const [level1Categories, setLevel1Categories] = useState<ProductCategory[]>(
    [],
  );
  const [brands, setBrands] = useState<Brand[]>([]);
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
    provinceName: undefined,
    districtId: undefined,
    districtName: undefined,
    wardId: undefined,
    wardName: undefined,
    status: "Draft",
    categories: [],
    skus: [],
    attributes: [],
  });

  // Load provinces on mount
  useEffect(() => {
    if (!isEdit) {
      loadProvinces();
    }
    loadCategories();
    loadBrands();
  }, [isEdit]);

  // Load districts when province changes
  useEffect(() => {
    if (formData.provinceId) {
      loadDistricts(formData.provinceId);
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [formData.provinceId]);

  // Load wards when district changes
  useEffect(() => {
    if (formData.districtId) {
      loadWards(formData.districtId);
    } else {
      setWards([]);
    }
  }, [formData.districtId]);

  const loadProvinces = async () => {
    try {
      const response = await locationApi.getProvinces();
      setProvinces(response.data || []);
    } catch (error) {
      console.error("Failed to load provinces:", error);
    }
  };

  const loadDistricts = async (provinceId: number) => {
    try {
      const response = await locationApi.getDistricts(provinceId);
      setDistricts(response.data || []);
    } catch (error) {
      console.error("Failed to load districts:", error);
    }
  };

  const loadWards = async (districtId: number) => {
    try {
      const response = await locationApi.getWards(districtId);
      setWards(response.data || []);
    } catch (error) {
      console.error("Failed to load wards:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      const allCategories = response.data?.categories || [];
      // Chỉ lấy categories level 0
      const level0Categories = allCategories.filter((c) => c.level === 0);
      setCategories(level0Categories);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadLevel1Categories = async (parentId: string) => {
    try {
      // Call API với query param parentCategoryId để lấy level 1 categories
      const response = await categoryApi.getAll({ parentCategoryId: parentId });
      const childCategories = response.data?.categories || [];
      console.log("Level 1 categories loaded:", childCategories);
      setLevel1Categories(childCategories);
    } catch (error) {
      console.error("Failed to load level 1 categories:", error);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await brandApi.getAll({ page: 1, limit: 100 });
      setBrands(response.data?.brands || []);
    } catch (error) {
      console.error("Failed to load brands:", error);
    }
  };

  useEffect(() => {
    if (isEdit && id) {
      loadProduct();
    }
  }, [id, isEdit]);

  // Auto-generate SKUs when variants change
  useEffect(() => {
    if (formData.variants.length > 0) {
      const newSkus = generateSKUs(formData.variants);
      // Only update if SKUs have changed
      if (
        JSON.stringify(newSkus.map((s) => s.value)) !==
        JSON.stringify(formData.skus.map((s) => s.value))
      ) {
        // Preserve existing SKU data (price, stock, image) when values match
        const mergedSkus = newSkus.map((newSku) => {
          const existingSku = formData.skus.find(
            (sku) => sku.value === newSku.value,
          );
          return existingSku
            ? {
              ...newSku,
              price: existingSku.price,
              stock: existingSku.stock,
              image: existingSku.image,
            }
            : newSku;
        });
        setFormData((prev) => ({ ...prev, skus: mergedSkus }));
      }
    } else {
      setFormData((prev) => ({ ...prev, skus: [] }));
    }
  }, [formData.variants]);

  const loadProduct = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await productApi.getById(id);
      const product = response.data || response;
      setFormData({
        name: product.name || "",
        basePrice: product.basePrice ?? 0,
        virtualPrice: product.virtualPrice ?? 0,
        brandId: product.brandId || "",
        images: product.images || [],
        variants: product.variants || [],
        description: product.description || "",
        sizeGuide: product.sizeGuide || "",
        provinceId: product.provinceId,
        provinceName: product.provinceName,
        districtId: product.districtId,
        districtName: product.districtName,
        wardId: product.wardId,
        wardName: product.wardName,
        status: product.status,
        categories: product.categoryIds || [],
        skus:
          product.skus?.map((sku) => ({
            value: sku.value,
            price: sku.price,
            stock: sku.stock,
            image: sku.image,
          })) || [],
        attributes: Array.isArray(product.attributes) ? product.attributes : [],
      });
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

      if (isEdit && id) {
        await productApi.update({ ...formData, id });
      } else {
        const payload = {
          ...formData,
          brandId: formData.brandId || undefined,
          provinceId: formData.provinceId || undefined,
          districtId: formData.districtId || undefined,
          wardId: formData.wardId || undefined,
          status: formData.status === "Published" ? "Published" : formData.status
        };

        await productApi.create(payload);
      }

      navigate("/products");
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Failed to save product");
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
                      basePrice: parseFloat(e.target.value),
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
                      virtualPrice: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Brand Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Brand
              </label>
              <select
                value={formData.brandId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, brandId: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Brand (Optional)</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selection */}
            <div className="space-y-4">
              {/* Level 0 - Main Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Main Category (Level 0) *
                </label>
                <select
                  value={selectedLevel0Category || ""}
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    if (categoryId) {
                      setSelectedLevel0Category(categoryId);
                      loadLevel1Categories(categoryId);
                      setFormData({
                        ...formData,
                        categories: [categoryId],
                      });
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Main Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level 1 - Sub Categories */}
              {selectedLevel0Category && level1Categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sub Categories (Level 1) - Multiple selection
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {level1Categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                categories: [
                                  ...formData.categories,
                                  category.id,
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                categories: formData.categories.filter(
                                  (id) => id !== category.id,
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex items-center gap-2">
                          <img
                            src={category.logo}
                            alt={category.name}
                            className="w-6 h-6 rounded object-cover"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {category.name}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Selected level 1: {formData.categories.length - 1}{" "}
                    categories
                  </p>
                </div>
              )}
            </div>

            {/* Location/Address Selection */}
            {!isEdit && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Location
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Province Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Province/City
                    </label>
                    <select
                      value={formData.provinceId || ""}
                      onChange={(e) => {
                        const provinceId = e.target.value
                          ? parseInt(e.target.value)
                          : undefined;
                        const selectedProvince = provinces.find(
                          (p) => p.id === provinceId,
                        );
                        setFormData({
                          ...formData,
                          provinceId,
                          provinceName: selectedProvince?.name,
                          districtId: undefined,
                          districtName: undefined,
                          wardId: undefined,
                          wardName: undefined,
                        });
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Province</option>
                      {provinces.map((province) => (
                        <option key={province.id} value={province.id}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* District Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      District
                    </label>
                    <select
                      value={formData.districtId || ""}
                      onChange={(e) => {
                        const districtId = e.target.value
                          ? parseInt(e.target.value)
                          : undefined;
                        const selectedDistrict = districts.find(
                          (d) => d.id === districtId,
                        );
                        setFormData({
                          ...formData,
                          districtId,
                          districtName: selectedDistrict?.name,
                          wardId: undefined,
                          wardName: undefined,
                        });
                      }}
                      disabled={!formData.provinceId}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select District</option>
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ward Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ward/Commune
                    </label>
                    <select
                      value={formData.wardId || ""}
                      onChange={(e) => {
                        const wardId = e.target.value
                          ? parseInt(e.target.value)
                          : undefined;
                        const selectedWard = wards.find((w) => w.id === wardId);
                        setFormData({
                          ...formData,
                          wardId,
                          wardName: selectedWard?.name,
                        });
                      }}
                      disabled={!formData.districtId}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Ward</option>
                      {wards.map((ward) => (
                        <option key={ward.id} value={ward.id}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

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
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Inactive">Inactive</option>
                <option value="OutOfStock">Out Of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Product Images
          </h2>
          <div className="space-y-3">
            {formData.images.map((image, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => {
                    const newImages = [...formData.images];
                    newImages[index] = e.target.value;
                    setFormData({ ...formData, images: newImages });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newImages = formData.images.filter(
                      (_, i) => i !== index,
                    );
                    setFormData({ ...formData, images: newImages });
                  }}
                  className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
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
              Add Image URL
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

        {/* SKUs */}
        {formData.skus.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              SKUs (Auto-generated from Variants)
            </h2>
            <div className="space-y-3">
              {formData.skus.map((sku, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        SKU Value
                      </label>
                      <input
                        type="text"
                        value={sku.value}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={sku.price}
                        onChange={(e) => {
                          const newSkus = [...formData.skus];
                          newSkus[index].price =
                            parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, skus: newSkus });
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={sku.stock}
                        onChange={(e) => {
                          const newSkus = [...formData.skus];
                          newSkus[index].stock = parseInt(e.target.value) || 0;
                          setFormData({ ...formData, skus: newSkus });
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={sku.image}
                        onChange={(e) => {
                          const newSkus = [...formData.skus];
                          newSkus[index].image = e.target.value;
                          setFormData({ ...formData, skus: newSkus });
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
