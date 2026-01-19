/**
 * This file contains the InventoryPage component which displays and manages inventory products.
 * It includes pagination, search functionality, date filtering, and various product management features
 * such as adding, editing, deleting products, generating barcodes/QR codes, and uploading inventory files.
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { inventoryService } from "@/services/inventory.service";
import type { Product } from "@/services/inventory.service";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useStore } from "@/contexts/StoreContext";
import Snackbar from "./Snackbar";
import Toast from "./Toast";
import UploadModal from "./inventory/UploadModal";
import UploadBillModal from "./scanned-bills/UploadBillModal";
import BarcodeModal from "./inventory/BarcodeModal";
import QRCodeModal from "./inventory/QRCodeModal";
import AddProductModal from "./inventory/AddProductModal";
import EditProductModal from "./inventory/EditProductModal";
import ViewProductModal from "./inventory/ViewProductModal";
import DisplayBarcodeModal from "./inventory/DisplayBarcodeModal";
import DisplayQRCodeModal from "./inventory/DisplayQRCodeModal";
import CameraScannerModal from "./inventory/CameraScannerModal";
import ConfirmDeleteModal from "./inventory/ConfirmDeleteModal";
import PrintQuantityModal from "./inventory/PrintQuantityModal";
import BulkUpdateModal from "./inventory/BulkUpdateModal";
import BulkUpdatePreviewModal from "./inventory/BulkUpdatePreviewModal";
import ProductList from "./inventory/ProductList";
import CategoryWiseSummary from "./inventory/CategoryWiseSummary";

export default function InventoryPage() {
  const { trackButton, track, events } = useAnalytics("Products Page", false);
  const { selectedStore, loading: storeLoading } = useStore();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [itemsPerPage] = useState(50);
  const [pageHistory, setPageHistory] = useState<
    Array<{ lastKey: string | null; hasMore: boolean }>
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUploadBillModal, setShowUploadBillModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Product | null>(null);
  const [showViewProductModal, setShowViewProductModal] = useState(false);
  const [itemToView, setItemToView] = useState<Product | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [showDisplayBarcodeModal, setShowDisplayBarcodeModal] = useState(false);
  const [showDisplayQRCodeModal, setShowDisplayQRCodeModal] = useState(false);
  const [displayItem, setDisplayItem] = useState<Product | null>(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scanningFor, setScanningFor] = useState<{
    itemId: string;
    type: "barcode" | "qr";
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<"top" | "bottom">("bottom");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteType, setDeleteType] = useState<"single" | "bulk">("single");
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPrintQuantityModal, setShowPrintQuantityModal] = useState(false);
  const [printType, setPrintType] = useState<"barcode" | "qr">("barcode");
  const [printItemIds, setPrintItemIds] = useState<string[]>([]);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showBulkUpdatePreview, setShowBulkUpdatePreview] = useState(false);
  const [bulkUpdateConfig, setBulkUpdateConfig] = useState<{
    categoryIds: string[];
    field:
      | "mrp"
      | "marginPercentage"
      | "purchaseMarginPercentage"
      | "taxPercentage";
    changeType: "increase" | "decrease" | "set";
    value: number;
  } | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "price" | "quantity" | "mrp" | "costPrice" | "sellingPrice">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    // Only fetch if store is available
    if (!selectedStore?.id) {
      // Don't clear items immediately - wait for store to load
      return;
    }
    
    // Reset and fetch when search or filters change
    setItems([]);
    setHasMore(false);
    setError(""); // Clear any previous errors
    setCurrentPage(1);
    setTotalCount(undefined); // Clear total count when filters change
    setPageHistory([]);
    fetchInventory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, startDate, endDate, selectedStore?.id]);

  // Listen for product updates from other components (e.g., scanned bills)
  useEffect(() => {
    const handleProductsUpdated = () => {
      // Refresh inventory when products are updated from other sources
      if (selectedStore?.id) {
        setItems([]);
        setPageHistory([]);
        setCurrentPage(1);
        fetchInventory(1);
      }
    };

    const handleBillUploaded = () => {
      // Wait a bit for OCR processing, then refresh
      setTimeout(() => {
        if (selectedStore?.id) {
          setItems([]);
          setPageHistory([]);
          setCurrentPage(1);
          fetchInventory(1);
        }
      }, 5000); // Wait 5 seconds for OCR to process
    };

    if (typeof window !== "undefined") {
      window.addEventListener("productsUpdated", handleProductsUpdated);
      window.addEventListener("billUploaded", handleBillUploaded);
      
      return () => {
        window.removeEventListener("productsUpdated", handleProductsUpdated);
        window.removeEventListener("billUploaded", handleBillUploaded);
      };
    }
  }, [selectedStore?.id]);

  // Sort items client-side - use useMemo to avoid infinite loops
  const sortedItems = useMemo(() => {
    if (items.length === 0) return items;

    return [...items].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "price":
        case "sellingPrice":
          aValue = a.sellingPrice ?? 0;
          bValue = b.sellingPrice ?? 0;
          break;
        case "mrp":
          aValue = a.mrp ?? 0;
          bValue = b.mrp ?? 0;
          break;
        case "costPrice":
          aValue = a.costPrice ?? 0;
          bValue = b.costPrice ?? 0;
          break;
        case "quantity":
          aValue = a.quantity ?? 0;
          bValue = b.quantity ?? 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === "asc" ? comparison : -comparison;
      } else {
        const comparison = (aValue as number) - (bValue as number);
        return sortOrder === "asc" ? comparison : -comparison;
      }
    });
  }, [items, sortBy, sortOrder]);

  /**
   * Fetches inventory for a specific page.
   * @param page - Page number (1-indexed)
   * @param pageLastKey - Optional lastKey for the page (for navigation)
   */
  const fetchInventory = async (page: number, pageLastKey?: string | null) => {
    try {
      setLoading(true);
      if (!selectedStore?.id) {
        // Don't set error if store is still loading - it might be loading
        if (!storeLoading) {
          setError("No store selected. Please select a store from the store selector.");
          setItems([]); // Clear items when no store is selected
        }
        setLoading(false);
        return;
      }
      setError(""); // Clear error when store is available
      const params: {
        limit: number;
        lastKey?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
        storeId: string;
      } = {
        limit: 50, // Increased from 10 to 50 for better visibility
        storeId: selectedStore.id,
      };

      // Use provided pageLastKey or get from history
      const lastKeyToUse =
        pageLastKey !== undefined
          ? pageLastKey
          : page > 1 && pageHistory[page - 2]
          ? pageHistory[page - 2].lastKey
          : null;

      if (
        lastKeyToUse &&
        lastKeyToUse !== "undefined" &&
        lastKeyToUse !== "null"
      ) {
        params.lastKey = lastKeyToUse;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      const response = await inventoryService.getInventory(params);
      const newItems = response.data || [];
      const pagination = response.pagination;
      const newLastKey = pagination?.lastKey || null;
      const newHasMore = pagination?.hasMore || false;
      const newTotalCount = pagination?.totalCount;

      setItems(newItems);
      setHasMore(newHasMore);
      setCurrentPage(page);
      // Only update totalCount if it's provided (when no filters/search applied)
      if (newTotalCount !== undefined) {
        setTotalCount(newTotalCount);
      }

      // Update page history
      setPageHistory((prev) => {
        const updated = [...prev];
        // Ensure array is large enough
        while (updated.length < page) {
          updated.push({ lastKey: null, hasMore: false });
        }
        updated[page - 1] = { lastKey: newLastKey, hasMore: newHasMore };
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigates to the next page.
   */
  const handleNextPage = () => {
    if (hasMore && !loading) {
      const nextPage = currentPage + 1;
      fetchInventory(nextPage);
    }
  };

  /**
   * Navigates to the previous page.
   */
  const handlePreviousPage = () => {
    if (currentPage > 1 && !loading) {
      const prevPage = currentPage - 1;
      // fetchInventory will automatically get the correct lastKey from pageHistory
      fetchInventory(prevPage);
    }
  };

  const handleUpload = async (
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
  ) => {
    try {
      await inventoryService.uploadInventory(file, options);
      setShowUploadModal(false);
      fetchInventory(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  /**
   * Handles updating an inventory item.
   * @param item - The product item to update
   * @param updates - The fields to update
   */
  const handleUpdateItem = async (item: Product, updates: Partial<Product>) => {
    try {
      await inventoryService.updateProduct(item.id, updates, item.store?.id);
      setEditingItem(null);
      fetchInventory(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleGenerateBarcodes = async () => {
    try {
      await inventoryService.generateBarcodes(selectedItems);
      setSelectedItems([]);
      setShowBarcodeModal(false);
      fetchInventory(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Barcode generation failed"
      );
    }
  };

  const handleGenerateQRCodes = async () => {
    try {
      await inventoryService.generateQRCodes(selectedItems);
      setSelectedItems([]);
      setShowQRCodeModal(false);
      fetchInventory(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "QR code generation failed"
      );
    }
  };

  const handleMapBarcode = async (itemId: string, barcode: string) => {
    try {
      await inventoryService.mapBarcode(itemId, barcode);
      fetchInventory(1);
      setError("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Barcode mapping failed";
      setError(errorMessage);
      console.error("Barcode mapping error:", err);
    }
  };

  const handleMapQRCode = async (itemId: string, qrCode: string) => {
    try {
      await inventoryService.mapQRCode(itemId, qrCode);
      fetchInventory(1);
      setError("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "QR code mapping failed";
      setError(errorMessage);
      console.error("QR code mapping error:", err);
    }
  };

  /**
   * Opens the confirmation modal for deleting a single product.
   * @param productId - The ID of the product to delete
   */
  const handleDeleteProduct = (productId: string) => {
    setProductIdToDelete(productId);
    setDeleteType("single");
    setShowDeleteConfirmModal(true);
  };

  /**
   * Performs the actual deletion of a single product after confirmation.
   * @param productId - The ID of the product to delete
   */
  const confirmDeleteProduct = async (productId: string) => {
    if (!selectedStore?.id) {
      setError("Store ID is required to delete product");
      return;
    }
    try {
      setIsDeleting(true);
      await inventoryService.deleteProduct(productId, selectedStore.id);
      setShowDeleteConfirmModal(false);
      setProductIdToDelete(null);
      fetchInventory(1);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Opens the confirmation modal for bulk deletion of selected products.
   */
  const handleDeleteMultiple = () => {
    if (selectedItems.length === 0) {
      setError("Please select products to delete");
      return;
    }
    setDeleteType("bulk");
    setShowDeleteConfirmModal(true);
  };

  /**
   * Performs the actual bulk deletion after confirmation.
   */
  const confirmDeleteMultiple = async () => {
    if (!selectedStore?.id) {
      setError("Store ID is required to delete products");
      return;
    }
    try {
      setIsDeleting(true);
      await inventoryService.deleteProducts(selectedItems, selectedStore.id);
      setSelectedItems([]);
      setShowDeleteConfirmModal(false);
      fetchInventory(1);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete products"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Opens the print quantity modal for barcode printing.
   */
  const handleDownloadBarcode = () => {
    setPrintType("barcode");
    setPrintItemIds(selectedItems.length > 0 ? selectedItems : []);
    setShowPrintQuantityModal(true);
  };

  /**
   * Performs the actual barcode printing after quantity is confirmed.
   * @param quantity - The number of copies to print
   * @param rows - The number of rows per page
   * @param columns - The number of columns per page
   */
  const performBarcodePrint = async (
    quantity: number,
    rows: number,
    columns: number
  ) => {
    try {
      const blob = await inventoryService.downloadBarcodes(
        printItemIds.length > 0 ? printItemIds : undefined,
        quantity,
        rows,
        columns
      );
      const url = window.URL.createObjectURL(blob);

      // Open PDF in new window and wait for it to load
      const printWindow = window.open(url, "_blank");

      if (printWindow) {
        // Wait for window to load, then print
        const checkReady = () => {
          try {
            // Check if PDF is loaded by trying to access the document
            if (printWindow.document.readyState === "complete") {
              // Additional wait for PDF viewer to initialize
              setTimeout(() => {
                printWindow.print();
                // Clean up after a delay
                setTimeout(() => {
                  window.URL.revokeObjectURL(url);
                }, 1000);
              }, 1000);
            } else {
              // Check again after a short delay
              setTimeout(checkReady, 100);
            }
          } catch {
            // Cross-origin or other error, try printing anyway after delay
            setTimeout(() => {
              printWindow.print();
              setTimeout(() => {
                window.URL.revokeObjectURL(url);
              }, 1000);
            }, 2000);
          }
        };

        // Start checking after a short initial delay
        setTimeout(checkReady, 500);

        // Fallback: print after 3 seconds regardless
        setTimeout(() => {
          try {
            printWindow.print();
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 1000);
          } catch (err) {
            console.error("Print error:", err);
          }
        }, 3000);
      }
    } catch (err) {
      setSuccessMessage(""); // Clear success message to show error
      setError(err instanceof Error ? err.message : "Print failed");
    }
  };

  /**
   * Opens the print quantity modal for QR code printing.
   */
  const handleDownloadQRCode = () => {
    setPrintType("qr");
    setPrintItemIds(selectedItems.length > 0 ? selectedItems : []);
    setShowPrintQuantityModal(true);
  };

  /**
   * Performs the actual QR code printing after quantity is confirmed.
   * @param quantity - The number of copies to print
   * @param rows - The number of rows per page
   * @param columns - The number of columns per page
   */
  const performQRCodePrint = async (
    quantity: number,
    rows: number,
    columns: number
  ) => {
    try {
      const blob = await inventoryService.downloadQRCodes(
        printItemIds.length > 0 ? printItemIds : undefined,
        quantity,
        rows,
        columns
      );
      const url = window.URL.createObjectURL(blob);

      // Open PDF in new window and wait for it to load
      const printWindow = window.open(url, "_blank");

      if (printWindow) {
        // Wait for window to load, then print
        const checkReady = () => {
          try {
            // Check if PDF is loaded by trying to access the document
            if (printWindow.document.readyState === "complete") {
              // Additional wait for PDF viewer to initialize
              setTimeout(() => {
                printWindow.print();
                // Clean up after a delay
                setTimeout(() => {
                  window.URL.revokeObjectURL(url);
                }, 1000);
              }, 1000);
            } else {
              // Check again after a short delay
              setTimeout(checkReady, 100);
            }
          } catch {
            // Cross-origin or other error, try printing anyway after delay
            setTimeout(() => {
              printWindow.print();
              setTimeout(() => {
                window.URL.revokeObjectURL(url);
              }, 1000);
            }, 2000);
          }
        };

        // Start checking after a short initial delay
        setTimeout(checkReady, 500);

        // Fallback: print after 3 seconds regardless
        setTimeout(() => {
          try {
            printWindow.print();
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 1000);
          } catch (err) {
            console.error("Print error:", err);
          }
        }, 3000);
      }
    } catch (err) {
      setSuccessMessage(""); // Clear success message to show error
      setError(err instanceof Error ? err.message : "Print failed");
    }
  };

  const handleGenerateBarcodeForItem = async (itemId: string) => {
    try {
      await inventoryService.generateBarcodes([itemId]);
      fetchInventory(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Barcode generation failed"
      );
    }
  };

  const handleGenerateQRCodeForItem = async (itemId: string) => {
    try {
      await inventoryService.generateQRCodes([itemId]);
      fetchInventory(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "QR code generation failed"
      );
    }
  };

  /**
   * Handles the preview request from BulkUpdateModal.
   * @param config - The bulk update configuration
   */
  const handleBulkUpdatePreview = (config: {
    categoryIds: string[];
    field:
      | "mrp"
      | "marginPercentage"
      | "purchaseMarginPercentage"
      | "taxPercentage";
    changeType: "increase" | "decrease" | "set";
    value: number;
  }) => {
    setBulkUpdateConfig(config);
    setShowBulkUpdateModal(false);
    setShowBulkUpdatePreview(true);
  };

  /**
   * Performs the actual bulk update after confirmation.
   * @param _affectedProducts - The products that will be affected (for display purposes, not used in update)
   * @param calculatedUpdates - The calculated updates for each product from the preview
   */
  const handleBulkUpdateConfirm = async (
    _affectedProducts: Product[],
    calculatedUpdates: Array<{
      productId: string;
      updates: {
        mrp?: number;
        costPrice?: number;
        costPriceBase?: number;
        costGST?: number;
        sellingPrice?: number;
        sellingPriceBase?: number;
        sellingGST?: number;
        marginPercentage?: number;
        purchaseMarginPercentage?: number;
        taxPercentage?: number;
      };
    }>
  ) => {
    // _affectedProducts is kept for API compatibility but not used in update
    void _affectedProducts;
    if (!bulkUpdateConfig) {
      setError("No update configuration found");
      return;
    }

    try {
      setError("");

      // Call backend bulk update endpoint with calculated values
      await inventoryService.bulkUpdateProducts(
        {
          categoryIds:
            bulkUpdateConfig.categoryIds.length > 0
              ? bulkUpdateConfig.categoryIds
              : undefined,
          updates: calculatedUpdates,
        },
        selectedStore?.id ?? ""
      );

      setShowBulkUpdatePreview(false);
      setBulkUpdateConfig(null);
      fetchInventory(1);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update products"
      );
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Inventory
          </h1>
          <div className="mt-1">
            {totalCount !== undefined ? (
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold text-gray-900">
                  📦 Total Products: {totalCount}
                </p>
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} (Page {currentPage})
                  {searchTerm && ` - Filtered results`}
                </p>
              </div>
            ) : (
              <p className="text-gray-600">
                Manage your inventory items
                {items.length > 0 && (
                  <span className="ml-2 text-sm font-semibold text-blue-600">
                    ({items.length} {items.length === 1 ? "product" : "products"} shown)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3">
          <button
            onClick={() => {
              trackButton("Add Product", { location: "inventory_page" });
              track(events.PRODUCT_ADDED, { action: "modal_opened" });
              setShowAddProductModal(true);
            }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            Add Product
          </button>
          <button
            onClick={() => {
              trackButton("Upload Invoice", { location: "inventory_page" });
              setShowUploadBillModal(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            Upload Invoice
          </button>
          <button
            onClick={() => {
              trackButton("Upload File", { location: "inventory_page" });
              track(events.PRODUCT_UPLOADED, { action: "modal_opened" });
              setShowUploadModal(true);
            }}
            className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            Upload Excel/CSV
          </button>
          <button
            onClick={() => {
              trackButton("Bulk Update", { location: "inventory_page" });
              track(events.PRODUCT_BULK_UPDATED, { action: "modal_opened" });
              setShowBulkUpdateModal(true);
            }}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            Bulk Update
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search inventory (name, category, brand, subcategory, barcode)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[40px]">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as typeof sortBy);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
              >
                <option value="name">Name</option>
                <option value="mrp">MRP</option>
                <option value="costPrice">Cost Price</option>
                <option value="sellingPrice">Selling Price</option>
                <option value="quantity">Quantity</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[40px]">
                Order:
              </label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as typeof sortOrder);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[40px]">
                From:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[40px]">
                To:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                }}
                min={startDate || undefined}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap sm:w-auto w-full"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        {selectedItems.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setShowBarcodeModal(true)}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              Generate Barcodes ({selectedItems.length})
            </button>
            <button
              onClick={() => setShowQRCodeModal(true)}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              Generate QR Codes ({selectedItems.length})
            </button>
            <button
              onClick={handleDownloadBarcode}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              Print Barcodes
            </button>
            <button
              onClick={handleDownloadQRCode}
              className="px-5 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              Print QR Codes
            </button>
            <button
              onClick={handleDeleteMultiple}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              Delete ({selectedItems.length})
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      ) : (
        <>
          <ProductList
            items={sortedItems}
            selectedItems={selectedItems}
            editingItem={editingItem}
            openMenuId={openMenuId}
            menuPosition={menuPosition}
            onToggleSelect={(itemId) => {
              if (selectedItems.includes(itemId)) {
                setSelectedItems(selectedItems.filter((id) => id !== itemId));
              } else {
                setSelectedItems([...selectedItems, itemId]);
              }
            }}
            onSelectAll={() => setSelectedItems(items.map((i) => i.id))}
            onDeselectAll={() => setSelectedItems([])}
            onEdit={(item) => {
              setItemToEdit(item);
              setShowEditProductModal(true);
            }}
            onUpdateItem={handleUpdateItem}
            onSetEditingItem={setEditingItem}
            onOpenMenu={(itemId, position) => {
              setMenuPosition(position);
              setOpenMenuId(openMenuId === itemId ? null : itemId);
            }}
            onCloseMenu={() => setOpenMenuId(null)}
            onGenerateBarcode={handleGenerateBarcodeForItem}
            onGenerateQRCode={handleGenerateQRCodeForItem}
            onScanBarcode={(itemId) => {
              setScanningFor({ itemId, type: "barcode" });
              setShowCameraScanner(true);
            }}
            onScanQRCode={(itemId) => {
              setScanningFor({ itemId, type: "qr" });
              setShowCameraScanner(true);
            }}
            onViewBarcode={(item) => {
              setDisplayItem(item);
              setShowDisplayBarcodeModal(true);
            }}
            onViewQRCode={(item) => {
              setDisplayItem(item);
              setShowDisplayQRCodeModal(true);
            }}
            onView={(item) => {
              setItemToView(item);
              setShowViewProductModal(true);
            }}
            onDelete={handleDeleteProduct}
          />

          {/* Pagination Controls - Always show if there are items */}
          {items.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-600 font-medium">
                  Page {currentPage}
                  {hasMore && ` (${itemsPerPage} more products available)`}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={!hasMore || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Next →
                </button>
              </div>
              <div className="flex items-center gap-2">
                {loading && (
                  <span className="text-sm text-gray-500">Loading...</span>
                )}
                {totalCount !== undefined && !loading && (
                  <span className="text-xs text-gray-500">
                    {itemsPerPage} items per page
                  </span>
                )}
              </div>
            </div>
          )}

          <CategoryWiseSummary
            storeId={selectedStore?.id ?? ""}
            startDate={startDate}
            endDate={endDate}
          />
        </>
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
        />
      )}

      {showUploadBillModal && (
        <UploadBillModal
          onClose={() => {
            setShowUploadBillModal(false);
            // Refresh inventory after bill upload
            if (selectedStore?.id) {
              setTimeout(() => {
                setItems([]);
                setPageHistory([]);
                setCurrentPage(1);
                fetchInventory(1);
              }, 5000); // Wait 5 seconds for OCR processing
            }
          }}
          onSuccess={() => {
            setSuccessMessage("Invoice uploaded successfully! Processing...");
            setShowUploadBillModal(false);
            // Dispatch event to notify that a bill was uploaded
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("billUploaded", { 
                detail: { source: "inventoryPage" } 
              }));
            }
            // Refresh inventory after a delay
            if (selectedStore?.id) {
              setTimeout(() => {
                setItems([]);
                setPageHistory([]);
                setCurrentPage(1);
                fetchInventory(1);
              }, 5000); // Wait 5 seconds for OCR processing
            }
          }}
        />
      )}

      {showBarcodeModal && (
        <BarcodeModal
          onClose={() => setShowBarcodeModal(false)}
          onGenerate={handleGenerateBarcodes}
          itemCount={selectedItems.length}
        />
      )}

      {showAddProductModal && (
        <AddProductModal
          onClose={() => setShowAddProductModal(false)}
          onAdd={async (productData) => {
            try {
              await inventoryService.createProduct(productData);
              setShowAddProductModal(false);
              fetchInventory(1);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to add product"
              );
            }
          }}
        />
      )}

      {showEditProductModal && itemToEdit && (
        <EditProductModal
          item={itemToEdit}
          onClose={() => {
            setShowEditProductModal(false);
            setItemToEdit(null);
          }}
          onUpdate={async (productData) => {
            try {
              await handleUpdateItem(itemToEdit, productData);
              setShowEditProductModal(false);
              setItemToEdit(null);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to update product"
              );
            }
          }}
        />
      )}

      {showViewProductModal && itemToView && (
        <ViewProductModal
          item={itemToView}
          onClose={() => {
            setShowViewProductModal(false);
            setItemToView(null);
          }}
        />
      )}

      {showDisplayBarcodeModal && displayItem && (
        <DisplayBarcodeModal
          item={displayItem}
          onClose={() => {
            setShowDisplayBarcodeModal(false);
            setDisplayItem(null);
          }}
        />
      )}

      {showDisplayQRCodeModal && displayItem && (
        <DisplayQRCodeModal
          item={displayItem}
          onClose={() => {
            setShowDisplayQRCodeModal(false);
            setDisplayItem(null);
          }}
        />
      )}

      {showCameraScanner && scanningFor && (
        <CameraScannerModal
          onClose={() => {
            setShowCameraScanner(false);
            setScanningFor(null);
          }}
          onScan={(code) => {
            if (scanningFor.type === "barcode") {
              handleMapBarcode(scanningFor.itemId, code);
            } else {
              handleMapQRCode(scanningFor.itemId, code);
            }
          }}
          type={scanningFor.type}
        />
      )}

      {showQRCodeModal && (
        <QRCodeModal
          onClose={() => setShowQRCodeModal(false)}
          onGenerate={handleGenerateQRCodes}
          itemCount={selectedItems.length}
        />
      )}

      {showDeleteConfirmModal && (
        <ConfirmDeleteModal
          onClose={() => {
            if (!isDeleting) {
              setShowDeleteConfirmModal(false);
              setProductIdToDelete(null);
            }
          }}
          onConfirm={() => {
            if (deleteType === "single" && productIdToDelete) {
              confirmDeleteProduct(productIdToDelete);
            } else if (deleteType === "bulk") {
              confirmDeleteMultiple();
            }
          }}
          itemCount={deleteType === "single" ? 1 : selectedItems.length}
          isDeleting={isDeleting}
        />
      )}

      {showPrintQuantityModal && (
        <PrintQuantityModal
          isOpen={showPrintQuantityModal}
          onClose={() => {
            setShowPrintQuantityModal(false);
            setPrintItemIds([]);
          }}
          onConfirm={(quantity, rows, columns) => {
            // Close modal first
            setShowPrintQuantityModal(false);
            setPrintItemIds([]);
            // Clear any existing error
            setError("");
            // Show success toast after modal closes - use setTimeout to ensure modal is closed first
            setTimeout(() => {
              const message =
                printType === "barcode"
                  ? "Generating barcode PDF... Please wait."
                  : "Generating QR code PDF... Please wait.";
              setSuccessMessage(message);
              // Start the print operation
              if (printType === "barcode") {
                performBarcodePrint(quantity, rows, columns);
              } else {
                performQRCodePrint(quantity, rows, columns);
              }
            }, 100);
          }}
          type={printType}
          itemCount={printItemIds.length > 0 ? printItemIds.length : 1}
        />
      )}

      {showBulkUpdateModal && (
        <BulkUpdateModal
          onClose={() => setShowBulkUpdateModal(false)}
          onPreview={handleBulkUpdatePreview}
        />
      )}

      {showBulkUpdatePreview && bulkUpdateConfig && (
        <BulkUpdatePreviewModal
          updateConfig={bulkUpdateConfig}
          onClose={() => {
            setShowBulkUpdatePreview(false);
            setBulkUpdateConfig(null);
          }}
          onConfirm={handleBulkUpdateConfirm}
        />
      )}

      <Snackbar
        message={error}
        type="error"
        isOpen={!!error}
        onClose={() => setError("")}
        duration={6000}
      />
      <Toast
        message={successMessage}
        type="success"
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage("")}
        duration={4000}
      />
    </div>
  );
}
