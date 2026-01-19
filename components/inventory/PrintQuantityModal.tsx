/**
 * This file contains the PrintQuantityModal component which displays a modal
 * for users to input the quantity of copies, rows, and columns for printing barcodes or QR codes.
 */

"use client";

import { useState, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface PrintQuantityModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback function to close the modal
   */
  onClose: () => void;
  /**
   * Callback function called when user confirms with quantity, rows, and columns
   * @param quantity - The number of copies to print
   * @param rows - The number of rows per page
   * @param columns - The number of columns per page
   */
  onConfirm: (quantity: number, rows: number, columns: number) => void;
  /**
   * The type of item being printed (barcode or QR code)
   */
  type: "barcode" | "qr";
  /**
   * The number of items being printed (for display purposes)
   */
  itemCount?: number;
}

/**
 * PrintQuantityModal displays a modal for users to input the quantity,
 * rows, and columns for printing barcodes or QR codes.
 */
export default function PrintQuantityModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  itemCount = 1,
}: PrintQuantityModalProps) {
  const { trackButton, track } = useAnalytics("Print Quantity Modal", false);
  const maxRows = type === "qr" ? 3 : 10;
  const maxColumns = type === "qr" ? 2 : 3;
  const defaultRows = type === "qr" ? 3 : 6;
  const defaultColumns = type === "qr" ? 2 : 2;

  const [quantity, setQuantity] = useState<string>("1");
  const [rows, setRows] = useState<string>(defaultRows.toString());
  const [columns, setColumns] = useState<string>(defaultColumns.toString());
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setQuantity("1");
      setRows(defaultRows.toString());
      setColumns(defaultColumns.toString());
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /**
   * Handles the form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    const rowsNum = parseInt(rows, 10);
    const colsNum = parseInt(columns, 10);

    if (isNaN(qty) || qty < 1) {
      setError("Please enter a valid quantity greater than 0");
      return;
    }

    if (isNaN(rowsNum) || rowsNum < 1 || rowsNum > maxRows) {
      setError(`Rows must be between 1 and ${maxRows}`);
      return;
    }

    if (isNaN(colsNum) || colsNum < 1 || colsNum > maxColumns) {
      setError(`Columns must be between 1 and ${maxColumns}`);
      return;
    }

    trackButton("Confirm Print", {
      location: "print_quantity_modal",
      type: type,
      quantity: qty,
      rows: rowsNum,
      columns: colsNum,
      item_count: itemCount,
    });
    track("Print Confirmed", {
      type: type,
      quantity: qty,
      rows: rowsNum,
      columns: colsNum,
      item_count: itemCount,
    });
    onConfirm(qty, rowsNum, colsNum);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          Print {type === "barcode" ? "Barcodes" : "QR Codes"}
        </h2>
        <p className="text-gray-600 mb-6">
          {itemCount > 1
            ? `You have selected ${itemCount} items. How many copies would you like to print?`
            : "How many copies would you like to print?"}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Number of Copies
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-lg"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="rows"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Rows per Page (max {maxRows})
              </label>
              <input
                id="rows"
                type="number"
                min="1"
                max={maxRows}
                value={rows}
                onChange={(e) => {
                  setRows(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-lg"
              />
            </div>
            <div>
              <label
                htmlFor="columns"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Columns per Page (max {maxColumns})
              </label>
              <input
                id="columns"
                type="number"
                min="1"
                max={maxColumns}
                value={columns}
                onChange={(e) => {
                  setColumns(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-lg"
              />
            </div>
          </div>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                trackButton("Cancel", { location: "print_quantity_modal" });
                onClose();
              }}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              Print
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
