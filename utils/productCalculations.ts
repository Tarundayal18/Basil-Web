/**
 * Utility functions for calculating derived product fields
 * CRITICAL: Most calculations are now done in backend for accuracy and GST compliance
 * Frontend only does minimal calculations for products not in inventory during billing
 */

import { inventoryService } from "@/services/inventory.service";

export interface FormDataWithPrices {
  taxPercentage: string;
  mrp?: string;
  costPrice: string;
  costPriceBase: string;
  costGST: string;
  sellingPrice: string;
  sellingPriceBase: string;
  sellingGST: string;
  marginPercentage: string;
  purchaseMarginPercentage: string;
}

/**
 * Calculates prices based on MRP and margins.
 * Formula: Selling Price = MRP * (1 - marginPercentage/100)
 * Formula: Cost Price = MRP * (1 - purchaseMarginPercentage/100)
 * @param mrp - Maximum Retail Price
 * @param marginPercentage - Margin percentage for selling price
 * @param purchaseMarginPercentage - Purchase margin percentage for cost price
 * @param taxPercentage - GST percentage
 * @returns Calculated prices
 */
export function calculatePricesFromMRP(
  mrp: number,
  marginPercentage: number,
  purchaseMarginPercentage: number,
  taxPercentage: number
) {
  const taxRate = taxPercentage / 100;
  const marginRate = marginPercentage / 100;
  const purchaseMarginRate = purchaseMarginPercentage / 100;

  // Calculate selling price from MRP
  const sellingPrice = mrp * (1 - marginRate);
  const sellingPriceBase = sellingPrice / (1 + taxRate);
  const sellingGST = sellingPrice - sellingPriceBase;

  // Calculate cost price from MRP
  const costPrice = mrp * (1 - purchaseMarginRate);
  const costPriceBase = costPrice / (1 + taxRate);
  const costGST = costPrice - costPriceBase;

  return {
    costPrice: costPrice.toFixed(2),
    costPriceBase: costPriceBase.toFixed(2),
    costGST: costGST.toFixed(2),
    sellingPrice: sellingPrice.toFixed(2),
    sellingPriceBase: sellingPriceBase.toFixed(2),
    sellingGST: sellingGST.toFixed(2),
  };
}

/**
 * Calculates MRP from cost price using purchase margin.
 * Formula: MRP = Cost Price / (1 - purchaseMarginPercentage/100)
 * @param costPrice - Cost price
 * @param purchaseMarginPercentage - Purchase margin percentage
 * @returns Calculated MRP as string
 */
export function calculateMRPFromCostPrice(
  costPrice: number,
  purchaseMarginPercentage: number
): string {
  const purchaseMarginRate = purchaseMarginPercentage / 100;
  if (purchaseMarginRate >= 1) {
    return costPrice.toFixed(2); // Fallback if invalid margin
  }
  const mrp = costPrice / (1 - purchaseMarginRate);
  return mrp.toFixed(2);
}

/**
 * Calculates derived fields when form fields change.
 * CRITICAL: Now uses backend for accurate GST-compliant calculations
 * 
 * @param field - The field that changed
 * @param value - The new value
 * @param currentData - Current form data
 * @param defaultTaxPercentage - Default tax percentage
 * @param editCostPriceAsBase - Whether cost price is being edited as base
 * @returns Updates to apply to form data
 */
export async function calculateDerivedFields(
  field: string,
  value: string,
  currentData: FormDataWithPrices,
  defaultTaxPercentage: number = 0,
  editCostPriceAsBase: boolean = false,
  editSellingPriceAsBase: boolean = false
): Promise<Partial<FormDataWithPrices>> {
  const taxPercentage =
    parseFloat(currentData.taxPercentage) || defaultTaxPercentage || 0;
  const taxRate = taxPercentage / 100;

  const updates: Partial<FormDataWithPrices> = {};

  // Calculate cost fields when costPrice (incl) changes
  if (field === "costPrice" && value) {
    const costPrice = parseFloat(value);
    if (!isNaN(costPrice)) {
      if (taxRate > 0) {
        const costBase = costPrice / (1 + taxRate);
        const costGST = costPrice - costBase;
        updates.costPriceBase = costBase.toFixed(2);
        updates.costGST = costGST.toFixed(2);
      } else {
        // No tax, so base price equals cost price
        updates.costPriceBase = costPrice.toFixed(2);
        updates.costGST = "0.00";
      }

      // If MRP exists, calculate cost margin percentage (purchaseMarginPercentage)
      const mrpValue = currentData.mrp;
      if (mrpValue && mrpValue.trim() !== "") {
        const mrp = parseFloat(mrpValue);
        if (!isNaN(mrp) && mrp > 0 && costPrice > 0) {
          // Cost Margin = (1 - Cost Price / MRP) * 100
          const calculatedCostMargin = (1 - costPrice / mrp) * 100;
          // Always calculate and update the margin
          updates.purchaseMarginPercentage = calculatedCostMargin.toFixed(2);
        }
      }
    }
  }
  // Calculate cost fields when costPriceBase changes
  else if (field === "costPriceBase" && value && taxRate > 0) {
    const costBase = parseFloat(value);
    if (!isNaN(costBase)) {
      const costPrice = costBase * (1 + taxRate);
      const costGST = costPrice - costBase;
      updates.costPrice = costPrice.toFixed(2);
      updates.costGST = costGST.toFixed(2);
    }
  }
  // Calculate selling fields when sellingPrice (incl) changes
  else if (field === "sellingPrice" && value) {
    const sellingPrice = parseFloat(value);
    if (!isNaN(sellingPrice)) {
      if (taxRate > 0) {
        const sellingBase = sellingPrice / (1 + taxRate);
        const sellingGST = sellingPrice - sellingBase;
        updates.sellingPriceBase = sellingBase.toFixed(2);
        updates.sellingGST = sellingGST.toFixed(2);
      } else {
        // No tax, so base price equals selling price
        updates.sellingPriceBase = sellingPrice.toFixed(2);
        updates.sellingGST = "0.00";
      }

      // If MRP exists, calculate selling margin percentage
      const mrpValue = currentData.mrp;
      if (mrpValue && mrpValue.trim() !== "") {
        const mrp = parseFloat(mrpValue);
        if (!isNaN(mrp) && mrp > 0 && sellingPrice > 0) {
          // Selling Margin = (1 - Selling Price / MRP) * 100
          const calculatedSellingMargin = (1 - sellingPrice / mrp) * 100;
          // Always calculate and update the margin
          updates.marginPercentage = calculatedSellingMargin.toFixed(2);
        }
      }
    }
  }
  // Calculate selling fields when sellingPriceBase changes
  else if (field === "sellingPriceBase" && value) {
    const sellingBase = parseFloat(value);
    if (!isNaN(sellingBase)) {
      if (taxRate > 0) {
        const sellingPrice = sellingBase * (1 + taxRate);
        const sellingGST = sellingPrice - sellingBase;
        updates.sellingPrice = sellingPrice.toFixed(2);
        updates.sellingGST = sellingGST.toFixed(2);
      } else {
        updates.sellingPrice = sellingBase.toFixed(2);
        updates.sellingGST = "0.00";
      }
    }
  }
  // Calculate from MRP and margins - when MRP changes, recalculate CP and SP
  else if (field === "mrp" && value) {
    const raw = String(value ?? "");
    const cleaned = raw
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*)\./g, "$1");
    
    // Allow typing "10." without recalculation
    if (cleaned.endsWith(".")) {
      return {};
    }

    const mrp = parseFloat(cleaned);
    const marginPercentage = parseFloat(currentData.marginPercentage) || 0;
    const purchaseMarginPercentage =
      parseFloat(currentData.purchaseMarginPercentage) || 0;
    if (!isNaN(mrp) && mrp > 0) {
      // If margins are blank (0), cost and selling prices should equal MRP
      if (purchaseMarginPercentage === 0 && marginPercentage === 0) {
        // Both margins are 0/blank - prices should equal MRP
        if (editCostPriceAsBase) {
          updates.costPriceBase = mrp.toFixed(2);
          if (taxRate > 0) {
            const costPrice = mrp * (1 + taxRate);
            const costGST = costPrice - mrp;
            updates.costPrice = costPrice.toFixed(2);
            updates.costGST = costGST.toFixed(2);
          } else {
            updates.costPrice = mrp.toFixed(2);
            updates.costGST = "0.00";
          }
        } else {
          updates.costPrice = mrp.toFixed(2);
          if (taxRate > 0) {
            const costPriceBase = mrp / (1 + taxRate);
            const costGST = mrp - costPriceBase;
            updates.costPriceBase = costPriceBase.toFixed(2);
            updates.costGST = costGST.toFixed(2);
          } else {
            updates.costPriceBase = mrp.toFixed(2);
            updates.costGST = "0.00";
          }
        }
        // Selling price also equals MRP when margin is 0
        if (editSellingPriceAsBase) {
          updates.sellingPriceBase = mrp.toFixed(2);
          if (taxRate > 0) {
            const sellingPrice = mrp * (1 + taxRate);
            const sellingGST = sellingPrice - mrp;
            updates.sellingPrice = sellingPrice.toFixed(2);
            updates.sellingGST = sellingGST.toFixed(2);
          } else {
            updates.sellingPrice = mrp.toFixed(2);
            updates.sellingGST = "0.00";
          }
        } else {
          updates.sellingPrice = mrp.toFixed(2);
          if (taxRate > 0) {
            const sellingPriceBase = mrp / (1 + taxRate);
            const sellingGST = mrp - sellingPriceBase;
            updates.sellingPriceBase = sellingPriceBase.toFixed(2);
            updates.sellingGST = sellingGST.toFixed(2);
          } else {
            updates.sellingPriceBase = mrp.toFixed(2);
            updates.sellingGST = "0.00";
          }
        }
      }
      // If margins exist, calculate from MRP using margins
      else if (purchaseMarginPercentage > 0) {
        if (editCostPriceAsBase) {
          // When in Base mode, calculate costPriceBase directly from MRP
          const purchaseMarginRate = purchaseMarginPercentage / 100;
          const costPriceBase = mrp * (1 - purchaseMarginRate);
          updates.costPriceBase = costPriceBase.toFixed(2);

          // Then calculate costPrice (incl GST) from the base
          if (taxRate > 0) {
            const costPrice = costPriceBase * (1 + taxRate);
            const costGST = costPrice - costPriceBase;
            updates.costPrice = costPrice.toFixed(2);
            updates.costGST = costGST.toFixed(2);
          } else {
            updates.costPrice = costPriceBase.toFixed(2);
            updates.costGST = "0.00";
          }
        } else {
          // Normal mode: calculate cost price from MRP using cost margin
          // CRITICAL FIX: This is now async, but we're in a sync fallback function
          // For fallback, use direct calculation
          const purchaseMarginRate = purchaseMarginPercentage / 100;
          const costPriceInclGST = mrp * (1 - purchaseMarginRate);
          const costPriceBase = taxRate > 0 ? costPriceInclGST / (1 + taxRate) : costPriceInclGST;
          const costGST = costPriceInclGST - costPriceBase;
          updates.costPrice = costPriceInclGST.toFixed(2);
          updates.costPriceBase = costPriceBase.toFixed(2);
          updates.costGST = costGST.toFixed(2);
        }
      } else {
        // If no purchase margin, cost price = MRP
        if (editCostPriceAsBase) {
          updates.costPriceBase = mrp.toFixed(2);
          if (taxRate > 0) {
            const costPrice = mrp * (1 + taxRate);
            const costGST = costPrice - mrp;
            updates.costPrice = costPrice.toFixed(2);
            updates.costGST = costGST.toFixed(2);
          } else {
            updates.costPrice = mrp.toFixed(2);
            updates.costGST = "0.00";
          }
        } else {
          updates.costPrice = mrp.toFixed(2);
          if (taxRate > 0) {
            const costPriceBase = mrp / (1 + taxRate);
            const costGST = mrp - costPriceBase;
            updates.costPriceBase = costPriceBase.toFixed(2);
            updates.costGST = costGST.toFixed(2);
          } else {
            updates.costPriceBase = mrp.toFixed(2);
            updates.costGST = "0.00";
          }
        }
      }
      
      if (marginPercentage > 0) {
        // Calculate selling price from MRP using selling margin
        // CRITICAL FIX: In fallback, use direct calculation (can't use async here)
        const marginRate = marginPercentage / 100;
        const sellingPriceInclGST = mrp * (1 - marginRate);
        const sellingPriceBase = taxRate > 0 ? sellingPriceInclGST / (1 + taxRate) : sellingPriceInclGST;
        const sellingGST = sellingPriceInclGST - sellingPriceBase;
        const calculated = {
          sellingPrice: sellingPriceInclGST.toFixed(2),
          sellingPriceBase: sellingPriceBase.toFixed(2),
          sellingGST: sellingGST.toFixed(2),
        };
        if (editSellingPriceAsBase) {
          updates.sellingPriceBase = calculated.sellingPriceBase;
          updates.sellingPrice = calculated.sellingPrice;
          updates.sellingGST = calculated.sellingGST;
        } else {
          updates.sellingPrice = calculated.sellingPrice;
          updates.sellingPriceBase = calculated.sellingPriceBase;
          updates.sellingGST = calculated.sellingGST;
        }
      } else {
        // If no selling margin, selling price = MRP
        if (editSellingPriceAsBase) {
          updates.sellingPriceBase = mrp.toFixed(2);
          if (taxRate > 0) {
            const sellingPrice = mrp * (1 + taxRate);
            const sellingGST = sellingPrice - mrp;
            updates.sellingPrice = sellingPrice.toFixed(2);
            updates.sellingGST = sellingGST.toFixed(2);
          } else {
            updates.sellingPrice = mrp.toFixed(2);
            updates.sellingGST = "0.00";
          }
        } else {
          updates.sellingPrice = mrp.toFixed(2);
          if (taxRate > 0) {
            const sellingPriceBase = mrp / (1 + taxRate);
            const sellingGST = mrp - sellingPriceBase;
            updates.sellingPriceBase = sellingPriceBase.toFixed(2);
            updates.sellingGST = sellingGST.toFixed(2);
          } else {
            updates.sellingPriceBase = mrp.toFixed(2);
            updates.sellingGST = "0.00";
          }
        }
      }
    }
  }
  // Calculate from purchase margin percentage
  else if (field === "purchaseMarginPercentage" && currentData.mrp) {
    const raw = String(value ?? "");
    const cleaned = raw
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*)\./g, "$1");
    
    // Allow typing "10." without recalculation
    if (cleaned.endsWith(".")) {
      return {};
    }

    const purchaseMarginPercentage = parseFloat(cleaned) || 0;
    const mrp = parseFloat(currentData.mrp);
    const marginPercentage = parseFloat(currentData.marginPercentage) || 0;
    if (!isNaN(mrp) && mrp > 0 && purchaseMarginPercentage >= 0 && purchaseMarginPercentage < 100) {
      // If margin is 0 or empty, cost price = MRP
      if (purchaseMarginPercentage === 0) {
        if (editCostPriceAsBase) {
          updates.costPriceBase = mrp.toFixed(2);
          if (taxRate > 0) {
            const costPrice = mrp * (1 + taxRate);
            const costGST = costPrice - mrp;
            updates.costPrice = costPrice.toFixed(2);
            updates.costGST = costGST.toFixed(2);
          } else {
            updates.costPrice = mrp.toFixed(2);
            updates.costGST = "0.00";
          }
        } else {
          updates.costPrice = mrp.toFixed(2);
          if (taxRate > 0) {
            const costPriceBase = mrp / (1 + taxRate);
            const costGST = mrp - costPriceBase;
            updates.costPriceBase = costPriceBase.toFixed(2);
            updates.costGST = costGST.toFixed(2);
          } else {
            updates.costPriceBase = mrp.toFixed(2);
            updates.costGST = "0.00";
          }
        }
        // Calculate selling price if margin exists
        if (marginPercentage > 0) {
          const calculated = calculatePricesFromMRP(
            mrp,
            marginPercentage,
            0,
            taxPercentage
          );
          if (editSellingPriceAsBase) {
            updates.sellingPriceBase = calculated.sellingPriceBase;
            updates.sellingPrice = calculated.sellingPrice;
            updates.sellingGST = calculated.sellingGST;
          } else {
            updates.sellingPrice = calculated.sellingPrice;
            updates.sellingPriceBase = calculated.sellingPriceBase;
            updates.sellingGST = calculated.sellingGST;
          }
        }
      } else {
        // Margin > 0, calculate from MRP
        if (editCostPriceAsBase) {
          // When in Base mode, calculate costPriceBase directly from MRP
          const purchaseMarginRate = purchaseMarginPercentage / 100;
          const costPriceBase = mrp * (1 - purchaseMarginRate);
          updates.costPriceBase = costPriceBase.toFixed(2);

          // Then calculate costPrice (incl GST) from the base
          if (taxRate > 0) {
            const costPrice = costPriceBase * (1 + taxRate);
            const costGST = costPrice - costPriceBase;
            updates.costPrice = costPrice.toFixed(2);
            updates.costGST = costGST.toFixed(2);
          } else {
            updates.costPrice = costPriceBase.toFixed(2);
            updates.costGST = "0.00";
          }

          // Calculate selling price if margin exists
          if (marginPercentage > 0) {
            // CRITICAL FIX: Direct calculation in fallback
            const marginRate = marginPercentage / 100;
            const sellingPriceInclGST = mrp * (1 - marginRate);
            const sellingPriceBase = taxRate > 0 ? sellingPriceInclGST / (1 + taxRate) : sellingPriceInclGST;
            const sellingGST = sellingPriceInclGST - sellingPriceBase;
            const calculated = {
              sellingPrice: sellingPriceInclGST.toFixed(2),
              sellingPriceBase: sellingPriceBase.toFixed(2),
              sellingGST: sellingGST.toFixed(2),
            };
            if (editSellingPriceAsBase) {
              updates.sellingPriceBase = calculated.sellingPriceBase;
              updates.sellingPrice = calculated.sellingPrice;
              updates.sellingGST = calculated.sellingGST;
            } else {
              updates.sellingPrice = calculated.sellingPrice;
              updates.sellingPriceBase = calculated.sellingPriceBase;
              updates.sellingGST = calculated.sellingGST;
            }
          }
        } else {
          // Normal mode: calculate costPrice (incl GST) from MRP, then base
          const calculated = calculatePricesFromMRP(
            mrp,
            marginPercentage,
            purchaseMarginPercentage,
            taxPercentage
          );
          updates.costPrice = calculated.costPrice;
          updates.costPriceBase = calculated.costPriceBase;
          updates.costGST = calculated.costGST;
          if (marginPercentage > 0) {
            if (editSellingPriceAsBase) {
              updates.sellingPriceBase = calculated.sellingPriceBase;
              updates.sellingPrice = calculated.sellingPrice;
              updates.sellingGST = calculated.sellingGST;
            } else {
              updates.sellingPrice = calculated.sellingPrice;
              updates.sellingPriceBase = calculated.sellingPriceBase;
              updates.sellingGST = calculated.sellingGST;
            }
          }
        }
      }
    }
  }
  // Calculate from margin percentage
  else if (field === "marginPercentage" && currentData.mrp) {
    const raw = String(value ?? "");
    const cleaned = raw
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*)\./g, "$1");
    
    // Allow typing "10." without recalculation
    if (cleaned.endsWith(".")) {
      return {};
    }

    const marginPercentage = parseFloat(cleaned) || 0;
    const mrp = parseFloat(currentData.mrp);
    const purchaseMarginPercentage =
      parseFloat(currentData.purchaseMarginPercentage) || 0;
    if (!isNaN(mrp) && mrp > 0 && marginPercentage >= 0 && marginPercentage < 100) {
      if (marginPercentage === 0) {
        // Margin is 0, selling price = MRP
        if (editSellingPriceAsBase) {
          updates.sellingPriceBase = mrp.toFixed(2);
          if (taxRate > 0) {
            const sellingPrice = mrp * (1 + taxRate);
            const sellingGST = sellingPrice - mrp;
            updates.sellingPrice = sellingPrice.toFixed(2);
            updates.sellingGST = sellingGST.toFixed(2);
          } else {
            updates.sellingPrice = mrp.toFixed(2);
            updates.sellingGST = "0.00";
          }
        } else {
          updates.sellingPrice = mrp.toFixed(2);
          if (taxRate > 0) {
            const sellingPriceBase = mrp / (1 + taxRate);
            const sellingGST = mrp - sellingPriceBase;
            updates.sellingPriceBase = sellingPriceBase.toFixed(2);
            updates.sellingGST = sellingGST.toFixed(2);
          } else {
            updates.sellingPriceBase = mrp.toFixed(2);
            updates.sellingGST = "0.00";
          }
        }
      } else {
        // Margin > 0, calculate from MRP
        // CRITICAL FIX: Direct calculation in fallback
        const marginRate = marginPercentage / 100;
        const sellingPriceInclGST = mrp * (1 - marginRate);
        const sellingPriceBase = taxRate > 0 ? sellingPriceInclGST / (1 + taxRate) : sellingPriceInclGST;
        const sellingGST = sellingPriceInclGST - sellingPriceBase;
        
        // Calculate cost price if purchase margin is provided
        let costPriceInclGST = 0;
        let costPriceBase = 0;
        let costGST = 0;
        if (purchaseMarginPercentage > 0) {
          const purchaseMarginRate = purchaseMarginPercentage / 100;
          costPriceInclGST = mrp * (1 - purchaseMarginRate);
          costPriceBase = taxRate > 0 ? costPriceInclGST / (1 + taxRate) : costPriceInclGST;
          costGST = costPriceInclGST - costPriceBase;
        }
        
        // CRITICAL FIX: Explicitly type the calculated object to ensure all properties are recognized
        const calculated: {
          sellingPrice: string;
          sellingPriceBase: string;
          sellingGST: string;
          costPrice: string;
          costPriceBase: string;
          costGST: string;
        } = {
          sellingPrice: sellingPriceInclGST.toFixed(2),
          sellingPriceBase: sellingPriceBase.toFixed(2),
          sellingGST: sellingGST.toFixed(2),
          costPrice: costPriceInclGST > 0 ? costPriceInclGST.toFixed(2) : "0.00",
          costPriceBase: costPriceBase > 0 ? costPriceBase.toFixed(2) : "0.00",
          costGST: costGST > 0 ? costGST.toFixed(2) : "0.00",
        };
        if (editSellingPriceAsBase) {
          updates.sellingPriceBase = calculated.sellingPriceBase;
          updates.sellingPrice = calculated.sellingPrice;
          updates.sellingGST = calculated.sellingGST;
        } else {
          updates.sellingPrice = calculated.sellingPrice;
          updates.sellingPriceBase = calculated.sellingPriceBase;
          updates.sellingGST = calculated.sellingGST;
        }
        if (purchaseMarginPercentage > 0) {
          updates.costPrice = calculated.costPrice;
          updates.costPriceBase = calculated.costPriceBase;
          updates.costGST = calculated.costGST;
        }
      }
    }
  }
  // Recalculate when tax percentage changes
  else if (field === "taxPercentage" && taxRate > 0) {
    if (currentData.costPrice) {
      const costPrice = parseFloat(currentData.costPrice);
      if (!isNaN(costPrice)) {
        const costBase = costPrice / (1 + taxRate);
        const costGST = costPrice - costBase;
        updates.costPriceBase = costBase.toFixed(2);
        updates.costGST = costGST.toFixed(2);
      }
    }
    if (editSellingPriceAsBase && currentData.sellingPriceBase) {
      const sellingBase = parseFloat(currentData.sellingPriceBase);
      if (!isNaN(sellingBase)) {
        const sellingPrice = sellingBase * (1 + taxRate);
        const sellingGST = sellingPrice - sellingBase;
        updates.sellingPrice = sellingPrice.toFixed(2);
        updates.sellingGST = sellingGST.toFixed(2);
      }
    } else if (currentData.sellingPrice) {
      const sellingPrice = parseFloat(currentData.sellingPrice);
      if (!isNaN(sellingPrice)) {
        const sellingBase = sellingPrice / (1 + taxRate);
        const sellingGST = sellingPrice - sellingBase;
        updates.sellingPriceBase = sellingBase.toFixed(2);
        updates.sellingGST = sellingGST.toFixed(2);
      }
    }
    // Recalculate from MRP if available
    if (currentData.mrp) {
      const mrp = parseFloat(currentData.mrp);
      const marginPercentage = parseFloat(currentData.marginPercentage) || 0;
      const purchaseMarginPercentage =
        parseFloat(currentData.purchaseMarginPercentage) || 0;
      if (!isNaN(mrp) && mrp > 0) {
        if (marginPercentage > 0 || purchaseMarginPercentage > 0) {
          // CRITICAL FIX: Direct calculation in fallback
          const purchaseMarginRate = purchaseMarginPercentage / 100;
          const marginRate = marginPercentage / 100;
          const costPriceInclGST = purchaseMarginPercentage > 0 ? mrp * (1 - purchaseMarginRate) : mrp;
          const costPriceBase = taxRate > 0 ? costPriceInclGST / (1 + taxRate) : costPriceInclGST;
          const costGST = costPriceInclGST - costPriceBase;
          const sellingPriceInclGST = marginPercentage > 0 ? mrp * (1 - marginRate) : mrp;
          const sellingPriceBase = taxRate > 0 ? sellingPriceInclGST / (1 + taxRate) : sellingPriceInclGST;
          const sellingGST = sellingPriceInclGST - sellingPriceBase;
          const calculated = {
            costPrice: costPriceInclGST.toFixed(2),
            costPriceBase: costPriceBase.toFixed(2),
            costGST: costGST.toFixed(2),
            sellingPrice: sellingPriceInclGST.toFixed(2),
            sellingPriceBase: sellingPriceBase.toFixed(2),
            sellingGST: sellingGST.toFixed(2),
          };
          updates.costPrice = calculated.costPrice;
          updates.costPriceBase = calculated.costPriceBase;
          updates.costGST = calculated.costGST;
          if (editSellingPriceAsBase) {
            updates.sellingPriceBase = calculated.sellingPriceBase;
            updates.sellingPrice = calculated.sellingPrice;
            updates.sellingGST = calculated.sellingGST;
          } else {
            updates.sellingPrice = calculated.sellingPrice;
            updates.sellingPriceBase = calculated.sellingPriceBase;
            updates.sellingGST = calculated.sellingGST;
          }
        }
      }
    }
  }

  return updates;
}
