/**
 * This file contains the UploadModal component for uploading inventory files.
 * Supports XLSX, CSV, PDF, and image files (images and PDFs are parsed using Gemini LLM).
 */

"use client";

import { useState, useEffect } from "react";
import { inventoryService } from "@/services/inventory.service";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Download } from "lucide-react";

interface UploadModalProps {
  onClose: () => void;
  onUpload: (
    file: File,
    options: {
      autoGenerateBarcode: boolean;
      taxPercentage: number;
      marginPercentage: number;
      purchaseMarginPercentage: number;
      categoryId?: string;
      subcategoryId?: string;
      brandId?: string;
      hsnCode?: string;
      costPriceBeforeGST: boolean;
    }
  ) => void;
}

export default function UploadModal({ onClose, onUpload }: UploadModalProps) {
  const { selectedStore } = useStore();
  const { trackButton, track, events } = useAnalytics("Upload Modal", false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoGenerateBarcode, setAutoGenerateBarcode] = useState(true);
  const [taxPercentage, setTaxPercentage] = useState<string>("");
  const [marginPercentage, setMarginPercentage] = useState<string>("");
  const [purchaseMarginPercentage, setPurchaseMarginPercentage] =
    useState<string>("");
  const [hsnCode, setHsnCode] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [costPriceBeforeGST, setCostPriceBeforeGST] = useState(false);
  const [categories, setCategories] = useState<
    Array<{
      id: string;
      name: string;
      subcategories: Array<{ id: string; name: string }>;
    }>
  >([]);
  const [subcategories, setSubcategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const loadData = async () => {
      if (selectedStore?.id) {
        try {
          const [cats, brs] = await Promise.all([
            inventoryService.getCategories(selectedStore.id),
            inventoryService.getBrands(selectedStore.id),
          ]);
          setCategories(cats);
          setBrands(brs);
        } catch (error) {
          console.error("Failed to load categories/brands:", error);
        }
      }
    };
    loadData();
  }, [selectedStore]);

  useEffect(() => {
    if (categoryId) {
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        setSubcategories(category.subcategories || []);
      } else {
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
    }
    setSubcategoryId("");
  }, [categoryId, categories]);

  const handleDownloadSample = () => {
    trackButton("Download Sample CSV", { location: "upload_modal" });
    // Create sample CSV content
    const sampleData = [
      {
        Name: "Sample Product 1",
        Barcode: "1234567890123",
        Category: "Electronics",
        Subcategory: "Mobile Phones",
        Brand: "Brand A",
        "HSN Code": "8517",
        "Tax Percentage": "18",
        MRP: "1000",
        "Cost Price": "800",
        "Selling Price": "900",
        Quantity: "10",
        "Cost Margin Percentage": "10",
        "Selling Margin Percentage": "20",
      },
      {
        Name: "Sample Product 2",
        Barcode: "1234567890124",
        Category: "Clothing",
        Subcategory: "Shirts",
        Brand: "Brand B",
        "HSN Code": "6109",
        "Tax Percentage": "12",
        MRP: "500",
        "Cost Price": "400",
        "Selling Price": "450",
        Quantity: "5",
        "Cost Margin Percentage": "10",
        "Selling Margin Percentage": "20",
      },
    ];

    // Convert to CSV
    const headers = Object.keys(sampleData[0]);
    const csvContent = [
      headers.join(","),
      ...sampleData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_sample.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      setLoading(true);
      try {
        track(events.PRODUCT_UPLOADED, {
          file_type: file.type || file.name.split(".").pop(),
          auto_generate_barcode: autoGenerateBarcode,
          has_category: !!categoryId,
        });
        await onUpload(file, {
          autoGenerateBarcode,
          taxPercentage: taxPercentage ? parseFloat(taxPercentage) : 0,
          marginPercentage: marginPercentage ? parseFloat(marginPercentage) : 0,
          purchaseMarginPercentage: purchaseMarginPercentage
            ? parseFloat(purchaseMarginPercentage)
            : 0,
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || undefined,
          brandId: brandId || undefined,
          hsnCode: hsnCode || undefined,
          costPriceBeforeGST,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Upload Inventory File
          </h2>
          <p className="text-xs text-gray-500">
            Upload products from CSV, Excel, PDF, or image files
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File Upload & Sample Download - Compact Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Select File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 text-sm border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors hover:border-indigo-400 cursor-pointer"
                />
                {file && (
                  <div className="mt-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs">
                    <p className="text-green-800 font-medium truncate">
                      {file.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleDownloadSample}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
              >
                <Download className="w-4 h-4" />
                Sample CSV
              </button>
            </div>
          </div>

          {/* Two Column Layout - Compact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column - Classification */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1.5">
                Classification
              </h3>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category <span className="text-gray-400">(optional)</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {categoryId && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Subcategory{" "}
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <select
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Brand <span className="text-gray-400">(optional)</span>
                </label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column - Pricing */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1.5">
                Pricing & Margins
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tax % <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    HSN Code <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 8517"
                    maxLength={50}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Selling Margin %{" "}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.01"
                  value={marginPercentage}
                  onChange={(e) => setMarginPercentage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
                <p className="mt-0.5 text-xs text-gray-400">
                  Selling = MRP × (1 - sellingMargin%/100)
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cost Margin %{" "}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.01"
                  value={purchaseMarginPercentage}
                  onChange={(e) => setPurchaseMarginPercentage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
                <p className="mt-0.5 text-xs text-gray-400">
                  Cost = MRP × (1 - costMargin%/100)
                </p>
              </div>
            </div>
          </div>

          {/* Options - Compact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
            <label className="flex items-center space-x-2.5 cursor-pointer group p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={costPriceBeforeGST}
                onChange={(e) => setCostPriceBeforeGST(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Cost price includes GST
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cost price in file includes GST
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer group p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={autoGenerateBarcode}
                onChange={(e) => setAutoGenerateBarcode(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Auto-generate barcode
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Generate barcodes automatically
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                trackButton("Cancel", { location: "upload_modal" });
                onClose();
              }}
              className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || loading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 shadow-sm hover:shadow transition-all font-medium text-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Uploading...
                </span>
              ) : (
                "Upload"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
