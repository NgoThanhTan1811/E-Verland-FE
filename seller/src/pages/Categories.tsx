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

  const parentCategoryOptions = useMemo(
    () => categories.filter((category) => category.id !== form.id),
    [categories, form.id],
  );

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  useEffect(() => {
    loadCategories();
  }, []);

  const unwrapCategories = (response: any): CategoryItem[] => {
    const payload = response?.data ?? response;
    const items =
      payload?.items || payload?.categories || payload?.data || payload || [];
    return (Array.isArray(items) ? items : []).map((cat: any) => ({
      ...cat,
      parentCategoryId: cat.parentCategoryId || cat.parentCateId || cat.parentId || null,
    }));
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
              Category list
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
          ) : filteredCategories.length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">
              No categories found
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Parent
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                          {category.id}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {category.parentCategoryName ||
                          (category.parentCategoryId ? categoryNameMap.get(category.parentCategoryId) : null) ||
                          category.parentCategoryId ||
                          "-"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
