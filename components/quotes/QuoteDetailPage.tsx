/**
 * Quote Detail Page Component
 * Enterprise-grade quote detail view with convert to invoice functionality
 * Uses India's beautiful UI/UX patterns
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { quotesService, Quote } from "@/services/quotes.service";
import { useStore } from "@/contexts/StoreContext";
import { useCountry } from "@/contexts/CountryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency } from "@/lib/region-config";
import { ArrowLeft, FileText, CheckCircle, XCircle, Clock, Send, Download } from "lucide-react";

export default function QuoteDetailPage() {
  const { selectedStore } = useStore();
  const { country } = useCountry();
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const quoteId = String(params.quoteId || "");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [converting, setConverting] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (quoteId && selectedStore?.id) {
      loadQuote();
    }
  }, [quoteId, selectedStore]);

  const loadQuote = async () => {
    if (!selectedStore?.id || !quoteId) return;
    setLoading(true);
    setError("");
    try {
      const quoteData = await quotesService.getQuote(selectedStore.id, quoteId);
      setQuote(quoteData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quote");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!selectedStore?.id || !quoteId) return;
    if (!confirm(t("quotes.convertConfirm") || "Convert this quote to an invoice?")) return;

    setConverting(true);
    try {
      const result = await quotesService.convertToInvoice(selectedStore.id, quoteId);
      router.push(`/invoices`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to convert quote");
    } finally {
      setConverting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedStore?.id || !quoteId) return;
    setUpdating(true);
    try {
      await quotesService.updateQuote(selectedStore.id, quoteId, { status: newStatus as any });
      await loadQuote();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update quote status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">{t("common.loading") || "Loading quote..."}</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4">{error || t("quotes.notFound") || "Quote not found"}</h2>
          <button
            onClick={() => router.push("/quotes")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {t("quotes.backToQuotes") || "Back to Quotes"}
          </button>
        </div>
      </div>
    );
  }

  const status = (quote.status || "DRAFT").toUpperCase();
  const canConvert = status === "ACCEPTED" || status === "SENT";
  const canUpdate = status === "DRAFT";

  const getStatusIcon = () => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "SENT":
        return <Send className="w-5 h-5 text-blue-600" />;
      case "EXPIRED":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {t("quotes.quote") || "Quote"} {quote.quoteNumber || quote.quoteId.slice(-8)}
              </h1>
              <p className="text-gray-600 mt-1">
                {new Date(quote.createdAt).toLocaleDateString()}
                {quote.validUntil && ` • ${t("quotes.validUntil") || "Valid until"}: ${new Date(quote.validUntil).toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === "ACCEPTED"
                  ? "bg-green-100 text-green-800"
                  : status === "SENT"
                  ? "bg-blue-100 text-blue-800"
                  : status === "EXPIRED"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {t(`quotes.status.${status.toLowerCase()}`) || status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canUpdate && (
              <button
                onClick={() => handleUpdateStatus("SENT")}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {updating ? t("common.saving") || "Updating..." : t("quotes.markAsSent") || "Mark as Sent"}
              </button>
            )}
            {status === "SENT" && (
              <>
                <button
                  onClick={() => handleUpdateStatus("ACCEPTED")}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {updating ? t("common.saving") || "Updating..." : t("quotes.markAsAccepted") || "Mark as Accepted"}
                </button>
                <button
                  onClick={() => {
                    if (confirm(t("quotes.markAsExpiredConfirm") || "Mark this quote as expired?")) {
                      handleUpdateStatus("EXPIRED");
                    }
                  }}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {updating ? t("common.saving") || "Updating..." : t("quotes.markAsExpired") || "Mark as Expired"}
                </button>
              </>
            )}
            {canConvert && (
              <button
                onClick={handleConvertToInvoice}
                disabled={converting}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium flex items-center gap-2"
              >
                {converting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t("common.converting") || "Converting..."}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    {t("quotes.convert") || "Convert to Invoice"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quote Details */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{t("customers.customer") || "Customer"}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">{t("customers.customerName") || "Name"}:</span>
                  <span className="ml-2 font-medium">{quote.customerName || "-"}</span>
                </div>
                {quote.customerPhone && (
                  <div>
                    <span className="text-gray-500">{t("customers.customerPhone") || "Phone"}:</span>
                    <span className="ml-2">{quote.customerPhone}</span>
                  </div>
                )}
                {quote.customerEmail && (
                  <div>
                    <span className="text-gray-500">{t("customers.customerEmail") || "Email"}:</span>
                    <span className="ml-2">{quote.customerEmail}</span>
                  </div>
                )}
                {quote.customerGstin && (
                  <div>
                    <span className="text-gray-500">{t("tax.gstin") || "GSTIN"}:</span>
                    <span className="ml-2">{quote.customerGstin}</span>
                  </div>
                )}
                {quote.customerVatId && (
                  <div>
                    <span className="text-gray-500">{t("tax.vatNumber") || "VAT ID"}:</span>
                    <span className="ml-2">{quote.customerVatId}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{t("quotes.quoteDetails") || "Quote Details"}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">{t("quotes.quoteNumber") || "Quote #"}:</span>
                  <span className="ml-2 font-medium">{quote.quoteNumber || quote.quoteId}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t("common.date") || "Date"}:</span>
                  <span className="ml-2">{new Date(quote.createdAt).toLocaleDateString()}</span>
                </div>
                {quote.validUntil && (
                  <div>
                    <span className="text-gray-500">{t("quotes.validUntil") || "Valid Until"}:</span>
                    <span className="ml-2">{new Date(quote.validUntil).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {quote.notes && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{t("quotes.notes") || "Notes"}</h3>
              <p className="text-gray-700">{quote.notes}</p>
            </div>
          )}

          {/* Items */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">{t("products.items") || "Items"}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("products.productName") || "Item"}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("products.qty") || "Qty"}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("products.price") || "Price"}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("products.discount") || "Disc%"}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("products.subtotal") || "Total"}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(quote.items || []).map((item, idx) => {
                    const price = item.price * (1 - (item.discountPercentage || 0) / 100);
                    const total = price * item.quantity;
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{item.productName}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.price, country)}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.discountPercentage || 0}%</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(total, country)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-semibold">
                      {t("invoices.total") || "Total"}:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-lg">
                      {formatCurrency(quote.totalAmount, country)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
