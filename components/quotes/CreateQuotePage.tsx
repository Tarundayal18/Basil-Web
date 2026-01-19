/**
 * Create Quote Page Component
 * Enterprise-grade quote creation with country-aware tax support
 * Uses India's beautiful UI/UX patterns
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quotesService } from "@/services/quotes.service";
import { inventoryService } from "@/services/inventory.service";
import { useStore } from "@/contexts/StoreContext";
import { useCountry } from "@/contexts/CountryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency } from "@/lib/region-config";
import { GSTFields } from "@/components/tax/GSTFields";
import { VATFields } from "@/components/tax/VATFields";
import { lookupPostcode, formatPostcode } from "@/lib/postcodeLookup";
import { validateNLVATID, validateDEVATID, validateVATIDViaVIES } from "@/lib/vatValidation";
import SearchableSelect from "@/components/orders/SearchableSelect";
import CustomerSearchInput from "@/components/billing/CustomerSearchInput";
import { Customer } from "@/services/customers.service";
import { ArrowLeft, Save } from "lucide-react";

interface QuoteItem {
  productId: string;
  quantity: number;
  price: number;
  discountPercentage?: number;
}

export default function CreateQuotePage() {
  const { selectedStore } = useStore();
  const { country, isIN, isNL, isDE } = useCountry();
  const { t } = useI18n();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [productCache, setProductCache] = useState<Map<string, { id: string; name: string; sellingPrice?: number }>>(new Map());

  // Customer fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerVatId, setCustomerVatId] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [customerPostcode, setCustomerPostcode] = useState("");
  const [customerStreet, setCustomerStreet] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [vatIdValidating, setVatIdValidating] = useState(false);
  const [vatIdValidationResult, setVatIdValidationResult] = useState<{ valid: boolean; name?: string; error?: string } | null>(null);

  // Quote fields
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  // Tax fields
  const [gstMode, setGstMode] = useState<"INTRA" | "INTER">("INTRA");
  const [vatRate, setVatRate] = useState<number>(isNL ? 21 : isDE ? 19 : 0);
  const [vatMode, setVatMode] = useState<"normal" | "reverse_charge" | "intra_eu_b2b" | "export">("normal");

  useEffect(() => {
    // Set default valid until date (30 days from now)
    const date = new Date();
    date.setDate(date.getDate() + 30);
    setValidUntil(date.toISOString().split("T")[0]);
  }, []);

  const handleProductSelect = (product: { id: string; name: string; sellingPrice?: number; quantity: number }) => {
    setProductCache(new Map(productCache.set(product.id, product)));
  };

  const addItem = () => {
    if (!selectedProduct) return;
    const product = productCache.get(selectedProduct);
    if (!product) return;

    const existingIndex = items.findIndex((item) => item.productId === selectedProduct);
    const qty = parseInt(itemQuantity) || 1;

    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + qty,
      };
      setItems(updatedItems);
    } else {
      setItems([
        ...items,
        {
          productId: selectedProduct,
          quantity: qty,
          price: product.sellingPrice || 0,
          discountPercentage: 0,
        },
      ]);
    }

    setSelectedProduct("");
    setItemQuantity("1");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, qty: number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], quantity: Math.max(1, qty) };
    setItems(updatedItems);
  };

  const updateItemPrice = (index: number, price: number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], price: Math.max(0, price) };
    setItems(updatedItems);
  };

  const updateItemDiscount = (index: number, discount: number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], discountPercentage: Math.max(0, Math.min(100, discount)) };
    setItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const price = item.price * (1 - (item.discountPercentage || 0) / 100);
      return sum + price * item.quantity;
    }, 0);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || "");
    setCustomerEmail(customer.email || "");
    setCustomerGstin(isIN ? (customer.gstin || "") : "");
    setCustomerVatId((isNL || isDE) ? (customer.vatId || "") : "");
    setBillingAddress(customer.billingAddress || "");
  };

  const handlePostcodeBlur = async () => {
    if (customerPostcode && (isNL || isDE)) {
      const addressData = await lookupPostcode(customerPostcode);
      if (addressData) {
        setCustomerStreet(addressData.street || customerStreet);
        setCustomerCity(addressData.city || customerCity);
        setCustomerPostcode(addressData.postcode || formatPostcode(customerPostcode));
      }
    }
  };

  const handleVatIdBlur = async () => {
    if (!customerVatId || (!isNL && !isDE)) return;

    const vatId = customerVatId.trim();
    if (!vatId) {
      setVatIdValidationResult(null);
      return;
    }

    // Format validation
    if (isNL && !validateNLVATID(vatId)) {
      setVatIdValidationResult({ valid: false, error: "Invalid VAT ID format" });
      return;
    }
    if (isDE && !validateDEVATID(vatId)) {
      setVatIdValidationResult({ valid: false, error: "Invalid VAT ID format" });
      return;
    }

    // VIES validation
    setVatIdValidating(true);
    try {
      const result = await validateVATIDViaVIES(vatId);
      setVatIdValidationResult(result);
      if (result.valid && result.name && !customerName.trim()) {
        setCustomerName(result.name);
      }
    } catch (err) {
      setVatIdValidationResult({ valid: false, error: "Validation failed" });
    } finally {
      setVatIdValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || items.length === 0) {
      setError("Please add at least one item");
      return;
    }
    if (!customerName.trim()) {
      setError("Please enter customer name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const quoteData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        customerGstin: isIN ? (customerGstin.trim() || undefined) : undefined,
        customerVatId: (isNL || isDE) ? (customerVatId.trim() || undefined) : undefined,
        billingAddress: billingAddress.trim() || undefined,
        placeOfSupply: isIN ? (placeOfSupply.trim() || undefined) : undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discountPercentage: item.discountPercentage || 0,
        })),
        validUntil: validUntil || undefined,
        notes: notes.trim() || undefined,
      };

      await quotesService.createQuote(selectedStore.id, quoteData);
      router.push("/quotes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quote");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calculateSubtotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
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
              <h1 className="text-2xl font-bold text-gray-900">{t("quotes.create") || "Create Quote"}</h1>
              <p className="text-gray-600 mt-1">{t("quotes.createDescription") || "Create a new quote for your customer"}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-4">
              {/* Customer Information */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">{t("customers.customerDetails") || "Customer Information"}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("customers.customerName") || "Customer Name"} *</label>
                    {selectedStore ? (
                      <CustomerSearchInput
                        storeId={selectedStore.id}
                        value={customerName}
                        onChange={setCustomerName}
                        onCustomerSelect={handleCustomerSelect}
                        placeholder={t("customers.customerNamePlaceholder") || "Enter customer name"}
                        searchBy="name"
                      />
                    ) : (
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("customers.customerPhone") || "Phone"}</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("customers.customerEmail") || "Email"}</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {isIN && (
                    <div>
                      <label className="block text-sm font-medium mb-1">{t("tax.gstin") || "GSTIN"}</label>
                      <input
                        type="text"
                        value={customerGstin}
                        onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="29ABCDE1234F1Z5"
                      />
                    </div>
                  )}
                  {(isNL || isDE) && (
                    <div>
                      <label className="block text-sm font-medium mb-1">{t("tax.vatNumber") || "VAT ID"}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customerVatId}
                          onBlur={handleVatIdBlur}
                          onChange={(e) => {
                            setCustomerVatId(e.target.value.toUpperCase());
                            setVatIdValidationResult(null);
                          }}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                            vatIdValidationResult?.valid === false
                              ? "border-red-500"
                              : vatIdValidationResult?.valid === true
                              ? "border-green-500"
                              : ""
                          }`}
                          placeholder={isNL ? "NL123456789B01" : "DE123456789"}
                          disabled={vatIdValidating}
                        />
                        {vatIdValidating && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            {t("common.loading") || "Validating..."}
                          </div>
                        )}
                      </div>
                      {vatIdValidationResult && (
                        <div className={`text-xs mt-1 ${
                          vatIdValidationResult.valid ? "text-green-600" : "text-red-600"
                        }`}>
                          {vatIdValidationResult.valid
                            ? `✓ ${t("validation.valid") || "Valid"}${vatIdValidationResult.name ? ` - ${vatIdValidationResult.name}` : ""}`
                            : `✗ ${vatIdValidationResult.error || t("validation.invalidVATID") || "Invalid VAT ID"}`}
                        </div>
                      )}
                    </div>
                  )}
                  {(isNL || isDE) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">{t("businessProfile.postcode") || "Postcode"}</label>
                        <input
                          type="text"
                          value={customerPostcode}
                          onBlur={handlePostcodeBlur}
                          onChange={(e) => {
                            let value = e.target.value.toUpperCase().replace(/\s/g, "");
                            if (value.length > 4) {
                              value = value.slice(0, 4) + " " + value.slice(4);
                            }
                            setCustomerPostcode(value);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="1234AB"
                          maxLength={7}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">{t("businessProfile.city") || "City"}</label>
                        <input
                          type="text"
                          value={customerCity}
                          onChange={(e) => setCustomerCity(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">{t("businessProfile.street") || "Street"}</label>
                        <input
                          type="text"
                          value={customerStreet}
                          onChange={(e) => setCustomerStreet(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </>
                  )}
                  {isIN && (
                    <div>
                      <label className="block text-sm font-medium mb-1">{t("tax.placeOfSupply") || "Place of Supply"}</label>
                      <input
                        type="text"
                        value={placeOfSupply}
                        onChange={(e) => setPlaceOfSupply(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">{t("customers.billingAddress") || "Billing Address"}</label>
                    <textarea
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">{t("products.title") || "Products"}</h2>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {selectedStore && (
                      <div className="flex-1">
                        <SearchableSelect
                          value={selectedProduct}
                          onChange={setSelectedProduct}
                          onProductSelect={handleProductSelect}
                          placeholder={t("products.searchPlaceholder") || "Search products..."}
                          storeId={selectedStore.id}
                        />
                      </div>
                    )}
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      placeholder={t("products.qty") || "Qty"}
                      className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={!selectedProduct}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                    >
                      {t("common.add") || "Add"}
                    </button>
                  </div>

                  {items.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("products.productName") || "Product"}</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t("products.qty") || "Qty"}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("products.price") || "Price"}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("products.discount") || "Disc%"}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("products.subtotal") || "Subtotal"}</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t("common.actions") || "Actions"}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {items.map((item, index) => {
                            const product = productCache.get(item.productId);
                            const price = item.price * (1 - (item.discountPercentage || 0) / 100);
                            const subtotal = price * item.quantity;
                            return (
                              <tr key={index}>
                                <td className="px-4 py-3 text-sm font-medium">{product?.name || "Unknown"}</td>
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.price}
                                    onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={item.discountPercentage || 0}
                                    onChange={(e) => updateItemDiscount(index, parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(subtotal, country)}</td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    {t("common.delete") || "Remove"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Tax Fields */}
              {isIN && (
                <GSTFields
                  gstMode={gstMode}
                  onGstModeChange={setGstMode}
                  placeOfSupply={placeOfSupply}
                  onPlaceOfSupplyChange={setPlaceOfSupply}
                />
              )}
              {(isNL || isDE) && (
                <VATFields
                  vatRate={vatRate}
                  onVatRateChange={setVatRate}
                  vatMode={vatMode}
                  onVatModeChange={setVatMode}
                  customerVatId={customerVatId}
                  onCustomerVatIdChange={setCustomerVatId}
                />
              )}

              {/* Notes */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">{t("quotes.notes") || "Notes"}</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={t("quotes.notesPlaceholder") || "Additional notes..."}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-semibold mb-4">{t("quotes.quoteDetails") || "Quote Details"}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("quotes.validUntil") || "Valid Until"} *</label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t("invoices.subtotal") || "Subtotal"}:</span>
                      <span className="font-medium">{formatCurrency(subtotal, country)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>{t("invoices.total") || "Total"}:</span>
                      <span>{formatCurrency(subtotal, country)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      {t("common.cancel") || "Cancel"}
                    </button>
                    <button
                      type="submit"
                      disabled={loading || items.length === 0 || !customerName.trim()}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {t("common.saving") || "Saving..."}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {t("common.save") || "Create Quote"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
