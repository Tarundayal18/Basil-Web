/**
 * This file contains the ConfirmDeleteModal component which displays a confirmation dialog
 * for deleting products. It supports both single product deletion and bulk deletion scenarios.
 */

"use client";

import { useAnalytics } from "@/hooks/useAnalytics";

interface ConfirmDeleteModalProps {
  /**
   * Callback function to close the modal
   */
  onClose: () => void;
  /**
   * Callback function to confirm the deletion
   */
  onConfirm: () => void;
  /**
   * The number of products to be deleted (1 for single, >1 for bulk)
   */
  itemCount: number;
  /**
   * Whether the deletion is in progress
   */
  isDeleting?: boolean;
}

/**
 * ConfirmDeleteModal displays a confirmation dialog for product deletion.
 * It shows different messages for single vs bulk deletion.
 */
export default function ConfirmDeleteModal({
  onClose,
  onConfirm,
  itemCount,
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  const { trackButton, track, events } = useAnalytics(
    "Confirm Delete Modal",
    false
  );
  const isBulk = itemCount > 1;
  const title = isBulk ? "Delete Products" : "Delete Product";
  const message = isBulk
    ? `Are you sure you want to delete ${itemCount} product(s)? This action cannot be undone.`
    : "Are you sure you want to delete this product? This action cannot be undone.";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <p className="mb-6 text-gray-600 ml-[52px]">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              trackButton("Cancel", { location: "confirm_delete_modal" });
              onClose();
            }}
            disabled={isDeleting}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              trackButton("Delete", {
                location: "confirm_delete_modal",
                item_count: itemCount,
                is_bulk: isBulk,
              });
              track(events.PRODUCT_DELETED, {
                item_count: itemCount,
                is_bulk: isBulk,
              });
              onConfirm();
            }}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isDeleting && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
