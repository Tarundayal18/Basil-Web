"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useCountry } from "@/contexts/CountryContext";
import { useI18n } from "@/contexts/I18nContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { storeSettingsService } from "@/services/storeSettings.service";
import SearchableSelect from "./SearchableSelect";
import AddProductModal from "../inventory/AddProductModal";
import UpdateInventoryModal from "./UpdateInventoryModal";
import CameraScannerModal from "../inventory/CameraScannerModal";
import { inventoryService } from "@/services/inventory.service";
import CustomerSearchInput from "../billing/CustomerSearchInput";
import { Customer } from "@/services/customers.service";
import { GSTFields } from "@/components/tax/GSTFields";
import { VATFields } from "@/components/tax/VATFields";
import { formatCurrency } from "@/lib/region-config";

interface ProductOption {
  id: string;
  name: string;
  sellingPrice?: number;
  quantity: number;
}

interface CreateOrderModalProps {
  onClose: () => void;
  onCreate: (orderData: {
    storeId: string;
    customerName?: string;
    customerPhone?: string;
    customerGstin?: string; // India only
    customerVatId?: string; // EU only
    billingAddress?: string;
    placeOfSupply?: string; // India only
    orderType?: string;
    // India GST fields
    gstMode?: 'INTRA' | 'INTER';
    isReverseCharge?: boolean;
    // EU VAT fields
    vatRate?: number;
    vatMode?: 'normal' | 'reverse_charge' | 'intra_eu_b2b' | 'export';
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
      discountPercentage?: number;
    }>;
  }) => Promise<void>;
}

export default function CreateOrderModal({
  onClose,
  onCreate,
}: CreateOrderModalProps) {
  const { selectedStore } = useStore();
  const { country, isIN, isNL, isDE } = useCountry();
  const { track, trackButton, events } = useAnalytics(
    "Create Order Modal",
    false
  );
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);

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

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerGstin: "",
    customerVatId: "",
    billingAddress: "",
    placeOfSupply: "",
    orderType: "B2C" as "B2C" | "B2B",
    items: [] as Array<{
      productId: string;
      quantity: number;
      price: number;
      discountPercentage?: number;
    }>,
  });
  const [selectedProduct, setSelectedProduct] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [quantityError, setQuantityError] = useState("");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
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
      { id: string; name: string; sellingPrice?: number; quantity: number }
    >
  >(new Map());
  const [showScanner, setShowScanner] = useState(false);

  const handleProductSelect = (product: ProductOption) => {
    setProductCache(new Map(productCache.set(product.id, product)));
    setQuantityError("");
  };

  /**
   * Handles barcode scanning - finds product by barcode and adds it to the bill
   */
  const handleBarcodeScan = async (barcode: string) => {
    try {
      const product = await inventoryService.getProductByBarcode(barcode);
      if (!product) {
        alert("Product not found for barcode: " + barcode);
        return;
      }

      // Convert product to ProductOption format
      const productOption: ProductOption = {
        id: product.id,
        name: product.name,
        sellingPrice: product.sellingPrice,
        quantity: product.quantity,
      };

      // Add to cache
      setProductCache(new Map(productCache.set(product.id, productOption)));

      // Add item to bill with quantity 1
      const orderQuantity = 1;
      const price = productOption.sellingPrice || 0;

      // Check if item already exists in bill
      const existingItemIndex = formData.items.findIndex(
        (item) => item.productId === product.id
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const existingQuantity = formData.items[existingItemIndex].quantity;
        const totalQuantity = existingQuantity + orderQuantity;

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
        } else {
          const updatedItems = [...formData.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: totalQuantity,
          };
          setFormData({
            ...formData,
            items: updatedItems,
          });
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
        } else {
          setFormData({
            ...formData,
            items: [
              ...formData.items,
              {
                productId: productOption.id,
                quantity: orderQuantity,
                price,
                discountPercentage: 0,
              },
            ],
          });
        }
      }

      setQuantityError("");
    } catch (err) {
      console.error("Failed to handle barcode scan:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to add product from barcode"
      );
    }
  };

  const handleAddNewProduct = (productName: string) => {
    setNewProductName(productName);
    setShowAddProductModal(true);
  };

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
        quantity: created.quantity,
      };

      // Add to cache
      setProductCache(
        new Map(productCache.set(productOption.id, productOption))
      );

      // Automatically add the product to bill items with quantity 1
      const price = productOption.sellingPrice || 0;
      const orderQuantity = 1;

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
          const updatedItems = [...formData.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: totalQuantity,
          };
          setFormData({
            ...formData,
            items: updatedItems,
          });
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
          setFormData({
            ...formData,
            items: [
              ...formData.items,
              {
                productId: productOption.id,
                quantity: orderQuantity,
                price,
                discountPercentage: 0,
              },
            ],
          });
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
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: totalQuantity,
      };
      setFormData({
        ...formData,
        items: updatedItems,
      });
    } else {
      const price = product.sellingPrice || 0;
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            productId: selectedProduct,
            quantity: requestedQuantity,
            price,
            discountPercentage: 0,
          },
        ],
      });
    }

    setSelectedProduct("");
    setItemQuantity("1");
    setQuantityError("");
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItemQuantity = (index: number, value: string) => {
    const item = formData.items[index];
    if (!item) return;

    const product = productCache.get(item.productId);
    if (!product) return;

    // Store the raw input value
    setQuantityInputs(new Map(quantityInputs.set(index, value)));

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

    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
    };

    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

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
  };

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

  // Calculate discounted price for an item
  const getDiscountedPrice = (item: {
    price: number;
    discountPercentage?: number;
  }) => {
    const discount = item.discountPercentage || 0;
    return item.price * (1 - discount / 100);
  };

  // Calculate subtotal for an item
  const getItemSubtotal = (item: {
    price: number;
    quantity: number | string;
    discountPercentage?: number;
  }) => {
    const discountedPrice = getDiscountedPrice(item);
    const qty =
      typeof item.quantity === "string"
        ? parseInt(item.quantity) || 1
        : item.quantity;
    return discountedPrice * qty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || formData.items.length === 0) {
      return;
    }
    setLoading(true);
    try {
      track(events.ORDER_CREATED, {
        order_type: formData.orderType,
        item_count: formData.items.length,
        has_customer: !!(formData.customerName || formData.customerPhone),
      });
      await onCreate({
        ...formData,
        storeId: selectedStore.id,
        customerGstin: formData.customerGstin.trim() || undefined,
        customerVatId: formData.customerVatId.trim() || undefined,
        billingAddress: formData.billingAddress.trim() || undefined,
        placeOfSupply: formData.placeOfSupply.trim() || undefined,
        orderType: formData.orderType,
      });
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.items.reduce(
    (sum, item) => sum + getItemSubtotal(item),
    0
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Bill</h2>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {!selectedStore && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    No store available. Please contact administrator.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-4 gap-6">
                {/* Left Column - Small (1/4 width) */}
                <div className="col-span-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name
                    </label>
                    {selectedStore ? (
                      <CustomerSearchInput
                        storeId={selectedStore.id}
                        value={formData.customerName}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            customerName: value,
                          })
                        }
                        onCustomerSelect={(customer: Customer) => {
                          // Populate all customer fields when customer is selected (country-aware)
                          setFormData({
                            ...formData,
                            customerName: customer.name,
                            customerPhone: customer.phone || "",
                            customerGstin: isIN ? (customer.gstin || "") : "",
                            customerVatId: (isNL || isDE) ? (customer.vatId || "") : "",
                            billingAddress: customer.billingAddress || "",
                          });
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
                    <p className="mt-1 text-xs text-gray-500">
                      Start typing to search existing customers
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Phone
                    </label>
                    {selectedStore ? (
                      <CustomerSearchInput
                        storeId={selectedStore.id}
                        value={formData.customerPhone}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            customerPhone: value,
                          })
                        }
                        onCustomerSelect={(customer: Customer) => {
                          // Populate all customer fields when customer is selected (country-aware)
                          setFormData({
                            ...formData,
                            customerName: customer.name,
                            customerPhone: customer.phone || "",
                            customerGstin: isIN ? (customer.gstin || "") : "",
                            customerVatId: (isNL || isDE) ? (customer.vatId || "") : "",
                            billingAddress: customer.billingAddress || "",
                          });
                        }}
                        placeholder="Start typing phone number..."
                        searchBy="phone"
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
                    <p className="mt-1 text-xs text-gray-500">
                      Start typing to search existing customers
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.customerGstin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerGstin: e.target.value,
                        })
                      }
                      placeholder="15-digit GSTIN"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Place of Supply (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.placeOfSupply}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          placeOfSupply: e.target.value,
                        })
                      }
                      placeholder="Enter place of supply"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bill Type
                    </label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="orderType"
                          value="B2C"
                          checked={formData.orderType === "B2C"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              orderType: e.target.value as "B2C" | "B2B",
                            })
                          }
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
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              orderType: e.target.value as "B2C" | "B2B",
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">B2B</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column - Large (3/4 width) */}
                <div className="col-span-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Bill Items
                  </h3>
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
                        {selectedStore ? (
                          <SearchableSelect
                            key={productSearchKey}
                            value={selectedProduct}
                            onChange={setSelectedProduct}
                            onProductSelect={handleProductSelect}
                            onAddNewProduct={handleAddNewProduct}
                            placeholder="Search and select a product..."
                            className=""
                            storeId={selectedStore.id}
                          />
                        ) : (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100 cursor-not-allowed"
                            placeholder="Select a store first..."
                            disabled
                          />
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max={
                            !allowNegativeStock && selectedProduct
                              ? (() => {
                                  const qty =
                                    productCache.get(selectedProduct)
                                      ?.quantity || 0;
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
                                  productCache.get(selectedProduct)?.quantity ||
                                  0
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
                    <div className="mt-4 border rounded-lg overflow-hidden">
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
                                  {product?.name || "Unknown"}
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
                                              const qty =
                                                product?.quantity || 0;
                                              return qty > 0 ? qty : undefined;
                                            })()
                                          : undefined
                                      }
                                      value={
                                        typeof item.quantity === "string"
                                          ? item.quantity
                                          : item.quantity
                                      }
                                      onChange={(e) => {
                                        updateItemQuantity(
                                          index,
                                          e.target.value
                                        );
                                      }}
                                      onBlur={() => {
                                        handleQuantityBlur(index);
                                      }}
                                      className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-gray-500">
                                      Price:
                                    </span>
                                    <p className="text-gray-900 font-medium">
                                      {formatCurrency(item.price, country)}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
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
                                        updateItemDiscount(
                                          index,
                                          e.target.value
                                        );
                                      }}
                                      onBlur={() => {
                                        handleDiscountBlur(index);
                                      }}
                                      className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                  </div>
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
                        <div className="px-3 py-3 bg-gray-50 border-t">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">
                              Total:
                            </span>
                            <span className="font-bold text-lg text-gray-900">
                              {formatCurrency(totalAmount, country)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Desktop Table View */}
                      <div className="hidden md:block">
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
                                Price
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Discount %
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Subtotal
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {formData.items.map((item, index) => {
                              const product = productCache.get(item.productId);
                              return (
                                <tr key={index}>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {product?.name || "Unknown"}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-500">
                                    <input
                                      type="number"
                                      min="1"
                                      max={
                                        !allowNegativeStock
                                          ? (() => {
                                              const qty =
                                                product?.quantity || 0;
                                              return qty > 0 ? qty : undefined;
                                            })()
                                          : undefined
                                      }
                                      value={
                                        typeof item.quantity === "string"
                                          ? item.quantity
                                          : item.quantity
                                      }
                                      onChange={(e) => {
                                        updateItemQuantity(
                                          index,
                                          e.target.value
                                        );
                                      }}
                                      onBlur={() => {
                                        handleQuantityBlur(index);
                                      }}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-500">
                                    ₹{item.price.toFixed(2)}
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
                                        updateItemDiscount(
                                          index,
                                          e.target.value
                                        );
                                      }}
                                      onBlur={() => {
                                        handleDiscountBlur(index);
                                      }}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-500">
                                    ₹{getItemSubtotal(item).toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    <button
                                      type="button"
                                      onClick={() => removeItem(index)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="px-3 py-2 bg-gray-50 border-t">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">
                              Total:
                            </span>
                            <span className="font-bold text-lg text-gray-900">
                              {formatCurrency(totalAmount, country)}
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
          <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => {
                trackButton("Cancel", { location: "create_order_modal" });
                onClose();
              }}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !selectedStore || formData.items.length === 0 || loading
              }
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              {loading ? "Creating..." : "Create Bill"}
            </button>
          </div>
        </form>
      </div>

      {showAddProductModal && selectedStore && (
        <AddProductModal
          initialName={newProductName}
          onClose={() => {
            setShowAddProductModal(false);
            setNewProductName("");
          }}
          onAdd={async (productData) => {
            try {
              const created = await handleCreateProduct(productData);
              // Automatically add the product to bill items with quantity 1
              const price = created.sellingPrice || 0;
              const orderQuantity = 1;

              // Check if product already exists in bill items
              const existingItemIndex = formData.items.findIndex(
                (item) => item.productId === created.id
              );

              if (existingItemIndex >= 0) {
                // If already exists, increment quantity
                const existingQuantity =
                  formData.items[existingItemIndex].quantity;
                const totalQuantity = existingQuantity + orderQuantity;

                if (!allowNegativeStock && totalQuantity > created.quantity) {
                  // Show update inventory modal instead of error
                  setInsufficientStockItems([
                    {
                      productId: created.id,
                      productName: created.name,
                      availableQuantity: created.quantity,
                      requestedQuantity: totalQuantity,
                      currentStock: created.quantity,
                    },
                  ]);
                  setPendingItemAddition({
                    productId: created.id,
                    quantity: orderQuantity,
                  });
                } else {
                  const updatedItems = [...formData.items];
                  updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: totalQuantity,
                  };
                  setFormData({
                    ...formData,
                    items: updatedItems,
                  });
                  setQuantityError("");
                }
              } else {
                // Add new item to bill
                if (!allowNegativeStock && orderQuantity > created.quantity) {
                  // Show update inventory modal instead of error
                  setInsufficientStockItems([
                    {
                      productId: created.id,
                      productName: created.name,
                      availableQuantity: created.quantity,
                      requestedQuantity: orderQuantity,
                      currentStock: created.quantity,
                    },
                  ]);
                  setPendingItemAddition({
                    productId: created.id,
                    quantity: orderQuantity,
                  });
                } else {
                  setFormData({
                    ...formData,
                    items: [
                      ...formData.items,
                      {
                        productId: created.id,
                        quantity: orderQuantity,
                        price,
                        discountPercentage: 0,
                      },
                    ],
                  });
                  setQuantityError("");
                }
              }

              // Clear selection after adding
              setSelectedProduct("");
              setItemQuantity("1");
              setShowAddProductModal(false);
              setNewProductName("");
              // Refresh product search dropdown
              setProductSearchKey((prev) => prev + 1);
            } catch (err) {
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
              // Update all products
              for (const update of updates) {
                await inventoryService.updateProduct(update.productId, {
                  quantity: update.newQuantity,
                });
              }

              // Update product cache directly with new quantities
              // We already know the new quantities from the updates, so no need to fetch
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
                    const updatedItems = [...formData.items];
                    updatedItems[existingItemIndex] = {
                      ...updatedItems[existingItemIndex],
                      quantity: totalQuantity,
                    };
                    setFormData({
                      ...formData,
                      items: updatedItems,
                    });
                  } else {
                    // Add new item
                    const price = updatedProduct.sellingPrice || 0;
                    setFormData({
                      ...formData,
                      items: [
                        ...formData.items,
                        {
                          productId: pendingItemAddition.productId,
                          quantity: pendingItemAddition.quantity,
                          price,
                          discountPercentage: 0,
                        },
                      ],
                    });
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
          type="barcode"
          onClose={() => setShowScanner(false)}
          onScan={(code) => {
            handleBarcodeScan(code);
          }}
        />
      )}
    </div>
  );
}
