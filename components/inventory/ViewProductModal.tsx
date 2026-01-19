/**
 * This file contains the ViewProductModal component for displaying product details.
 * It shows comprehensive product information in a modern, organized layout.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import type { Product } from "@/services/inventory.service";
import { useAnalytics } from "@/hooks/useAnalytics";
import { inventoryService } from "@/services/inventory.service";
import JsBarcode from "jsbarcode";
import QRCodeLib from "qrcode";
import {
  Package,
  IndianRupee,
  Percent,
  Box,
  Hash,
  Store,
  X,
  Tag,
  Layers,
  Building2,
  ShoppingCart,
  Barcode,
  QrCode,
} from "lucide-react";

interface ViewProductModalProps {
  item: Product;
  onClose: () => void;
}

/**
 * Renders an info card with label and value.
 * @param label - The label text
 * @param value - The value to display
 * @param icon - Optional icon component
 * @param highlight - Whether to highlight this field
 * @returns JSX element for the info card
 */
function InfoCard({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-4 h-4 text-[#46499e]" />}
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {label}
        </label>
      </div>
      <p
        className={`text-base font-semibold ${
          highlight ? "text-[#46499e]" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * ViewProductModal displays detailed product information in a modal.
 * @param item - The product to display
 * @param onClose - Callback function to close the modal
 */
export default function ViewProductModal({
  item,
  onClose,
}: ViewProductModalProps) {
  const { trackButton } = useAnalytics("View Product Modal", false);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Fetches supplier name if supplierId exists.
   */
  useEffect(() => {
    const fetchSupplierName = async () => {
      if (item.supplierId && item.store?.id) {
        try {
          const suppliers = await inventoryService.getSuppliers(item.store.id);
          const supplier = suppliers.find((s) => s.id === item.supplierId);
          if (supplier) {
            setSupplierName(supplier.name);
          }
        } catch (error) {
          console.error("Failed to fetch supplier:", error);
        }
      }
    };
    fetchSupplierName();
  }, [item.supplierId, item.store?.id]);

  /**
   * Generates QR code image if qrCode exists.
   */
  useEffect(() => {
    if (item.qrCode) {
      QRCodeLib.toDataURL(item.qrCode, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((url: string) => {
          setQrCodeDataUrl(url);
        })
        .catch((err: Error) => {
          console.error("QR code generation failed:", err);
        });
    }
  }, [item.qrCode]);

  /**
   * Generates barcode image if barcode exists.
   */
  useEffect(() => {
    if (barcodeCanvasRef.current && item.barcode) {
      JsBarcode(barcodeCanvasRef.current, item.barcode, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      });
    }
  }, [item.barcode]);

  /**
   * Formats a value for display, handling null, undefined, boolean, and number types.
   * @param value - The value to format
   * @returns Formatted string representation of the value
   */
  const formatValue = (
    value: string | number | boolean | null | undefined
  ): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") {
      if (Number.isInteger(value)) return value.toString();
      return value.toFixed(2);
    }
    return value.toString();
  };

  /**
   * Formats currency values for display.
   * @param value - The numeric value to format as currency
   * @returns Formatted currency string
   */
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "-";
    return `₹${formatValue(value)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#46499e] to-[#6b6fb8] px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Product Details</h2>
              <p className="text-sm text-white/80 mt-0.5">{item.name}</p>
            </div>
          </div>
          <button
            onClick={() => {
              trackButton("Close", { location: "view_product_modal_header" });
              onClose();
            }}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2 lg:col-span-3">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-6">
                  <Tag className="w-5 h-5 text-[#46499e]" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Basic Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoCard
                    label="Product Name"
                    value={item.name}
                    icon={Package}
                    highlight
                  />
                  <InfoCard
                    label="Category"
                    value={item.category?.name || "-"}
                    icon={Layers}
                  />
                  <InfoCard
                    label="Subcategory"
                    value={item.subcategory?.name || "-"}
                    icon={Layers}
                  />
                  <InfoCard
                    label="Brand"
                    value={item.brand?.name || "-"}
                    icon={Tag}
                  />
                  <InfoCard
                    label="HSN Code"
                    value={formatValue(item.hsnCode)}
                    icon={Hash}
                  />
                  {item.supplierId && (
                    <InfoCard
                      label="Supplier"
                      value={supplierName || formatValue(item.supplierId)}
                      icon={ShoppingCart}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="md:col-span-2 lg:col-span-3">
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-2 mb-6">
                  <IndianRupee className="w-5 h-5 text-[#46499e]" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Pricing Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InfoCard
                    label="MRP"
                    value={formatCurrency(item.mrp)}
                    icon={IndianRupee}
                    highlight
                  />
                  <InfoCard
                    label="Cost Price (Incl GST)"
                    value={formatCurrency(item.costPrice)}
                    icon={IndianRupee}
                  />
                  <InfoCard
                    label="Cost Price Base (Excl GST)"
                    value={formatCurrency(item.costPriceBase)}
                    icon={IndianRupee}
                  />
                  <InfoCard
                    label="Cost GST"
                    value={formatCurrency(item.costGST)}
                    icon={IndianRupee}
                  />
                  <InfoCard
                    label="Selling Price (Incl GST)"
                    value={formatCurrency(item.sellingPrice)}
                    icon={IndianRupee}
                    highlight
                  />
                  <InfoCard
                    label="Selling Price Base (Excl GST)"
                    value={formatCurrency(item.sellingPriceBase)}
                    icon={IndianRupee}
                  />
                  <InfoCard
                    label="Selling GST"
                    value={formatCurrency(item.sellingGST)}
                    icon={IndianRupee}
                  />
                </div>
              </div>
            </div>

            {/* Tax & Margin Information */}
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100 h-full">
                <div className="flex items-center gap-2 mb-6">
                  <Percent className="w-5 h-5 text-[#46499e]" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Tax & Margins
                  </h3>
                </div>
                <div className="space-y-4">
                  <InfoCard
                    label="Tax Percentage"
                    value={`${formatValue(item.taxPercentage)}%`}
                    icon={Percent}
                  />
                  <InfoCard
                    label="Selling Margin"
                    value={`${formatValue(item.marginPercentage)}%`}
                    icon={Percent}
                  />
                  <InfoCard
                    label="Cost Margin"
                    value={`${formatValue(item.purchaseMarginPercentage)}%`}
                    icon={Percent}
                  />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border border-green-100 h-full">
                <div className="flex items-center gap-2 mb-6">
                  <Box className="w-5 h-5 text-[#46499e]" />
                  <h3 className="text-lg font-bold text-gray-900">Inventory</h3>
                </div>
                <div className="space-y-4">
                  <InfoCard
                    label="Quantity"
                    value={formatValue(item.quantity)}
                    icon={Box}
                    highlight
                  />
                </div>
              </div>
            </div>

            {/* QR Code & Barcode */}
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 border border-orange-100 h-full">
                <div className="flex items-center gap-2 mb-6">
                  <QrCode className="w-5 h-5 text-[#46499e]" />
                  <h3 className="text-lg font-bold text-gray-900">
                    QR Code & Barcode
                  </h3>
                </div>
                <div className="space-y-4">
                  {item.qrCode && qrCodeDataUrl ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <QrCode className="w-4 h-4 text-[#46499e]" />
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          QR Code
                        </label>
                      </div>
                      <div className="flex flex-col items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrCodeDataUrl}
                          alt="QR Code"
                          className="w-32 h-32 border border-gray-300 mb-2"
                        />
                        <p className="text-xs font-mono text-gray-600 break-all text-center">
                          {item.qrCode}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="w-4 h-4 text-[#46499e]" />
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          QR Code
                        </label>
                      </div>
                      <p className="text-sm font-mono text-gray-900 break-all">
                        {formatValue(item.qrCode)}
                      </p>
                    </div>
                  )}
                  {item.barcode ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Barcode className="w-4 h-4 text-[#46499e]" />
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Barcode
                        </label>
                      </div>
                      <div className="flex flex-col items-center">
                        <canvas
                          ref={barcodeCanvasRef}
                          className="max-w-full mb-2"
                        />
                        <p className="text-xs font-mono text-gray-600 break-all text-center">
                          {item.barcode}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Barcode className="w-4 h-4 text-[#46499e]" />
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Barcode
                        </label>
                      </div>
                      <p className="text-sm font-mono text-gray-900 break-all">
                        {formatValue(item.barcode)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={() => {
              trackButton("Close", { location: "view_product_modal_footer" });
              onClose();
            }}
            className="px-6 py-2.5 bg-[#46499e] text-white rounded-lg hover:bg-[#3a3d85] transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
