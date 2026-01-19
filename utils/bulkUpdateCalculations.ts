/**
 * This file contains utility functions for calculating all product fields
 * when performing bulk updates. When one field changes, all related fields
 * are recalculated to maintain consistency.
 */

import type { Product } from "@/services/inventory.service";

/**
 * Interface for bulk update calculation result
 */
export interface BulkUpdateCalculatedFields {
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
}

/**
 * Rounds a number to 2 decimal places.
 * @param num - The number to round
 * @returns The rounded number
 */
function roundToTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Calculates all product fields when one field is changed during bulk update.
 * Uses the same logic as the backend calculatePrices function.
 * @param product - The current product
 * @param field - The field being changed
 * @param newValue - The new value for the field
 * @returns All calculated fields
 */
export function calculateBulkUpdateFields(
  product: Product,
  field:
    | "mrp"
    | "marginPercentage"
    | "purchaseMarginPercentage"
    | "taxPercentage",
  newValue: number
): BulkUpdateCalculatedFields {
  // Get current values
  const currentMrp = product.mrp ?? 0;
  const currentTaxPercentage = product.taxPercentage ?? 0;
  const currentMarginPercentage = product.marginPercentage ?? 0;
  const currentPurchaseMarginPercentage = product.purchaseMarginPercentage ?? 0;
  const currentCostPrice = product.costPrice ?? 0;
  const currentSellingPrice = product.sellingPrice ?? 0;

  // Apply the new value
  let mrp = currentMrp;
  let taxPercentage = currentTaxPercentage;
  let marginPercentage = currentMarginPercentage;
  let purchaseMarginPercentage = currentPurchaseMarginPercentage;

  switch (field) {
    case "mrp":
      mrp = roundToTwoDecimals(newValue);
      break;
    case "taxPercentage":
      taxPercentage = roundToTwoDecimals(newValue);
      break;
    case "marginPercentage":
      marginPercentage = roundToTwoDecimals(newValue);
      break;
    case "purchaseMarginPercentage":
      purchaseMarginPercentage = roundToTwoDecimals(newValue);
      break;
  }

  const taxRate = taxPercentage / 100;
  const currentCostPriceBase = product.costPriceBase ?? 0;
  const currentSellingPriceBase = product.sellingPriceBase ?? 0;

  // Initialize calculated values
  let costPrice = 0;
  let costPriceBase = 0;
  let costGST = 0;
  let sellingPrice = 0;
  let sellingPriceBase = 0;
  let sellingGST = 0;

  // Special handling for tax percentage change: keep base prices unchanged
  if (field === "taxPercentage") {
    // Keep base prices unchanged
    costPriceBase = currentCostPriceBase;
    sellingPriceBase = currentSellingPriceBase;

    // Recalculate GST and total prices with new tax rate
    if (costPriceBase > 0) {
      costGST = roundToTwoDecimals((costPriceBase * taxPercentage) / 100);
      costPrice = roundToTwoDecimals(costPriceBase + costGST);
    }

    if (sellingPriceBase > 0) {
      sellingGST = roundToTwoDecimals((sellingPriceBase * taxPercentage) / 100);
      sellingPrice = roundToTwoDecimals(sellingPriceBase + sellingGST);
    }

    // Recalculate margins if MRP is available
    if (mrp > 0 && costPrice > 0) {
      const calculatedPurchaseMargin = roundToTwoDecimals(
        (1 - costPrice / mrp) * 100
      );
      if (calculatedPurchaseMargin > 0 && calculatedPurchaseMargin < 100) {
        purchaseMarginPercentage = calculatedPurchaseMargin;
      }
    }

    if (mrp > 0 && sellingPrice > 0) {
      const calculatedMargin = roundToTwoDecimals(
        (1 - sellingPrice / mrp) * 100
      );
      if (calculatedMargin > 0 && calculatedMargin < 100) {
        marginPercentage = calculatedMargin;
      }
    }
  } else {
    // For other field changes (MRP, margins), calculate from MRP
    // Calculate cost price from MRP and purchase margin
    if (
      mrp > 0 &&
      purchaseMarginPercentage > 0 &&
      purchaseMarginPercentage < 100
    ) {
      // Cost Price = MRP * (1 - purchaseMarginPercentage/100)
      costPrice = roundToTwoDecimals(
        mrp * (1 - purchaseMarginPercentage / 100)
      );
      if (taxRate > 0) {
        costPriceBase = roundToTwoDecimals(costPrice / (1 + taxRate));
        costGST = roundToTwoDecimals(costPrice - costPriceBase);
      } else {
        costPriceBase = costPrice;
        costGST = 0;
      }
    } else if (currentCostPrice > 0) {
      // Use existing cost price if available
      costPrice = currentCostPrice;
      if (taxRate > 0) {
        costPriceBase = roundToTwoDecimals(costPrice / (1 + taxRate));
        costGST = roundToTwoDecimals(costPrice - costPriceBase);
      } else {
        costPriceBase = costPrice;
        costGST = 0;
      }
    }

    // Calculate selling price from MRP and margin
    if (mrp > 0 && marginPercentage > 0 && marginPercentage < 100) {
      // Selling Price = MRP * (1 - marginPercentage/100)
      sellingPrice = roundToTwoDecimals(mrp * (1 - marginPercentage / 100));
      if (taxRate > 0) {
        sellingPriceBase = roundToTwoDecimals(sellingPrice / (1 + taxRate));
        sellingGST = roundToTwoDecimals(sellingPrice - sellingPriceBase);
      } else {
        sellingPriceBase = sellingPrice;
        sellingGST = 0;
      }
    } else if (mrp > 0) {
      // If no margin, selling price = MRP
      sellingPrice = mrp;
      if (taxRate > 0) {
        sellingPriceBase = roundToTwoDecimals(sellingPrice / (1 + taxRate));
        sellingGST = roundToTwoDecimals(sellingPrice - sellingPriceBase);
      } else {
        sellingPriceBase = sellingPrice;
        sellingGST = 0;
      }
    } else if (currentSellingPrice > 0) {
      // Use existing selling price if available
      sellingPrice = currentSellingPrice;
      if (taxRate > 0) {
        sellingPriceBase = roundToTwoDecimals(sellingPrice / (1 + taxRate));
        sellingGST = roundToTwoDecimals(sellingPrice - sellingPriceBase);
      } else {
        sellingPriceBase = sellingPrice;
        sellingGST = 0;
      }
    }
  }

  // Recalculate margins if MRP and prices are available (only for non-tax changes)
  if (field !== "taxPercentage") {
    if (mrp > 0 && costPrice > 0 && purchaseMarginPercentage === 0) {
      const calculatedPurchaseMargin = roundToTwoDecimals(
        (1 - costPrice / mrp) * 100
      );
      if (calculatedPurchaseMargin > 0 && calculatedPurchaseMargin < 100) {
        purchaseMarginPercentage = calculatedPurchaseMargin;
      }
    }

    if (mrp > 0 && sellingPrice > 0 && marginPercentage === 0) {
      const calculatedMargin = roundToTwoDecimals(
        (1 - sellingPrice / mrp) * 100
      );
      if (calculatedMargin > 0 && calculatedMargin < 100) {
        marginPercentage = calculatedMargin;
      }
    }
  }

  return {
    mrp: mrp > 0 ? mrp : undefined,
    costPrice: costPrice > 0 ? costPrice : undefined,
    costPriceBase: costPriceBase > 0 ? costPriceBase : undefined,
    costGST: costGST > 0 ? costGST : undefined,
    sellingPrice: sellingPrice > 0 ? sellingPrice : undefined,
    sellingPriceBase: sellingPriceBase > 0 ? sellingPriceBase : undefined,
    sellingGST: sellingGST > 0 ? sellingGST : undefined,
    marginPercentage: marginPercentage > 0 ? marginPercentage : undefined,
    purchaseMarginPercentage:
      purchaseMarginPercentage > 0 ? purchaseMarginPercentage : undefined,
    taxPercentage: taxPercentage > 0 ? taxPercentage : undefined,
  };
}
