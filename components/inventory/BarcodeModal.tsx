"use client";

import { useAnalytics } from "@/hooks/useAnalytics";

interface BarcodeModalProps {
  onClose: () => void;
  onGenerate: () => void;
  itemCount: number;
}

/**
 * BarcodeModal displays a confirmation dialog for generating barcodes
 */
export default function BarcodeModal({
  onClose,
  onGenerate,
  itemCount,
}: BarcodeModalProps) {
  const { trackButton, track, events } = useAnalytics("Barcode Modal", false);
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          Generate Barcodes
        </h2>
        <p className="mb-6 text-gray-600">
          Generate barcodes for {itemCount} selected items?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              trackButton("Cancel", { location: "barcode_modal" });
              onClose();
            }}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              trackButton("Generate Barcodes", {
                location: "barcode_modal",
                item_count: itemCount,
              });
              track(events.BARCODE_GENERATED, { item_count: itemCount });
              onGenerate();
            }}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
