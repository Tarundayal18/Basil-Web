"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import { CheckCircle } from "lucide-react";

/**
 * Props for the DeleteBillingAccountSuccessModal component
 */
interface DeleteBillingAccountSuccessModalProps {
  /**
   * Callback function to close the modal
   */
  onClose: () => void;
  /**
   * The name of the billing account that was deleted (optional)
   */
  accountName?: string;
  /**
   * The email of the billing account that was deleted
   */
  accountEmail: string;
}

/**
 * Modal component for displaying success message after deleting a billing account
 */
export default function DeleteBillingAccountSuccessModal({
  onClose,
  accountName,
  accountEmail,
}: DeleteBillingAccountSuccessModalProps) {
  const { trackButton } = useAnalytics("Delete Success Modal", false);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Account Deleted</h2>
        </div>
        <div className="mb-6 text-gray-600 ml-[52px]">
          <p className="mb-3">
            The billing account has been successfully deleted.
          </p>
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {accountName || "Unnamed Account"}
            </p>
            <p className="text-sm text-gray-600">{accountEmail}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              trackButton("Close", {
                location: "delete_success_modal",
              });
              onClose();
            }}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
