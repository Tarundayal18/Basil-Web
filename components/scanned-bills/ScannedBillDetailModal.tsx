"use client";

import { useState, useEffect } from "react";
import { scannedBillsService, ScannedBill, ScannedBillItem } from "@/services/scannedBills.service";
import { X, ExternalLink, CheckCircle, AlertCircle, Edit2, Save, XCircle, TrendingUp, TrendingDown, Eye } from "lucide-react";

interface ScannedBillDetailModalProps {
  bill: ScannedBill;
  onClose: () => void;
  onProcessSuccess: () => void;
}

interface EditableItem extends ScannedBillItem {
  confidence?: number;
  extractionMethod?: string;
  isEditing?: boolean;
  originalData?: any;
}

export default function ScannedBillDetailModal({
  bill,
  onClose,
  onProcessSuccess,
}: ScannedBillDetailModalProps) {
  const [processing, setProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedItem, setEditedItem] = useState<EditableItem | null>(null);

  // Initialize items from bill
  useEffect(() => {
    if (bill.items) {
      setItems(bill.items.map((item: any) => ({
        ...item,
        confidence: item.confidence,
        extractionMethod: item.extractionMethod,
        isEditing: false,
      })));
    }
  }, [bill]);

  const handleEditItem = (index: number) => {
    if (editingIndex !== null && editingIndex !== index) {
      // Cancel previous edit
      const updatedItems = [...items];
      if (updatedItems[editingIndex].originalData) {
        updatedItems[editingIndex] = updatedItems[editingIndex].originalData;
      }
      setItems(updatedItems);
    }
    
    const item = items[index];
    setEditingIndex(index);
    setEditedItem({ ...item });
    const updatedItems = [...items];
    updatedItems[index] = { ...item, isEditing: true, originalData: item };
    setItems(updatedItems);
  };

  const handleSaveItem = (index: number) => {
    if (!editedItem) return;
    
    const updatedItems = [...items];
    updatedItems[index] = {
      ...editedItem,
      isEditing: false,
      originalData: undefined,
    };
    setItems(updatedItems);
    setEditingIndex(null);
    setEditedItem(null);
  };

  const handleCancelEdit = (index: number) => {
    const updatedItems = [...items];
    if (updatedItems[index].originalData) {
      updatedItems[index] = updatedItems[index].originalData;
    }
    updatedItems[index].isEditing = false;
    updatedItems[index].originalData = undefined;
    setItems(updatedItems);
    setEditingIndex(null);
    setEditedItem(null);
  };

  const handleItemChange = (field: keyof EditableItem, value: any) => {
    if (!editedItem) return;
    setEditedItem({ ...editedItem, [field]: value });
  };

  const handleProcess = async (addAllItems: boolean = false) => {
    try {
      setProcessing(true);
      setError("");
      setProcessingResult(null);

      // Use edited items if available, otherwise use original bill items
      const itemsToProcess = items.length > 0 ? items : bill.items;

      // Note: In a real implementation, you'd send the edited items back to the backend
      // For now, we process with the items as they are
      const result = await scannedBillsService.processScannedBill(bill.id, {
        addAllItems,
        skipDuplicates: !addAllItems,
      });

      setProcessingResult(result);
      if (result.itemsAdded > 0) {
        // Dispatch event immediately when items are added
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("productsUpdated", { 
            detail: { 
              source: "scannedBill",
              itemsAdded: result.itemsAdded,
              itemsSkipped: result.itemsSkipped,
              itemsUpdated: result.itemsUpdated
            } 
          }));
        }
        setTimeout(() => {
          onProcessSuccess();
        }, 2000);
      } else {
        // Even if no items added, still call onProcessSuccess to refresh bills list
        setTimeout(() => {
          onProcessSuccess();
        }, 1000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process bill"
      );
    } finally {
      setProcessing(false);
    }
  };

  const requiresConfirmation = (bill as any).requiresOwnerConfirmation || bill.status === "PARSED_NEEDS_CONFIRMATION";
  const overallConfidence = (bill as any).overallConfidence;
  const isHandwritten = (bill as any).isHandwritten;
  const handwrittenRatio = (bill as any).handwrittenRatio;
  const extractionMethod = (bill as any).extractionMethod;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full my-8 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bill Details</h2>
            {extractionMethod && (
              <p className="text-xs text-gray-500 mt-1">
                Extracted using: {extractionMethod.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            disabled={processing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {processingResult && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <p className="font-medium">{processingResult.message}</p>
                  <p className="text-xs mt-1">
                    Added: {processingResult.itemsAdded} | Skipped: {processingResult.itemsSkipped} | Updated: {processingResult.itemsUpdated || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* OCR Quality Metrics */}
          {(overallConfidence !== undefined || isHandwritten || requiresConfirmation) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                OCR Quality Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {overallConfidence !== undefined && (
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Overall Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-blue-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            overallConfidence >= 0.85 ? 'bg-green-600' :
                            overallConfidence >= 0.70 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${overallConfidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-blue-900">
                        {(overallConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
                {isHandwritten !== undefined && (
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Handwritten Content</p>
                    <div className="flex items-center gap-2">
                      {isHandwritten ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-semibold text-orange-600">Yes</span>
                          {handwrittenRatio !== undefined && (
                            <span className="text-xs text-gray-600">({(handwrittenRatio * 100).toFixed(0)}%)</span>
                          )}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-600">No</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {requiresConfirmation !== undefined && (
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Confirmation Required</p>
                    <div className="flex items-center gap-2">
                      {requiresConfirmation ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-semibold text-orange-600">Yes</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-600">No</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {requiresConfirmation && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Owner Confirmation Required</p>
                    <p className="text-xs">
                      {isHandwritten 
                        ? "This invoice contains handwritten content. Please review and confirm all extracted items before processing."
                        : overallConfidence !== undefined && overallConfidence < 0.85
                        ? `OCR confidence is ${(overallConfidence * 100).toFixed(0)}%. Please review extracted items for accuracy before processing.`
                        : "Please review the extracted items and confirm they are correct before processing."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {bill.duplicateOf && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>This bill is a duplicate of an existing bill. Only missing items will be added.</span>
            </div>
          )}

          {/* Supplier Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Supplier Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-gray-900 font-medium">{bill.supplierName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GSTIN</p>
                <p className="text-gray-900 font-medium">{(bill as any).supplierGstin || bill.supplierGSTIN || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900 font-medium">{(bill as any).supplierPhone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-900 font-medium">{(bill as any).supplierAddress || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Invoice Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Invoice Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Invoice Number</p>
                <p className="text-gray-900 font-medium">{bill.invoiceNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Invoice Date</p>
                <p className="text-gray-900 font-medium">
                  {bill.invoiceDate
                    ? new Date(bill.invoiceDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              {bill.totalAmount && (
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-gray-900 font-medium">₹{bill.totalAmount.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table with Edit Capability */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">
                Items ({items.length})
                {requiresConfirmation && (
                  <span className="ml-2 text-sm font-normal text-orange-600">
                    - Review and confirm
                  </span>
                )}
              </h3>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        HSN
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        GST%
                      </th>
                      {requiresConfirmation && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Confidence
                        </th>
                      )}
                      {requiresConfirmation && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => {
                      const isEditing = item.isEditing || editingIndex === index;
                      const itemData = isEditing && editedItem ? editedItem : item;
                      const itemName = (itemData as any).name || itemData.productName || "N/A";
                      const itemQuantity = itemData.quantity || 0;
                      const itemPrice = itemData.price || 0;
                      const itemTotal = itemData.totalAmount || (itemQuantity * itemPrice);
                      const itemHsn = itemData.hsnCode || "N/A";
                      const itemGst = itemData.taxPercentage || (itemData as any).gstRate || "N/A";
                      const itemConfidence = itemData.confidence;

                      return (
                        <tr
                          key={index}
                          className={`hover:bg-gray-50 ${
                            itemConfidence !== undefined && itemConfidence < 0.7 ? 'bg-yellow-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-sm">
                            {isEditing ? (
                              <input
                                type="text"
                                value={itemName}
                                onChange={(e) => handleItemChange('productName', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                autoFocus
                              />
                            ) : (
                              <div>
                                <span className="text-gray-900">{itemName}</span>
                                {itemConfidence !== undefined && itemConfidence < 0.7 && (
                                  <span className="ml-2 text-xs text-orange-600" title="Low confidence - please verify">
                                    ⚠️
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {isEditing ? (
                              <input
                                type="number"
                                value={itemQuantity}
                                onChange={(e) => handleItemChange('quantity', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                min="0"
                                step="0.01"
                              />
                            ) : (
                              <span className="text-gray-500">{itemQuantity}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {isEditing ? (
                              <input
                                type="number"
                                value={itemPrice}
                                onChange={(e) => handleItemChange('price', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                min="0"
                                step="0.01"
                              />
                            ) : (
                              <span className="text-gray-500">₹{itemPrice.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {isEditing ? (
                              <span className="text-gray-900 font-medium">
                                ₹{((editedItem?.quantity || 0) * (editedItem?.price || 0)).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-500">₹{itemTotal.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {isEditing ? (
                              <input
                                type="text"
                                value={itemHsn}
                                onChange={(e) => handleItemChange('hsnCode', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="HSN Code"
                              />
                            ) : (
                              <span className="text-gray-500">{itemHsn}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {isEditing ? (
                              <input
                                type="number"
                                value={typeof itemGst === 'number' ? itemGst : ''}
                                onChange={(e) => handleItemChange('taxPercentage', parseFloat(e.target.value) || undefined)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="GST %"
                              />
                            ) : (
                              <span className="text-gray-500">
                                {typeof itemGst === 'number' ? `${itemGst}%` : itemGst}
                              </span>
                            )}
                          </td>
                          {requiresConfirmation && (
                            <td className="px-4 py-3 text-sm">
                              {itemConfidence !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-16">
                                    <div
                                      className={`h-2 rounded-full ${
                                        itemConfidence >= 0.85 ? 'bg-green-600' :
                                        itemConfidence >= 0.70 ? 'bg-yellow-600' : 'bg-red-600'
                                      }`}
                                      style={{ width: `${itemConfidence * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-600 w-10">
                                    {(itemConfidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">N/A</span>
                              )}
                            </td>
                          )}
                          {requiresConfirmation && (
                            <td className="px-4 py-3 text-sm">
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleSaveItem(index)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                    title="Save changes"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelEdit(index)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Cancel"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditItem(index)}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Edit item"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* View Bill Link */}
          {bill.s3Url && (
            <div>
              <a
                href={bill.s3Url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View Original Bill
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {(bill.status === "PENDING" || bill.status === "PARSED" || bill.status === "PARSED_NEEDS_CONFIRMATION") && !processingResult && (
            <div className="flex gap-3">
              {requiresConfirmation && (
                <button
                  type="button"
                  onClick={() => handleProcess(false)}
                  disabled={processing || editingIndex !== null}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  title="Confirm and add missing items to inventory"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm & Add Missing Items
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleProcess(false)}
                disabled={processing || editingIndex !== null}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Add Missing Items Only"}
              </button>
              <button
                type="button"
                onClick={() => handleProcess(true)}
                disabled={processing || editingIndex !== null}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Add All Items"}
              </button>
            </div>
          )}

          {bill.status !== "PENDING" && bill.status !== "PARSED" && bill.status !== "PARSED_NEEDS_CONFIRMATION" && (
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Close
            </button>
          )}
          
          {editingIndex !== null && (
            <p className="mt-2 text-xs text-orange-600 text-center">
              Please save or cancel your current edit before processing
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
