"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import { AlertTriangle } from "lucide-react";

/**
 * Props for the DeleteBillingAccountModal component
 */
interface DeleteBillingAccountModalProps {
  /**
   * Callback function to close the modal
   */
  onClose: () => void;
  /**
   * Callback function to confirm the deletion
   */
  onConfirm: () => void;
  /**
   * The name of the billing account being deleted (optional)
   */
  accountName?: string;
  /**
   * The email of the billing account being deleted
   */
  accountEmail: string;
  /**
   * Whether the deletion is in progress
   */
  isDeleting?: boolean;
}

/**
 * Modal component for confirming deletion of a billing account
 */
export default function DeleteBillingAccountModal({
  onClose,
  onConfirm,
  accountName,
  accountEmail,
  isDeleting = false,
}: DeleteBillingAccountModalProps) {
  const { trackButton, track, events } = useAnalytics(
    "Delete Billing Account Modal",
    false
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Delete Billing Account
          </h2>
        </div>
        <div className="mb-6 text-gray-600 ml-[52px]">
          <p className="mb-2">
            Are you sure you want to delete this billing account? This action
            cannot be undone.
          </p>
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {accountName || "Unnamed Account"}
            </p>
            <p className="text-sm text-gray-600">{accountEmail}</p>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              trackButton("Cancel", {
                location: "delete_billing_account_modal",
              });
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
                location: "delete_billing_account_modal",
                account_email: accountEmail,
              });
              track(events.BILLING_ACCOUNT_UPDATED, {
                action: "delete_confirmed",
                account_email: accountEmail,
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
