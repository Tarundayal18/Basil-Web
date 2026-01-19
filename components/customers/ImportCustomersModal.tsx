"use client";

import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Download, CheckCircle, AlertCircle } from "lucide-react";

/**
 * Import result structure
 */
export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; phone: string; error: string }>;
}

/**
 * Modal component for importing customers from CSV/XLSX file
 */
interface ImportCustomersModalProps {
  onClose: () => void;
  onImport: (file: File) => Promise<ImportResult>;
}

export default function ImportCustomersModal({
  onClose,
  onImport,
}: ImportCustomersModalProps) {
  const { trackButton, track, events } = useAnalytics(
    "Import Customers Modal",
    false
  );
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      setLoading(true);
      try {
        trackButton("Import Customers", {
          location: "import_customers_modal",
          file_type: file.type || file.name.split(".").pop(),
        });
        track(events.CUSTOMER_IMPORTED, {
          file_type: file.type || file.name.split(".").pop(),
        });
        const result = await onImport(file);
        setImportResult(result);
      } catch (error) {
        // Error is handled by parent component
        throw error;
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Handle closing the success modal
   */
  const handleCloseSuccess = () => {
    setImportResult(null);
    setFile(null);
    onClose();
  };

  /**
   * Download sample CSV file
   */
  const handleDownloadSample = () => {
    trackButton("Download Sample CSV", { location: "import_customers_modal" });
    const link = document.createElement("a");
    link.href = "/customers_import_sample.csv";
    link.download = "customers_import_sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show success modal if import result is available
  if (importResult) {
    const hasErrors = importResult.errors.length > 0;
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            {hasErrors ? (
              <AlertCircle className="w-8 h-8 text-amber-500" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              Import {hasErrors ? "Completed with Warnings" : "Successful"}
            </h2>
          </div>

          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium mb-1">
                  Created
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {importResult.created}
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-1">
                  Updated
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {importResult.updated}
                </p>
              </div>
            </div>

            {importResult.skipped > 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700 font-medium mb-1">
                  Skipped
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {importResult.skipped}
                </p>
              </div>
            )}

            {hasErrors && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-900 mb-2">
                  Errors ({importResult.errors.length})
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {importResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className="text-xs bg-white p-2 rounded border border-amber-100"
                    >
                      <span className="font-medium">Row {error.row}:</span>{" "}
                      {error.error}
                      {error.phone && (
                        <span className="text-gray-500 ml-1">
                          (Phone: {error.phone})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Total processed:</span>{" "}
                {importResult.total} rows
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCloseSuccess}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Import Customers
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File (CSV, XLSX, or XLS)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: CSV, Excel (XLSX, XLS)
            </p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Need a template?
                </p>
                <p className="text-xs text-blue-700">
                  Download our sample CSV file with the correct format and
                  example data.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Download Sample
              </button>
            </div>
          </div>

          <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Required columns:
            </p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Phone (required)</li>
              <li>Name (required)</li>
              <li>Email (optional)</li>
              <li>GSTIN (optional)</li>
              <li>Billing Address (optional)</li>
              <li>Segment (optional: vip, regular, inactive)</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                trackButton("Cancel", { location: "import_customers_modal" });
                onClose();
              }}
              disabled={loading}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || loading}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              {loading ? "Importing..." : "Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
