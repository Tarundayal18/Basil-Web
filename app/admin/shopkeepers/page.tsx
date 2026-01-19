"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

type StoreAssignment = {
  storeId: string;
  store?: { id: string; name?: string } | null;
};

type ShopkeeperRow = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  purgeStatus?: string;
  purgeRequestedAt?: string;
  purgeJobId?: string;
  storeAssignments?: StoreAssignment[];
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

export default function AdminShopkeepersPage() {
  const router = useRouter();
  const [shopkeepers, setShopkeepers] = useState<ShopkeeperRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [purgeEmail, setPurgeEmail] = useState("");
  const [purgePhone, setPurgePhone] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  useEffect(() => {
    loadShopkeepers();
  }, []);

  const loadShopkeepers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: ShopkeeperRow[] }>("/admin/shopkeepers", {
        limit: 200,
      });
      setShopkeepers(response.data?.data || []);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to load shopkeepers");
      console.error("Shopkeepers load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shopkeepers;
    return shopkeepers.filter((s) => {
      const hay = `${s.id} ${s.name || ""} ${s.email || ""} ${s.phone || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, shopkeepers]);

  const triggerPurge = async (payload: { shopkeeperId?: string; email?: string; phone?: string }) => {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      setError("Type DELETE to confirm hard deletion.");
      return;
    }

    try {
      setPurging(true);
      setError(null);
      setPurgeResult(null);
      const res = await apiClient.post<{
        jobId: string;
        shopkeeperId: string;
        email?: string;
        phone?: string;
        storeIds: string[];
        status: string;
      }>("/admin/shopkeepers/purge", payload, { timeout: 30000 });

      const jobId = res.data?.jobId;
      setPurgeResult(jobId ? `Purge queued. jobId=${jobId}` : "Purge queued.");
      await loadShopkeepers();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to queue purge job");
      console.error("Purge error:", err);
    } finally {
      setPurging(false);
    }
  };

  const purgeSelected = async () => {
    const email = purgeEmail.trim() || undefined;
    const phone = purgePhone.trim() || undefined;
    if (!email && !phone) {
      setError("Enter email or phone to purge.");
      return;
    }
    await triggerPurge({ email, phone });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading shopkeepers...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shopkeeper Management</h1>
        <div className="space-x-3">
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => loadShopkeepers()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {purgeResult && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {purgeResult}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="text-sm text-gray-700 font-semibold">Hard delete (irreversible)</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={purgeEmail}
            onChange={(e) => setPurgeEmail(e.target.value)}
            placeholder="Email (optional)"
            className="border rounded px-3 py-2"
          />
          <input
            value={purgePhone}
            onChange={(e) => setPurgePhone(e.target.value)}
            placeholder="Phone (optional)"
            className="border rounded px-3 py-2"
          />
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="border rounded px-3 py-2"
          />
        </div>
        <div className="flex justify-end">
          <button
            disabled={purging}
            onClick={purgeSelected}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {purging ? "Queuing..." : "Queue Purge"}
          </button>
        </div>
        <div className="text-xs text-gray-500">
          This will immediately deactivate the account and remove login indexes (email/phone/googleUid),
          then delete all store data asynchronously.
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-3 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name/email/phone/id"
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shopkeeper
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stores
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purge
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((s) => {
                const storesCount = s.storeAssignments?.length || 0;
                const purgeLabel = s.purgeStatus ? `${s.purgeStatus}${s.purgeJobId ? ` (${s.purgeJobId})` : ""}` : "-";
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{s.name || "-"}</div>
                      <div className="text-xs text-gray-500">{s.id}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      <div>{s.email || "-"}</div>
                      <div className="text-xs text-gray-500">{s.phone || "-"}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {storesCount}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          s.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {s.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{purgeLabel}</span>
                        <button
                          disabled={purging}
                          onClick={() => triggerPurge({ shopkeeperId: s.id })}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Purge
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={5}>
                    No shopkeepers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

