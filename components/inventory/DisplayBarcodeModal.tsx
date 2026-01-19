/**
 * This file contains the DisplayBarcodeModal component which displays a barcode
 * for a product and allows users to print it with a quantity selection modal.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { useAnalytics } from "@/hooks/useAnalytics";
import { inventoryService } from "@/services/inventory.service";
import { printBarcode } from "@/lib/products.barcode";
import type { Product } from "@/services/inventory.service";
import PrintQuantityModal from "./PrintQuantityModal";
import Toast from "../Toast";

interface DisplayBarcodeModalProps {
  item: Product;
  onClose: () => void;
}

/**
 * DisplayBarcodeModal displays a barcode for a product and allows users
 * to print it with a quantity selection modal.
 */
export default function DisplayBarcodeModal({
  item,
  onClose,
}: DisplayBarcodeModalProps) {
  const { trackButton } = useAnalytics("Display Barcode Modal", false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showPrintQuantityModal, setShowPrintQuantityModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (canvasRef.current && item.barcode) {
      JsBarcode(canvasRef.current, item.barcode, {
        format: "EAN13",
        width: 2,
        height: 70,
        displayValue: true,
        fontSize: 14,
        margin: 8,
        valid: function(valid) {
          if (!valid) {
            console.warn("EAN-13 barcode validation failed, attempting to render anyway");
          }
        }
      });
    }
  }, [item.barcode]);

  /**
   * Opens the print quantity modal.
   */
  const handlePrint = () => {
    trackButton("Print Barcode", {
      location: "display_barcode_modal",
      product_id: item.id,
    });
    setShowPrintQuantityModal(true);
  };

  /**
   * Performs the actual barcode printing after quantity is confirmed.
   * @param quantity - The number of copies to print
   * @param rows - The number of rows per page
   * @param columns - The number of columns per page
   */
  const performPrint = async (
    quantity: number,
    rows: number,
    columns: number
  ) => {
    try {
      const blob = await inventoryService.downloadBarcodes(
        [item.id],
        quantity,
        rows,
        columns
      );
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");

      if (printWindow) {
        const checkReady = () => {
          try {
            if (printWindow.document.readyState === "complete") {
              setTimeout(() => {
                printWindow.print();
                setTimeout(() => {
                  window.URL.revokeObjectURL(url);
                }, 1000);
              }, 1000);
            } else {
              setTimeout(checkReady, 100);
            }
          } catch {
            setTimeout(() => {
              printWindow.print();
              setTimeout(() => {
                window.URL.revokeObjectURL(url);
              }, 1000);
            }, 2000);
          }
        };

        setTimeout(checkReady, 500);

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
      console.error("Print failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          Barcode - {item.name}
        </h2>
        <div className="mb-6">
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 flex flex-col items-center">
            <p className="text-sm text-gray-600 mb-4 font-medium">
              {item.name}
            </p>
            <canvas ref={canvasRef} className="max-w-full" />
            <p className="text-xs text-gray-500 mt-2 font-mono">
              {item.barcode}
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              trackButton("Close", { location: "display_barcode_modal" });
              onClose();
            }}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Close
          </button>
          <button
            onClick={() => {
              trackButton("Print Barcode", { location: "display_barcode_modal" });
              printBarcode({
                barcode: item.barcode || "",
                name: item.name,
                productId: item.productId,
              });
            }}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            Print Barcode
          </button>
        </div>
      </div>

      {showPrintQuantityModal && (
        <PrintQuantityModal
          isOpen={showPrintQuantityModal}
          onClose={() => setShowPrintQuantityModal(false)}
          onConfirm={(quantity, rows, columns) => {
            setShowPrintQuantityModal(false);
            // Show success toast after modal closes
            setTimeout(() => {
              setSuccessMessage("Generating barcode PDF... Please wait.");
              performPrint(quantity, rows, columns);
            }, 100);
          }}
          type="barcode"
          itemCount={1}
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
