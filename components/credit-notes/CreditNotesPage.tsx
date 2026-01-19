/**
 * Credit Notes Page Component
 * Enterprise-grade credit notes management with India UI/UX
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { creditNotesService, CreditNote } from "@/services/creditNotes.service";
import { useStore } from "@/contexts/StoreContext";
import { useCountry } from "@/contexts/CountryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency } from "@/lib/region-config";
import { ReceiptText, Plus, Search, Calendar } from "lucide-react";
import Link from "next/link";

export default function CreditNotesPage() {
  const { selectedStore } = useStore();
  const { country } = useCountry();
  const { t } = useI18n();
  const router = useRouter();

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (selectedStore?.id) {
      loadCreditNotes();
    }
  }, [selectedStore, startDate, endDate]);

  const loadCreditNotes = async () => {
    if (!selectedStore?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await creditNotesService.getCreditNotes(selectedStore.id, {
        fromDate: startDate || undefined,
        toDate: endDate || undefined,
      });
      setCreditNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load credit notes");
      setCreditNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCreditNotes = creditNotes.filter((cn) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      cn.creditNoteNumber?.toLowerCase().includes(search) ||
      cn.customerName?.toLowerCase().includes(search) ||
      cn.originalInvoiceId?.toLowerCase().includes(search)
    );
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t("creditNotes.title") || "Credit Notes"}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("creditNotes.description") || "View and manage credit notes"}
          </p>
        </div>
        <button
          onClick={() => router.push("/credit-notes/new")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t("creditNotes.create") || "New Credit Note"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm text-red-800">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("creditNotes.searchPlaceholder") || "Search credit notes..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">{t("common.from") || "From"}:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">{t("common.to") || "To"}:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              {t("common.clear") || "Clear"}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">{t("common.loading") || "Loading credit notes..."}</p>
        </div>
      ) : filteredCreditNotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <ReceiptText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t("creditNotes.noCreditNotes") || "No credit notes found"}</p>
          <button
            onClick={() => router.push("/credit-notes/new")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {t("creditNotes.createFirst") || "Create Your First Credit Note"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("creditNotes.creditNoteNumber") || "Credit Note #"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("creditNotes.originalInvoice") || "Original Invoice"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("customers.customer") || "Customer"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.date") || "Date"}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("creditNotes.amount") || "Amount"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.status") || "Status"}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions") || "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCreditNotes.map((cn) => (
                  <tr key={cn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cn.creditNoteNumber || cn.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <Link 
                        href="/invoices"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {cn.originalInvoiceId?.slice(-8) || "-"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cn.customerName || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cn.creditNoteDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(Math.abs(cn.totalAmount), country)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        cn.status === "ISSUED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {cn.status || "ISSUED"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => router.push(`/credit-notes/${cn.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {t("common.view") || "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredCreditNotes.map((cn) => (
              <div key={cn.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {cn.creditNoteNumber || cn.id.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-600">{cn.customerName || "-"}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("creditNotes.originalInvoice") || "Invoice"}:{" "}
                      <Link 
                        href="/invoices"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {cn.originalInvoiceId?.slice(-8) || "-"}
                      </Link>
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    cn.status === "ISSUED"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {cn.status || "ISSUED"}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-gray-600">
                    {new Date(cn.creditNoteDate).toLocaleDateString()}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(Math.abs(cn.totalAmount), country)}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/credit-notes/${cn.id}`)}
                  className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  {t("common.view") || "View"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
