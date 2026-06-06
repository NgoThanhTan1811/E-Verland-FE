import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Plus, Pencil, Trash2, Search } from "lucide-react";
import { brandApi } from "../services/api";
import type { BrandItem } from "../types";
import { toast } from "sonner";

type BrandForm = {
  id?: string;
  name: string;
};

export function Brands() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<BrandForm>({ name: "" });

  const filteredBrands = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return brands;
    return brands.filter(
      (brand) =>
        brand.name.toLowerCase().includes(keyword) ||
        brand.id.toLowerCase().includes(keyword),
    );
  }, [brands, search]);

  useEffect(() => {
    loadBrands();
  }, []);

  const unwrapBrands = (response: any): BrandItem[] => {
    const payload = response?.data ?? response;
    return payload?.items || payload?.brands || payload?.data || payload || [];
  };

  const loadBrands = async () => {
    try {
      setLoading(true);
      const response = await brandApi.search({ Page: 1, Limit: 100 });
      setBrands(unwrapBrands(response));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load brands");
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setForm({ name: "" });

  const handleEdit = (brand: BrandItem) => {
    setForm({ id: brand.id, name: brand.name });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      if (form.id) {
        await brandApi.update(form.id, { name: form.name.trim() });
        toast.success("Brand updated");
      } else {
        await brandApi.create({ name: form.name.trim() });
        toast.success("Brand created");
      }
      resetForm();
      await loadBrands();
    } catch (error) {
      console.error(error);
      toast.error("Could not save brand");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm("Delete this brand?")) return;
    try {
      await brandApi.delete(brandId);
      toast.success("Brand deleted");
      await loadBrands();
    } catch (error) {
      console.error(error);
      toast.error("Could not delete brand");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-violet-100 dark:border-violet-900 bg-gradient-to-r from-white via-violet-50 to-cyan-50 dark:from-gray-900 dark:via-violet-950/30 dark:to-cyan-950/30 p-6 lg:p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
          <BadgeDollarSign className="w-3.5 h-3.5" />
          Brand catalog
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">
          Brands
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
          Keep your brand registry clean so products can be attributed
          correctly.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {form.id ? "Edit brand" : "New brand"}
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
            Brand name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Nike"
              required
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {saving ? "Saving..." : form.id ? "Update brand" : "Create brand"}
          </button>
        </form>

        <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Brand list
            </h2>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Search brands"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">
              Loading brands...
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">
              No brands found
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredBrands.map((brand) => (
                    <tr
                      key={brand.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {brand.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                          {brand.id}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(brand)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(brand.id)}
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
