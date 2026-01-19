"use client";

import { useAnalytics } from "@/hooks/useAnalytics";

interface QRCodeModalProps {
  onClose: () => void;
  onGenerate: () => void;
  itemCount: number;
}

/**
 * QRCodeModal displays a confirmation dialog for generating QR codes
 */
export default function QRCodeModal({
  onClose,
  onGenerate,
  itemCount,
}: QRCodeModalProps) {
  const { trackButton, track, events } = useAnalytics("QR Code Modal", false);
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          Generate QR Codes
        </h2>
        <p className="mb-6 text-gray-600">
          Generate QR codes for {itemCount} selected items?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              trackButton("Cancel", { location: "qr_code_modal" });
              onClose();
            }}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              trackButton("Generate QR Codes", { location: "qr_code_modal", item_count: itemCount });
              track(events.QR_CODE_GENERATED, { item_count: itemCount });
              onGenerate();
            }}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
