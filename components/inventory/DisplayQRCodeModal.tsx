/**
 * This file contains the DisplayQRCodeModal component which displays a QR code
 * for a product and allows users to print it with a quantity selection modal.
 */

"use client";

import { useState, useEffect } from "react";
import QRCodeLib from "qrcode";
import { useAnalytics } from "@/hooks/useAnalytics";
import { inventoryService } from "@/services/inventory.service";
import type { Product } from "@/services/inventory.service";
import PrintQuantityModal from "./PrintQuantityModal";
import Toast from "../Toast";

interface DisplayQRCodeModalProps {
  item: Product;
  onClose: () => void;
}

/**
 * DisplayQRCodeModal displays a QR code for a product and allows users
 * to print it with a quantity selection modal.
 */
export default function DisplayQRCodeModal({
  item,
  onClose,
}: DisplayQRCodeModalProps) {
  const { trackButton } = useAnalytics("Display QR Code Modal", false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [showPrintQuantityModal, setShowPrintQuantityModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (item.qrCode) {
      QRCodeLib.toDataURL(item.qrCode, {
        width: 300,
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
   * Opens the print quantity modal.
   */
  const handlePrint = () => {
    trackButton("Print QR Code", {
      location: "display_qr_code_modal",
      product_id: item.id,
    });
    setShowPrintQuantityModal(true);
  };

  /**
   * Performs the actual QR code printing after quantity is confirmed.
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
      const blob = await inventoryService.downloadQRCodes(
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[calc(100vh-2rem)] my-auto overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          QR Code - {item.name}
        </h2>
        <div className="mb-6">
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 flex flex-col items-center">
            <p className="text-sm text-gray-600 mb-4 font-medium">
              {item.name}
            </p>
            {qrCodeDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                className="w-64 h-64 border border-gray-300"
              />
            ) : (
              <div className="w-64 h-64 border border-gray-300 flex items-center justify-center">
                <p className="text-gray-400">Generating QR code...</p>
              </div>
            )}
            {/* CRITICAL FIX: Removed QR code link display - business name will be shown in printed PDF instead */}
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            Print
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
              setSuccessMessage("Generating QR code PDF... Please wait.");
              performPrint(quantity, rows, columns);
            }, 100);
          }}
          type="qr"
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
