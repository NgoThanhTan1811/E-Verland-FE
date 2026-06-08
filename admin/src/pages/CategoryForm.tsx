import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, FolderTree } from "lucide-react";
import { categoryApi } from "../services/api";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

export function CategoryForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // State to hold the chosen levels
  const [name, setName] = useState("");
  const [selectedRootId, setSelectedRootId] = useState<string>("");
  const [selectedParentId, setSelectedParentId] = useState<string>("");

  useEffect(() => {
    loadInitialData();
  }, [id, isEditing]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Load all categories to build the tree
      const response = await categoryApi.getAll();
      let items: any[] = [];
      if (Array.isArray(response)) items = response;
      else if (response && typeof response === 'object') {
        items = response.categories || response.data?.categories || response.items || response.data?.items || (Array.isArray(response.data) ? response.data : []);
      }

      const flattenCategories = (cats: any[]): any[] => {
        let result: any[] = [];
        cats.forEach(c => {
          result.push(c);
          if (c.subCategories && c.subCategories.length > 0) {
            result = result.concat(flattenCategories(c.subCategories));
          }
        });
        return result;
      };

      const allCategories = flattenCategories(items);
      setCategories(allCategories);

      if (isEditing && id) {
        const categoryToEdit = allCategories.find((c: any) => c.id === id);
        if (!categoryToEdit) {
          toast.error("Category not found");
          navigate("/categories");
          return;
        }

        setName(categoryToEdit.name);

        if (categoryToEdit.parentCategoryId) {
          // It's at least a Level 2 category
          const parentCategory = allCategories.find((c: any) => c.id === categoryToEdit.parentCategoryId);
          if (parentCategory) {
            if (parentCategory.parentCategoryId) {
              // The parent has a parent, so it's a Level 3 (Sub Category)
              setSelectedRootId(parentCategory.parentCategoryId);
              setSelectedParentId(categoryToEdit.parentCategoryId);
            } else {
              // The parent has no parent, so it's a Level 2 (Parent Category)
              setSelectedRootId(categoryToEdit.parentCategoryId);
              setSelectedParentId("");
            }
          } else {
            // Parent not found, fallback
            setSelectedRootId(categoryToEdit.parentCategoryId);
          }
        } else {
          // Level 1 (Root Category)
          setSelectedRootId("");
          setSelectedParentId("");
        }
      }
    } catch (error) {
      console.error("Failed to load category data:", error);
      toast.error("Failed to load data");
      navigate("/categories");
    } finally {
      setLoading(false);
    }
  };

  // Build root categories (parentCategoryId is null)
  const rootCategories = useMemo(() => {
    return categories.filter(c => !c.parentCategoryId && c.id !== id);
  }, [categories, id]);

  // Build parent categories for the selected root
  const parentCategories = useMemo(() => {
    if (!selectedRootId) return [];
    return categories.filter(c => c.parentCategoryId === selectedRootId && c.id !== id);
  }, [categories, selectedRootId, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      
      // Determine final parentCategoryId
      let finalParentCategoryId = null;
      if (selectedParentId) {
        finalParentCategoryId = selectedParentId; // Level 3
      } else if (selectedRootId) {
        finalParentCategoryId = selectedRootId; // Level 2
      }

      const payload: any = {
        name
      };
      if (finalParentCategoryId) {
        payload.parentCategoryId = finalParentCategoryId;
      }

      if (isEditing && id) {
        await categoryApi.update(id, payload);
        toast.success("Category updated successfully");
      } else {
        await categoryApi.create(payload);
        toast.success("Category created successfully");
      }
      navigate("/categories");
    } catch (error: any) {
      toast.error(error?.message || (isEditing ? "Failed to update category" : "Failed to create category"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/categories")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-blue-600" />
            {isEditing ? "Edit Category" : "Create Category"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEditing ? "Update existing category details" : "Add a new category to the hierarchy"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Electronics, Laptops, Gaming Laptops"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Hierarchy Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Root Category (Level 1)
                </label>
                <select
                  value={selectedRootId}
                  onChange={(e) => {
                    setSelectedRootId(e.target.value);
                    setSelectedParentId(""); // Reset parent when root changes
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Make this a Root Category --</option>
                  {rootCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty if this is a top-level category.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Parent Category (Level 2)
                </label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  disabled={!selectedRootId}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">-- Direct child of Root --</option>
                  {parentCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a Root Category first to see available parents.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/categories")}
            className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Save Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
