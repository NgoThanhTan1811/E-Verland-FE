import { useEffect, useMemo, useState } from "react";
import { FolderTree, Plus, Pencil, Trash2, Search } from "lucide-react";
import { categoryApi } from "../services/api";
import type { CategoryItem } from "../types";
import { toast } from "sonner";

type CategoryForm = {
  id?: string;
  name: string;
  parentCategoryId: string;
};

export function Categories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>({
    name: "",
    parentCategoryId: "",
  });

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return categories;
    return categories.filter((category) =>
      [category.name, category.parentCategoryName, category.id]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword)),
    );
  }, [categories, search]);


  const treeData = useMemo(() => {
    const parents = categories.filter((c) => !c.parentCategoryId);
    const result = parents.map((p) => {
      const subs = categories.filter((c) => c.parentCategoryId === p.id);
      return { parent: p, subs };
    });

    const keyword = search.trim().toLowerCase();
    if (!keyword) return result;

    return result
      .filter((item) => {
        const parentMatches = item.parent.name.toLowerCase().includes(keyword) || item.parent.id.toLowerCase().includes(keyword);
        const subMatches = item.subs.some(
          (sub) => sub.name.toLowerCase().includes(keyword) || sub.id.toLowerCase().includes(keyword)
        );
        return parentMatches || subMatches;
      })
      .map((item) => {
        const parentMatches = item.parent.name.toLowerCase().includes(keyword) || item.parent.id.toLowerCase().includes(keyword);
        return {
          parent: item.parent,
          subs: parentMatches
            ? item.subs
            : item.subs.filter((sub) => sub.name.toLowerCase().includes(keyword) || sub.id.toLowerCase().includes(keyword)),
        };
      });
  }, [categories, search]);

  const toggleParent = (parentId: string) => {
    setExpandedParentId((prev) => (prev === parentId ? null : parentId));
  };

  const parentCategoryOptions = useMemo(
    () => categories.filter((category) => category.id !== form.id),
    [categories, form.id],
  );



  useEffect(() => {
    loadCategories();
  }, []);

  const unwrapCategories = (response: any): CategoryItem[] => {
    const payload = response?.data ?? response;
    const items =
      payload?.items || payload?.categories || payload?.data || payload || [];
    
    const flatItems: any[] = [];
    (Array.isArray(items) ? items : []).forEach((cat: any) => {
      flatItems.push({
        ...cat,
        parentCategoryId: cat.parentCategoryId || cat.parentCateId || cat.parentId || null,
      });
      if (Array.isArray(cat.subCategories)) {
        cat.subCategories.forEach((sub: any) => {
          flatItems.push({
            ...sub,
            parentCategoryId: sub.parentCategoryId || sub.parentCateId || sub.parentId || cat.id,
            parentCategoryName: cat.name
          });
        });
      }
    });
    return flatItems;
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryApi.getAll();
      setCategories(unwrapCategories(response));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setForm({ name: "", parentCategoryId: "" });

  const handleEdit = (category: CategoryItem) => {
    setForm({
      id: category.id,
      name: category.name,
      parentCategoryId: category.parentCategoryId || "",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        parentCategoryId: form.parentCategoryId.trim() || null,
      };

      if (form.id) {
        await categoryApi.update(form.id, payload);
        toast.success("Category updated");
      } else {
        await categoryApi.create(payload);
        toast.success("Category created");
      }

      resetForm();
      setExpandedParentId(null);
      await loadCategories();
    } catch (error) {
      console.error(error);
      toast.error("Could not save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Delete this category?")) return;

    try {
      await categoryApi.delete(categoryId);
      toast.success("Category deleted");
      await loadCategories();
    } catch (error) {
      console.error(error);
      toast.error("Could not delete category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 dark:border-emerald-900 bg-gradient-to-r from-white via-emerald-50 to-cyan-50 dark:from-gray-900 dark:via-emerald-950/30 dark:to-cyan-950/30 p-6 lg:p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          <FolderTree className="w-3.5 h-3.5" />
          Catalog structure
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">
          Categories
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
          Organize the catalog hierarchy and keep parent-child relationships
          consistent.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {form.id ? "Edit category" : "New category"}
            </h2>
            {form.id ? (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Reset
              </button>
            ) : null}
          </div>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Electronics"
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Parent category
            <select
              value={form.parentCategoryId}
              onChange={(e) =>
                setForm({ ...form, parentCategoryId: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">No parent category</option>
              {parentCategoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.parentCategoryName
                    ? ` · ${category.parentCategoryName}`
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {saving
              ? "Saving..."
              : form.id
                ? "Update category"
                : "Create category"}
          </button>
        </form>

        <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manage Categories
            </h2>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Search categories"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">
              Loading categories...
            </div>
          ) : (
            <div className="space-y-3">
              {treeData.length === 0 ? (
                <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                  No categories found
                </div>
              ) : (
                treeData.map(({ parent, subs }) => {
                  const isExpanded = expandedParentId === parent.id || (search.trim() !== "");

                  return (
                    <div
                      key={parent.id}
                      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-all duration-200"
                    >
                      {/* Parent Row */}
                      <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <button
                          onClick={() => toggleParent(parent.id)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <div
                            className={`p-1.5 rounded-lg transition-colors ${
                              isExpanded
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            <FolderTree className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {parent.name}
                            </span>
                            <span className="text-xs text-gray-400 hidden sm:block">
                              {parent.id}
                            </span>
                          </div>
                          {subs.length > 0 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30">
                              {subs.length} sub
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-1 sm:gap-2 pl-4">
                          <button
                            onClick={() => handleEdit(parent)}
                            className="p-2 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-gray-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
                            title="Edit Parent"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(parent.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                            title="Delete Parent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {isExpanded && subs.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 p-2 sm:p-3">
                          <div className="space-y-1">
                            {subs.map((sub) => (
                              <div
                                key={sub.id}
                                className="group flex items-center justify-between p-2 pl-4 sm:pl-12 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                      {sub.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {sub.id}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEdit(sub)}
                                    className="p-1.5 rounded-md text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-gray-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20"
                                    title="Edit Subcategory"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(sub.id)}
                                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                                    title="Delete Subcategory"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
