import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { brandApi } from "../services/api";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

export function BrandForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    if (isEditing && id) {
      loadBrand(id);
    }
  }, [id, isEditing]);

  const loadBrand = async (brandId: string) => {
    try {
      setLoading(true);
      const response = await brandApi.getAll(); // Using getAll since brandApi might not have getById
      const items = response.items || response.data?.items || response.data || response || [];
      const brand = (Array.isArray(items) ? items : []).find(b => b.id === brandId);
      
      if (brand) {
        setFormData({ name: brand.name });
      } else {
        toast.error("Brand not found");
        navigate("/brands");
      }
    } catch (error) {
      console.error("Failed to load brand:", error);
      toast.error("Failed to load brand");
      navigate("/brands");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      if (isEditing && id) {
        await brandApi.update(id, formData);
        toast.success("Brand updated successfully");
      } else {
        await brandApi.create(formData);
        toast.success("Brand created successfully");
      }
      navigate("/brands");
    } catch (error: any) {
      toast.error(error?.message || (isEditing ? "Failed to update brand" : "Failed to create brand"));
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
          onClick={() => navigate("/brands")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? "Edit Brand" : "Create Brand"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEditing ? "Update existing brand details" : "Add a new brand to the system"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Nike, Samsung, Apple"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/brands")}
            className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.name.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Save Brand"}
          </button>
        </div>
      </form>
    </div>
  );
}
