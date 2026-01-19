/**
 * Credit Note Detail Page Component
 * Enterprise-grade credit note detail view with India UI/UX
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { creditNotesService, CreditNote } from "@/services/creditNotes.service";
import { useStore } from "@/contexts/StoreContext";
import { useCountry } from "@/contexts/CountryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency } from "@/lib/region-config";
import { ArrowLeft, ReceiptText, XCircle } from "lucide-react";
import Link from "next/link";

export default function CreditNoteDetailPage() {
  const { selectedStore } = useStore();
  const { country, isIN } = useCountry();
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const creditNoteId = String(params.creditNoteId || "");

  const [creditNote, setCreditNote] = useState<CreditNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (creditNoteId && selectedStore?.id) {
      loadCreditNote();
    }
  }, [creditNoteId, selectedStore]);

  const loadCreditNote = async () => {
    if (!selectedStore?.id || !creditNoteId) return;
    setLoading(true);
    setError("");
    try {
      const data = await creditNotesService.getCreditNote(selectedStore.id, creditNoteId);
      setCreditNote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load credit note");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">{t("common.loading") || "Loading credit note..."}</p>
        </div>
      </div>
    );
  }

  if (error || !creditNote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4">{error || t("creditNotes.notFound") || "Credit note not found"}</h2>
          <button
            onClick={() => router.push("/credit-notes")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {t("creditNotes.backToCreditNotes") || "Back to Credit Notes"}
          </button>
        </div>
      </div>
    );
  }

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
                {t("creditNotes.creditNote") || "Credit Note"} {creditNote.creditNoteNumber || creditNote.id.slice(-8)}
              </h1>
              <p className="text-gray-600 mt-1">
                {new Date(creditNote.creditNoteDate).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              creditNote.status === "ISSUED"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}>
              {creditNote.status || "ISSUED"}
            </span>
          </div>
        </div>

        {/* Credit Note Details */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{t("customers.customer") || "Customer"}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">{t("customers.customerName") || "Name"}:</span>
                  <span className="ml-2 font-medium">{creditNote.customerName || "-"}</span>
                </div>
                {creditNote.customerGstin && (
                  <div>
                    <span className="text-gray-500">{t("tax.gstin") || "GSTIN"}:</span>
                    <span className="ml-2">{creditNote.customerGstin}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{t("creditNotes.creditNoteDetails") || "Credit Note Details"}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">{t("creditNotes.creditNoteNumber") || "Credit Note #"}:</span>
                  <span className="ml-2 font-medium">{creditNote.creditNoteNumber || creditNote.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t("creditNotes.originalInvoice") || "Original Invoice"}:</span>
                  <span className="ml-2">
                    <Link 
                      href="/invoices"
                      className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                      title={t("creditNotes.viewOriginalInvoice") || "View original invoice"}
                    >
                      {creditNote.originalInvoiceId?.slice(-8) || "-"}
                    </Link>
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">{t("common.date") || "Date"}:</span>
                  <span className="ml-2">{new Date(creditNote.creditNoteDate).toLocaleDateString()}</span>
                </div>
                {creditNote.reason && (
                  <div>
                    <span className="text-gray-500">{t("creditNotes.reason") || "Reason"}:</span>
                    <span className="ml-2">{creditNote.reason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {creditNote.notes && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{t("creditNotes.notes") || "Notes"}</h3>
              <p className="text-gray-700">{creditNote.notes}</p>
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
                    {/* Country-aware tax columns: GST for India, simple for EU */}
                    {isIN ? (
                      <>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("products.taxableValue") || "Taxable Value"}</th>
                        {creditNote.totalCGST !== 0 && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("tax.cgst") || "CGST"}</th>
                        )}
                        {creditNote.totalSGST !== 0 && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("tax.sgst") || "SGST"}</th>
                        )}
                        {creditNote.totalIGST !== 0 && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("tax.igst") || "IGST"}</th>
                        )}
                      </>
                    ) : (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("tax.vat") || "VAT"}</th>
                    )}
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("products.total") || "Total"}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(creditNote.items || []).map((item, idx) => {
                    // Calculate VAT amount for EU (if not GST)
                    const vatAmount = !isIN && item.totalAmount && item.taxableValue 
                      ? Math.abs(item.totalAmount) - Math.abs(item.taxableValue)
                      : 0;
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{item.productName}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                        {isIN ? (
                          <>
                            <td className="px-4 py-3 text-sm text-right">{formatCurrency(Math.abs(item.taxableValue || 0), country)}</td>
                            {creditNote.totalCGST !== 0 && (
                              <td className="px-4 py-3 text-sm text-right">{formatCurrency(Math.abs(item.cgstAmount || 0), country)}</td>
                            )}
                            {creditNote.totalSGST !== 0 && (
                              <td className="px-4 py-3 text-sm text-right">{formatCurrency(Math.abs(item.sgstAmount || 0), country)}</td>
                            )}
                            {creditNote.totalIGST !== 0 && (
                              <td className="px-4 py-3 text-sm text-right">{formatCurrency(Math.abs(item.igstAmount || 0), country)}</td>
                            )}
                          </>
                        ) : (
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(vatAmount, country)}</td>
                        )}
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(Math.abs(item.totalAmount), country)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    {isIN ? (
                      <>
                        <td colSpan={creditNote.totalIGST !== 0 ? 3 : 2} className="px-4 py-3 text-right font-semibold">
                          {t("invoices.subtotal") || "Subtotal"}:
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(Math.abs(creditNote.totalTaxableValue), country)}</td>
                        {creditNote.totalCGST !== 0 && (
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(Math.abs(creditNote.totalCGST), country)}</td>
                        )}
                        {creditNote.totalSGST !== 0 && (
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(Math.abs(creditNote.totalSGST), country)}</td>
                        )}
                        {creditNote.totalIGST !== 0 && (
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(Math.abs(creditNote.totalIGST), country)}</td>
                        )}
                      </>
                    ) : (
                      <>
                        <td colSpan={2} className="px-4 py-3 text-right font-semibold">
                          {t("invoices.subtotal") || "Subtotal"}:
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(Math.abs(creditNote.totalTaxableValue || (creditNote.totalAmount - (creditNote.totalGST || 0))), country)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(Math.abs(creditNote.totalGST || (creditNote.totalAmount - (creditNote.totalTaxableValue || 0))), country)}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right font-bold text-lg text-red-600">
                      {formatCurrency(Math.abs(creditNote.totalAmount), country)}
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
