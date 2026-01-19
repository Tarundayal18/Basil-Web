"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import WorldClassScanner from "@/lib/world-class-scanner";

interface CameraScannerModalProps {
  onClose: () => void;
  onScan: (code: string) => void;
  type: "barcode" | "qr" | "both";
}

export default function CameraScannerModal({
  onClose,
  onScan,
  type,
}: CameraScannerModalProps) {
  const { trackButton, track } = useAnalytics("Camera Scanner Modal", false);

  const handleDetected = (code: string, metadata?: { type: "barcode" | "qr"; method: "hardware" | "camera"; payload?: any }) => {
    track("Code Scanned", { 
      type: type, 
      scanner: metadata?.method || "camera", 
      barcode: code,
      codeType: metadata?.type || (type === "qr" ? "qr" : "barcode")
    });
    onScan(code);
  };

  const handleClose = () => {
    trackButton("Close", {
      location: "camera_scanner_modal",
      type: type,
    });
    onClose();
  };

  return (
    <WorldClassScanner
      open={true}
      onClose={handleClose}
      onDetected={handleDetected}
      type={type}
      enableHardwareScanner={true}
      enableOfflineCache={true}
    />
  );
}
