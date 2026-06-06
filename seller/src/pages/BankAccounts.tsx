import { useEffect, useMemo, useState } from "react";
import { Landmark, Plus, Pencil, Trash2 } from "lucide-react";
import { bankAccountApi, profileApi } from "../services/api";
import type { User_AccountMeResDto, User_BankAccountResDto } from "../types";
import { toast } from "sonner";

type BankOption = {
  name: string;
  code: string;
  bin: string;
  short_name: string;
  supported: boolean;
};

type BankAccountForm = {
  id?: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
};

const emptyBankAccountForm: BankAccountForm = {
  bankName: "",
  bankCode: "",
  accountNumber: "",
  accountHolder: "",
};

export function BankAccounts() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<User_BankAccountResDto[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BankAccountForm>(emptyBankAccountForm);

  useEffect(() => {
    void loadBanks();
    loadBankAccounts();
  }, []);

  const unwrapMe = (response: any): User_AccountMeResDto | null => {
    const payload = response?.data ?? response;
    if (payload?.profile) return payload as User_AccountMeResDto;
    return null;
  };

  const unwrapAccounts = (response: any): User_BankAccountResDto[] => {
    const payload = response?.data ?? response;
    return (
      payload?.items || payload?.bankAccounts || payload?.data || payload || []
    );
  };

  const loadBanks = async () => {
    try {
      const response = await fetch("/bank/banks.json");
      if (!response.ok) {
        throw new Error(`Failed to load banks: ${response.status}`);
      }

      const data = await response.json();
      setBanks(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error(error);
      setBanks([]);
    }
  };

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      const meResponse = await profileApi.getMe();
      const me = unwrapMe(meResponse);
      const nextProfileId = me?.profile?.id || null;
      setProfileId(nextProfileId);

      if (!nextProfileId) {
        setAccounts([]);
        return;
      }

      const response = await bankAccountApi.getAll(nextProfileId);
      setAccounts(unwrapAccounts(response));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load bank accounts");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setForm(emptyBankAccountForm);

  const selectedBank = useMemo(
    () => banks.find((bank) => bank.code === form.bankCode) || null,
    [banks, form.bankCode],
  );

  const handleEdit = (account: User_BankAccountResDto) => {
    setForm({
      id: account.id,
      bankName: account.bankName || "",
      bankCode: account.bankCode || "",
      accountNumber: account.accountNumber || "",
      accountHolder: account.accountHolder || "",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileId) {
      toast.error("Create a profile first");
      return;
    }

    if (!selectedBank) {
      toast.error("Select a bank name");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
        accountNumber: form.accountNumber || undefined,
        accountHolder: form.accountHolder || undefined,
      };

      if (form.id) {
        await bankAccountApi.update(profileId, form.id, payload);
        toast.success("Bank account updated");
      } else {
        await bankAccountApi.create(profileId, payload);
        toast.success("Bank account added");
      }

      resetForm();
      await loadBankAccounts();
    } catch (error) {
      console.error(error);
      toast.error("Could not save bank account");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!profileId || !confirm("Delete this bank account?")) return;

    try {
      await bankAccountApi.delete(profileId, accountId);
      toast.success("Bank account deleted");
      await loadBankAccounts();
    } catch (error) {
      console.error(error);
      toast.error("Could not delete bank account");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        Loading bank accounts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-amber-100 dark:border-amber-900 bg-gradient-to-r from-white via-amber-50 to-orange-50 dark:from-gray-900 dark:via-amber-950/30 dark:to-orange-950/30 p-6 lg:p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
          <Landmark className="w-3.5 h-3.5" />
          Payments
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">
          Bank Account
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
          Store the payout accounts tied to the seller profile.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {form.id ? "Edit bank account" : "New bank account"}
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
            Bank
            <select
              value={form.bankCode}
              onChange={(e) => {
                const nextCode = e.target.value;
                const nextBank = banks.find((bank) => bank.code === nextCode);
                setForm({
                  ...form,
                  bankCode: nextCode,
                  bankName: nextBank?.name || "",
                });
              }}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">Select bank name</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.short_name} - {bank.code}
                  {bank.supported ? "" : " (unsupported)"}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
            {selectedBank ? (
              <>
                <div className="font-medium text-gray-900 dark:text-white">
                  {selectedBank.name}
                </div>
                <div>Bank code: {selectedBank.code}</div>
                <div>BIN: {selectedBank.bin}</div>
                <div>
                  Status: {selectedBank.supported ? "Supported" : "Unsupported"}
                </div>
              </>
            ) : (
              "Pick a bank name from the list to auto-fill the backend payload."
            )}
          </div>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Account number
            <input
              value={form.accountNumber}
              onChange={(e) =>
                setForm({ ...form, accountNumber: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
              placeholder="0123456789"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Account holder
            <input
              value={form.accountHolder}
              onChange={(e) =>
                setForm({ ...form, accountHolder: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Seller name"
            />
          </label>

          <button
            type="submit"
            disabled={saving || !profileId || !selectedBank}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {saving
              ? "Saving..."
              : form.id
                ? "Update bank account"
                : "Add bank account"}
          </button>
        </form>

        <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Saved bank accounts
          </h2>

          {!profileId ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Create a profile first to manage bank accounts.
            </div>
          ) : accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No bank accounts yet
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {account.bankName || "Bank account"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {account.bankCode ? `${account.bankCode} · ` : ""}
                        {account.accountNumber || "-"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 break-all">
                        {account.id}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(account)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
