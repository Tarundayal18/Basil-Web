"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useStore } from "@/contexts/StoreContext";
import Toast from "@/components/Toast";
import { crmEnhancedService, FollowUp } from "@/services/crm-enhanced.service";
import Link from "next/link";

export default function FollowUpsPage() {
  return (
    <ProtectedRoute>
      <FollowUpsContent />
    </ProtectedRoute>
  );
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function FollowUpsContent() {
  const { selectedStore, stores } = useStore();
  const [storeId, setStoreId] = useState<string>("");
  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"OPEN" | "DONE" | "CANCELLED">("OPEN");
  const [search, setSearch] = useState("");

  const today = useMemo(() => isoDate(new Date()), []);
  const to = useMemo(() => isoDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), []);

  const load = async () => {
    const effectiveStoreId = storeId || selectedStore?.id;
    if (!effectiveStoreId) return;
    try {
      setLoading(true);
      setError("");
      const res = await crmEnhancedService.listFollowUps({
        storeId: effectiveStoreId,
        from: "0000-01-01",
        to,
        status,
        limit: 300,
      });
      setItems(res.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load follow-ups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStore?.id && !storeId) setStoreId(selectedStore.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore?.id]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, status, to]);

  const grouped = useMemo(() => {
    const overdue: FollowUp[] = [];
    const dueToday: FollowUp[] = [];
    const upcoming: FollowUp[] = [];

    for (const f of items) {
      if (f.status !== status) continue;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${f.customerName || ""} ${f.customerPhone || ""} ${f.customerId} ${f.title || ""} ${f.note || ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      if (f.dueDate < today) overdue.push(f);
      else if (f.dueDate === today) dueToday.push(f);
      else upcoming.push(f);
    }

    const sort = (a: FollowUp, b: FollowUp) =>
      new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();

    overdue.sort(sort);
    dueToday.sort(sort);
    upcoming.sort(sort);

    return { overdue, dueToday, upcoming };
  }, [items, status, today, search]);

  const mark = async (id: string, next: "OPEN" | "DONE" | "CANCELLED") => {
    try {
      await crmEnhancedService.updateFollowUpStatus(id, next);
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update follow-up");
    }
  };

  if (!selectedStore) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please select a store to view follow-ups.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-gray-600 mt-1">Upcoming and overdue follow-ups (pipeline view)</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/crm" className="text-sm text-blue-600 hover:text-blue-800">
            Back to CRM
          </Link>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search follow-ups"
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="OPEN">Open</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={load}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading follow-ups...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <FollowUpSection
            title="Overdue"
            items={grouped.overdue}
            onMark={mark}
            emptyText="No overdue follow-ups."
          />
          <FollowUpSection
            title="Due today"
            items={grouped.dueToday}
            onMark={mark}
            emptyText="Nothing due today."
          />
          <FollowUpSection
            title="Upcoming (next 14 days)"
            items={grouped.upcoming}
            onMark={mark}
            emptyText="No upcoming follow-ups."
          />
        </div>
      )}

      <Toast message={error} type="error" isOpen={!!error} onClose={() => setError("")} />
    </div>
  );
}

function FollowUpSection(props: {
  title: string;
  items: FollowUp[];
  emptyText: string;
  onMark: (id: string, next: "OPEN" | "DONE" | "CANCELLED") => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-100">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{props.title}</h2>
        <span className="text-xs text-gray-500">{props.items.length}</span>
      </div>
      {props.items.length === 0 ? (
        <div className="p-4 text-sm text-gray-500">{props.emptyText}</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {props.items.map((f) => (
            <div key={f.id} className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium text-gray-900">{f.title || "Follow-up"}</div>
                {f.note ? <div className="text-sm text-gray-600 mt-1">{f.note}</div> : null}
                <div className="text-xs text-gray-500 mt-2">
                  Due: {new Date(f.dueAt).toLocaleString("en-IN")} •{" "}
                  {f.customerName ? `${f.customerName}` : `Customer: ${f.customerId}`}
                  {f.customerPhone ? ` • ${f.customerPhone}` : ""}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Link
                  href={`/crm/customers/${f.customerId}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Open customer
                </Link>
                <div className="flex gap-2">
                  <button
                    onClick={() => props.onMark(f.id, "DONE")}
                    className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700"
                  >
                    Mark done
                  </button>
                  <button
                    onClick={() => props.onMark(f.id, "CANCELLED")}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

