/**
 * This file contains the CreateBillPage component which provides a full-page interface
 * for creating bills/orders. It includes product selection, quantity management, and order submission.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/contexts/StoreContext";
import { useCountry } from "@/contexts/CountryContext";
import { useI18n } from "@/contexts/I18nContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { storeSettingsService } from "@/services/storeSettings.service";
import { ordersService, Order } from "@/services/orders.service";
import SearchableSelect from "../orders/SearchableSelect";
import QuickAddProductModal from "./QuickAddProductModal";
import UpdateInventoryModal from "../orders/UpdateInventoryModal";
import CameraScannerModal from "../inventory/CameraScannerModal";
import Toast from "../Toast";
import { inventoryService } from "@/services/inventory.service";
import CustomerSearchInput from "./CustomerSearchInput";
import { Customer } from "@/services/customers.service";
import { VATFields } from "@/components/tax/VATFields";
import { getCurrencySymbol, formatCurrency } from "@/lib/region-config";
import { gstService, GSTDetails } from "@/services/gst.service";
import { customersService } from "@/services/customers.service";

/**
 * Product option interface for product selection
 */
interface ProductOption {
  id: string;
  name: string;
  sellingPrice?: number;
  mrp?: number;
  taxPercentage?: number;
  marginPercentage?: number;
  quantity: number;
}

/**
 * CreateBillPage component provides a full-page interface for creating bills.
 * Users can add products, set quantities, apply discounts, and submit orders.
 */
export default function CreateBillPage() {
  const router = useRouter();
  const { selectedStore } = useStore();
  const { country, isIN, isNL, isDE } = useCountry();
  const { t } = useI18n();
  const { track, trackButton, events } = useAnalytics("Create Bill Page", true);
  const currencySymbol = getCurrencySymbol(country); // '₹' for India, '€' for EU
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fetchingGST, setFetchingGST] = useState(false);
  const [gstDetails, setGstDetails] = useState<GSTDetails | null>(null);
  
  // Country-aware tax state
  const [gstMode, setGstMode] = useState<'INTRA' | 'INTER'>('INTRA');
  const [vatRate, setVatRate] = useState<number>(isNL ? 21 : isDE ? 19 : 0);
  const [vatMode, setVatMode] = useState<'normal' | 'reverse_charge' | 'intra_eu_b2b' | 'export'>('normal');
  const [customerVatId, setCustomerVatId] = useState<string>("");

  // Get initial print mode based on order type: B2C defaults to receipt, B2B defaults to A4
  const getInitialPrintMode = (orderType: "B2C" | "B2B"): "a4" | "receipt" => {
    return orderType === "B2B" ? "a4" : "receipt";
  };

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerGstin: "",
    billingAddress: "",
    placeOfSupply: "",
    orderType: "B2C" as "B2C" | "B2B",
    printMode: getInitialPrintMode("B2C"), // Default to receipt for B2C
    overallDiscount: 0, // Overall discount percentage on entire bill
    overallDiscountType: "CASH" as "TRADE" | "CASH", // Trade discount (before GST) or Cash discount (after GST)
    isReverseCharge: false, // Reverse Charge Mechanism (RCM)
    items: [] as Array<{
      productId: string;
      quantity: number;
      price: number;
      discountPercentage?: number;
      taxPercentage?: number; // Allow custom tax percentage per item
      // New product data (when product doesn't exist in inventory)
      newProductData?: {
        name: string;
        mrp?: number;
        sellingPrice: number;
        costPrice?: number;
        taxPercentage?: number;
        hsnCode?: string;
      };
    }>,
  });

  // Fetch store settings on mount
  useEffect(() => {
    const fetchStoreSettings = async () => {
      if (selectedStore?.id) {
        try {
          const settings = await storeSettingsService.getStoreSettings(
            selectedStore.id
          );
          setAllowNegativeStock(settings.allowNegativeStock);
        } catch (err) {
          console.error("Failed to fetch store settings:", err);
          // Default to false if fetch fails
          setAllowNegativeStock(false);
        }
      }
    };
    fetchStoreSettings();
  }, [selectedStore]);

  // Auto-fetch GST details when GSTIN is entered (with debouncing)
  useEffect(() => {
    const gstin = formData.customerGstin.trim().toUpperCase().replace(/\s+/g, '');
    
    // Only fetch if GSTIN is exactly 15 characters and valid format
    if (!isIN || gstin.length !== 15 || !/^[0-9A-Z]{15}$/.test(gstin)) {
      if (gstin.length === 0) {
        setGstDetails(null);
      }
      return;
    }

    // Debounce: Wait 1 second after user stops typing
    const timeoutId = setTimeout(async () => {
      // Don't refetch if we already have details for this GSTIN
      if (gstDetails && gstDetails.gstin === gstin) {
        return;
      }

      setFetchingGST(true);
      setError("");
      
      try {
        // First, try to fetch from database (customers with this GSTIN)
        let gstData: GSTDetails | null = null;
        
        if (selectedStore?.id) {
          try {
            const customersResponse = await customersService.getCustomers({
              storeId: selectedStore.id,
              search: gstin,
              limit: 10,
            });
            
            // Find customer with matching GSTIN
            const customerWithGstin = customersResponse.data.find(
              (c) => c.gstin?.toUpperCase().replace(/\s+/g, '') === gstin
            );
            
            if (customerWithGstin && customerWithGstin.gstin) {
              // Convert customer data to GSTDetails format
              gstData = {
                gstin: customerWithGstin.gstin.toUpperCase().replace(/\s+/g, ''),
                legalName: customerWithGstin.name,
                tradeName: customerWithGstin.name,
                address: customerWithGstin.billingAddress
                  ? {
                      fullAddress: customerWithGstin.billingAddress,
                    }
                  : undefined,
              };
              
              // If we found customer in DB, use it and skip API call
              setGstDetails(gstData);
              
              // Auto-populate fields from customer data
              setFormData((prev) => {
                const updates: any = {};
                
                // Populate customer name if empty
                if (!prev.customerName && customerWithGstin.name) {
                  updates.customerName = customerWithGstin.name;
                }
                
                // Populate billing address if empty
                if (!prev.billingAddress && customerWithGstin.billingAddress) {
                  updates.billingAddress = customerWithGstin.billingAddress;
                }
                
                // Populate phone and email if available
                if (!prev.customerPhone && customerWithGstin.phone) {
                  updates.customerPhone = customerWithGstin.phone;
                }
                if (!prev.customerEmail && customerWithGstin.email) {
                  updates.customerEmail = customerWithGstin.email;
                }
                
                // Auto-set B2B if GSTIN is provided
                if (prev.orderType === "B2C" && gstin.length === 15) {
                  updates.orderType = "B2B" as "B2C" | "B2B";
                  updates.printMode = "a4";
                }
                
                return { ...prev, ...updates };
              });
              
              setSuccessMessage("Customer found in database!");
              setTimeout(() => setSuccessMessage(""), 3000);
              setFetchingGST(false);
              return; // Exit early, don't call API
            }
          } catch (dbError) {
            // If DB search fails, continue to API fallback
            console.log("DB search failed, falling back to API:", dbError);
          }
        }
        
        // If not found in DB, fetch from API
        if (!gstData) {
          const response = await gstService.verifyGSTIN(gstin);
          
          if (response.success && response.data) {
            gstData = response.data;
            setGstDetails(gstData);
          } else {
            setError(response.error || "Failed to fetch GST details. You can continue with manual entry.");
            setGstDetails(null);
            setFetchingGST(false);
            return;
          }
        }
        
        // Auto-populate fields from GST details (gstData is guaranteed to be non-null here)
        if (gstData) {
          // Update form data with GST details
          setFormData((prev) => {
            const updates: any = {};
            
            // Populate customer name if empty (use legal name or trade name)
            if (!prev.customerName && (gstData.legalName || gstData.tradeName)) {
              updates.customerName = gstData.legalName || gstData.tradeName || "";
            }
            
            // Populate billing address if empty
            if (!prev.billingAddress && gstData.address) {
              const address = gstService.extractAddress(gstData);
              if (address) {
                updates.billingAddress = address;
              }
            }
            
            // Determine place of supply from GST address state
            if (!prev.placeOfSupply && gstData.address?.state) {
              updates.placeOfSupply = gstData.address.state;
            } else if (!prev.placeOfSupply && gstin) {
              // Extract state from GSTIN if address state not available
              const stateCode = gstService.extractStateCode(gstin);
              const stateName = gstService.getStateName(stateCode);
              if (stateName) {
                updates.placeOfSupply = stateName;
              }
            }
            
            // Auto-set B2B if GSTIN is provided (B2B typically requires GSTIN)
            if (prev.orderType === "B2C" && gstin.length === 15) {
              updates.orderType = "B2B" as "B2C" | "B2B";
              // B2B must use A4 format (default)
              updates.printMode = "a4";
            }
            
            return { ...prev, ...updates };
          });
          
          setSuccessMessage("GST details fetched successfully!");
          setTimeout(() => setSuccessMessage(""), 3000);
        }
      } catch (err) {
        console.error("GST fetch error:", err);
        setError("Failed to fetch GST details. You can continue with manual entry.");
        setGstDetails(null);
      } finally {
        setFetchingGST(false);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [formData.customerGstin, isIN, gstDetails]);

  // Helper function to get product name (with fallback)
  const getProductName = (productId: string): string => {
    const product = productCache.get(productId);
    if (product?.name) return product.name;
    // Fallback to itemProductNames
    const storedName = itemProductNames.get(productId);
    if (storedName) return storedName;
    return "Unknown";
  };
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null); // Track selected customer
  const [priceInputs, setPriceInputs] = useState(new Map<number, string>()); // Track price inputs
  const [taxInputs, setTaxInputs] = useState(new Map<number, string>()); // Track tax percentage inputs
  const [selectedProduct, setSelectedProduct] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1"); // Allow any quantity, not restricted to 1
  const [loading, setLoading] = useState(false);
  const [quantityError, setQuantityError] = useState("");
  const [showQuickAddProductModal, setShowQuickAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [productSearchKey, setProductSearchKey] = useState(0);
  const [insufficientStockItems, setInsufficientStockItems] = useState<
    Array<{
      productId: string;
      productName: string;
      availableQuantity: number;
      requestedQuantity: number;
      currentStock: number;
    }>
  >([]);
  const [pendingItemAddition, setPendingItemAddition] = useState<{
    productId: string;
    quantity: number;
  } | null>(null);
  const [quantityInputs, setQuantityInputs] = useState<Map<number, string>>(
    new Map()
  );
  const [discountInputs, setDiscountInputs] = useState<Map<number, string>>(
    new Map()
  );
  const [productCache, setProductCache] = useState<
    Map<
      string,
      {
        id: string;
        name: string;
        sellingPrice?: number;
        mrp?: number;
        taxPercentage?: number;
        marginPercentage?: number;
        quantity: number;
      }
    >
  >(new Map());
  const [showScanner, setShowScanner] = useState(false);
  const [lastCreatedOrderId, setLastCreatedOrderId] = useState<string | null>(null);
  const [lastCreatedOrderCustomerPhone, setLastCreatedOrderCustomerPhone] = useState<string | null>(null);
  const [lastCreatedOrderCustomerEmail, setLastCreatedOrderCustomerEmail] = useState<string | null>(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [itemProductNames, setItemProductNames] = useState<Map<string, string>>(new Map()); // Store product names for items (fallback if not in cache)

  /**
   * Handles product selection from the searchable select
   * @param product - The selected product option
   */
  const handleProductSelect = (product: ProductOption) => {
    setProductCache(new Map(productCache.set(product.id, product)));
    // Also store name in itemProductNames as backup
    setItemProductNames(new Map(itemProductNames.set(product.id, product.name)));
    setQuantityError("");
  };

  /**
   * Handles barcode scanning - finds product by barcode and adds it to the bill
   * Enhanced with seamless UX, instant feedback, and smooth animations
   * @param barcode - The scanned barcode
   */
  const handleBarcodeScan = async (barcode: string) => {
    try {
      // Show loading state immediately
      setSuccessMessage("Looking up product...");

      // CRITICAL FIX: Parse QR code if it's a Basil QR code format
      let productId: string | null = null;
      let lookupBarcode = barcode;
      
      // Check if it's a Basil QR code (format: basil:version:...|type:product|id:...)
      if (barcode.startsWith("basil:")) {
        const parts = barcode.split("|");
        for (const part of parts) {
          const [key, value] = part.split(":");
          if (key && value && key.trim() === "id") {
            productId = value.trim();
            break;
          }
        }
      }
      
      // If we extracted a product ID from QR code, try to use it as barcode lookup
      // (since QR codes often contain product IDs that can be used as barcodes)
      let product;
      if (productId) {
        try {
          // Try using the product ID as a barcode first (QR codes often encode product IDs)
          const productPromise = inventoryService.getProductByBarcode(productId);
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), 5000)
          );
          product = await Promise.race([productPromise, timeoutPromise]);
        } catch (err) {
          console.error("Failed to fetch product by ID from QR code:", err);
          product = null;
        }
      }
      
      // If product not found by ID, try original barcode lookup
      if (!product) {
        const productPromise = inventoryService.getProductByBarcode(lookupBarcode);
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 5000)
        );
        product = await Promise.race([productPromise, timeoutPromise]);
      }

      if (!product) {
        setSuccessMessage("");
        // Use Toast for better UX instead of alert
        setTimeout(() => {
          setSuccessMessage(`Product not found for barcode: ${barcode}`);
          setTimeout(() => setSuccessMessage(""), 3000);
        }, 100);
        return;
      }

      // Convert product to ProductOption format
      const productOption: ProductOption = {
        id: product.id,
        name: product.name,
        sellingPrice: product.sellingPrice,
        mrp: product.mrp,
        taxPercentage: product.taxPercentage,
        marginPercentage: product.marginPercentage,
        quantity: product.quantity,
      };

      // Add to cache
      setProductCache(new Map(productCache.set(product.id, productOption)));
      // Also store name in itemProductNames as backup
      setItemProductNames(new Map(itemProductNames.set(product.id, productOption.name)));

      // Add item to bill with quantity from form (any quantity allowed)
      const orderQuantity = parseInt(itemQuantity) || 1; // Use quantity from form, allow any quantity
      const price = productOption.mrp || productOption.sellingPrice || 0;
      const initialDiscount = productOption.marginPercentage || 0;

      // Check if item already exists in bill
      const existingItemIndex = formData.items.findIndex(
        (item) => item.productId === product.id
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const existingQuantity = formData.items[existingItemIndex].quantity;
        const totalQuantity = existingQuantity + orderQuantity;
        // CRITICAL FIX: Preserve existing custom GST/discount when updating quantity
        const existingTax = formData.items[existingItemIndex].taxPercentage;
        const existingDiscount = formData.items[existingItemIndex].discountPercentage;

        if (!allowNegativeStock && totalQuantity > productOption.quantity) {
          // Show update inventory modal
          setInsufficientStockItems([
            {
              productId: productOption.id,
              productName: productOption.name,
              availableQuantity: productOption.quantity,
              requestedQuantity: totalQuantity,
              currentStock: productOption.quantity,
            },
          ]);
          setPendingItemAddition({
            productId: productOption.id,
            quantity: orderQuantity,
          });
          setSuccessMessage("");
        } else {
          const updatedItems = [...formData.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: totalQuantity,
            // Preserve existing custom GST/discount
            taxPercentage: existingTax,
            discountPercentage: existingDiscount,
          };
          setFormData({
            ...formData,
            items: updatedItems,
          });
          // Update quantity input to reflect new total
          setQuantityInputs(new Map(quantityInputs.set(existingItemIndex, totalQuantity.toString())));
          
          // Success feedback
          setSuccessMessage(`✓ ${productOption.name} - Quantity updated to ${totalQuantity}`);
          setTimeout(() => setSuccessMessage(""), 2000);
        }
      } else {
        // Add new item
        if (!allowNegativeStock && orderQuantity > productOption.quantity) {
          // Show update inventory modal
          setInsufficientStockItems([
            {
              productId: productOption.id,
              productName: productOption.name,
              availableQuantity: productOption.quantity,
              requestedQuantity: orderQuantity,
              currentStock: productOption.quantity,
            },
          ]);
          setPendingItemAddition({
            productId: productOption.id,
            quantity: orderQuantity,
          });
          setSuccessMessage("");
        } else {
          const newItemIndex = formData.items.length;
          // CRITICAL FIX: Use custom discount/GST from productCache if previously set
          const customDiscount = productOption.marginPercentage || initialDiscount;
          const customTax = productOption.taxPercentage || 0;
          setFormData({
            ...formData,
            items: [
              ...formData.items,
              {
                productId: productOption.id,
                quantity: orderQuantity,
                price,
                discountPercentage: customDiscount,
                taxPercentage: customTax, // Include tax percentage (may include custom value from cache)
              },
            ],
          });
          // CRITICAL FIX: Store product name for display
          setItemProductNames(new Map(itemProductNames.set(productOption.id, productOption.name)));
          // Set initial discount, tax, and quantity input values
          setDiscountInputs(
            new Map(
              discountInputs.set(newItemIndex, customDiscount.toString())
            )
          );
          setTaxInputs(
            new Map(
              taxInputs.set(newItemIndex, customTax.toString())
            )
          );
          setQuantityInputs(
            new Map(
              quantityInputs.set(newItemIndex, orderQuantity.toString())
            )
          );
          
          // Success feedback with product name
          setSuccessMessage(`✓ ${productOption.name} added to bill`);
          setTimeout(() => setSuccessMessage(""), 2000);
        }
      }

      setQuantityError("");
    } catch (err) {
      console.error("Failed to handle barcode scan:", err);
      setSuccessMessage("");
      // Show error toast
      setTimeout(() => {
        setSuccessMessage(
          err instanceof Error
            ? `Error: ${err.message}`
            : "Failed to add product from barcode"
        );
        setTimeout(() => setSuccessMessage(""), 3000);
      }, 100);
    }
  };

  /**
   * Handles adding a new product that doesn't exist
   * @param productName - The name of the product to create
   */
  const handleAddNewProduct = (productName: string) => {
    setNewProductName(productName);
    setShowQuickAddProductModal(true);
  };

  /**
   * Handles creating a new product and adding it to the bill
   * @param productData - The product data to create
   * @returns The created product option
   */
  const handleCreateProduct = async (productData: {
    name: string;
    storeId: string;
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
    requireCustomBarcode: boolean;
    needsBarcode: boolean;
    marginPercentage?: number;
    purchaseMarginPercentage?: number;
    supplierId?: string;
    categoryId?: string;
    subcategoryId?: string;
  }): Promise<{
    id: string;
    name: string;
    sellingPrice?: number;
    mrp?: number;
    taxPercentage?: number;
    marginPercentage?: number;
    quantity: number;
  }> => {
    try {
      const created = await inventoryService.createProduct({
        name: productData.name,
        storeId: productData.storeId,
        barcode: productData.barcode,
        hsnCode: productData.hsnCode,
        taxPercentage: productData.taxPercentage,
        mrp: productData.mrp,
        costPrice: productData.costPrice,
        costPriceBase: productData.costPriceBase,
        costGST: productData.costGST,
        sellingPrice: productData.sellingPrice,
        sellingPriceBase: productData.sellingPriceBase,
        sellingGST: productData.sellingGST,
        quantity: productData.quantity,
        requireCustomBarcode: productData.requireCustomBarcode,
        needsBarcode: productData.needsBarcode,
        marginPercentage: productData.marginPercentage,
        purchaseMarginPercentage: productData.purchaseMarginPercentage,
        supplierId: productData.supplierId,
        categoryId: productData.categoryId,
        subcategoryId: productData.subcategoryId,
      });

      const productOption: ProductOption = {
        id: created.id,
        name: created.name,
        sellingPrice: created.sellingPrice,
        mrp: created.mrp,
        taxPercentage: created.taxPercentage,
        marginPercentage: created.marginPercentage,
        quantity: created.quantity,
      };

      // Add to cache
      setProductCache(
        new Map(productCache.set(productOption.id, productOption))
      );

      // Automatically add the product to bill items with quantity from form (any quantity allowed)
      const price = productOption.mrp || productOption.sellingPrice || 0;
      const initialDiscount = productOption.marginPercentage || 0;
      const orderQuantity = parseInt(itemQuantity) || 1; // Use quantity from form, allow any quantity

      // Check if product already exists in bill items
      const existingItemIndex = formData.items.findIndex(
        (item) => item.productId === productOption.id
      );

      if (existingItemIndex >= 0) {
        // If already exists, increment quantity
        const existingQuantity = formData.items[existingItemIndex].quantity;
        const totalQuantity = existingQuantity + orderQuantity;

        if (!allowNegativeStock && totalQuantity > productOption.quantity) {
          // Show update inventory modal instead of error
          setInsufficientStockItems([
            {
              productId: productOption.id,
              productName: productOption.name,
              availableQuantity: productOption.quantity,
              requestedQuantity: totalQuantity,
              currentStock: productOption.quantity,
            },
          ]);
          setPendingItemAddition({
            productId: productOption.id,
            quantity: orderQuantity,
          });
        } else {
          // CRITICAL FIX: Preserve existing custom GST/discount when updating quantity
          const existingTax = formData.items[existingItemIndex].taxPercentage;
          const existingDiscount = formData.items[existingItemIndex].discountPercentage;
          const updatedItems = [...formData.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: totalQuantity,
            // Preserve existing custom GST/discount
            taxPercentage: existingTax,
            discountPercentage: existingDiscount,
          };
          setFormData({
            ...formData,
            items: updatedItems,
          });
          // Update quantity input to reflect new total
          setQuantityInputs(new Map(quantityInputs.set(existingItemIndex, totalQuantity.toString())));
          setQuantityError("");
        }
      } else {
        // Add new item to bill
        if (!allowNegativeStock && orderQuantity > productOption.quantity) {
          // Show update inventory modal instead of error
          setInsufficientStockItems([
            {
              productId: productOption.id,
              productName: productOption.name,
              availableQuantity: productOption.quantity,
              requestedQuantity: orderQuantity,
              currentStock: productOption.quantity,
            },
          ]);
          setPendingItemAddition({
            productId: productOption.id,
            quantity: orderQuantity,
          });
        } else {
          const newItemIndex = formData.items.length;
          // CRITICAL FIX: Use custom discount/GST from productCache if previously set
          const customDiscount = productOption.marginPercentage || initialDiscount;
          const customTax = productOption.taxPercentage || 0;
          setFormData({
            ...formData,
            items: [
              ...formData.items,
              {
                productId: productOption.id,
                quantity: orderQuantity,
                price,
                discountPercentage: customDiscount,
                taxPercentage: customTax, // Include tax percentage (may include custom value from cache)
              },
            ],
          });
          // CRITICAL FIX: Store product name for display
          setItemProductNames(new Map(itemProductNames.set(productOption.id, productOption.name)));
          // CRITICAL FIX: Store product name for display
          setItemProductNames(new Map(itemProductNames.set(productOption.id, productOption.name)));
          // Set initial discount, tax, and quantity input values
          setDiscountInputs(
            new Map(
              discountInputs.set(newItemIndex, customDiscount.toString())
            )
          );
          setTaxInputs(
            new Map(
              taxInputs.set(newItemIndex, customTax.toString())
            )
          );
          setQuantityInputs(
            new Map(
              quantityInputs.set(newItemIndex, orderQuantity.toString())
            )
          );
          setQuantityError("");
        }
      }

      // Clear selection after adding
      setSelectedProduct("");
      setItemQuantity("1");

      return productOption;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Adds the selected product to the bill items
   */
  const addItem = () => {
    if (!selectedProduct) return;

    const product = productCache.get(selectedProduct);
    if (!product) return;

    const requestedQuantity = parseInt(itemQuantity) || 1;

    // Only validate stock if negative stock is not allowed
    if (!allowNegativeStock) {
      const existingItemIndex = formData.items.findIndex(
        (item) => item.productId === selectedProduct
      );
      const existingQuantity =
        existingItemIndex >= 0 ? formData.items[existingItemIndex].quantity : 0;
      const totalQuantity = existingQuantity + requestedQuantity;

      // Check if there's insufficient stock
      if (product.quantity < totalQuantity) {
        // Show update inventory modal instead of error
        setInsufficientStockItems([
          {
            productId: product.id,
            productName: product.name,
            availableQuantity: product.quantity,
            requestedQuantity: totalQuantity,
            currentStock: product.quantity,
          },
        ]);
        setPendingItemAddition({
          productId: selectedProduct,
          quantity: requestedQuantity,
        });
        return;
      }
    }

    const existingItemIndex = formData.items.findIndex(
      (item) => item.productId === selectedProduct
    );
    if (existingItemIndex >= 0) {
      const existingQuantity = formData.items[existingItemIndex].quantity;
      const totalQuantity = existingQuantity + requestedQuantity;
      // CRITICAL FIX: Preserve existing custom GST/discount when updating quantity
      const existingTax = formData.items[existingItemIndex].taxPercentage;
      const existingDiscount = formData.items[existingItemIndex].discountPercentage;
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: totalQuantity,
        // Preserve existing custom GST/discount
        taxPercentage: existingTax,
        discountPercentage: existingDiscount,
      };
      setFormData({
        ...formData,
        items: updatedItems,
      });
      // Update quantity input to reflect new total
      setQuantityInputs(new Map(quantityInputs.set(existingItemIndex, totalQuantity.toString())));
    } else {
      const price = product.mrp || product.sellingPrice || 0;
      // CRITICAL FIX: Use custom discount/GST from productCache if previously set, otherwise use product defaults
      const initialDiscount = product.marginPercentage || 0;
      const initialTax = product.taxPercentage || 0;
      const newItemIndex = formData.items.length;
          setFormData({
            ...formData,
            items: [
              ...formData.items,
              {
                productId: selectedProduct,
                quantity: requestedQuantity,
                price,
                discountPercentage: initialDiscount,
                taxPercentage: initialTax, // Include tax percentage from product (may include custom value from cache)
              },
            ],
          });
          // CRITICAL FIX: Store product name for display
          if (product) {
            setItemProductNames(new Map(itemProductNames.set(selectedProduct, product.name)));
          }
          // Set initial discount and tax input values
          setDiscountInputs(
            new Map(discountInputs.set(newItemIndex, initialDiscount.toString()))
          );
          setTaxInputs(
            new Map(taxInputs.set(newItemIndex, initialTax.toString()))
          );
          // Set initial quantity input
          setQuantityInputs(
            new Map(quantityInputs.set(newItemIndex, requestedQuantity.toString()))
          );
    }

    setSelectedProduct("");
    setItemQuantity("1");
    setQuantityError("");
  };

  /**
   * Removes an item from the bill
   * @param index - The index of the item to remove
   */
  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  /**
   * Updates the quantity of an item
   * @param index - The index of the item
   * @param value - The new quantity value
   */
  const updateItemQuantity = (index: number, value: string) => {
    const item = formData.items[index];
    if (!item) return;

    const product = productCache.get(item.productId);
    if (!product) return;

    // Store the raw input value immediately for real-time display
    const updatedQuantityInputs = new Map(quantityInputs);
    updatedQuantityInputs.set(index, value);
    setQuantityInputs(updatedQuantityInputs);

    // If empty, don't update the actual quantity yet
    if (value === "" || value === null || value === undefined) {
      return;
    }

    const newQuantity = parseInt(value);
    if (isNaN(newQuantity)) return;

    // Validate quantity - only limit to available stock if negative stock not allowed
    let quantity = Math.max(1, newQuantity);
    if (!allowNegativeStock) {
      quantity = Math.min(quantity, product.quantity);
    }

    if (!allowNegativeStock && quantity !== newQuantity) {
      setQuantityError(
        `Quantity must be between 1 and ${product.quantity} (available stock)`
      );
      // Clear error after 3 seconds
      setTimeout(() => setQuantityError(""), 3000);
    } else {
      setQuantityError("");
    }

    // Update formData with new quantity
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
    };

    setFormData({
      ...formData,
      items: updatedItems,
    });

    // CRITICAL FIX: Sync quantityInputs with the validated quantity to ensure UI updates
    if (quantity !== newQuantity) {
      // If quantity was adjusted, update the input to show the validated value
      updatedQuantityInputs.set(index, quantity.toString());
      setQuantityInputs(updatedQuantityInputs);
    }
  };

  /**
   * Updates the discount percentage of an item
   * @param index - The index of the item
   * @param value - The new discount value
   */
  const updateItemDiscount = (index: number, value: string) => {
    const item = formData.items[index];
    if (!item) return;

    // Store the raw input value
    setDiscountInputs(new Map(discountInputs.set(index, value)));

    // If empty, don't update the actual discount yet
    if (value === "" || value === null || value === undefined) {
      return;
    }

    const discountValue = parseFloat(value);
    if (isNaN(discountValue)) return;

    // Validate discount (0-100)
    const discount = Math.max(0, Math.min(100, discountValue));

    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      discountPercentage: discount === 0 ? 0 : discount,
    };

    setFormData({
      ...formData,
      items: updatedItems,
    });

    // CRITICAL FIX: Update productCache with custom discount for future use
    const product = productCache.get(item.productId);
    if (product) {
      const updatedProduct = {
        ...product,
        marginPercentage: discount, // Store discount as marginPercentage for future billings
      };
      setProductCache(new Map(productCache.set(item.productId, updatedProduct)));
    }
  };

  /**
   * Handles quantity input blur event
   * @param index - The index of the item
   */
  const handleQuantityBlur = (index: number) => {
    const item = formData.items[index];
    if (!item) return;

    const inputValue = quantityInputs.get(index);
    // If empty on blur, set to 1 and clear input cache
    if (!inputValue || inputValue === "") {
      const updatedItems = [...formData.items];
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: 1,
      };
      setFormData({
        ...formData,
        items: updatedItems,
      });
      setQuantityInputs(new Map(quantityInputs.set(index, "1")));
    }
  };

  /**
   * Handles discount input blur event
   * @param index - The index of the item
   */
  const handleDiscountBlur = (index: number) => {
    const item = formData.items[index];
    if (!item) return;

    const inputValue = discountInputs.get(index);
    // If empty on blur, set to 0 and clear input cache
    if (!inputValue || inputValue === "") {
      const updatedItems = [...formData.items];
      updatedItems[index] = {
        ...updatedItems[index],
        discountPercentage: 0,
      };
      setFormData({
        ...formData,
        items: updatedItems,
      });
      setDiscountInputs(new Map(discountInputs.set(index, "0")));
    }
  };

  /**
   * Updates the MRP (price) for an item
   * @param index - The index of the item
   * @param value - The new price value
   */
  const updateItemPrice = (index: number, value: string) => {
    setPriceInputs(new Map(priceInputs.set(index, value)));

    // If empty, don't update the actual price yet
    if (value === "" || value === null || value === undefined) {
      return;
    }

    const priceValue = parseFloat(value);
    if (isNaN(priceValue) || priceValue < 0) return;

    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      price: priceValue,
    };

    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  /**
   * Handles price input blur event
   * @param index - The index of the item
   */
  const handlePriceBlur = (index: number) => {
    const item = formData.items[index];
    if (!item) return;

    const inputValue = priceInputs.get(index);
    // If empty on blur, use original price
    if (!inputValue || inputValue === "") {
      const product = productCache.get(item.productId);
      const originalPrice = product?.mrp || product?.sellingPrice || item.price || 0;
      const updatedItems = [...formData.items];
      updatedItems[index] = {
        ...updatedItems[index],
        price: originalPrice,
      };
      setFormData({
        ...formData,
        items: updatedItems,
      });
      setPriceInputs(new Map(priceInputs.set(index, originalPrice.toString())));
    }
  };

  /**
   * Updates the GST percentage for an item
   * @param index - The index of the item
   * @param value - The new GST percentage value
   */
  const updateItemTaxPercentage = (index: number, value: string) => {
    setTaxInputs(new Map(taxInputs.set(index, value)));

    // If empty, don't update the actual tax yet
    if (value === "" || value === null || value === undefined) {
      return;
    }

    const taxValue = parseFloat(value);
    if (isNaN(taxValue) || taxValue < 0) return;

    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      taxPercentage: taxValue,
    };

    setFormData({
      ...formData,
      items: updatedItems,
    });

    // CRITICAL FIX: Update productCache with custom GST for future use
    const item = formData.items[index];
    if (item) {
      const product = productCache.get(item.productId);
      if (product) {
        const updatedProduct = {
          ...product,
          taxPercentage: taxValue, // Store custom GST for future billings
        };
        setProductCache(new Map(productCache.set(item.productId, updatedProduct)));
      }
    }
  };

  /**
   * Handles tax percentage input blur event
   * @param index - The index of the item
   */
  const handleTaxBlur = (index: number) => {
    const item = formData.items[index];
    if (!item) return;

    const inputValue = taxInputs.get(index);
    // If empty on blur, use original tax percentage
    if (!inputValue || inputValue === "") {
      const product = productCache.get(item.productId);
      const originalTax = product?.taxPercentage || item.taxPercentage || 0;
      const updatedItems = [...formData.items];
      updatedItems[index] = {
        ...updatedItems[index],
        taxPercentage: originalTax,
      };
      setFormData({
        ...formData,
        items: updatedItems,
      });
      setTaxInputs(new Map(taxInputs.set(index, originalTax.toString())));
    }
  };

  /**
   * Calculates discounted MRP for an item (discount applied to MRP)
   * MRP includes GST, so discounted MRP also includes GST
   * @param item - The item to calculate discount for
   * @returns The discounted MRP (includes GST)
   */
  const getDiscountedMRP = (item: {
    price: number;
    discountPercentage?: number;
  }) => {
    const discount = item.discountPercentage || 0;
    return item.price * (1 - discount / 100);
  };

  /**
   * Calculates GST amount for an item
   * Since MRP includes GST, we need to extract GST from the discounted MRP
   * Formula: GST = discountedMRP * (taxPercentage / (100 + taxPercentage))
   * @param item - The item to calculate GST for
   * @param product - The product with tax percentage
   * @returns The GST amount
   */
  const getItemGST = (
    item: {
      price: number;
      discountPercentage?: number;
      taxPercentage?: number;
    },
    product?: {
      taxPercentage?: number;
    }
  ) => {
    // Use item's custom tax percentage if set, otherwise use product's tax percentage
    const taxPercentage = item.taxPercentage ?? product?.taxPercentage ?? 0;
    if (taxPercentage === 0) return 0;
    const discountedMRP = getDiscountedMRP(item);
    // Since MRP includes GST: GST = discountedMRP * (taxPercentage / (100 + taxPercentage))
    return discountedMRP * (taxPercentage / (100 + taxPercentage));
  };

  /**
   * Calculates subtotal for an item (discounted MRP, which already includes GST)
   * @param item - The item to calculate subtotal for
   * @returns The subtotal amount
   */
  const getItemSubtotal = (item: {
    price: number;
    quantity: number | string;
    discountPercentage?: number;
  }) => {
    const discountedMRP = getDiscountedMRP(item);
    const qty =
      typeof item.quantity === "string"
        ? parseInt(item.quantity) || 1
        : item.quantity;
    // discountedMRP already includes GST, so just multiply by quantity
    return discountedMRP * qty;
  };

  /**
   * Handles form submission to create the order
   * @param e - The form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || formData.items.length === 0) {
      return;
    }

    // GST compliance (India): warn before completing B2B invoice if any item is missing HSN.
    if (isIN && formData.orderType === "B2B") {
      const missing = formData.items
        .map((it, idx) => {
          const hsn =
            (it as any)?.hsnCode ||
            (it as any)?.product?.hsnCode ||
            (it.newProductData as any)?.hsnCode ||
            "";
          const name =
            (it.newProductData as any)?.name ||
            (it as any)?.product?.name ||
            `Item ${idx + 1}`;
          return { idx, name, hsn: String(hsn || "").trim() };
        })
        .filter((x) => !x.hsn);

      if (missing.length > 0) {
        const names = missing.slice(0, 6).map((m) => `- ${m.name}`).join("\n");
        const more = missing.length > 6 ? `\n(and ${missing.length - 6} more...)` : "";
        const ok = window.confirm(
          `HSN is mandatory for B2B invoices.\n\nMissing HSN for:\n${names}${more}\n\nContinue anyway? (Backend will block if HSN is required)`
        );
        if (!ok) return;
      }
    }
    setLoading(true);
    setError("");
    try {
      track(events.ORDER_CREATED, {
        order_type: formData.orderType,
        item_count: formData.items.length,
        has_customer: !!(formData.customerName || formData.customerPhone),
      });

      // Apply overall discount to totalAmount if set
      const finalTotalAmount = formData.overallDiscount > 0 
        ? totalAmount // totalAmount already includes overall discount calculation
        : totalAmount;
      
      // CRITICAL FIX: Ensure customer name and phone are sent correctly (trimmed, not empty strings)
      // This ensures customers are always created in the database when invoice is created
      // Country-aware tax data: GST for India, VAT for EU
      const orderData: any = {
        ...formData,
        storeId: selectedStore.id,
        customerName: formData.customerName.trim() || undefined, // Send undefined if empty, not empty string
        customerPhone: formData.customerPhone.trim() || undefined, // Send undefined if empty, not empty string
        customerEmail: formData.customerEmail.trim() || undefined,
        billingAddress: formData.billingAddress.trim() || undefined,
        orderType: formData.orderType,
        printMode: formData.printMode,
        overallDiscount: formData.overallDiscount || 0,
        overallDiscountType: formData.overallDiscountType || "CASH",
        items: formData.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discountPercentage: item.discountPercentage || 0,
          taxPercentage: item.taxPercentage, // Include custom tax percentage if set (GST for India, VAT for EU)
          // Include new product data if product doesn't exist in inventory
          newProductData: item.newProductData,
        })),
      };
      
      // India-specific fields (GST)
      if (isIN) {
        orderData.customerGstin = formData.customerGstin.trim() || undefined;
        orderData.placeOfSupply = formData.placeOfSupply.trim() || undefined;
        // GST Mode will be determined from placeOfSupply in backend, but we can send it if needed
        orderData.gstMode = gstMode;
        orderData.isReverseCharge = formData.isReverseCharge || false;
      }
      
      // EU-specific fields (VAT)
      if (isNL || isDE) {
        orderData.vatRate = vatRate;
        orderData.vatMode = vatMode;
        if (customerVatId) {
          orderData.customerVatId = customerVatId.trim();
        }
      }

      const createdOrder = (await ordersService.createOrder(
        orderData
      )) as unknown as Order;

      // Track order creation with phone number (WhatsApp will be sent automatically by backend)
      if (orderData.customerPhone) {
        track(events.ORDER_CREATED, {
          action: "order_created_with_phone",
          hasPhone: true,
        });
      }

      // Poll for PDF URL and open in new tab
      const pollForPdf = async (orderId: string, maxAttempts = 7) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            // Prefer the download endpoint (works even if pdfUrl isn't persisted or has expired).
            const dl = await ordersService.getBillDownloadUrl(orderId);
            if (dl?.downloadUrl) {
              window.open(dl.downloadUrl, "_blank");
              return;
            }
          } catch (err) {
            // Expected while the async processor is still generating/uploading the PDF.
            console.warn("PDF not ready yet, retrying...", err);
          }
          // Wait 1000ms before next attempt
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        // If PDF not available after max attempts, show error
        setError(
          "PDF generation is taking longer than expected. Please try refreshing the page."
        );
      };

      // Store created order ID and customer info for WhatsApp/Email sending
      if (createdOrder?.id) {
        setLastCreatedOrderId(createdOrder.id);
        setLastCreatedOrderCustomerPhone(formData.customerPhone || null);
        setLastCreatedOrderCustomerEmail(formData.customerEmail || null);
        pollForPdf(createdOrder.id);
      }

      // Clear form after successful creation (reset to defaults)
      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerGstin: "",
        billingAddress: "",
        placeOfSupply: "",
        orderType: "B2C" as "B2C" | "B2B",
        printMode: "receipt", // Default to receipt for B2C
        overallDiscount: 0,
        overallDiscountType: "CASH" as "TRADE" | "CASH",
        isReverseCharge: false,
        items: [],
      });
      setSelectedProduct("");
      setItemQuantity("1");
      setQuantityInputs(new Map());
      setDiscountInputs(new Map());
      setProductCache(new Map());
      setItemProductNames(new Map()); // Clear product names cache
      setSelectedCustomerId(null); // Reset selected customer
      // Clear lastCreatedOrderId and customer info when starting a new order (after a delay to allow WhatsApp/Email sending)
      setTimeout(() => {
        setLastCreatedOrderId(null);
        setLastCreatedOrderCustomerPhone(null);
        setLastCreatedOrderCustomerEmail(null);
      }, 30000); // Clear after 30 seconds
      setPriceInputs(new Map());
      setTaxInputs(new Map());
      setError("");

      // Show success toast
      setSuccessMessage("Bill created successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create order";

      // Check if error is about insufficient inventory
      if (
        errorMessage.includes("Insufficient inventory") &&
        !allowNegativeStock
      ) {
        // Parse error message to extract product info
        const insufficientItems: Array<{
          productId: string;
          productName: string;
          availableQuantity: number;
          requestedQuantity: number;
          currentStock: number;
        }> = [];

        try {
          // Fetch all inventory to match products
          const inventory = await inventoryService.getInventory({
            limit: 1000,
            storeId: selectedStore.id,
          });

          // Extract product info from error message
          const match = errorMessage.match(
            /Insufficient inventory for (.+?)\. Available: (-?\d+), Requested: (\d+)/
          );

          if (match) {
            const productName = match[1].trim();
            const availableQuantity = parseInt(match[2]);
            const requestedQuantity = parseInt(match[3]);

            // Find the product in inventory by name
            const product = inventory.data.find((p) => p.name === productName);

            if (product) {
              insufficientItems.push({
                productId: product.id,
                productName: product.name,
                availableQuantity,
                requestedQuantity,
                currentStock: product.quantity,
              });
            }
          }

          // Always check all items against their current stock as a fallback
          for (const item of formData.items) {
            const product = inventory.data.find((p) => p.id === item.productId);

            if (product && product.quantity < item.quantity) {
              // Check if this item is already in insufficientItems
              const alreadyAdded = insufficientItems.some(
                (insufficient) => insufficient.productId === item.productId
              );

              if (!alreadyAdded) {
                insufficientItems.push({
                  productId: item.productId,
                  productName: product.name,
                  availableQuantity: product.quantity,
                  requestedQuantity: item.quantity,
                  currentStock: product.quantity,
                });
              }
            }
          }

          if (insufficientItems.length > 0) {
            setInsufficientStockItems(insufficientItems);
            setLoading(false);
            return;
          }
        } catch (fetchErr) {
          console.error("Error fetching inventory:", fetchErr);
          // Fall through to show general error
        }
      }

      // If not insufficient inventory error or allowNegativeStock is true, show error
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate subtotal before overall discount
  const subtotalBeforeDiscount = formData.items.reduce((sum, item) => {
    return sum + getItemSubtotal(item);
  }, 0);

  // Calculate overall discount based on type
  // Note: For trade discount, the backend will recalculate GST on reduced taxable value
  // Frontend shows approximate values; backend does the accurate GST calculation
  const overallDiscount = formData.overallDiscount || 0;
  const overallDiscountType = formData.overallDiscountType || "CASH";
  
  let overallDiscountAmount = 0;
  let totalAmount = subtotalBeforeDiscount;
  
  if (overallDiscount > 0) {
    if (overallDiscountType === "TRADE") {
      // Trade discount: Applied before GST (reduces taxable value)
      // Frontend shows approximate - backend will recalculate GST accurately
      overallDiscountAmount = (subtotalBeforeDiscount * overallDiscount) / 100;
      // Approximate: reduce by discount amount (GST will be recalculated by backend)
      totalAmount = subtotalBeforeDiscount - overallDiscountAmount;
    } else {
      // Cash discount: Applied after GST (doesn't affect taxable value)
      overallDiscountAmount = (subtotalBeforeDiscount * overallDiscount) / 100;
      totalAmount = subtotalBeforeDiscount - overallDiscountAmount;
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Create Bill
        </h1>
        <p className="text-gray-600 mt-1">
          Add products and create a new bill for your customer
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm text-red-800">
          {error}
        </div>
      )}

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          isOpen={!!successMessage}
          onClose={() => setSuccessMessage("")}
          duration={3000}
        />
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          <div className="space-y-4 flex-1 overflow-hidden">
            {!selectedStore && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No store available. Please contact administrator.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0 overflow-hidden">
              {/* Left Column - Small (1/4 width) */}
              <div className="lg:col-span-1 space-y-4">
                {/* For B2B in India: Show GSTIN field instead of Customer Name */}
                {isIN && formData.orderType === "B2B" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer GSTIN *
                      {fetchingGST && (
                        <span className="ml-2 text-xs text-blue-600 flex items-center">
                          <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Fetching details...
                        </span>
                      )}
                      {gstDetails && gstDetails.gstin === formData.customerGstin.trim().toUpperCase().replace(/\s+/g, '') && (
                        <span className="ml-2 text-xs text-green-600">✓ Verified</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.customerGstin}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/\s+/g, '');
                        setFormData({
                          ...formData,
                          customerGstin: value,
                        });
                        // Clear GST details if GSTIN changes
                        if (gstDetails && gstDetails.gstin !== value) {
                          setGstDetails(null);
                        }
                      }}
                      placeholder="Enter 15-digit GSTIN"
                      maxLength={15}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {gstDetails && gstDetails.gstin === formData.customerGstin.trim().toUpperCase().replace(/\s+/g, '') && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                        <div className="font-semibold mb-2 text-sm">✓ GST Details Verified (Auto-filled):</div>
                        <div className="space-y-1">
                          {gstDetails.legalName && (
                            <div><strong>Legal Name:</strong> {gstDetails.legalName}</div>
                          )}
                          {gstDetails.tradeName && gstDetails.tradeName !== gstDetails.legalName && (
                            <div><strong>Trade Name:</strong> {gstDetails.tradeName}</div>
                          )}
                          {gstDetails.status && (
                            <div><strong>Status:</strong> <span className={gstDetails.status.toLowerCase() === 'active' ? 'text-green-700' : 'text-red-700'}>{gstDetails.status}</span></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name
                    </label>
                    {selectedStore ? (
                      <CustomerSearchInput
                        storeId={selectedStore.id}
                        value={formData.customerName}
                        onChange={(value) => {
                          setFormData({
                            ...formData,
                            customerName: value,
                          });
                          // If user clears or changes name, reset selected customer
                          if (selectedCustomerId && (!value || value.trim() === "")) {
                            setSelectedCustomerId(null);
                          }
                        }}
                        onCustomerSelect={(customer: Customer) => {
                          // Populate all customer fields when customer is selected
                          console.log("Populating form with customer:", customer);
                          setSelectedCustomerId(customer.id); // Mark customer as selected FIRST
                          // Then update form data - this ensures phone field is disabled before value changes
                          setFormData((prev) => ({
                            ...prev,
                            customerName: customer.name,
                            customerPhone: customer.phone || "",
                            customerEmail: customer.email || "",
                            customerGstin: customer.gstin || "",
                            billingAddress: customer.billingAddress || "",
                          }));
                        }}
                        placeholder="Start typing customer name..."
                        searchBy="name"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Phone
                  </label>
                  {selectedStore ? (
                    <CustomerSearchInput
                      storeId={selectedStore.id}
                      value={formData.customerPhone}
                      onChange={(value) => {
                        // Only allow changes if customer is not selected
                        if (!selectedCustomerId) {
                          setFormData({
                            ...formData,
                            customerPhone: value,
                          });
                        }
                      }}
                      onCustomerSelect={(customer: Customer) => {
                        // Populate all customer fields when customer is selected
                        console.log("Populating form with customer:", customer);
                        setSelectedCustomerId(customer.id); // Mark customer as selected
                        setFormData((prev) => ({
                          ...prev,
                          customerName: customer.name,
                          customerPhone: customer.phone || "",
                          customerEmail: customer.email || "",
                          customerGstin: customer.gstin || "",
                          billingAddress: customer.billingAddress || "",
                        }));
                      }}
                      placeholder="Start typing phone number..."
                      searchBy="phone"
                      disabled={!!selectedCustomerId} // Disable if customer already selected from name
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerPhone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customerEmail: e.target.value,
                      })
                    }
                    placeholder="customer@example.com"
                    autoComplete="email"
                    data-lpignore="true"
                    data-form-type="other"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                {/* Billing Address for B2C (GST field removed for B2C) */}
                {isIN && formData.orderType === "B2C" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Billing Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.billingAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAddress: e.target.value,
                        })
                      }
                      placeholder="Enter billing address"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* For B2B: Show billing address field after GSTIN (if needed) */}
                {isIN && formData.orderType === "B2B" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Billing Address (Optional)
                      {gstDetails && gstDetails.address && (
                        <span className="ml-2 text-xs text-gray-500">(Auto-filled from GST)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.billingAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAddress: e.target.value,
                        })
                      }
                      placeholder="Enter billing address (or auto-filled from GSTIN)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {gstDetails && gstDetails.placeOfBusiness && gstDetails.placeOfBusiness.length > 0 && (
                      <div className="mt-1 text-xs text-blue-600 cursor-pointer hover:underline"
                        onClick={() => {
                          // Allow user to select different place of business if multiple exist
                          const pob = gstDetails.placeOfBusiness![0];
                          if (pob.address) {
                            setFormData({
                              ...formData,
                              billingAddress: pob.address,
                              placeOfSupply: pob.state || formData.placeOfSupply,
                            });
                          }
                        }}
                      >
                        {gstDetails.placeOfBusiness.length > 1 
                          ? `Multiple addresses found. Click to use: ${gstDetails.placeOfBusiness[0].address}`
                          : `Use registered address: ${gstDetails.placeOfBusiness[0].address}`}
                      </div>
                    )}
                  </div>
                )}

                {/* EU: VAT Fields (Simple) */}
                {(isNL || isDE) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Billing Address (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.billingAddress}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            billingAddress: e.target.value,
                          })
                        }
                        placeholder="Enter billing address"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <VATFields
                      vatRate={vatRate}
                      onVatRateChange={setVatRate}
                      vatMode={vatMode}
                      onVatModeChange={setVatMode}
                      customerVatId={customerVatId}
                      onCustomerVatIdChange={setCustomerVatId}
                      showVATBreakdown={false}
                    />
                  </>
                )}
              </div>

              {/* Right Column - Large (3/4 width) */}
              <div className="lg:col-span-3 flex flex-col min-h-0 overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Bill Items
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Bill Type:</span>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="orderType"
                          value="B2C"
                          checked={formData.orderType === "B2C"}
                          onChange={(e) => {
                            const newOrderType = e.target.value as "B2C" | "B2B";
                            // Auto-set print mode: B2C = receipt, B2B = A4
                            const newPrintMode = newOrderType === "B2B" ? "a4" : "receipt";
                            setFormData({
                              ...formData,
                              orderType: newOrderType,
                              printMode: newPrintMode,
                            });
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">B2C</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="orderType"
                          value="B2B"
                          checked={formData.orderType === "B2B"}
                          onChange={(e) => {
                            const newOrderType = e.target.value as "B2C" | "B2B";
                            // Auto-set print mode: B2C = receipt, B2B = A4
                            const newPrintMode = newOrderType === "B2B" ? "a4" : "receipt";
                            setFormData({
                              ...formData,
                              orderType: newOrderType,
                              printMode: newPrintMode,
                            });
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">B2B</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 flex-shrink-0"
                      style={{ height: "42px" }}
                      title="Scan barcode"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
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
                    </button>
                    <div className="flex-1">
                      <SearchableSelect
                        key={productSearchKey}
                        value={selectedProduct}
                        onChange={setSelectedProduct}
                        onProductSelect={handleProductSelect}
                        onAddNewProduct={handleAddNewProduct}
                        placeholder="Search and select a product..."
                        className=""
                        storeId={selectedStore?.id}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={
                          !allowNegativeStock && selectedProduct
                            ? (() => {
                                const qty =
                                  productCache.get(selectedProduct)?.quantity ||
                                  0;
                                return qty > 0 ? qty : undefined;
                              })()
                            : undefined
                        }
                        value={itemQuantity}
                        onChange={(e) => {
                          setItemQuantity(e.target.value);
                          setQuantityError("");
                        }}
                        placeholder="Qty"
                        className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={!selectedProduct}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                      style={{ height: "42px", minWidth: "80px" }}
                    >
                      Add
                    </button>
                  </div>
                  {selectedProduct && productCache.get(selectedProduct) && (
                    <div className="flex gap-2">
                      <div className="flex-1"></div>
                      <div className="w-20">
                        <span className="text-xs text-gray-500">
                          {allowNegativeStock
                            ? "Unlimited"
                            : `Max: ${
                                productCache.get(selectedProduct)?.quantity || 0
                              }`}
                        </span>
                      </div>
                      <div style={{ minWidth: "80px" }}></div>
                    </div>
                  )}
                </div>
                {quantityError && (
                  <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{quantityError}</p>
                  </div>
                )}

                {formData.items.length > 0 ? (
                  <div className="mt-4 border rounded-lg overflow-hidden flex-1 flex flex-col min-h-0" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-200">
                      {formData.items.map((item, index) => {
                        const product = productCache.get(item.productId);
                        return (
                          <div
                            key={index}
                            className="p-3 bg-white border-b border-gray-200 last:border-b-0"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900 flex-1">
                                {getProductName(item.productId)}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-800 text-sm ml-2"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-gray-500">Qty:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max={
                                      !allowNegativeStock
                                        ? (() => {
                                            const qty = product?.quantity || 0;
                                            return qty > 0 ? qty : undefined;
                                          })()
                                        : undefined
                                    }
                                    value={
                                      quantityInputs.get(index) ?? 
                                      (item.quantity != null ? String(item.quantity) : "1")
                                    }
                                    onChange={(e) => {
                                      updateItemQuantity(index, e.target.value);
                                    }}
                                    onBlur={() => {
                                      handleQuantityBlur(index);
                                    }}
                                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <span className="text-gray-500">MRP:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      priceInputs.get(index) ?? item.price.toFixed(2)
                                    }
                                    onChange={(e) => {
                                      updateItemPrice(index, e.target.value);
                                    }}
                                    onBlur={() => {
                                      handlePriceBlur(index);
                                    }}
                                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-gray-500">GST %:</span>
                                  <div className="flex items-center gap-1 mt-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={
                                        taxInputs.get(index) ?? 
                                        (item.taxPercentage ?? product?.taxPercentage ?? 0).toFixed(2)
                                      }
                                      onChange={(e) => {
                                        updateItemTaxPercentage(index, e.target.value);
                                      }}
                                      onBlur={() => {
                                        handleTaxBlur(index);
                                      }}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <span className="text-xs text-gray-500">%</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    ₹{getItemGST(item, product).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Discount %:
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={
                                      discountInputs.get(index) ??
                                      item.discountPercentage ??
                                      ""
                                    }
                                    onChange={(e) => {
                                      updateItemDiscount(index, e.target.value);
                                    }}
                                    onBlur={() => {
                                      handleDiscountBlur(index);
                                    }}
                                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-gray-500">
                                    Subtotal:
                                  </span>
                                  <p className="text-gray-900 font-medium">
                                    {formatCurrency(getItemSubtotal(item), country)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="px-3 py-3 bg-gray-50 border-t space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Subtotal:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(subtotalBeforeDiscount, country)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">Overall Discount:</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formData.overallDiscount === 0 ? "" : formData.overallDiscount.toString()}
                              onChange={(e) => {
                                const value = e.target.value.trim();
                                // Allow empty string, numbers, and decimal point
                                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                  const discount = value === "" ? 0 : parseFloat(value);
                                  if (isNaN(discount) || discount < 0) {
                                    setFormData({
                                      ...formData,
                                      overallDiscount: 0,
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      overallDiscount: Math.min(100, discount),
                                    });
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                // Ensure valid value on blur
                                const value = e.target.value.trim();
                                const discount = value === "" ? 0 : parseFloat(value);
                                if (isNaN(discount) || discount < 0) {
                                  setFormData({
                                    ...formData,
                                    overallDiscount: 0,
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    overallDiscount: Math.min(100, Math.max(0, discount)),
                                  });
                                }
                              }}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="0"
                            />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                          <span className="text-sm font-medium text-red-600">
                            -{formatCurrency(overallDiscountAmount, country)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                          <span className="font-semibold text-gray-900">
                            Grand Total:
                          </span>
                          <span className="font-bold text-lg text-gray-900">
                            ₹{totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-y-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Product
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Quantity
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              MRP
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {isIN ? t('tax.gst') : t('tax.vat')}
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Discount %
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Subtotal
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.items.map((item, index) => {
                            const product = productCache.get(item.productId);
                            return (
                              <tr key={index}>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {getProductName(item.productId)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">
                                  <input
                                    type="number"
                                    min="1"
                                    max={
                                      !allowNegativeStock
                                        ? (() => {
                                            const qty = product?.quantity || 0;
                                            return qty > 0 ? qty : undefined;
                                          })()
                                        : undefined
                                    }
                                    value={
                                      quantityInputs.get(index) ?? 
                                      (item.quantity != null ? String(item.quantity) : "1")
                                    }
                                    onChange={(e) => {
                                      updateItemQuantity(index, e.target.value);
                                    }}
                                    onBlur={() => {
                                      handleQuantityBlur(index);
                                    }}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      priceInputs.get(index) ?? item.price.toFixed(2)
                                    }
                                    onChange={(e) => {
                                      updateItemPrice(index, e.target.value);
                                    }}
                                    onBlur={() => {
                                      handlePriceBlur(index);
                                    }}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={
                                        taxInputs.get(index) ?? 
                                        (item.taxPercentage ?? product?.taxPercentage ?? 0).toFixed(2)
                                      }
                                      onChange={(e) => {
                                        updateItemTaxPercentage(index, e.target.value);
                                      }}
                                      onBlur={() => {
                                        handleTaxBlur(index);
                                      }}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <span className="text-xs">%</span>
                                    <span className="ml-1 text-xs">
                                      {isIN ? '₹' : '€'}{getItemGST(item, product).toFixed(2)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={
                                      discountInputs.get(index) ??
                                      item.discountPercentage ??
                                      ""
                                    }
                                    onChange={(e) => {
                                      updateItemDiscount(index, e.target.value);
                                    }}
                                    onBlur={() => {
                                      handleDiscountBlur(index);
                                    }}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">
                                  {formatCurrency(getItemSubtotal(item), country)}
                                </td>
                                <td className="px-3 py-2 text-sm text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Remove item"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="px-3 py-4 bg-gray-50 border-t space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Subtotal:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(subtotalBeforeDiscount, country)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">Overall Discount:</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formData.overallDiscount === 0 ? "" : formData.overallDiscount.toString()}
                              onChange={(e) => {
                                const value = e.target.value.trim();
                                // Allow empty string, numbers, and decimal point
                                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                  const discount = value === "" ? 0 : parseFloat(value);
                                  if (isNaN(discount) || discount < 0) {
                                    setFormData({
                                      ...formData,
                                      overallDiscount: 0,
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      overallDiscount: Math.min(100, discount),
                                    });
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                // Ensure valid value on blur
                                const value = e.target.value.trim();
                                const discount = value === "" ? 0 : parseFloat(value);
                                if (isNaN(discount) || discount < 0) {
                                  setFormData({
                                    ...formData,
                                    overallDiscount: 0,
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    overallDiscount: Math.min(100, Math.max(0, discount)),
                                  });
                                }
                              }}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="0"
                            />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                          <span className="text-sm font-medium text-red-600">
                            -{formatCurrency(overallDiscountAmount, country)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                          <span className="font-semibold text-gray-900">
                            Grand Total:
                          </span>
                          <span className="font-bold text-lg text-gray-900">
                            ₹{totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                    <p className="text-gray-500 text-sm">
                      No items added yet. Select a product above and click
                      &quot;Add&quot; to add items to this bill.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50 mt-auto">
          {/* WhatsApp and Email buttons - always visible after bill creation */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                if (!lastCreatedOrderId) {
                  setError("Please create the bill first before sending via WhatsApp");
                  return;
                }
                const customerPhone = lastCreatedOrderCustomerPhone || formData.customerPhone;
                if (!customerPhone) {
                  setError("Customer phone number is required to send WhatsApp");
                  return;
                }
                trackButton("Send WhatsApp", { location: "create_bill_page" });
                setSendingWhatsApp(true);
                setError("");
                try {
                  await ordersService.sendWhatsApp(
                    lastCreatedOrderId,
                    selectedStore?.id
                  );
                  setSuccessMessage("Invoice sent via WhatsApp successfully!");
                  setTimeout(() => setSuccessMessage(""), 3000);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Failed to send WhatsApp. Please try again."
                  );
                } finally {
                  setSendingWhatsApp(false);
                }
              }}
              disabled={sendingWhatsApp || !lastCreatedOrderId || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2"
              title={!lastCreatedOrderId ? "Create bill first to send via WhatsApp" : "Send invoice via WhatsApp"}
            >
              {sendingWhatsApp ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Send WhatsApp
                </>
              )}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!lastCreatedOrderId) {
                  setError("Please create the bill first before sending via email");
                  return;
                }
                const customerEmail = lastCreatedOrderCustomerEmail || formData.customerEmail;
                if (!customerEmail) {
                  setError("Customer email is required to send email");
                  return;
                }
                trackButton("Send Email", { location: "create_bill_page" });
                setSendingEmail(true);
                setError("");
                try {
                  await ordersService.sendEmail(
                    lastCreatedOrderId,
                    selectedStore?.id
                  );
                  setSuccessMessage("Invoice sent via email successfully!");
                  setTimeout(() => setSuccessMessage(""), 3000);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Failed to send email. Please try again."
                  );
                } finally {
                  setSendingEmail(false);
                }
              }}
              disabled={sendingEmail || !lastCreatedOrderId || loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2"
              title={!lastCreatedOrderId ? "Create bill first to send via email" : "Send invoice via email"}
            >
              {sendingEmail ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </>
              )}
            </button>
          </div>

          {/* Cancel and Create Bill buttons - Print format is auto-set based on B2C/B2B */}
          <div className="flex gap-3 items-center flex-wrap">
            <button
              type="button"
              onClick={() => {
                trackButton("Cancel", { location: "create_bill_page" });
                router.push("/invoices");
              }}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedStore || formData.items.length === 0 || loading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              {loading ? "Creating..." : "Create Bill"}
            </button>
          </div>
        </div>
      </form>

      {showQuickAddProductModal && selectedStore && (
        <QuickAddProductModal
          initialName={newProductName}
          onClose={() => {
            setShowQuickAddProductModal(false);
            setNewProductName("");
          }}
          onAdd={async (quickProductData) => {
            try {
              // CRITICAL FIX: Don't create product when adding to bill - only create when invoice is generated
              // Store product data temporarily with a temporary ID
              const tempProductId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              
              // Create temporary product option for display
              const productOption: ProductOption = {
                id: tempProductId,
                name: quickProductData.name,
                sellingPrice: quickProductData.sellingPrice,
                mrp: quickProductData.mrp,
                taxPercentage: quickProductData.taxPercentage || 0,
                marginPercentage: 0,
                quantity: 0, // Product doesn't exist yet, quantity will be set when invoice is created
              };
              setProductCache(new Map(productCache.set(tempProductId, productOption)));
              setItemProductNames(new Map(itemProductNames.set(tempProductId, quickProductData.name)));

              // Automatically add the product to bill items with new product data
              const orderQuantity = quickProductData.quantity; // Use the quantity from form (any quantity allowed)
              const price = quickProductData.mrp;
              const discount = quickProductData.discountPercentage;
              const taxPercentage = quickProductData.taxPercentage || 0;

              // Check if product already exists in bill items
              // Note: For new products, we use tempProductId, so we check by tempProductId
              // However, since each new product gets a unique tempProductId, they won't match
              // This check is mainly for existing products that might be added again
              const existingItemIndex = formData.items.findIndex(
                (item) => item.productId === tempProductId
              );

              if (existingItemIndex >= 0) {
                // If already exists, increment quantity and preserve custom GST/discount
                const existingQuantity =
                  formData.items[existingItemIndex].quantity;
                const totalQuantity = existingQuantity + orderQuantity;
                // Preserve existing custom GST/discount if they were set
                const existingTaxPercentage = formData.items[existingItemIndex].taxPercentage;
                const existingDiscount = formData.items[existingItemIndex].discountPercentage;

                const updatedItems = [...formData.items];
                updatedItems[existingItemIndex] = {
                  ...updatedItems[existingItemIndex],
                  quantity: totalQuantity,
                  // Preserve existing discount if set, otherwise use new discount
                  discountPercentage: existingDiscount !== undefined && existingDiscount !== null ? existingDiscount : discount,
                  // Preserve existing tax if set, otherwise use new tax
                  taxPercentage: existingTaxPercentage !== undefined && existingTaxPercentage !== null ? existingTaxPercentage : taxPercentage,
                };
                setFormData({
                  ...formData,
                  items: updatedItems,
                });
                // Update quantity input to reflect new total
                setQuantityInputs(new Map(quantityInputs.set(existingItemIndex, totalQuantity.toString())));
              } else {
                // Add new item to bill
                const newItemIndex = formData.items.length;
                setFormData({
                  ...formData,
                  items: [
                    ...formData.items,
                    {
                      productId: tempProductId,
                      quantity: orderQuantity,
                      price,
                      discountPercentage: discount,
                      taxPercentage: taxPercentage, // Include tax percentage
                      newProductData: quickProductData, // Store new product data for backend creation
                    },
                  ],
                });
                // CRITICAL FIX: Store product name for display
                setItemProductNames(new Map(itemProductNames.set(tempProductId, quickProductData.name)));
                // Set initial discount and tax input values
                setDiscountInputs(
                  new Map(
                    discountInputs.set(newItemIndex, discount.toString())
                  )
                );
                setTaxInputs(
                  new Map(
                    taxInputs.set(newItemIndex, taxPercentage.toString())
                  )
                );
                // Set initial quantity input
                setQuantityInputs(
                  new Map(
                    quantityInputs.set(newItemIndex, orderQuantity.toString())
                  )
                );
              }

              setQuantityError("");
              // Clear selection after adding
              setSelectedProduct("");
              setItemQuantity("1");
              setShowQuickAddProductModal(false);
              setNewProductName("");
              // Refresh product search dropdown
              setProductSearchKey((prev) => prev + 1);

              setSuccessMessage(
                `Product "${quickProductData.name}" added to bill. Product will be created in inventory when invoice is generated.`
              );
              setTimeout(() => setSuccessMessage(""), 5000);
            } catch (err: any) {
              setError(err.message || "Failed to add product");
              setTimeout(() => setError(""), 5000);
              throw err;
            }
          }}
        />
      )}

      {insufficientStockItems.length > 0 && (
        <UpdateInventoryModal
          key={insufficientStockItems.map((i) => i.productId).join("-")}
          items={insufficientStockItems}
          onClose={() => {
            setInsufficientStockItems([]);
            setPendingItemAddition(null);
          }}
          onUpdate={async (updates) => {
            try {
              if (!selectedStore?.id) {
                setQuantityError("No store selected");
                return;
              }
              // Update all products
              for (const update of updates) {
                await inventoryService.updateProduct(
                  update.productId,
                  {
                    quantity: update.newQuantity,
                  },
                  selectedStore.id
                );
              }

              // Update product cache directly with new quantities
              const updatedCache = new Map(productCache);
              for (const update of updates) {
                const existingProduct = updatedCache.get(update.productId);
                if (existingProduct) {
                  // Update the quantity in cache
                  updatedCache.set(update.productId, {
                    ...existingProduct,
                    quantity: update.newQuantity,
                  });
                }
              }
              setProductCache(updatedCache);

              // Retry adding the item if there was a pending addition
              if (pendingItemAddition) {
                const updatedProduct = updatedCache.get(
                  pendingItemAddition.productId
                );
                if (updatedProduct) {
                  const existingItemIndex = formData.items.findIndex(
                    (item) => item.productId === pendingItemAddition.productId
                  );

                  if (existingItemIndex >= 0) {
                    // Update existing item
                    const existingQuantity =
                      formData.items[existingItemIndex].quantity;
                    const totalQuantity =
                      existingQuantity + pendingItemAddition.quantity;
                    // CRITICAL FIX: Preserve existing custom GST/discount when updating quantity
                    const existingTax = formData.items[existingItemIndex].taxPercentage;
                    const existingDiscount = formData.items[existingItemIndex].discountPercentage;
                    const updatedItems = [...formData.items];
                    updatedItems[existingItemIndex] = {
                      ...updatedItems[existingItemIndex],
                      quantity: totalQuantity,
                      // Preserve existing custom GST/discount
                      taxPercentage: existingTax,
                      discountPercentage: existingDiscount,
                    };
                    setFormData({
                      ...formData,
                      items: updatedItems,
                    });
                    // Update quantity input to reflect new total
                    setQuantityInputs(new Map(quantityInputs.set(existingItemIndex, totalQuantity.toString())));
                  } else {
                    // Add new item
                    const price =
                      updatedProduct.mrp || updatedProduct.sellingPrice || 0;
                    // CRITICAL FIX: Use custom discount/GST from productCache if previously set
                    const initialDiscount =
                      updatedProduct.marginPercentage || 0;
                    const initialTax = updatedProduct.taxPercentage || 0;
                    const newItemIndex = formData.items.length;
                    setFormData({
                      ...formData,
                      items: [
                        ...formData.items,
                        {
                          productId: pendingItemAddition.productId,
                          quantity: pendingItemAddition.quantity,
                          price,
                          discountPercentage: initialDiscount,
                          taxPercentage: initialTax, // Include tax percentage
                        },
                      ],
                    });
                    // CRITICAL FIX: Store product name for display
                    if (updatedProduct) {
                      setItemProductNames(new Map(itemProductNames.set(pendingItemAddition.productId, updatedProduct.name)));
                    }
                    // CRITICAL FIX: Store product name for display
                    if (updatedProduct) {
                      setItemProductNames(new Map(itemProductNames.set(pendingItemAddition.productId, updatedProduct.name)));
                    }
                    // Set initial discount, tax, and quantity input values
                    setDiscountInputs(
                      new Map(
                        discountInputs.set(
                          newItemIndex,
                          initialDiscount.toString()
                        )
                      )
                    );
                    setTaxInputs(
                      new Map(
                        taxInputs.set(
                          newItemIndex,
                          initialTax.toString()
                        )
                      )
                    );
                    setQuantityInputs(
                      new Map(
                        quantityInputs.set(
                          newItemIndex,
                          pendingItemAddition.quantity.toString()
                        )
                      )
                    );
                  }

                  // Clear selection
                  setSelectedProduct("");
                  setItemQuantity("1");
                  setQuantityError("");
                }
              }

              // Close the modal and clear pending addition after successful update
              setInsufficientStockItems([]);
              setPendingItemAddition(null);
            } catch (err) {
              setQuantityError(
                err instanceof Error
                  ? err.message
                  : "Failed to update inventory"
              );
              // Don't close modal on error so user can retry
            }
          }}
        />
      )}

      {showScanner && (
        <CameraScannerModal
          type="both"
          onClose={() => {
            setShowScanner(false);
          }}
          onScan={(code) => {
            handleBarcodeScan(code);
          }}
        />
      )}

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
