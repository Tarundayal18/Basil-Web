/**
 * This file contains the EditProductModal component which allows users to edit product details.
 * It includes form fields for product information, pricing, tax, and inventory management.
 * The component displays derived field values (like base prices and GST amounts) as read-only info below editable fields.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import type { Product } from "@/services/inventory.service";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useCountry } from "@/contexts/CountryContext";
import { settingsService } from "@/services/settings.service";
import { inventoryService } from "@/services/inventory.service";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { calculateDerivedFields } from "@/utils/productCalculations";
import { aiService } from "@/services/ai.service";
import LeftSidebar from "./LeftSidebar";
import PricingBlock from "./PricingBlock";
import TaxBlock from "./TaxBlock";
import CategorySelector from "./CategorySelector";
import CameraScannerModal from "./CameraScannerModal";

interface EditProductModalProps {
  item: Product;
  onClose: () => void;
  onUpdate: (productData: {
    name?: string;
    productId?: string;
    barcode?: string;
    qrCode?: string;
    hsnCode?: string;
    taxPercentage?: number;
    mrp?: number;
    costPrice?: number;
    costPriceBase?: number;
    costGST?: number;
    sellingPrice?: number;
    sellingPriceBase?: number;
    sellingGST?: number;
    quantity?: number;
    lowStockAlert?: number;
    requireCustomBarcode?: boolean;
    needsBarcode?: boolean;
    marginPercentage?: number;
    purchaseMarginPercentage?: number;
    supplierId?: string;
    brandId?: string;
    categoryId?: string;
    subcategoryId?: string;
    manufacturerId?: string;
    storeId?: string;
  }) => Promise<void>;
}

export default function EditProductModal({
  item,
  onClose,
  onUpdate,
}: EditProductModalProps) {
  const { track, trackButton, events } = useAnalytics(
    "Edit Product Modal",
    false
  );
  const [formData, setFormData] = useState({
    name: item.name || "",
    productId: item.productId || "",
    barcode: item.barcode || "",
    qrCode: item.qrCode || "",
    hsnCode: item.hsnCode || "",
    taxPercentage: item.taxPercentage?.toString() || "",
    mrp: item.mrp?.toString() || "",
    costPrice: item.costPrice?.toString() || "",
    costPriceBase: item.costPriceBase?.toString() || "",
    costGST: item.costGST?.toString() || "",
    sellingPrice: item.sellingPrice?.toString() || "",
    sellingPriceBase: item.sellingPriceBase?.toString() || "",
    sellingGST: item.sellingGST?.toString() || "",
    quantity: item.quantity?.toString() || "0",
    lowStockAlert: item.lowStockAlert?.toString() || "",
    requireCustomBarcode: item.requireCustomBarcode || false,
    needsBarcode: item.needsBarcode || false,
    marginPercentage: item.marginPercentage?.toString() || "",
    purchaseMarginPercentage: item.purchaseMarginPercentage?.toString() || "",
    supplierId: item.supplierId || "",
    brandId: item.brandId || "",
    categoryId: item.categoryId || "",
    subcategoryId: item.subcategoryId || "",
  });
  const [loading, setLoading] = useState(false);
  const [defaultTaxPercentage, setDefaultTaxPercentage] = useState<number>(0);
  const [suppliers, setSuppliers] = useState<
    Array<{ id: string; name: string; storeId: string }>
  >([]);
  const [showNewSupplierInput, setShowNewSupplierInput] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [brands, setBrands] = useState<
    Array<{ id: string; name: string; storeId: string }>
  >([]);
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showBarcodeInput, setShowBarcodeInput] = useState(
    !!(item.barcode && item.barcode.trim() !== "")
  );
  const [editCostPriceAsBase, setEditCostPriceAsBase] = useState(false);
  const [editSellingPriceAsBase, setEditSellingPriceAsBase] = useState(false);
  const [barcodeDuplicateWarning, setBarcodeDuplicateWarning] = useState<{
    barcode: string;
    productName: string;
  } | null>(null);
  const [checkingBarcode, setCheckingBarcode] = useState(false);
  const barcodeCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get storeId from item (use storeId directly, not from store object)
  const storeId = item.storeId || item.store?.id;

  const categoryManagement = useCategoryManagement(storeId);

  // Load default tax percentage from settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        setDefaultTaxPercentage(settings.taxPercentage || 0);
        if (!formData.taxPercentage && settings.taxPercentage) {
          setFormData((prev) => ({
            ...prev,
            taxPercentage: settings.taxPercentage?.toString() || "",
          }));
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load categories, suppliers, and brands when component mounts and storeId is available
  useEffect(() => {
    const loadAllOptions = async () => {
      if (storeId) {
        try {
          // Load categories, suppliers, and brands in parallel
          const [supps, brs] = await Promise.all([
            inventoryService.getSuppliers(storeId),
            inventoryService.getBrands(storeId),
          ]);
          setSuppliers(supps);
          setBrands(brs);
          // Categories are automatically loaded by useCategoryManagement hook when storeId changes
        } catch (error) {
          console.error("Failed to load suppliers or brands:", error);
        }
      }
    };
    loadAllOptions();
  }, [storeId]);

  // Load subcategories when category is selected
  useEffect(() => {
    if (formData.categoryId) {
      categoryManagement.loadSubcategories(formData.categoryId);
    } else {
      categoryManagement.setSubcategories([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.categoryId]);

  const handleFieldChange = async (field: string, value: string) => {
    // Update field immediately for responsive UI
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Calculate derived fields using backend
    try {
      const updates = await calculateDerivedFields(
        field,
        value,
        {
          taxPercentage: formData.taxPercentage,
          mrp: formData.mrp,
        costPrice: formData.costPrice,
        costPriceBase: formData.costPriceBase,
        costGST: formData.costGST,
        sellingPrice: formData.sellingPrice,
        sellingPriceBase: formData.sellingPriceBase,
        sellingGST: formData.sellingGST,
        marginPercentage: formData.marginPercentage,
        purchaseMarginPercentage: formData.purchaseMarginPercentage,
        [field]: value,
      },
      defaultTaxPercentage,
      editCostPriceAsBase,
      editSellingPriceAsBase
    );
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...updates,
    }));
    } catch (error) {
      console.error("Failed to calculate derived fields:", error);
      // Still update the field even if calculation fails
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  /**
   * Recalculates selling price when toggling between Base and Inc GST modes
   * @param newMode - The new mode (true for Base, false for Inc GST)
   */
  const handleToggleSellingPriceMode = (newMode: boolean) => {
    setEditSellingPriceAsBase(newMode);

    // Recalculate based on current MRP and selling margin
    if (formData.mrp && formData.marginPercentage) {
      const mrp = parseFloat(formData.mrp);
      const marginPercentage = parseFloat(formData.marginPercentage);
      const taxPercentage =
        parseFloat(formData.taxPercentage) || defaultTaxPercentage || 0;
      const taxRate = taxPercentage / 100;

      if (!isNaN(mrp) && !isNaN(marginPercentage) && mrp > 0) {
        const marginRate = marginPercentage / 100;

        if (newMode) {
          // Switching to Base mode: calculate base from MRP, then sellingPrice (incl GST)
          const sellingPriceBase = mrp * (1 - marginRate);
          const sellingPrice =
            taxRate > 0 ? sellingPriceBase * (1 + taxRate) : sellingPriceBase;
          const sellingGST = sellingPrice - sellingPriceBase;

          setFormData((prev) => ({
            ...prev,
            sellingPriceBase: sellingPriceBase.toFixed(2),
            sellingPrice: sellingPrice.toFixed(2),
            sellingGST: sellingGST.toFixed(2),
          }));
        } else {
          // Switching to Inc GST mode: calculate sellingPrice (incl GST) from MRP, then base
          const sellingPrice = mrp * (1 - marginRate);
          const sellingPriceBase =
            taxRate > 0 ? sellingPrice / (1 + taxRate) : sellingPrice;
          const sellingGST = sellingPrice - sellingPriceBase;

          setFormData((prev) => ({
            ...prev,
            sellingPrice: sellingPrice.toFixed(2),
            sellingPriceBase: sellingPriceBase.toFixed(2),
            sellingGST: sellingGST.toFixed(2),
          }));
        }
      }
    } else if (formData.mrp) {
      // No margin, selling price = MRP
      const mrp = parseFloat(formData.mrp);
      const taxPercentage =
        parseFloat(formData.taxPercentage) || defaultTaxPercentage || 0;
      const taxRate = taxPercentage / 100;

      if (!isNaN(mrp) && mrp > 0) {
        if (newMode) {
          const sellingPriceBase = mrp;
          const sellingPrice =
            taxRate > 0 ? sellingPriceBase * (1 + taxRate) : sellingPriceBase;
          const sellingGST = sellingPrice - sellingPriceBase;

          setFormData((prev) => ({
            ...prev,
            sellingPriceBase: sellingPriceBase.toFixed(2),
            sellingPrice: sellingPrice.toFixed(2),
            sellingGST: sellingGST.toFixed(2),
          }));
        } else {
          const sellingPrice = mrp;
          const sellingPriceBase =
            taxRate > 0 ? sellingPrice / (1 + taxRate) : sellingPrice;
          const sellingGST = sellingPrice - sellingPriceBase;

          setFormData((prev) => ({
            ...prev,
            sellingPrice: sellingPrice.toFixed(2),
            sellingPriceBase: sellingPriceBase.toFixed(2),
            sellingGST: sellingGST.toFixed(2),
          }));
        }
      }
    }
  };

  /**
   * Recalculates cost price when toggling between Base and Inc GST modes
   * @param newMode - The new mode (true for Base, false for Inc GST)
   */
  const handleToggleCostPriceMode = (newMode: boolean) => {
    setEditCostPriceAsBase(newMode);

    // Recalculate based on current MRP and purchase margin
    if (formData.mrp && formData.purchaseMarginPercentage) {
      const mrp = parseFloat(formData.mrp);
      const purchaseMarginPercentage = parseFloat(
        formData.purchaseMarginPercentage
      );
      const taxPercentage =
        parseFloat(formData.taxPercentage) || defaultTaxPercentage || 0;
      const taxRate = taxPercentage / 100;

      if (!isNaN(mrp) && !isNaN(purchaseMarginPercentage) && mrp > 0) {
        const purchaseMarginRate = purchaseMarginPercentage / 100;

        if (newMode) {
          // Switching to Base mode: calculate base from MRP, then costPrice (incl GST)
          const costPriceBase = mrp * (1 - purchaseMarginRate);
          const costPrice =
            taxRate > 0 ? costPriceBase * (1 + taxRate) : costPriceBase;
          const costGST = costPrice - costPriceBase;

          setFormData((prev) => ({
            ...prev,
            costPriceBase: costPriceBase.toFixed(2),
            costPrice: costPrice.toFixed(2),
            costGST: costGST.toFixed(2),
          }));
        } else {
          // Switching to Inc GST mode: calculate costPrice (incl GST) from MRP, then base
          const costPrice = mrp * (1 - purchaseMarginRate);
          const costPriceBase =
            taxRate > 0 ? costPrice / (1 + taxRate) : costPrice;
          const costGST = costPrice - costPriceBase;

          setFormData((prev) => ({
            ...prev,
            costPrice: costPrice.toFixed(2),
            costPriceBase: costPriceBase.toFixed(2),
            costGST: costGST.toFixed(2),
          }));
        }
      }
    }
  };

  /**
   * Validates the form data before submission.
   * @returns true if validation passes, false otherwise
   */
  const { isIN, isNL, isDE } = useCountry();
  
  const validateForm = (): boolean => {
    setValidationError("");
    const taxPercentage = formData.taxPercentage
      ? parseFloat(formData.taxPercentage)
      : undefined;
    const hsnCode = formData.hsnCode.trim();

    // Country-aware validation: HSN code required only for India (when GST > 0)
    // EU countries don't use HSN codes (VAT only, no HSN required)
    if (isIN && taxPercentage !== undefined && taxPercentage > 0 && !hsnCode) {
      setValidationError("HSN Code is required when GST is provided");
      return false;
    }
    // EU: No HSN validation (VAT rates don't require HSN)

    return true;
  };

  /**
   * Checks if barcode exists for another product
   */
  const checkBarcodeDuplicate = async (barcode: string) => {
    if (!barcode || !barcode.trim() || !storeId) {
      setBarcodeDuplicateWarning(null);
      return;
    }

    // If barcode hasn't changed, no need to check
    if (barcode.trim() === (item.barcode || "").trim()) {
      setBarcodeDuplicateWarning(null);
      return;
    }

    try {
      setCheckingBarcode(true);
      const existingProduct = await inventoryService.getProductByBarcode(barcode.trim());
      
      if (existingProduct && existingProduct.id !== item.id) {
        setBarcodeDuplicateWarning({
          barcode: barcode.trim(),
          productName: existingProduct.name,
        });
      } else {
        setBarcodeDuplicateWarning(null);
      }
    } catch (error) {
      console.error("Failed to check barcode:", error);
      // Don't show error, just clear warning
      setBarcodeDuplicateWarning(null);
    } finally {
      setCheckingBarcode(false);
    }
  };

  /**
   * Handles barcode change with duplicate checking
   */
  const handleBarcodeChange = (value: string) => {
    setFormData({ ...formData, barcode: value });
    setBarcodeDuplicateWarning(null);
    
    // Clear existing timeout
    if (barcodeCheckTimeoutRef.current) {
      clearTimeout(barcodeCheckTimeoutRef.current);
    }
    
    if (!value.trim()) {
      setShowBarcodeInput(false);
      setFormData((prev) => ({ ...prev, needsBarcode: true }));
    } else {
      // Debounce barcode duplicate check
      barcodeCheckTimeoutRef.current = setTimeout(() => {
        checkBarcodeDuplicate(value);
      }, 500);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (barcodeCheckTimeoutRef.current) {
        clearTimeout(barcodeCheckTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handles form submission with validation.
   * @param e - The form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Check for barcode duplicate before submitting (non-blocking, just for info)
    if (formData.barcode && formData.barcode.trim()) {
      // Check in background, but don't block submission
      checkBarcodeDuplicate(formData.barcode).catch(console.error);
    }

    setLoading(true);
    try {
      const updateData: Parameters<typeof onUpdate>[0] = {
        name: formData.name,
        barcode: formData.barcode.trim() || undefined,
        qrCode: formData.qrCode.trim() || undefined,
        hsnCode: formData.hsnCode.trim() || undefined,
        taxPercentage: formData.taxPercentage
          ? parseFloat(formData.taxPercentage)
          : undefined,
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
        costPrice: formData.costPrice
          ? parseFloat(formData.costPrice)
          : undefined,
        costPriceBase: formData.costPriceBase
          ? parseFloat(formData.costPriceBase)
          : undefined,
        costGST: formData.costGST ? parseFloat(formData.costGST) : undefined,
        sellingPrice: formData.sellingPrice
          ? parseFloat(formData.sellingPrice)
          : undefined,
        sellingPriceBase: formData.sellingPriceBase
          ? parseFloat(formData.sellingPriceBase)
          : undefined,
        sellingGST: formData.sellingGST
          ? parseFloat(formData.sellingGST)
          : undefined,
        quantity: parseInt(formData.quantity) || 0,
        productId: formData.productId.trim() || "", // Send empty string if cleared, backend will handle it
        lowStockAlert: formData.lowStockAlert && formData.lowStockAlert.trim()
          ? parseInt(formData.lowStockAlert)
          : undefined, // Send undefined if empty to clear the value
        requireCustomBarcode: formData.requireCustomBarcode,
        needsBarcode: formData.needsBarcode,
        marginPercentage: formData.marginPercentage
          ? parseFloat(formData.marginPercentage)
          : undefined,
        purchaseMarginPercentage: formData.purchaseMarginPercentage
          ? parseFloat(formData.purchaseMarginPercentage)
          : undefined,
        supplierId: formData.supplierId.trim()
          ? formData.supplierId.trim()
          : undefined,
        brandId: formData.brandId.trim() ? formData.brandId.trim() : undefined,
      };

      if (formData.categoryId && formData.categoryId.trim() !== "") {
        updateData.categoryId = formData.categoryId.trim();
      } else {
        updateData.categoryId = undefined;
      }
      if (formData.subcategoryId && formData.subcategoryId.trim() !== "") {
        updateData.subcategoryId = formData.subcategoryId.trim();
      } else {
        updateData.subcategoryId = undefined;
      }
      if (
        item.manufacturerId &&
        typeof item.manufacturerId === "string" &&
        item.manufacturerId.trim() !== ""
      ) {
        updateData.manufacturerId = item.manufacturerId;
      }

      // Include storeId in update data (required by backend)
      // Use storeId from item directly, or fallback to store.id
      const storeIdForUpdate = item.storeId || item.store?.id;
      if (storeIdForUpdate) {
        updateData.storeId = storeIdForUpdate;
      }

      track(events.PRODUCT_EDITED, {
        product_id: item.id,
        has_barcode: !!updateData.barcode,
        has_hsn: !!updateData.hsnCode,
      });
      await onUpdate(updateData);

      // Self-Learning: Learn from corrections
      // Reuse storeIdForUpdate from above
      if (storeIdForUpdate) {
        try {
          // Learn from HSN correction
          if (updateData.hsnCode && item.hsnCode && updateData.hsnCode !== item.hsnCode) {
            await aiService.learnFromCorrection({
              type: "HSN",
              original: item.hsnCode,
              corrected: updateData.hsnCode,
              context: {
                productName: formData.name,
                hsnCode: updateData.hsnCode || item.hsnCode,
                vendorName: item.supplierId ? suppliers.find(s => s.id === item.supplierId)?.name : undefined,
              },
            });
          }

          // Learn from GST correction
          if (updateData.taxPercentage !== undefined && item.taxPercentage !== undefined && 
              updateData.taxPercentage !== item.taxPercentage) {
            await aiService.learnFromCorrection({
              type: "GST",
              original: item.taxPercentage.toString(),
              corrected: updateData.taxPercentage.toString(),
              context: {
                productName: formData.name,
                hsnCode: updateData.hsnCode || item.hsnCode,
                vendorName: item.supplierId ? suppliers.find(s => s.id === item.supplierId)?.name : undefined,
              },
            });
          }

          // Learn from product name correction
          if (updateData.name && item.name && updateData.name !== item.name) {
            await aiService.learnFromCorrection({
              type: "PRODUCT_NAME",
              original: item.name,
              corrected: updateData.name,
              context: {
                hsnCode: updateData.hsnCode || item.hsnCode,
                vendorName: item.supplierId ? suppliers.find(s => s.id === item.supplierId)?.name : undefined,
              },
            });
          }
        } catch (learnError) {
          // Silently fail - learning is non-critical
          console.log("Failed to learn from correction:", learnError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
            <div className="space-y-4 md:grid md:grid-cols-12 md:gap-6 md:space-y-0">
              {/* Right Block: Product Details */}
              <div className="col-span-12 md:col-span-9 space-y-4 order-1 md:order-2">
                {/* Row 1: Product Name Block */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter product name"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product ID
                      </label>
                      <input
                        type="text"
                        value={formData.productId}
                        onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Auto-generated if not provided"
                        disabled={loading}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        8-digit product ID (auto-generated if not provided)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Low Stock Alert
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.lowStockAlert}
                        onChange={(e) => setFormData({ ...formData, lowStockAlert: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Threshold quantity"
                        disabled={loading}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Alert when stock falls below this quantity
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile: Category (shown after Product Name) */}
                <div className="md:hidden">
                  <CategorySelector
                    categories={categoryManagement.categories}
                    selectedCategoryId={formData.categoryId}
                    onCategoryChange={(categoryId) => {
                      setFormData({
                        ...formData,
                        categoryId,
                        subcategoryId: "",
                      });
                    }}
                    showNewCategoryInput={
                      categoryManagement.showNewCategoryInput
                    }
                    onToggleNewCategory={() =>
                      categoryManagement.setShowNewCategoryInput(
                        !categoryManagement.showNewCategoryInput
                      )
                    }
                    newCategoryName={categoryManagement.newCategoryName}
                    onNewCategoryNameChange={(name) =>
                      categoryManagement.setNewCategoryName(name)
                    }
                    onCreateCategory={async () => {
                      try {
                        await categoryManagement.handleCreateCategory((id) => {
                          setFormData({
                            ...formData,
                            categoryId: id,
                            subcategoryId: "",
                          });
                        });
                      } catch (error) {
                        alert(
                          error instanceof Error
                            ? error.message
                            : "Failed to create category"
                        );
                      }
                    }}
                    creatingCategory={categoryManagement.creatingCategory}
                  />
                </div>

                {/* Pricing Block */}
                <PricingBlock
                  mrp={formData.mrp}
                  purchaseMarginPercentage={formData.purchaseMarginPercentage}
                  marginPercentage={formData.marginPercentage}
                  quantity={formData.quantity}
                  costPrice={formData.costPrice}
                  costPriceBase={formData.costPriceBase}
                  costGST={formData.costGST}
                  sellingPrice={formData.sellingPrice}
                  sellingPriceBase={formData.sellingPriceBase}
                  sellingGST={formData.sellingGST}
                  onFieldChange={handleFieldChange}
                  onQuantityChange={(value) => {
                    // When quantity changes in edit mode, backend will calculate weighted average if costPrice is provided
                    // Just update quantity - backend handles weighted average calculation
                    setFormData({ ...formData, quantity: value });
                  }}
                  editCostPriceAsBase={editCostPriceAsBase}
                  onToggleCostPriceMode={() =>
                    handleToggleCostPriceMode(!editCostPriceAsBase)
                  }
                  editSellingPriceAsBase={editSellingPriceAsBase}
                  onToggleSellingPriceMode={() =>
                    handleToggleSellingPriceMode(!editSellingPriceAsBase)
                  }
                />

                {/* Tax Block */}
                <TaxBlock
                  taxPercentage={formData.taxPercentage}
                  hsnCode={formData.hsnCode}
                  needsBarcode={formData.needsBarcode}
                  barcode={formData.barcode}
                  validationError={validationError}
                  showBarcodeInput={showBarcodeInput}
                  onTaxPercentageChange={(value) =>
                    handleFieldChange("taxPercentage", value)
                  }
                  onHsnCodeChange={(value) => {
                    setFormData({ ...formData, hsnCode: value });
                    setValidationError("");
                  }}
                  onNeedsBarcodeChange={(checked) =>
                    setFormData({ ...formData, needsBarcode: checked })
                  }
                  onBarcodeChange={handleBarcodeChange}
                  onClearValidationError={() => setValidationError("")}
                />

                {/* Barcode Duplicate Warning */}
                {barcodeDuplicateWarning && (
                  <div className="p-3 bg-orange-50 border border-orange-300 rounded-lg text-sm text-orange-800 shadow-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-orange-600 font-semibold text-lg">⚠️</span>
                      <div className="flex-1">
                        <p className="font-semibold mb-1">Barcode Already Exists</p>
                        <p className="text-xs mb-2">
                          Barcode <strong className="font-mono">"{barcodeDuplicateWarning.barcode}"</strong> is currently assigned to product <strong>"{barcodeDuplicateWarning.productName}"</strong>.
                        </p>
                        <p className="text-xs font-medium text-orange-900">
                          💡 Saving will replace the barcode on that product. This is useful for correcting mistakes or updating barcodes.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBarcodeDuplicateWarning(null)}
                        className="text-orange-600 hover:text-orange-800 flex-shrink-0"
                        title="Dismiss warning"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                {/* Barcode Checking Indicator */}
                {checkingBarcode && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span>Checking barcode availability...</span>
                    </div>
                  </div>
                )}

                {validationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 shadow-sm">
                    {validationError}
                  </div>
                )}
              </div>

              {/* Left Sidebar */}
              <LeftSidebar
                categories={categoryManagement.categories}
                selectedCategoryId={formData.categoryId}
                onCategoryChange={(categoryId) => {
                  setFormData({
                    ...formData,
                    categoryId,
                    subcategoryId: "",
                  });
                }}
                showNewCategoryInput={categoryManagement.showNewCategoryInput}
                onToggleNewCategory={() =>
                  categoryManagement.setShowNewCategoryInput(
                    !categoryManagement.showNewCategoryInput
                  )
                }
                newCategoryName={categoryManagement.newCategoryName}
                onNewCategoryNameChange={(name) =>
                  categoryManagement.setNewCategoryName(name)
                }
                onCreateCategory={async () => {
                  try {
                    await categoryManagement.handleCreateCategory((id) => {
                      setFormData({
                        ...formData,
                        categoryId: id,
                        subcategoryId: "",
                      });
                    });
                  } catch (error) {
                    alert(
                      error instanceof Error
                        ? error.message
                        : "Failed to create category"
                    );
                  }
                }}
                creatingCategory={categoryManagement.creatingCategory}
                subcategories={categoryManagement.subcategories}
                selectedSubcategoryId={formData.subcategoryId}
                onSubcategoryChange={(subcategoryId) => {
                  setFormData({ ...formData, subcategoryId });
                }}
                showNewSubcategoryInput={
                  categoryManagement.showNewSubcategoryInput
                }
                onToggleNewSubcategory={() =>
                  categoryManagement.setShowNewSubcategoryInput(
                    !categoryManagement.showNewSubcategoryInput
                  )
                }
                newSubcategoryName={categoryManagement.newSubcategoryName}
                onNewSubcategoryNameChange={(name) =>
                  categoryManagement.setNewSubcategoryName(name)
                }
                onCreateSubcategory={async () => {
                  if (!formData.categoryId) return;
                  try {
                    await categoryManagement.handleCreateSubcategory(
                      formData.categoryId,
                      (id) => {
                        setFormData({ ...formData, subcategoryId: id });
                      }
                    );
                  } catch (error) {
                    alert(
                      error instanceof Error
                        ? error.message
                        : "Failed to create subcategory"
                    );
                  }
                }}
                creatingSubcategory={categoryManagement.creatingSubcategory}
                suppliers={suppliers}
                selectedSupplierId={formData.supplierId}
                onSupplierChange={(supplierId) => {
                  setFormData({ ...formData, supplierId });
                }}
                showNewSupplierInput={showNewSupplierInput}
                onToggleNewSupplier={() =>
                  setShowNewSupplierInput(!showNewSupplierInput)
                }
                newSupplierName={newSupplierName}
                onNewSupplierNameChange={setNewSupplierName}
                onCreateSupplier={async () => {
                  if (!newSupplierName.trim() || !item.store?.id) return;
                  setCreatingSupplier(true);
                  try {
                    const newSupplier = await inventoryService.createSupplier({
                      name: newSupplierName.trim(),
                      storeId: item.store.id,
                    });
                    setSuppliers([...suppliers, newSupplier]);
                    setFormData({ ...formData, supplierId: newSupplier.id });
                    setShowNewSupplierInput(false);
                    setNewSupplierName("");
                  } catch (error) {
                    console.error("Failed to create supplier:", error);
                    alert(
                      error instanceof Error
                        ? error.message
                        : "Failed to create supplier"
                    );
                  } finally {
                    setCreatingSupplier(false);
                  }
                }}
                creatingSupplier={creatingSupplier}
                brands={brands}
                selectedBrandId={formData.brandId}
                onBrandChange={(brandId) => {
                  setFormData({ ...formData, brandId });
                }}
                showNewBrandInput={showNewBrandInput}
                onToggleNewBrand={() =>
                  setShowNewBrandInput(!showNewBrandInput)
                }
                newBrandName={newBrandName}
                onNewBrandNameChange={setNewBrandName}
                onCreateBrand={async () => {
                  if (!newBrandName.trim() || !item.store?.id) return;
                  setCreatingBrand(true);
                  try {
                    const newBrand = await inventoryService.createBrand({
                      name: newBrandName.trim(),
                      storeId: item.store.id,
                    });
                    setBrands([...brands, newBrand]);
                    setFormData({ ...formData, brandId: newBrand.id });
                    setShowNewBrandInput(false);
                    setNewBrandName("");
                  } catch (error) {
                    console.error("Failed to create brand:", error);
                    alert(
                      error instanceof Error
                        ? error.message
                        : "Failed to create brand"
                    );
                  } finally {
                    setCreatingBrand(false);
                  }
                }}
                creatingBrand={creatingBrand}
              />
            </div>
          </div>
          <div className="flex justify-between items-center gap-2 px-4 md:px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  trackButton("Scan Barcode", {
                    location: "edit_product_modal",
                  });
                  setShowScanner(true);
                }}
                className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 font-medium flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                Scan
              </button>
              {!formData.barcode.trim() && !showBarcodeInput && (
                <button
                  type="button"
                  onClick={() => {
                    trackButton("Add Barcode", {
                      location: "edit_product_modal",
                    });
                    setShowBarcodeInput(true);
                    setFormData((prev) => ({ ...prev, needsBarcode: false }));
                  }}
                  className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 font-medium"
                >
                  Add Barcode
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  trackButton("Cancel", { location: "edit_product_modal" });
                  onClose();
                }}
                className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name || loading}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 font-medium"
              >
                {loading ? "Updating..." : "Update Product"}
              </button>
            </div>
          </div>
        </form>
        {showScanner && (
          <CameraScannerModal
            type="barcode"
            onClose={() => setShowScanner(false)}
            onScan={(code) => {
              setFormData({
                ...formData,
                barcode: code,
                needsBarcode: false,
              });
              setShowBarcodeInput(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
