/**
 * This file contains the BulkUpdatePreviewModal component which shows a preview
 * of products that will be affected by a bulk update operation before applying changes.
 */

"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { inventoryService, Product } from "@/services/inventory.service";
import { calculateBulkUpdateFields } from "@/utils/bulkUpdateCalculations";

interface BulkUpdatePreviewModalProps {
  updateConfig: {
    categoryIds: string[];
    field:
      | "mrp"
      | "marginPercentage"
      | "purchaseMarginPercentage"
      | "taxPercentage";
    changeType: "increase" | "decrease" | "set";
    value: number;
  };
  onClose: () => void;
  onConfirm: (
    affectedProducts: Product[],
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
  ) => void;
}

/**
 * Calculates the new value based on the current value, change type, and value.
 * @param currentValue - The current value of the field
 * @param changeType - The type of change (increase, decrease, or set)
 * @param value - The value to apply
 * @returns The new calculated value
 */
function calculateNewValue(
  currentValue: number | null | undefined,
  changeType: "increase" | "decrease" | "set",
  value: number
): number | null {
  if (currentValue === undefined || currentValue === null) {
    return changeType === "set" ? value : null;
  }

  switch (changeType) {
    case "increase":
      return currentValue * (1 + value / 100);
    case "decrease":
      return currentValue * (1 - value / 100);
    case "set":
      return value;
    default:
      return currentValue;
  }
}

/**
 * Gets the field label for display.
 * @param field - The field name
 * @returns The display label
 */
function getFieldLabel(
  field:
    | "mrp"
    | "marginPercentage"
    | "purchaseMarginPercentage"
    | "taxPercentage"
): string {
  switch (field) {
    case "mrp":
      return "MRP (incl GST)";
    case "marginPercentage":
      return "Selling Discount %";
    case "purchaseMarginPercentage":
      return "Buying Discount %";
    case "taxPercentage":
      return "GST %";
    default:
      return field;
  }
}

/**
 * Gets the current value of a field from a product.
 * @param product - The product
 * @param field - The field name
 * @returns The current value
 */
function getCurrentValue(
  product: Product,
  field:
    | "mrp"
    | "marginPercentage"
    | "purchaseMarginPercentage"
    | "taxPercentage"
): number | null | undefined {
  switch (field) {
    case "mrp":
      return product.mrp ?? null;
    case "marginPercentage":
      return product.marginPercentage ?? null;
    case "purchaseMarginPercentage":
      return product.purchaseMarginPercentage ?? null;
    case "taxPercentage":
      return product.taxPercentage ?? null;
    default:
      return null;
  }
}

/**
 * BulkUpdatePreviewModal displays a preview of products that will be affected
 * by the bulk update, showing current and new values before applying changes.
 */
export default function BulkUpdatePreviewModal({
  updateConfig,
  onClose,
  onConfirm,
}: BulkUpdatePreviewModalProps) {
  const { selectedStore } = useStore();
  const { trackButton, track, events } = useAnalytics(
    "Bulk Update Preview Modal",
    false
  );
  const [affectedProducts, setAffectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchAffectedProducts = async () => {
      if (!selectedStore?.id) {
        setError("No store selected");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Fetch categories if category IDs are provided
        if (updateConfig.categoryIds.length > 0) {
          const cats = await inventoryService.getCategories(selectedStore.id);
          setCategories(cats);
        } else {
          setCategories([]);
        }

        // Fetch all products by fetching all pages using cursor-based pagination
        const allProducts: Product[] = [];
        let lastKey: string | undefined = undefined;
        let hasMore = true;

        while (hasMore) {
          const response = await inventoryService.getInventory({
            lastKey,
            limit: 100, // Fetch 100 at a time
            storeId: selectedStore.id,
          });

          if (response.data && response.data.length > 0) {
            allProducts.push(...response.data);

            // Check if there are more pages
            if (response.pagination) {
              hasMore = response.pagination.hasMore;
              lastKey = response.pagination.lastKey || undefined;
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }

        // Filter products based on selected categories
        let filteredProducts = allProducts;
        if (updateConfig.categoryIds.length > 0) {
          filteredProducts = allProducts.filter(
            (product) =>
              product.categoryId &&
              updateConfig.categoryIds.includes(product.categoryId)
          );
        }

        // Filter products that have the field or will be set
        const productsWithField = filteredProducts.filter((product) => {
          const currentValue = getCurrentValue(product, updateConfig.field);
          // Include if field exists or if we're setting a value
          return (
            currentValue !== undefined || updateConfig.changeType === "set"
          );
        });

        setAffectedProducts(productsWithField);
        setCurrentPage(1); // Reset to first page when products change
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch products for preview"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAffectedProducts();
  }, [updateConfig, selectedStore?.id]);

  /**
   * Handles the confirmation and triggers the update.
   * Calculates all values for each product and passes them to the backend.
   */
  const handleConfirm = () => {
    if (affectedProducts.length === 0) {
      setError("No products to update");
      return;
    }

    // Calculate all values for each product (same as shown in preview)
    const calculatedUpdates = affectedProducts.map((product) => {
      const currentValue = getCurrentValue(product, updateConfig.field);
      const newValue = calculateNewValue(
        currentValue,
        updateConfig.changeType,
        updateConfig.value
      );

      // Calculate all fields with the new value (same logic as preview)
      const calculatedFields = calculateBulkUpdateFields(
        product,
        updateConfig.field,
        newValue ?? 0
      );

      // Prepare updates object with all calculated values
      // Always include all fields (even if undefined) so backend knows to skip recalculation
      const updates: {
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
      } = {
        // Always include all fields from calculated values
        mrp: calculatedFields.mrp,
        costPrice: calculatedFields.costPrice,
        costPriceBase: calculatedFields.costPriceBase,
        costGST: calculatedFields.costGST,
        sellingPrice: calculatedFields.sellingPrice,
        sellingPriceBase: calculatedFields.sellingPriceBase,
        sellingGST: calculatedFields.sellingGST,
        marginPercentage: calculatedFields.marginPercentage,
        purchaseMarginPercentage: calculatedFields.purchaseMarginPercentage,
        taxPercentage: calculatedFields.taxPercentage,
      };

      return {
        productId: product.id,
        updates,
      };
    });

    trackButton("Confirm Bulk Update", {
      location: "bulk_update_preview_modal",
      product_count: affectedProducts.length,
      field: updateConfig.field,
      change_type: updateConfig.changeType,
    });
    track(events.PRODUCT_BULK_UPDATED, {
      product_count: affectedProducts.length,
      field: updateConfig.field,
      change_type: updateConfig.changeType,
      action: "confirmed",
    });
    onConfirm(affectedProducts, calculatedUpdates);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Preview Bulk Update
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {affectedProducts.length} product
              {affectedProducts.length !== 1 ? "s" : ""} will be affected
            </p>
          </div>
          <button
            onClick={() => {
              trackButton("Close", {
                location: "bulk_update_preview_modal_header",
              });
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : affectedProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No products match the selected criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Update Summary:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-blue-800">
                  <div>
                    <strong>Total Items:</strong> {affectedProducts.length}
                  </div>
                  <div>
                    <strong>Field:</strong> {getFieldLabel(updateConfig.field)}
                  </div>
                  <div>
                    <strong>Change Type:</strong>{" "}
                    {updateConfig.changeType === "increase"
                      ? "Increase"
                      : updateConfig.changeType === "decrease"
                      ? "Decrease"
                      : "Set Direct"}
                  </div>
                  <div>
                    <strong>Value:</strong> {updateConfig.value}
                    {updateConfig.changeType !== "set" ? "%" : ""}
                  </div>
                </div>
                {updateConfig.categoryIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <strong className="text-sm text-blue-900">
                      Selected Categories:
                    </strong>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {updateConfig.categoryIds.map((categoryId) => {
                        const category = categories.find(
                          (cat) => cat.id === categoryId
                        );
                        return (
                          <span
                            key={categoryId}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                          >
                            {category?.name || categoryId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                        Product
                      </th>
                      {/* Left Group Headers */}
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider bg-blue-50 border-l-2 border-blue-300">
                        Field
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                        Old
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider bg-blue-50 border-r-2 border-blue-300">
                        New
                      </th>
                      {/* Spacer */}
                      <th className="px-2 bg-gray-100"></th>
                      {/* Right Group Headers */}
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider bg-green-50 border-l-2 border-green-300">
                        Field
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                        Old
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider bg-green-50 border-r-2 border-green-300">
                        New
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {(() => {
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedProducts = affectedProducts.slice(
                        startIndex,
                        endIndex
                      );

                      return paginatedProducts.map((product) => {
                        const currentValue = getCurrentValue(
                          product,
                          updateConfig.field
                        );
                        const newValue = calculateNewValue(
                          currentValue,
                          updateConfig.changeType,
                          updateConfig.value
                        );

                        // Calculate all fields with the new value
                        // If newValue is null, use 0 as fallback (shouldn't happen in practice)
                        const calculatedFields = calculateBulkUpdateFields(
                          product,
                          updateConfig.field,
                          newValue ?? 0
                        );

                        // Define fields in two groups: Left (Cost-related) and Right (Selling-related)
                        const leftGroupFields: Array<{
                          label: string;
                          oldValue: number | null | undefined;
                          newValue: number | null | undefined;
                          format: "currency" | "percentage";
                        }> = [
                          {
                            label: "MRP",
                            oldValue: product.mrp,
                            newValue: calculatedFields.mrp,
                            format: "currency",
                          },
                          {
                            label: "Buy Disc %",
                            oldValue: product.purchaseMarginPercentage,
                            newValue: calculatedFields.purchaseMarginPercentage,
                            format: "percentage",
                          },
                          {
                            label: "Cost Price",
                            oldValue: product.costPrice,
                            newValue: calculatedFields.costPrice,
                            format: "currency",
                          },
                          {
                            label: "Cost Base",
                            oldValue: product.costPriceBase,
                            newValue: calculatedFields.costPriceBase,
                            format: "currency",
                          },
                          {
                            label: "Cost GST",
                            oldValue: product.costGST,
                            newValue: calculatedFields.costGST,
                            format: "currency",
                          },
                        ];

                        const rightGroupFields: Array<{
                          label: string;
                          oldValue: number | null | undefined;
                          newValue: number | null | undefined;
                          format: "currency" | "percentage";
                        }> = [
                          {
                            label: "GST %",
                            oldValue: product.taxPercentage,
                            newValue: calculatedFields.taxPercentage,
                            format: "percentage",
                          },
                          {
                            label: "Sell Disc %",
                            oldValue: product.marginPercentage,
                            newValue: calculatedFields.marginPercentage,
                            format: "percentage",
                          },
                          {
                            label: "Sell Price",
                            oldValue: product.sellingPrice,
                            newValue: calculatedFields.sellingPrice,
                            format: "currency",
                          },
                          {
                            label: "Sell Base",
                            oldValue: product.sellingPriceBase,
                            newValue: calculatedFields.sellingPriceBase,
                            format: "currency",
                          },
                          {
                            label: "Sell GST",
                            oldValue: product.sellingGST,
                            newValue: calculatedFields.sellingGST,
                            format: "currency",
                          },
                        ];

                        // Pair fields from both groups
                        const maxRows = Math.max(
                          leftGroupFields.length,
                          rightGroupFields.length
                        );
                        const fieldPairs: Array<
                          [
                            (typeof leftGroupFields)[0] | null,
                            (typeof rightGroupFields)[0] | null
                          ]
                        > = [];
                        for (let i = 0; i < maxRows; i++) {
                          fieldPairs.push([
                            leftGroupFields[i] || null,
                            rightGroupFields[i] || null,
                          ]);
                        }

                        return fieldPairs.map(
                          ([leftField, rightField], pairIndex) => {
                            const hasChangedLeft =
                              leftField &&
                              leftField.oldValue !== leftField.newValue &&
                              leftField.oldValue !== undefined &&
                              leftField.newValue !== undefined;
                            const hasChangedRight =
                              rightField &&
                              rightField.oldValue !== rightField.newValue &&
                              rightField.oldValue !== undefined &&
                              rightField.newValue !== undefined;
                            const isLastRow =
                              pairIndex === fieldPairs.length - 1;

                            return (
                              <tr
                                key={`${product.id}-${pairIndex}`}
                                className={`hover:bg-gray-50 ${
                                  hasChangedLeft || hasChangedRight
                                    ? "bg-yellow-50"
                                    : ""
                                } ${
                                  isLastRow ? "border-b-2 border-gray-400" : ""
                                }`}
                              >
                                {pairIndex === 0 && (
                                  <td
                                    rowSpan={fieldPairs.length}
                                    className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200 max-w-[180px] truncate"
                                    title={product.name}
                                  >
                                    {product.name}
                                  </td>
                                )}
                                {/* Left Group (Cost-related) */}
                                {leftField ? (
                                  <>
                                    <td className="px-3 py-1 text-gray-700 font-medium bg-blue-50/30 border-l-2 border-blue-300">
                                      {leftField.label}
                                    </td>
                                    <td className="px-3 py-1 text-right text-gray-500 bg-blue-50/30">
                                      {leftField.oldValue !== undefined &&
                                      leftField.oldValue !== null
                                        ? leftField.format === "currency"
                                          ? `₹${leftField.oldValue.toFixed(2)}`
                                          : `${leftField.oldValue.toFixed(2)}%`
                                        : "-"}
                                    </td>
                                    <td
                                      className={`px-3 py-1 text-right font-medium bg-blue-50/30 border-r-2 border-blue-300 ${
                                        hasChangedLeft
                                          ? "text-indigo-600 font-bold"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      {leftField.newValue !== undefined &&
                                      leftField.newValue !== null
                                        ? leftField.format === "currency"
                                          ? `₹${leftField.newValue.toFixed(2)}`
                                          : `${leftField.newValue.toFixed(2)}%`
                                        : "-"}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-3 py-1 bg-blue-50/30 border-l-2 border-blue-300"></td>
                                    <td className="px-3 py-1 bg-blue-50/30"></td>
                                    <td className="px-3 py-1 bg-blue-50/30 border-r-2 border-blue-300"></td>
                                  </>
                                )}
                                {/* Spacer between groups */}
                                <td className="px-2 bg-gray-100"></td>
                                {/* Right Group (Selling-related) */}
                                {rightField ? (
                                  <>
                                    <td className="px-3 py-1 text-gray-700 font-medium bg-green-50/30 border-l-2 border-green-300">
                                      {rightField.label}
                                    </td>
                                    <td className="px-3 py-1 text-right text-gray-500 bg-green-50/30">
                                      {rightField.oldValue !== undefined &&
                                      rightField.oldValue !== null
                                        ? rightField.format === "currency"
                                          ? `₹${rightField.oldValue.toFixed(2)}`
                                          : `${rightField.oldValue.toFixed(2)}%`
                                        : "-"}
                                    </td>
                                    <td
                                      className={`px-3 py-1 text-right font-medium bg-green-50/30 border-r-2 border-green-300 ${
                                        hasChangedRight
                                          ? "text-indigo-600 font-bold"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      {rightField.newValue !== undefined &&
                                      rightField.newValue !== null
                                        ? rightField.format === "currency"
                                          ? `₹${rightField.newValue.toFixed(2)}`
                                          : `${rightField.newValue.toFixed(2)}%`
                                        : "-"}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-3 py-1 bg-green-50/30 border-l-2 border-green-300"></td>
                                    <td className="px-3 py-1 bg-green-50/30"></td>
                                    <td className="px-3 py-1 bg-green-50/30 border-r-2 border-green-300"></td>
                                  </>
                                )}
                              </tr>
                            );
                          }
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          {/* Pagination */}
          <div className="flex items-center gap-2">
            {(() => {
              const totalPages = Math.ceil(
                affectedProducts.length / itemsPerPage
              );

              if (totalPages <= 1) return null;

              const getPageNumbers = () => {
                const pages: (number | string)[] = [];
                const maxVisible = 5; // Show max 5 page numbers

                if (totalPages <= maxVisible) {
                  // Show all pages if total is less than max
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Always show first page
                  pages.push(1);

                  if (currentPage > 3) {
                    pages.push("...");
                  }

                  // Show pages around current page
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);

                  for (let i = start; i <= end; i++) {
                    if (i !== 1 && i !== totalPages) {
                      pages.push(i);
                    }
                  }

                  if (currentPage < totalPages - 2) {
                    pages.push("...");
                  }

                  // Always show last page
                  if (totalPages > 1) {
                    pages.push(totalPages);
                  }
                }

                return pages;
              };

              const pageNumbers = getPageNumbers();

              return (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  {pageNumbers.map((page, index) => {
                    if (page === "...") {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 py-1 text-sm text-gray-500"
                        >
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === page
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                  <span className="ml-2 text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => {
                trackButton("Cancel", {
                  location: "bulk_update_preview_modal_footer",
                });
                onClose();
              }}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={affectedProducts.length === 0}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            >
              Confirm Update ({affectedProducts.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
