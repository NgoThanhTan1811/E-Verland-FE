import { useEffect, useState } from "react";
import { Search, Filter, Plus, Edit, Trash2, FolderTree, ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { categoryApi } from "../services/api";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { PaginationControls } from "../components/PaginationControls";

const CategoryRow = ({ category, level, expandedIds, toggleExpand, navigate, handleDelete }: any) => {
  const isExpanded = expandedIds.has(category.id);
  const hasChildren = category.subCategories && category.subCategories.length > 0;

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
          <div className="flex items-center" style={{ paddingLeft: `${level * 1.5}rem` }}>
            {hasChildren ? (
              <button onClick={() => toggleExpand(category.id)} className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-6 mr-2 inline-block"></span>
            )}
            {category.name}
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            Active
          </span>
        </td>
        <td className="px-6 py-4 flex items-center justify-end gap-2">
          <button onClick={() => navigate(`/categories/${category.id}/edit`)} className="p-2 text-gray-400 hover:text-blue-600">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(category.id)} className="p-2 text-gray-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
      {isExpanded && hasChildren && category.subCategories.map((sub: any) => (
        <CategoryRow 
          key={sub.id} 
          category={sub} 
          level={level + 1} 
          expandedIds={expandedIds} 
          toggleExpand={toggleExpand} 
          navigate={navigate} 
          handleDelete={handleDelete} 
        />
      ))}
    </>
  );
};

export function Categories() {
  const { t } = useLanguage();
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const navigate = useNavigate();

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryApi.getAll();
      let items: any[] = [];
      if (Array.isArray(response)) items = response;
      else if (response && typeof response === 'object') {
        items = response.categories || response.data?.categories || response.items || response.data?.items || (Array.isArray(response.data) ? response.data : []);
      }

      setAllCategories(items);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
      setAllCategories([]);
    } finally {
      setLoading(false);
    }
  };



  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await categoryApi.delete(id);
      toast.success("Category deleted successfully");
      loadCategories();
    } catch (error) {
      toast.error("Failed to delete category");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t.nav.categories || "Categories"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage product categories
          </p>
        </div>
        <button
          onClick={() => navigate("/categories/create")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {allCategories.length === 0 ? (
          <div className="p-8 text-center">
            <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-900 dark:text-white font-medium">No categories found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {allCategories.slice((page - 1) * limit, page * limit).map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    level={0}
                    expandedIds={expandedIds}
                    toggleExpand={toggleExpand}
                    navigate={navigate}
                    handleDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && allCategories.length > 0 && (
          <PaginationControls
            page={page}
            limit={limit}
            total={allCategories.length}
            onPageChange={setPage}
            itemName={t.nav.categories?.toLowerCase() || "categories"}
          />
        )}
      </div>


    </div>
  );
}
