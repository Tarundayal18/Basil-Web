/**
 * Enhanced Customer Profile Page
 * Enterprise-grade customer profile with lifetime metrics, preferences, and timeline
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, CustomerProfile, InteractionHistory } from "@/services/crm-enhanced.service";
import { crmService } from "@/services/crm.service";
import { useStore } from "@/contexts/StoreContext";
import Toast from "@/components/Toast";
import Link from "next/link";
import { Award } from "lucide-react";
import CustomerLifetimeValueWidget from "@/components/ai/CustomerLifetimeValueWidget";
import { customersService, type CustomerDetails } from "@/services/customers.service";
import { ordersService } from "@/services/orders.service";
import { tenantUsersService, type TenantUser } from "@/services/tenantUsers.service";
import { jobCardsService, type JobCard } from "@/services/jobCards.service";

export default function CustomerProfilePage() {
  return (
    <ProtectedRoute>
      <CustomerProfileContent />
    </ProtectedRoute>
  );
}

function CustomerProfileContent() {
  const params = useParams();
  const router = useRouter();
  const { selectedStore, stores } = useStore();
  const customerId = params.id as string;

  type LoyaltyData = { tier?: string; points?: number; tierBenefits?: string[] };
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loyaltyTier, setLoyaltyTier] = useState<LoyaltyData | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [timelineInteractions, setTimelineInteractions] = useState<InteractionHistory[]>([]);
  const [timelineJobCards, setTimelineJobCards] = useState<JobCard[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<
    "ALL" | "ORDERS" | "INVOICES" | "JOB_CARDS" | "NOTES" | "WHATSAPP" | "EMAIL"
  >("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [showNoteModal, setShowNoteModal] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [profileRes, detailsRes, usersRes, interactionsRes, jobCardsRes] = await Promise.allSettled([
        crmEnhancedService.getCustomerProfile(customerId),
        customersService.getCustomerDetails(customerId),
        tenantUsersService.getTenantUsers(),
        crmEnhancedService.getCustomerTimeline(customerId, 50),
        jobCardsService.getCustomerJobCards(customerId, { storeId: selectedStore?.id, limit: 50 }),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value);
      } else {
        throw profileRes.reason;
      }

      if (detailsRes.status === "fulfilled") {
        setCustomerDetails(detailsRes.value);
      } else {
        // Not fatal for the profile screen, but we want it visible for debugging.
        console.warn("Failed to load customer order history:", detailsRes.reason);
        setCustomerDetails(null);
      }

      if (usersRes.status === "fulfilled") {
        setTenantUsers(usersRes.value.users || []);
      }

      if (interactionsRes.status === "fulfilled") {
        setTimelineInteractions(interactionsRes.value.items || []);
      } else {
        setTimelineInteractions([]);
      }

      if (jobCardsRes.status === "fulfilled") {
        setTimelineJobCards(jobCardsRes.value.items || []);
      } else {
        setTimelineJobCards([]);
      }
      
      // Load loyalty tier info
      try {
        const loyalty = await crmService.getLoyalty(customerId);
        setLoyaltyTier(loyalty);
      } catch {
        // Loyalty might not exist, that's okay
        console.log("No loyalty data found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customer profile");
    } finally {
      setLoading(false);
    }
  }, [customerId, selectedStore?.id]);

  useEffect(() => {
    if (customerId) {
      loadProfile();
    }
  }, [customerId, loadProfile]);

  const handleDownloadPdf = async (orderId: string, billNumber: string, pdfUrl?: string) => {
    if (!pdfUrl) return;
    setDownloadingOrderId(orderId);
    try {
      await ordersService.downloadBillPdf(pdfUrl, billNumber, orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download PDF");
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString("en-IN");

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    setProfile((p) => {
      if (!p) return p;
      const next = Array.isArray(p.tags) ? p.tags.slice() : [];
      if (!next.includes(tag)) next.push(tag);
      return { ...p, tags: next };
    });
  };
  const removeTag = (tag: string) => {
    setProfile((p) => {
      if (!p) return p;
      return { ...p, tags: (p.tags || []).filter((t) => t !== tag) };
    });
  };

  const computeInactiveDays = () => {
    const last =
      profile?.lastInteractionDate ||
      (customerDetails?.orders && customerDetails.orders.length > 0
        ? customerDetails.orders
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
            .createdAt
        : undefined);
    if (!last) return null;
    return Math.floor((Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24));
  };

  type CustomerOrder = CustomerDetails["orders"][number];
  type UnifiedTimelineItem =
    | { kind: "INTERACTION"; date: string; interaction: InteractionHistory }
    | { kind: "ORDER"; date: string; order: CustomerOrder }
    | { kind: "JOB_CARD"; date: string; jobCard: JobCard };

  const unifiedTimeline: UnifiedTimelineItem[] = [
    ...(timelineInteractions || []).map((i) => ({
      kind: "INTERACTION" as const,
      date: i.interactionDate,
      interaction: i,
    })),
    ...(customerDetails?.orders || []).map((o) => ({
      kind: "ORDER" as const,
      date: o.createdAt,
      order: o,
    })),
    ...(timelineJobCards || []).map((jc) => ({
      kind: "JOB_CARD" as const,
      date: jc.createdAt,
      jobCard: jc,
    })),
  ]
    .filter((x) => !!x.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTimeline = unifiedTimeline.filter((t) => {
    if (timelineFilter === "ALL") return true;
    if (timelineFilter === "ORDERS" || timelineFilter === "INVOICES") return t.kind === "ORDER";
    if (timelineFilter === "JOB_CARDS") return t.kind === "JOB_CARD";
    if (timelineFilter === "WHATSAPP")
      return t.kind === "INTERACTION" && (t.interaction.channel || "").toUpperCase() === "WHATSAPP";
    if (timelineFilter === "EMAIL")
      return t.kind === "INTERACTION" && (t.interaction.channel || "").toUpperCase() === "EMAIL";
    if (timelineFilter === "NOTES")
      return (
        t.kind === "INTERACTION" &&
        ["MANUAL_NOTE", "FOLLOW_UP", "FOLLOW_UP_DONE"].includes(
          String(t.interaction.interactionType || "").toUpperCase()
        )
      );
    return true;
  });

  const handleSendWhatsApp = async () => {
    if (!profile?.phone) return;
    const digits = profile.phone.replace(/[^\d]/g, "");
    const url = `https://wa.me/${digits}`;
    window.open(url, "_blank", "noopener,noreferrer");
    try {
      await crmEnhancedService.addInteraction(customerId, {
        interactionType: "WHATSAPP",
        channel: "WHATSAPP",
        title: "WhatsApp opened",
        description: "Opened WhatsApp chat from customer profile",
        amount: undefined,
        orderId: undefined,
        jobCardId: undefined,
        campaignId: undefined,
        metadata: {},
      });
      const tl = await crmEnhancedService.getCustomerTimeline(customerId, 50);
      setTimelineInteractions(tl.items || []);
    } catch {
      // ignore
    }
  };

  const handleAddNote = async (withFollowUp: boolean) => {
    if (!quickNote.trim()) return;
    try {
      await crmEnhancedService.addInteraction(customerId, {
        interactionType: withFollowUp ? "FOLLOW_UP" : "MANUAL_NOTE",
        channel: "MANUAL",
        title: withFollowUp ? "Follow-up set" : "Note added",
        description: quickNote.trim(),
        metadata: withFollowUp && followUpDate ? { followUpDate, note: quickNote.trim() } : { note: quickNote.trim() },
        amount: undefined,
        orderId: undefined,
        jobCardId: undefined,
        campaignId: undefined,
      });
      setQuickNote("");
      setFollowUpDate("");
      setShowNoteModal(false);
      const tl = await crmEnhancedService.getCustomerTimeline(customerId, 50);
      setTimelineInteractions(tl.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add note");
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError("");
      const updated = await crmEnhancedService.updateCustomerProfile(customerId, profile);
      // Sync base customer fields used by listing/filters (type + tags)
      const typeLower: "retail" | "wholesale" | "corporate" | "vip" =
        updated.customerType === "VIP"
          ? "vip"
          : updated.customerType === "WHOLESALE"
          ? "wholesale"
          : updated.customerType === "CORPORATE"
          ? "corporate"
          : "retail";
      await customersService.updateCustomer(customerId, {
        customerType: typeLower,
        tags: updated.tags,
      });
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadProfile}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const orders = (customerDetails?.orders || []).slice().sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profile.name}</h1>
            <div className="mt-1 text-gray-600">
              <span>{profile.phone}</span>
              {profile.email ? <span className="ml-2">• {profile.email}</span> : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                {profile.customerType || "RETAIL"}
              </span>
              {profile.segment ? (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-800">
                  Segment: {profile.segment}
                </span>
              ) : null}
              {computeInactiveDays() !== null ? (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-800">
                  Inactive: {computeInactiveDays()}d
                </span>
              ) : null}
              {(profile.tags || []).map((t) => (
                <span key={t} className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-800">
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-3 text-sm text-gray-600 flex flex-wrap gap-3">
              <span>
                Assigned store:{" "}
                <span className="font-medium text-gray-900">
                  {stores.find((s) => s.id === profile.assignedStoreId)?.name || "—"}
                </span>
              </span>
              <span>
                Assigned manager:{" "}
                <span className="font-medium text-gray-900">
                  {tenantUsers.find((u) => u.userId === profile.assignedManagerId)?.user?.name ||
                    tenantUsers.find((u) => u.userId === profile.assignedManagerId)?.user?.email ||
                    "—"}
                </span>
              </span>
            </div>

            {editing && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Customer Type</label>
                  <select
                    value={profile.customerType || "RETAIL"}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        customerType: e.target.value as CustomerProfile["customerType"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="CORPORATE">Corporate</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Assigned Store</label>
                  <select
                    value={profile.assignedStoreId || ""}
                    onChange={(e) => setProfile({ ...profile, assignedStoreId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">—</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Assigned Manager</label>
                  <select
                    value={profile.assignedManagerId || ""}
                    onChange={(e) => setProfile({ ...profile, assignedManagerId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">—</option>
                    {tenantUsers
                      .filter((u) => u.isActive && (u.role === "OWNER" || u.role === "MANAGER"))
                      .map((u) => (
                        <option key={u.userId} value={u.userId}>
                          {(u.user?.name || u.user?.email || u.userId) + ` (${u.role})`}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2 items-center border border-gray-300 rounded-lg px-2 py-2 bg-white">
                    {(profile.tags || []).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-800"
                      >
                        {t}
                        <button
                          type="button"
                          className="text-indigo-700 hover:text-indigo-900"
                          onClick={() => removeTag(t)}
                          aria-label={`Remove tag ${t}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addTag(tagInput);
                          setTagInput("");
                        }
                      }}
                      placeholder={(profile.tags || []).length === 0 ? "Type + Enter" : ""}
                      className="flex-1 min-w-[120px] outline-none text-sm px-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 items-stretch md:items-end">
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={handleSendWhatsApp}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Send WhatsApp
              </button>
              <button
                onClick={() => router.push("/crm/offers/new")}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create offer
              </button>
              <button
                onClick={() => setShowNoteModal(true)}
                className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Add note / follow-up
              </button>
              <button
                onClick={async () => {
                  try {
                    setSaving(true);
                    setError("");
                    await customersService.updateCustomer(customerId, { customerType: "vip" });
                    const refreshed = await crmEnhancedService.getCustomerProfile(customerId);
                    setProfile(refreshed);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Failed to mark as VIP");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Mark as VIP
              </button>
            </div>

            <div className="flex gap-2 justify-end">
              {editing ? (
                <>
                  <button
                    onClick={() => {
                      setEditing(false);
                      loadProfile();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Quick edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <Link
            href={`/crm/customers/${customerId}`}
            className="border-b-2 border-blue-600 py-4 px-1 text-sm font-medium text-blue-600"
          >
            Profile
          </Link>
          <Link
            href={`/crm/customers/${customerId}/timeline`}
            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Timeline
          </Link>
          <Link
            href={`/crm/customers/${customerId}/preferences`}
            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Preferences
          </Link>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline-first */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-semibold">Timeline</h2>
                <p className="text-sm text-gray-500">Orders, invoices, job cards, notes & messages</p>
              </div>
              <Link
                href={`/crm/customers/${customerId}/timeline`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View full timeline
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {(["ALL", "INVOICES", "JOB_CARDS", "NOTES", "WHATSAPP", "EMAIL"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTimelineFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    timelineFilter === f
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
            {filteredTimeline.slice(0, 12).length === 0 ? (
              <div className="text-sm text-gray-500">No timeline events yet.</div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const toDayKey = (d: string) => new Date(d).toISOString().slice(0, 10);
                  const dayLabel = (k: string) => {
                    const now = new Date();
                    const today = now.toISOString().slice(0, 10);
                    const y = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                    if (k === today) return "Today";
                    if (k === y) return "Yesterday";
                    return new Date(k).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
                  };
                  const icon = (t: any) => {
                    if (t.kind === "ORDER") return "🧾";
                    if (t.kind === "JOB_CARD") return "🔧";
                    const it = String(t.interaction?.interactionType || "").toUpperCase();
                    if (it === "WHATSAPP") return "💬";
                    if (it === "EMAIL") return "📧";
                    if (it === "FOLLOW_UP") return "📅";
                    if (it === "MANUAL_NOTE") return "📝";
                    if (it === "PURCHASE") return "🛒";
                    return "📌";
                  };
                  const preview = filteredTimeline.slice(0, 12);
                  const groups = new Map<string, typeof preview>();
                  for (const t of preview) {
                    const k = toDayKey(t.date);
                    const arr = groups.get(k) || [];
                    arr.push(t);
                    groups.set(k, arr);
                  }
                  const keys = Array.from(groups.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                  return keys.map((k) => (
                    <div key={k}>
                      <div className="text-xs font-medium text-gray-500 mb-2">{dayLabel(k)}</div>
                      <div className="space-y-2">
                        {(groups.get(k) || []).map((t, idx) => (
                          <div key={`${t.kind}-${t.date}-${idx}`} className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                                {icon(t)}
                              </div>
                              <div className="min-w-0">
                                {t.kind === "ORDER" ? (
                                  <>
                                    <div className="font-medium text-gray-900">Invoice / Order</div>
                                    <div className="text-sm text-gray-600 truncate">
                                      {(t.order?.bill?.billNumber && `Bill: ${t.order.bill.billNumber}`) ||
                                        t.order?.id ||
                                        ""}
                                    </div>
                                  </>
                                ) : t.kind === "JOB_CARD" ? (
                                  <>
                                    <div className="font-medium text-gray-900">Job card</div>
                                    <div className="text-sm text-gray-600 truncate">
                                      {t.jobCard.jobCardNumber} • {t.jobCard.status}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="font-medium text-gray-900">{t.interaction.title}</div>
                                    <div className="text-sm text-gray-600 truncate">{t.interaction.description || ""}</div>
                                    <div className="text-xs text-gray-500">
                                      {(t.interaction.channel || "").toUpperCase()} •{" "}
                                      {(t.interaction.interactionType || "").toUpperCase()}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                              {new Date(t.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Customer Lifetime Value Widget */}
          <CustomerLifetimeValueWidget customerId={customerId} compact={false} />
          
          {/* Lifetime Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Lifetime Metrics</h2>
            {loyaltyTier?.tier && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Loyalty Tier</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-lg font-bold ${
                        loyaltyTier.tier === "PLATINUM" ? "text-purple-600" :
                        loyaltyTier.tier === "GOLD" ? "text-yellow-600" :
                        loyaltyTier.tier === "SILVER" ? "text-gray-600" :
                        "text-orange-600"
                      }`}>
                        {loyaltyTier.tier}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({loyaltyTier.points || 0} points)
                      </span>
                    </div>
                    {loyaltyTier.tierBenefits && loyaltyTier.tierBenefits.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">Benefits:</p>
                        <ul className="text-xs text-gray-700 space-y-0.5">
                          {loyaltyTier.tierBenefits.slice(0, 2).map((benefit, idx) => (
                            <li key={idx}>• {benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Lifetime Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{profile.lifetimeValue?.toLocaleString("en-IN") || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{profile.totalOrders || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{profile.averageOrderValue?.toLocaleString("en-IN") || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Purchase Frequency</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile.purchaseFrequency?.toFixed(1) || "0.0"}/month
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={profile.dateOfBirth || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, dateOfBirth: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {profile.dateOfBirth
                        ? new Date(profile.dateOfBirth).toLocaleDateString()
                        : "Not set"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anniversary
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={profile.anniversary || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, anniversary: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {profile.anniversary
                        ? new Date(profile.anniversary).toLocaleDateString()
                        : "Not set"}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Type
                </label>
                {editing ? (
                  <select
                    value={profile.customerType || "RETAIL"}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        customerType: e.target.value as CustomerProfile["customerType"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="CORPORATE">Corporate</option>
                    <option value="VIP">VIP</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{profile.customerType || "Retail"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segment</label>
                {editing ? (
                  <input
                    type="text"
                    value={profile.segment || ""}
                    onChange={(e) => setProfile({ ...profile, segment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter segment"
                  />
                ) : (
                  <p className="text-gray-900">{profile.segment || "Not assigned"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Purchase History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Purchase History</h2>
            {!customerDetails ? (
              <p className="text-sm text-gray-600">
                Order history not available right now.
              </p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-gray-600">No orders found for this customer.</p>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 10).map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          Order #{order.id.slice(-8)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.store?.name || "Store"} • {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {order.orderItems?.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-2">Items:</div>
                        <div className="space-y-1">
                          {order.orderItems.map((item) => {
                            const productName =
                              item.product?.name ||
                              item.productName ||
                              "Unknown Product";
                            return (
                              <div
                                key={item.id}
                                className="flex justify-between text-sm text-gray-700"
                              >
                                <span className="truncate pr-2">
                                  {productName} × {item.quantity}
                                </span>
                                <span className="whitespace-nowrap">
                                  {formatCurrency(item.subtotal)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {order.bill?.pdfUrl && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Bill: {order.bill.billNumber}
                        </div>
                        <button
                          onClick={() =>
                            handleDownloadPdf(order.id, order.bill!.billNumber, order.bill!.pdfUrl)
                          }
                          disabled={downloadingOrderId === order.id}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {downloadingOrderId === order.id ? "Downloading..." : "Download PDF"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Addresses</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Address
                </label>
                {editing ? (
                  <textarea
                    value={profile.billingAddress || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, billingAddress: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-900">{profile.billingAddress || "Not set"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Address
                </label>
                {editing ? (
                  <textarea
                    value={profile.shippingAddress || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, shippingAddress: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-900">{profile.shippingAddress || "Not set"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Communication Preferences */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Communication Preferences</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.smsConsent || false}
                  onChange={(e) =>
                    setProfile({ ...profile, smsConsent: e.target.checked })
                  }
                  disabled={!editing}
                  className="mr-2"
                />
                <span className="text-gray-700">SMS Consent</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.whatsappConsent || false}
                  onChange={(e) =>
                    setProfile({ ...profile, whatsappConsent: e.target.checked })
                  }
                  disabled={!editing}
                  className="mr-2"
                />
                <span className="text-gray-700">WhatsApp Consent</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.emailConsent || false}
                  onChange={(e) =>
                    setProfile({ ...profile, emailConsent: e.target.checked })
                  }
                  disabled={!editing}
                  className="mr-2"
                />
                <span className="text-gray-700">Email Consent</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Channel
                </label>
                {editing ? (
                  <select
                    value={profile.preferredChannel || "SMS"}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        preferredChannel: e.target.value as CustomerProfile["preferredChannel"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{profile.preferredChannel || "SMS"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/crm/customers/${customerId}/timeline`}
                className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                View Timeline
              </Link>
              <Link
                href={`/crm/customers/${customerId}/preferences`}
                className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                View Preferences
              </Link>
              <Link
                href={`/crm/customers/${customerId}/wallet`}
                className="block w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                Wallet
              </Link>
              <Link
                href={`/crm/customers/${customerId}/credit`}
                className="block w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                Credit Ledger
              </Link>
              <Link
                href={`/crm/customers/${customerId}/loyalty`}
                className="block w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
              >
                Loyalty Points
              </Link>
            </div>
          </div>

          {/* Key Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Key Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">First Interaction</p>
                <p className="text-gray-900">
                  {profile.firstInteractionDate
                    ? new Date(profile.firstInteractionDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Interaction</p>
                <p className="text-gray-900">
                  {profile.lastInteractionDate
                    ? new Date(profile.lastInteractionDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              {profile.gstin && (
                <div>
                  <p className="text-sm text-gray-600">GSTIN</p>
                  <p className="text-gray-900">{profile.gstin}</p>
                </div>
              )}
              {profile.behaviorScore !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Behavior Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${profile.behaviorScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{profile.behaviorScore}/100</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast
        message={error}
        type="error"
        isOpen={!!error}
        onClose={() => setError("")}
      />

      {/* Note / Follow-up modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add note / set follow-up</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowNoteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="What happened? Next step?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up date (optional)</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddNote(false)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Add note
                </button>
                <button
                  onClick={() => handleAddNote(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Set follow-up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

