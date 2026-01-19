/**
 * Create Credit Note Page Component
 * Enterprise-grade credit note creation with India UI/UX
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { creditNotesService } from "@/services/creditNotes.service";
import { ordersService } from "@/services/orders.service";
import { useStore } from "@/contexts/StoreContext";
import { useCountry } from "@/contexts/CountryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency } from "@/lib/region-config";
import { ArrowLeft, Save } from "lucide-react";

export default function CreateCreditNotePage() {
  const { selectedStore } = useStore();
  const { country } = useCountry();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]); // Support both Order (India) and Invoice (NL/DE) formats
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (selectedStore?.id) {
      loadInvoices();
    }
  }, [selectedStore]);

  useEffect(() => {
    const invoiceId = searchParams?.get("invoiceId");
    if (invoiceId && invoices.length > 0) {
      // Support both Order format (India) and Invoice format (NL/DE)
      const inv = invoices.find((i) => {
        const id = (i as any).id || (i as any).invoiceId;
        return id === invoiceId;
      });
      if (inv) {
        setSelectedInvoice(inv);
      }
    }
  }, [invoices, searchParams]);

  const loadInvoices = async () => {
    if (!selectedStore?.id) return;
    try {
      // Try orders endpoint first (India), fallback to sales endpoint (NL/DE)
      try {
        const response = await ordersService.getOrders({
          storeId: selectedStore.id,
          limit: 100,
        });
        // Filter for completed/paid invoices only
        setInvoices(response.data.filter((o) => o.status === "completed" || o.bill));
      } catch (ordersErr) {
        // Fallback to sales endpoint for NL/DE
        const { apiClient } = await import("@/lib/api");
        const salesResponse = await apiClient.get<any>("/sales", {
          status: "OPEN,PAID,PARTIAL",
        });
        const salesData = Array.isArray(salesResponse.data?.items) 
          ? salesResponse.data.items 
          : Array.isArray(salesResponse.data) 
          ? salesResponse.data 
          : [];
        setInvoices(salesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    }
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    setSelectedInvoice(inv || null);
    setSelectedItems(new Set());
    setReason("");
  };

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const calculateCreditAmount = () => {
    if (!selectedInvoice) return 0;
    // Support both Order format (India) and Invoice format (NL/DE)
    const items = (selectedInvoice as any).orderItems || (selectedInvoice as any).items || [];
    const selected = items.filter((item: any, idx: number) => {
      const itemId = item.id || String(idx);
      return selectedItems.has(itemId);
    });
    return selected.reduce((sum: number, item: any) => {
      // Support both formats
      const subtotal = item.subtotal || (item.totalPrice || ((item.priceIncl || item.sellingPrice || item.unitPrice || 0) * (item.qty || item.quantity || 1)));
      return sum + subtotal;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore?.id || !selectedInvoice) {
      setError("Please select an invoice");
      return;
    }
    if (selectedItems.size === 0) {
      setError("Please select at least one item to credit");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for the credit note");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Support both Order format (India) and Invoice format (NL/DE)
      const invoiceId = (selectedInvoice as any).id || (selectedInvoice as any).invoiceId;
      const items = (selectedInvoice as any).orderItems || (selectedInvoice as any).items || [];
      const selected = items.filter((item: any, idx: number) => {
        const itemId = item.id || String(idx);
        return selectedItems.has(itemId);
      });
      
      const creditNoteData = {
        originalInvoiceId: invoiceId,
        items: selected.map((item: any, idx: number) => ({
          originalItemId: item.id || item.itemId || String(idx),
          quantity: item.quantity || item.qty || 1,
        })),
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      };

      await creditNotesService.createCreditNote(selectedStore.id, creditNoteData);
      router.push("/credit-notes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create credit note");
    } finally {
      setLoading(false);
    }
  };

  const creditAmount = calculateCreditAmount();

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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("creditNotes.create") || "Create Credit Note"}</h1>
              <p className="text-gray-600 mt-1">{t("creditNotes.createDescription") || "Create a credit note for an invoice"}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Selection */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">{t("creditNotes.selectInvoice") || "Select Invoice"}</h2>
            <select
              value={selectedInvoice?.id || ""}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">{t("creditNotes.selectInvoicePlaceholder") || "Select an invoice..."}</option>
              {invoices.map((inv) => {
                // Support both Order format (India) and Invoice format (NL/DE)
                const invoiceId = (inv as any).id || (inv as any).invoiceId || "";
                const invoiceNumber = (inv as any).bill?.billNumber || (inv as any).invoiceNumber || (inv as any).invoiceSeries || invoiceId.slice(-8);
                const customerName = (inv as any).customerName || "Walk-in";
                const totalAmount = (inv as any).totalAmount || (inv as any).grandTotal || 0;
                return (
                  <option key={invoiceId} value={invoiceId}>
                    {invoiceNumber} - {customerName} - {formatCurrency(totalAmount, country)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Invoice Items */}
          {selectedInvoice && selectedInvoice.orderItems.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">{t("creditNotes.selectItems") || "Select Items to Credit"}</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("products.productName") || "Item"}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("products.qty") || "Qty"}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("products.price") || "Price"}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("products.subtotal") || "Total"}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedInvoice.orderItems.map((item: any) => {
                      const isSelected = selectedItems.has(item.id);
                      return (
                        <tr key={item.id} className={isSelected ? "bg-blue-50" : ""}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItem(item.id)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {item.product?.name || item.productName || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.price, country)}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(item.subtotal, country)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Credit Details */}
          {selectedItems.size > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold">{t("creditNotes.creditNoteDetails") || "Credit Note Details"}</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t("creditNotes.reason") || "Reason"} *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={t("creditNotes.reasonPlaceholder") || "Enter reason for credit note..."}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t("creditNotes.notes") || "Notes"}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={t("creditNotes.notesPlaceholder") || "Additional notes..."}
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t("creditNotes.creditAmount") || "Credit Amount"}:</span>
                  <span className="text-lg font-bold text-red-600">{formatCurrency(creditAmount, country)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={loading || selectedItems.size === 0 || !reason.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t("common.saving") || "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t("common.create") || "Create Credit Note"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
