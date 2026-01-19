/**
 * This file contains the AddProductModal component for creating new products.
 * It includes auto-calculation of prices based on MRP and margins,
 * and displays category and global rates for reference.
 */
"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useCountry } from "@/contexts/CountryContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { inventoryService } from "@/services/inventory.service";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { calculateDerivedFields } from "@/utils/productCalculations";
import CategorySelector from "./CategorySelector";
import LeftSidebar from "./LeftSidebar";
import PricingBlock from "./PricingBlock";
import TaxBlock from "./TaxBlock";
import CameraScannerModal from "./CameraScannerModal";
import ProductSearchInput from "./ProductSearchInput";
import { lookupOpenFoodFacts } from "@/lib/openFoodFacts";
import { generateEAN13, isValidEAN13 } from "@/lib/products.barcode";
import type { Product } from "@/services/inventory.service";

interface AddProductModalProps {
  onClose: () => void;
  onAdd: (productData: {
    name: string;
    storeId: string;
    productId?: string;
    barcode?: string;
    hsnCode?: string;
    taxPercentage?: number;
    mrp?: number;
    costPrice?: number;
    costPriceBase?: number;
    costGST?: number;
    sellingPrice?: number;
    sellingPriceBase?: number;
    sellingGST?: number;
    quantity: number;
    lowStockAlert?: number;
    requireCustomBarcode: boolean;
    needsBarcode: boolean;
    marginPercentage?: number;
    purchaseMarginPercentage?: number;
    supplierId?: string;
    brandId?: string;
    categoryId?: string;
    subcategoryId?: string;
  }) => Promise<void>;
  initialName?: string;
}

interface CategoryRates {
  gstRate?: number;
  hsnCode?: string;
  marginPercentage?: number;
  purchaseMarginPercentage?: number;
}

export default function AddProductModal({
  onClose,
  onAdd,
  initialName = "",
}: AddProductModalProps) {
  const { selectedStore } = useStore();
  const { isIN, isNL } = useCountry();
  const { track, trackButton, events } = useAnalytics(
    "Add Product Modal",
    false
  );
  const { globalSettings, getCategoryRates } = useSettings();

  const [formData, setFormData] = useState({
    name: initialName,
    productId: "",
    hsnCode: "",
    taxPercentage: "",
    mrp: "",
    costPrice: "",
    costPriceBase: "",
    costGST: "",
    sellingPrice: "",
    sellingPriceBase: "",
    sellingGST: "",
    quantity: "0",
    lowStockAlert: "",
    requireCustomBarcode: false,
    needsBarcode: false,
    barcode: "",
    marginPercentage: "",
    purchaseMarginPercentage: "",
    supplierId: "",
    brandId: "",
    categoryId: "",
    subcategoryId: "",
  });
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [editCostPriceAsBase, setEditCostPriceAsBase] = useState(false);
  const [editSellingPriceAsBase, setEditSellingPriceAsBase] = useState(false);
  const [categoryRates, setCategoryRates] = useState<CategoryRates | null>(
    null
  );
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
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

  const categoryManagement = useCategoryManagement(selectedStore?.id);

  // Auto-fill global settings on mount
  useEffect(() => {
    setFormData((prev) => {
      const updates: Partial<typeof formData> = {};
      if (!prev.taxPercentage && globalSettings.taxPercentage > 0) {
        updates.taxPercentage = globalSettings.taxPercentage.toString();
      }
      if (!prev.marginPercentage && globalSettings.marginPercentage > 0) {
        updates.marginPercentage = globalSettings.marginPercentage.toString();
      }
      if (
        !prev.purchaseMarginPercentage &&
        globalSettings.purchaseMarginPercentage
      ) {
        updates.purchaseMarginPercentage =
          globalSettings.purchaseMarginPercentage?.toString() || "";
      }
      if (!prev.hsnCode && globalSettings.hsnCode) {
        updates.hsnCode = globalSettings.hsnCode || "";
      }
      return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
    });
  }, [globalSettings]);

  // Load category rates when category is selected (fill once per category)
  useEffect(() => {
    const loadCategoryRates = async () => {
      if (formData.categoryId) {
        const rates = await getCategoryRates(formData.categoryId);
        setCategoryRates(rates);
        // Get category name
        const category = categoryManagement.categories.find(
          (cat) => cat.id === formData.categoryId
        );
        setSelectedCategoryName(category?.name || "");
        // Auto-fill category rates when category is first selected
        if (rates) {
          setFormData((prev) => {
            const updates: Partial<typeof formData> = {};
            // Always apply category values when category is selected
            if (rates.gstRate !== undefined && rates.gstRate !== null) {
              updates.taxPercentage = rates.gstRate.toString();
            }
            if (rates.hsnCode) {
              updates.hsnCode = rates.hsnCode;
            }
            if (
              rates.marginPercentage !== undefined &&
              rates.marginPercentage !== null
            ) {
              updates.marginPercentage = rates.marginPercentage.toString();
            }
            if (
              rates.purchaseMarginPercentage !== undefined &&
              rates.purchaseMarginPercentage !== null
            ) {
              updates.purchaseMarginPercentage =
                rates.purchaseMarginPercentage.toString();
            }
            return { ...prev, ...updates };
          });
        }
      } else {
        setCategoryRates(null);
        setSelectedCategoryName("");
      }
    };
    loadCategoryRates();
  }, [formData.categoryId, getCategoryRates, categoryManagement.categories]);

  // Load subcategories when category is selected
  useEffect(() => {
    if (formData.categoryId) {
      categoryManagement.loadSubcategories(formData.categoryId);
    } else {
      categoryManagement.setSubcategories([]);
      setFormData((prev) => ({ ...prev, subcategoryId: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.categoryId]);

  // Load suppliers and brands when store is available
  useEffect(() => {
    const loadSuppliersAndBrands = async () => {
      if (selectedStore?.id) {
        try {
          const [supps, brs] = await Promise.all([
            inventoryService.getSuppliers(selectedStore.id),
            inventoryService.getBrands(selectedStore.id),
          ]);
          setSuppliers(supps);
          setBrands(brs);
        } catch (error) {
          console.error("Failed to load suppliers or brands:", error);
        }
      }
    };
    loadSuppliersAndBrands();
  }, [selectedStore]);

  const handleFieldChange = async (field: string, value: string) => {
    // Update field immediately for responsive UI
    // Calculate derived fields using backend
    try {
      const updates = await calculateDerivedFields(
        field,
        value,
        {
          ...formData,
          [field]: value,
        },
        globalSettings.taxPercentage,
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
        parseFloat(formData.taxPercentage) || globalSettings.taxPercentage || 0;
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
        parseFloat(formData.taxPercentage) || globalSettings.taxPercentage || 0;
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
        parseFloat(formData.taxPercentage) || globalSettings.taxPercentage || 0;
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
  const validateForm = (): boolean => {
    setValidationError("");

    // MRP is required
    if (!formData.mrp || parseFloat(formData.mrp) <= 0) {
      setValidationError("MRP is required");
      return false;
    }

    const taxPercentage = formData.taxPercentage
      ? parseFloat(formData.taxPercentage)
      : undefined;
    const hsnCode = formData.hsnCode.trim();

    // If GST is provided, HSN code is required
    if (taxPercentage !== undefined && taxPercentage > 0 && !hsnCode) {
      setValidationError("HSN Code is required when GST is provided");
      return false;
    }

    return true;
  };

  /**
   * Handles form submission with validation.
   * @param e - The form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !selectedStore) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      track(events.PRODUCT_ADDED, {
        has_barcode: !!formData.barcode.trim(),
        has_hsn: !!formData.hsnCode.trim(),
        has_tax: !!formData.taxPercentage,
      });
      await onAdd({
        name: formData.name,
        storeId: selectedStore.id,
        // India: Include HSN code, EU: Optional (for compatibility, but not required)
        hsnCode: isIN ? (formData.hsnCode.trim() || undefined) : undefined,
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
        productId: formData.productId.trim() || undefined,
        lowStockAlert: formData.lowStockAlert
          ? parseInt(formData.lowStockAlert) || undefined
          : undefined,
        requireCustomBarcode: formData.requireCustomBarcode,
        needsBarcode: formData.needsBarcode,
        barcode: formData.barcode.trim() || undefined,
        marginPercentage: formData.marginPercentage
          ? parseFloat(formData.marginPercentage)
          : undefined,
        purchaseMarginPercentage: formData.purchaseMarginPercentage
          ? parseFloat(formData.purchaseMarginPercentage)
          : undefined,
        supplierId: formData.supplierId.trim() || undefined,
        brandId: formData.brandId.trim() || undefined,
        categoryId: formData.categoryId.trim() || undefined,
        subcategoryId: formData.subcategoryId.trim() || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add Product</h2>
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
                    <ProductSearchInput
                      value={formData.name}
                      onChange={(product, searchQuery) => {
                        if (product) {
                          // Auto-populate form fields from selected product
                          const taxPercentage = product.taxPercentage?.toString() || formData.taxPercentage || "";
                          setFormData({
                            ...formData,
                            name: product.name,
                            productId: product.productId || "",
                            hsnCode: product.hsnCode || "",
                            taxPercentage,
                            mrp: product.mrp?.toString() || "",
                            costPrice: product.costPrice?.toString() || "",
                            costPriceBase: product.costPriceBase?.toString() || "",
                            costGST: product.costGST?.toString() || "",
                            sellingPrice: product.sellingPrice?.toString() || "",
                            sellingPriceBase: product.sellingPriceBase?.toString() || "",
                            sellingGST: product.sellingGST?.toString() || "",
                            marginPercentage: product.marginPercentage?.toString() || "",
                            purchaseMarginPercentage: product.purchaseMarginPercentage?.toString() || "",
                            categoryId: product.categoryId || "",
                            subcategoryId: product.subcategoryId || "",
                            brandId: product.brandId || "",
                            supplierId: product.supplierId || "",
                            barcode: product.barcode || "",
                            lowStockAlert: product.lowStockAlert?.toString() || "",
                          });
                        } else if (searchQuery !== undefined) {
                          // User is typing - update name field
                          setFormData({ ...formData, name: searchQuery });
                        }
                      }}
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
                  {/* Info Bar - below product name */}
                  <div className="mt-2 text-xs">
                    {categoryRates ? (
                      <span className="text-blue-700">
                        <span className="font-semibold">
                          {selectedCategoryName}:
                        </span>{" "}
                        {categoryRates.gstRate !== undefined &&
                          `GST ${categoryRates.gstRate}%`}
                        {categoryRates.marginPercentage !== undefined &&
                          ` | Selling Margin ${categoryRates.marginPercentage}%`}
                        {categoryRates.purchaseMarginPercentage !== undefined &&
                          ` | Cost Margin ${categoryRates.purchaseMarginPercentage}%`}
                      </span>
                    ) : (
                      <span className="text-purple-700">
                        <span className="font-semibold">Global:</span>{" "}
                        {isIN ? `GST ${globalSettings.taxPercentage}%` : `VAT ${globalSettings.taxPercentage || (isNL ? 21 : 19)}%`} | Selling Margin{" "}
                        {globalSettings.marginPercentage}%
                        {globalSettings.purchaseMarginPercentage !==
                          undefined &&
                          ` | Cost Margin ${globalSettings.purchaseMarginPercentage}%`}
                      </span>
                    )}
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
                    const quantityNum = parseFloat(value) || 0;
                    const mrpNum = parseFloat(formData.mrp) || 0;
                    
                    // When quantity is entered, if MRP exists and margins are blank, set margins to 0 and prices to MRP
                    if (quantityNum > 0 && mrpNum > 0) {
                      const marginPercentage = parseFloat(formData.marginPercentage) || 0;
                      const purchaseMarginPercentage = parseFloat(formData.purchaseMarginPercentage) || 0;
                      const taxPercentage = parseFloat(formData.taxPercentage) || globalSettings.taxPercentage || 0;
                      const taxRate = taxPercentage / 100;
                      
                      const updates: Partial<typeof formData> = { quantity: value };
                      
                      // If margins are blank (empty string or 0), set them to 0 explicitly and set prices to MRP
                      if (!formData.marginPercentage && !formData.purchaseMarginPercentage) {
                        updates.marginPercentage = "0";
                        updates.purchaseMarginPercentage = "0";
                        
                        // Set prices to MRP
                        if (editCostPriceAsBase) {
                          updates.costPriceBase = mrpNum.toFixed(2);
                          if (taxRate > 0) {
                            const costPrice = mrpNum * (1 + taxRate);
                            updates.costPrice = costPrice.toFixed(2);
                            updates.costGST = (costPrice - mrpNum).toFixed(2);
                          } else {
                            updates.costPrice = mrpNum.toFixed(2);
                            updates.costGST = "0.00";
                          }
                        } else {
                          updates.costPrice = mrpNum.toFixed(2);
                          if (taxRate > 0) {
                            const costPriceBase = mrpNum / (1 + taxRate);
                            updates.costPriceBase = costPriceBase.toFixed(2);
                            updates.costGST = (mrpNum - costPriceBase).toFixed(2);
                          } else {
                            updates.costPriceBase = mrpNum.toFixed(2);
                            updates.costGST = "0.00";
                          }
                        }
                        
                        updates.sellingPrice = mrpNum.toFixed(2);
                        if (taxRate > 0) {
                          const sellingPriceBase = mrpNum / (1 + taxRate);
                          updates.sellingPriceBase = sellingPriceBase.toFixed(2);
                          updates.sellingGST = (mrpNum - sellingPriceBase).toFixed(2);
                        } else {
                          updates.sellingPriceBase = mrpNum.toFixed(2);
                          updates.sellingGST = "0.00";
                        }
                        
                        setFormData((prev) => ({ ...prev, ...updates }));
                        return;
                      }
                    }
                    
                    // Otherwise, just update quantity
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
                  onHsnCodeChange={(value) =>
                    setFormData({ ...formData, hsnCode: value })
                  }
                  onNeedsBarcodeChange={(checked) => {
                    if (checked && !formData.barcode.trim()) {
                      // Generate EAN-13 barcode when checkbox is checked
                      const generatedBarcode = generateEAN13();
                      setFormData({ 
                        ...formData, 
                        needsBarcode: checked,
                        barcode: generatedBarcode
                      });
                      setShowBarcodeInput(true);
                    } else {
                      setFormData({ ...formData, needsBarcode: checked });
                    }
                  }}
                  onBarcodeChange={(value) => {
                    setFormData({ ...formData, barcode: value });
                    if (!value.trim()) {
                      setShowBarcodeInput(false);
                      setFormData((prev) => ({ ...prev, needsBarcode: true }));
                    }
                  }}
                  onClearValidationError={() => setValidationError("")}
                />

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
                  if (!newSupplierName.trim() || !selectedStore) return;
                  setCreatingSupplier(true);
                  try {
                    const newSupplier = await inventoryService.createSupplier({
                      name: newSupplierName.trim(),
                      storeId: selectedStore.id,
                    });
                    setSuppliers([...suppliers, newSupplier]);
                    setFormData({
                      ...formData,
                      supplierId: newSupplier.id,
                    });
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
                  if (!newBrandName.trim() || !selectedStore) return;
                  setCreatingBrand(true);
                  try {
                    const newBrand = await inventoryService.createBrand({
                      name: newBrandName.trim(),
                      storeId: selectedStore.id,
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
                    location: "add_product_modal",
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
                      location: "add_product_modal",
                    });
                    // Generate EAN-13 barcode and populate the field
                    const generatedBarcode = generateEAN13();
                    setFormData((prev) => ({ 
                      ...prev, 
                      barcode: generatedBarcode,
                      needsBarcode: false 
                    }));
                    setShowBarcodeInput(true);
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
                  trackButton("Cancel", { location: "add_product_modal" });
                  onClose();
                }}
                className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  !formData.name || !formData.mrp || !selectedStore || loading
                }
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 font-medium"
              >
                {loading ? "Adding..." : "Add Product"}
              </button>
            </div>
          </div>
        </form>
        {showScanner && (
          <CameraScannerModal
            type="both"
            onClose={() => setShowScanner(false)}
            onScan={async (code) => {
              // Normalize barcode
              const barcode = typeof code === "string" ? code.trim() : "";
              if (!barcode) {
                return;
              }

              // Validate EAN13 if it's 13 digits
              const cleaned = barcode.replace(/\D/g, "");
              if (cleaned.length === 13 && !isValidEAN13(barcode)) {
                // Invalid checksum, but still allow it (user may have manually entered valid barcode)
                console.warn("EAN13 checksum validation failed, but allowing barcode:", barcode);
              }

              // First, try to lookup product from database by barcode
              try {
                const existingProduct = await inventoryService.getProductByBarcode(barcode);
                if (existingProduct) {
                  // Product found in database - populate all fields
                  setFormData({
                    name: existingProduct.name || "",
                    productId: existingProduct.productId || "",
                    hsnCode: existingProduct.hsnCode || "",
                    taxPercentage: existingProduct.taxPercentage?.toString() || "",
                    mrp: existingProduct.mrp?.toString() || "",
                    costPrice: existingProduct.costPrice?.toString() || "",
                    costPriceBase: existingProduct.costPriceBase?.toString() || "",
                    costGST: existingProduct.costGST?.toString() || "",
                    sellingPrice: existingProduct.sellingPrice?.toString() || "",
                    sellingPriceBase: existingProduct.sellingPriceBase?.toString() || "",
                    sellingGST: existingProduct.sellingGST?.toString() || "",
                    quantity: existingProduct.quantity?.toString() || "0",
                    lowStockAlert: existingProduct.lowStockAlert?.toString() || "",
                    requireCustomBarcode: existingProduct.requireCustomBarcode || false,
                    needsBarcode: existingProduct.needsBarcode || false,
                    barcode: existingProduct.barcode || barcode,
                    marginPercentage: existingProduct.marginPercentage?.toString() || "",
                    purchaseMarginPercentage: existingProduct.purchaseMarginPercentage?.toString() || "",
                    supplierId: existingProduct.supplierId || "",
                    brandId: existingProduct.brandId || "",
                    categoryId: existingProduct.categoryId || "",
                    subcategoryId: existingProduct.subcategoryId || "",
                  });
                  setShowBarcodeInput(true);
                  return; // Exit early - product found in database
                }
              } catch (err) {
                console.error("Database barcode lookup failed:", err);
                // Continue to OpenFoodFacts lookup as fallback
              }

              // If not found in database, try OpenFoodFacts
              try {
                const offData = await lookupOpenFoodFacts(barcode);
                if (offData) {
                  setFormData((d) => ({
                    ...d,
                    name: offData.name || d.name,
                    barcode: barcode,
                    needsBarcode: false,
                  }));
                } else {
                  setFormData((d) => ({
                    ...d,
                    barcode: barcode,
                    needsBarcode: false,
                  }));
                }
              } catch (err) {
                console.error("OpenFoodFacts lookup failed:", err);
                setFormData((d) => ({
                  ...d,
                  barcode: barcode,
                  needsBarcode: false,
                }));
              }
              setShowBarcodeInput(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
