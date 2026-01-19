/**
 * Quotes Page Component
 * Enterprise-grade quotes management with country-aware tax support
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quotesService, Quote } from "@/services/quotes.service";
import { useStore } from "@/contexts/StoreContext";
import { useCountry } from "@/contexts/CountryContext";
import { useI18n } from "@/contexts/I18nContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { formatCurrency } from "@/lib/region-config";
import { FileText, Plus, Search, Calendar } from "lucide-react";

export default function QuotesPage() {
  const { selectedStore } = useStore();
  const { country, isIN, isNL, isDE } = useCountry();
  const { t } = useI18n();
  const router = useRouter();
  const { trackButton } = useAnalytics("Quotes Page", false);
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    if (selectedStore?.id) {
      loadQuotes();
    }
  }, [selectedStore, statusFilter, startDate, endDate]);

  const loadQuotes = async () => {
    if (!selectedStore?.id) return;
    
    setLoading(true);
    setError("");
    try {
      const quotesData = await quotesService.getQuotes(selectedStore.id, {
        status: statusFilter || undefined,
        fromDate: startDate || undefined,
        toDate: endDate || undefined,
      });
      setQuotes(quotesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quotes");
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter((quote) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      quote.quoteNumber?.toLowerCase().includes(search) ||
      quote.customerName?.toLowerCase().includes(search) ||
      quote.customerPhone?.toLowerCase().includes(search) ||
      quote.customerEmail?.toLowerCase().includes(search)
    );
  });

  const handleViewQuote = (quoteId: string) => {
    router.push(`/quotes/${quoteId}`);
  };

  const handleConvertToInvoice = async (quoteId: string) => {
    if (!selectedStore?.id) return;
    
    if (!confirm(t("quotes.confirmConvert") || "Convert this quote to an invoice?")) {
      return;
    }

    try {
      trackButton("Convert Quote to Invoice", { quote_id: quoteId });
      const result = await quotesService.convertToInvoice(selectedStore.id, quoteId);
      router.push(`/invoices`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to convert quote");
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t("quotes.title") || "Quotes"}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("quotes.description") || "View and manage customer quotes"}
          </p>
        </div>
        <button
          onClick={() => {
            trackButton("Create Quote", { location: "quotes_page" });
            router.push("/quotes/new");
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t("quotes.newQuote") || "New Quote"}
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
              placeholder={t("quotes.searchPlaceholder") || "Search quotes..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">{t("quotes.allStatus") || "All Status"}</option>
            <option value="DRAFT">{t("quotes.draft") || "Draft"}</option>
            <option value="SENT">{t("quotes.sent") || "Sent"}</option>
            <option value="ACCEPTED">{t("quotes.accepted") || "Accepted"}</option>
            <option value="EXPIRED">{t("quotes.expired") || "Expired"}</option>
            <option value="REJECTED">{t("quotes.rejected") || "Rejected"}</option>
          </select>
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
          <p className="mt-4 text-gray-600">{t("common.loading") || "Loading quotes..."}</p>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t("quotes.noQuotes") || "No quotes found"}</p>
          <button
            onClick={() => router.push("/quotes/new")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {t("quotes.createFirst") || "Create Your First Quote"}
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
                    {t("quotes.quoteNumber") || "Quote #"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("quotes.customer") || "Customer"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("quotes.date") || "Date"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("quotes.validUntil") || "Valid Until"}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("quotes.total") || "Total"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("quotes.status") || "Status"}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions") || "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.quoteId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quote.quoteNumber || quote.quoteId.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{quote.customerName || "-"}</div>
                        {quote.customerPhone && (
                          <div className="text-gray-500 text-xs">{quote.customerPhone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(quote.totalAmount, country)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          quote.status === "ACCEPTED"
                            ? "bg-green-100 text-green-800"
                            : quote.status === "SENT"
                            ? "bg-blue-100 text-blue-800"
                            : quote.status === "EXPIRED"
                            ? "bg-red-100 text-red-800"
                            : quote.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {t(`quotes.status.${quote.status.toLowerCase()}`) || quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewQuote(quote.quoteId)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t("common.view") || "View"}
                        </button>
                        {(quote.status === "ACCEPTED" || quote.status === "SENT") && (
                          <button
                            onClick={() => handleConvertToInvoice(quote.quoteId)}
                            className="text-green-600 hover:text-green-900"
                          >
                            {t("quotes.convert") || "Convert"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredQuotes.map((quote) => (
              <div key={quote.quoteId} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {quote.quoteNumber || quote.quoteId.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-600">{quote.customerName || "-"}</p>
                    {quote.customerPhone && (
                      <p className="text-xs text-gray-500">{quote.customerPhone}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      quote.status === "ACCEPTED"
                        ? "bg-green-100 text-green-800"
                        : quote.status === "SENT"
                        ? "bg-blue-100 text-blue-800"
                        : quote.status === "EXPIRED"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {t(`quotes.status.${quote.status.toLowerCase()}`) || quote.status}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-gray-600">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(quote.totalAmount, country)}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleViewQuote(quote.quoteId)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    {t("common.view") || "View"}
                  </button>
                  {(quote.status === "ACCEPTED" || quote.status === "SENT") && (
                    <button
                      onClick={() => handleConvertToInvoice(quote.quoteId)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      {t("quotes.convert") || "Convert"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
