"use client";

import { useState, useRef, useEffect } from "react";
import { scannedBillsService, ScannedBill } from "@/services/scannedBills.service";
import { Upload, X, FileText, Image as ImageIcon, AlertTriangle, CheckCircle } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";

interface UploadBillModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface DuplicateInfo {
  bill: ScannedBill;
  message: string;
}

export default function UploadBillModal({
  onClose,
  onSuccess,
}: UploadBillModalProps) {
  const { selectedStore } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF, JPG, or PNG file");
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setError("");
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Poll for bill status to detect duplicates
  useEffect(() => {
    if (!uploadId || !selectedStore?.id) return;

    const pollForBill = async () => {
      try {
        // Wait a bit for OCR processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Get all bills and check for the newly uploaded one
        const result = await scannedBillsService.getScannedBills({
          storeId: selectedStore.id,
          limit: 100,
        });

        // Find the bill that matches our upload (by checking recent bills)
        const recentBill = result.bills
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (recentBill && recentBill.status === "DUPLICATE" && recentBill.duplicateOf) {
          // Find the original bill
          const originalBill = result.bills.find(b => b.id === recentBill.duplicateOf);
          if (originalBill) {
            setDuplicateInfo({
              bill: originalBill,
              message: `This invoice appears to be already uploaded. Invoice Number: ${originalBill.invoiceNumber}, Date: ${originalBill.invoiceDate}, Supplier: ${originalBill.supplierName}`,
            });
            setShowDuplicatePopup(true);
          }
        } else if (recentBill && recentBill.status === "PENDING") {
          // Bill is still processing, continue polling
          return;
        } else if (recentBill && recentBill.status === "PROCESSED") {
          // Bill processed successfully - items were added to inventory
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          
          console.log(`✅ Bill processed successfully`);
          
          onSuccess();
        } else if (recentBill && (recentBill.status === "FAILED" || recentBill.status === "OCR_FAILED")) {
          // Bill processing failed
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setError(`Bill processing failed: ${recentBill.status === "OCR_FAILED" ? "OCR extraction failed" : "Unknown error"}`);
        }
      } catch (err) {
        console.error("Error polling for bill status:", err);
      }
    };

    // Poll every 3 seconds for up to 60 seconds (OCR and processing can take time)
    let pollCount = 0;
    const maxPolls = 20; // 20 * 3 = 60 seconds
    pollIntervalRef.current = setInterval(() => {
      pollCount++;
      if (pollCount >= maxPolls) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        // Bill is taking longer than expected, but don't fail - it might still process
        console.log("Bill processing taking longer than expected. It will be processed in the background.");
        // Still call onSuccess to close modal and refresh
        onSuccess();
        return;
      }
      pollForBill();
    }, 3000); // Poll every 3 seconds instead of 2

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [uploadId, selectedStore?.id, onSuccess]);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setDuplicateInfo(null);
      setShowDuplicatePopup(false);

      // Get presigned URL
      const { uploadId: newUploadId, presignedUrl, key } = await scannedBillsService.getUploadUrl(
        file.name,
        file.type
      );

      setUploadId(newUploadId);

      // Upload to S3
      await scannedBillsService.uploadFileToS3(presignedUrl, file);

      // Notify backend that upload is complete to trigger OCR processing
      if (key) {
        try {
          await scannedBillsService.notifyUploadComplete(newUploadId, key);
          // Don't call onSuccess immediately - wait for duplicate check
        } catch (notifyError) {
          console.error("Error notifying upload complete:", notifyError);
          // Still proceed - OCR might be triggered via S3 events
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload bill";
      setError(errorMessage);
      console.error("Upload error:", err);
      setUploading(false);
    }
  };

  const handleDuplicateContinue = () => {
    setShowDuplicatePopup(false);
    setUploading(false);
    onSuccess(); // Close modal and refresh
  };

  const handleDuplicateCancel = () => {
    setShowDuplicatePopup(false);
    setUploading(false);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Upload Purchase Invoice</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            disabled={uploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  {file.type === "application/pdf" ? (
                    <FileText className="w-12 h-12 text-indigo-600" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-indigo-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-gray-700 font-medium">
                    Drag and drop your invoice here
                  </p>
                  <p className="text-sm text-gray-500 mt-1">or</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Browse files
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, JPG, PNG (max 10MB)
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!file || uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>

      {/* Duplicate Detection Popup */}
      {showDuplicatePopup && duplicateInfo && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-200">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900">Duplicate Invoice Detected</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  This invoice appears to be already uploaded:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Supplier:</span>
                    <span className="text-gray-900">{duplicateInfo.bill.supplierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Invoice Number:</span>
                    <span className="text-gray-900">{duplicateInfo.bill.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Invoice Date:</span>
                    <span className="text-gray-900">{duplicateInfo.bill.invoiceDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Total Amount:</span>
                    <span className="text-gray-900">₹{duplicateInfo.bill.totalAmount?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> If you deleted items from inventory by mistake, 
                  processing this bill will only add the missing items back.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDuplicateCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel Upload
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateContinue}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

