"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

type Props = {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
};

// Play success sound
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (err) {
    // Silently fail if audio context is not available
  }
};

// Vibrate on mobile devices
const vibrate = () => {
  if ("vibrate" in navigator) {
    navigator.vibrate(50);
  }
};

export default function BarcodeScanner({ open, onClose, onDetected }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = "barcode-scanner-video";
  const detectedRef = useRef(false);
  const isScanningRef = useRef(false);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success">("idle");

  function stopAll() {
    if (scannerRef.current && isScanningRef.current) {
      try {
        // CRITICAL FIX: Stop scanner properly and clear DOM to prevent duplicate streams
        scannerRef.current.stop().then(() => {
          const element = document.getElementById(scannerElementId);
          if (element) {
            element.innerHTML = "";
          }
          scannerRef.current?.clear();
        }).catch(() => {
          // Even if stop fails, clear the element
          const element = document.getElementById(scannerElementId);
          if (element) {
            element.innerHTML = "";
          }
          scannerRef.current?.clear();
        });
        isScanningRef.current = false;
        setIsScanning(false);
      } catch (err) {
        console.log("Scanner stop error (ignored):", err);
        // Force clear element on error
        const element = document.getElementById(scannerElementId);
        if (element) {
          element.innerHTML = "";
        }
      } finally {
        scannerRef.current = null;
      }
    }
  }

  async function startScanner() {
    if (isScanningRef.current || scannerRef.current) {
      return;
    }

    try {
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 150));

      const element = document.getElementById(scannerElementId);
      if (!element) {
        setError("Scanner element not found");
        return;
      }

      // CRITICAL FIX: formatsToSupport must be passed to constructor, not start() method
      const scanner = new Html5Qrcode(scannerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
      } as any); // Type assertion needed if types don't match library version
      
      isScanningRef.current = true;
      setIsScanning(true);
      setScanStatus("scanning");
      scannerRef.current = scanner;

      // For laptops, try user-facing camera first, then environment
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const cameraFacingMode = isMobile ? "environment" : "user"; // Front camera for laptops
      
      await scanner.start(
        { facingMode: cameraFacingMode },
        {
          fps: 30, // Higher FPS for smoother scanning
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            // CRITICAL FIX: Use full viewfinder for maximum scanning area (like WhatsApp)
            // This allows scanning from anywhere, not just a small box
            // IMPORTANT: Html5Qrcode requires minimum 50px for both width and height
            const MIN_QRBOX_SIZE = 50;
            
            // Ensure viewfinder dimensions are valid (at least 50px)
            const safeWidth = Math.max(viewfinderWidth || 640, MIN_QRBOX_SIZE);
            const safeHeight = Math.max(viewfinderHeight || 480, MIN_QRBOX_SIZE);
            
            return {
              width: safeWidth, // Use full width (already validated to be at least 50px)
              height: Math.max(Math.floor(safeHeight * 0.4), MIN_QRBOX_SIZE), // Taller area, but at least 50px
            };
          },
          disableFlip: false,
          // CRITICAL FIX: Remove aspectRatio constraint that causes divided screen
          videoConstraints: {
            facingMode: cameraFacingMode,
            width: { ideal: 1920, min: 640 }, // Lower min for better compatibility
            height: { ideal: 1080, min: 480 },
            // DO NOT set aspectRatio - let camera use natural ratio
          },
        },
        (decodedText, decodedResult) => {
          console.log("🔍 Scanner callback triggered:", { decodedText, decodedResult, detectedRef: detectedRef.current });
          
          if (detectedRef.current) {
            console.log("⏭️ Skipping - already detected");
            return;
          }

          // Validate decoded text
          if (!decodedText || typeof decodedText !== "string" || decodedText.trim().length === 0) {
            console.warn("⚠️ Invalid barcode detected:", decodedText, decodedResult);
            return;
          }

          const cleanedBarcode = decodedText.trim();
          console.log("✅ Barcode detected successfully:", cleanedBarcode, "Full result:", decodedResult);

          detectedRef.current = true;
          setScanStatus("success");
          playSuccessSound();
          vibrate();
          stopAll();

          try {
            console.log("📤 Calling onDetected with barcode:", cleanedBarcode);
            onDetected(cleanedBarcode);
          } catch (err) {
            console.error("❌ Error in onDetected callback:", err);
          }

          try {
            onClose();
          } catch (err) {
            console.error("❌ Error closing scanner:", err);
          }
        },
        (errorMessage) => {
          // Log errors for debugging (but don't show to user as they're frequent during scanning)
          if (errorMessage) {
            // Only log non-common errors
            if (!errorMessage.includes("NotFoundException") && 
                !errorMessage.includes("No MultiFormat Readers") &&
                !errorMessage.includes("QR code parse error")) {
              console.debug("📊 Scanning error:", errorMessage);
            }
          }
        }
      );
    } catch (err) {
      isScanningRef.current = false;
      scannerRef.current = null;
      setIsScanning(false);
      setScanStatus("idle");
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to start camera. Please check permissions.";
      setError(errorMessage);
      throw err;
    }
  }

  useEffect(() => {
    if (!open) {
      stopAll();
      detectedRef.current = false;
      setScanStatus("idle");
      return;
    }

    detectedRef.current = false;
    setError("");
    setScanStatus("idle");

    let isMounted = true;

    (async () => {
      try {
        await startScanner();
      } catch (e) {
        if (!isMounted) return;
        
        console.error("Barcode scanner error:", e);
        const errorMessage =
          e instanceof Error
            ? e.message
            : "Camera unavailable. Please check permissions.";
        setError(errorMessage);
        stopAll();
        detectedRef.current = false;
        setScanStatus("idle");
      }
    })();

    return () => {
      isMounted = false;
      stopAll();
      detectedRef.current = false;
      setScanStatus("idle");
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-3 transition-opacity duration-200">
      <div className="bg-white rounded-2xl p-4 w-full max-w-md max-h-[85vh] overflow-auto transform transition-all duration-300">
        <div className="flex justify-between items-center mb-2 sticky top-0 bg-white pt-1">
          <div>
            <div className="font-bold text-lg">Scan Barcode</div>
            <p className="text-xs text-gray-500 mt-0.5">
              Position barcode within the frame
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close scanner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative">
          <div
            id={scannerElementId}
            className="w-full rounded-lg border-2 border-gray-200 overflow-hidden bg-black relative"
            style={{ 
              minHeight: "350px", 
              height: "350px", 
              position: "relative",
              display: "block"
            }}
          />
          {/* CRITICAL FIX: CSS to prevent split screen and duplicate video elements */}
          <style dangerouslySetInnerHTML={{__html: `
            #${scannerElementId} {
              position: relative !important;
              overflow: hidden !important;
              width: 100% !important;
              height: 350px !important;
            }
            #${scannerElementId} > div {
              width: 100% !important;
              height: 100% !important;
              position: relative !important;
            }
            #${scannerElementId} video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              transform: none !important;
            }
            #${scannerElementId} canvas {
              display: none !important;
            }
            /* CRITICAL: Hide any duplicate video elements that cause split screen */
            #${scannerElementId} video:nth-of-type(n+2),
            #${scannerElementId} > div > video:nth-of-type(n+2) {
              display: none !important;
            }
            /* Ensure only one video stream is visible */
            #${scannerElementId} video:first-of-type {
              display: block !important;
            }
          `}} />
          
          {/* Scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Corner guides */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                
                {/* Scanning line animation */}
                {scanStatus === "scanning" && (
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div className="absolute w-full h-1 bg-green-400 animate-pulse" style={{
                      top: "50%",
                      transform: "translateY(-50%)",
                      boxShadow: "0 0 10px rgba(74, 222, 128, 0.8)",
                    }} />
                  </div>
                )}
                
                {/* Success indicator */}
                {scanStatus === "success" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg transition-all duration-200 animate-pulse">
                    <div className="bg-green-500 rounded-full p-3 transform scale-100 transition-transform duration-200">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {scanStatus === "scanning" && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600 font-medium">Scanning...</span>
            </>
          )}
          {scanStatus === "success" && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-600 font-medium">Barcode detected!</span>
            </>
          )}
          {scanStatus === "idle" && !error && (
            <>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
              <span className="text-sm text-gray-500">Ready to scan</span>
            </>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500 text-center">
          Hold steady and ensure good lighting
        </div>

        {/* Manual barcode input fallback */}
        {!error && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-2 text-center">
              Having trouble scanning? Enter barcode manually:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter barcode number"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const barcode = (e.target as HTMLInputElement).value.trim();
                    if (barcode) {
                      console.log("Manual barcode entry:", barcode);
                      detectedRef.current = true;
                      setScanStatus("success");
                      playSuccessSound();
                      vibrate();
                      stopAll();
                      setTimeout(() => {
                        onDetected(barcode);
                        onClose();
                      }, 200);
                    }
                  }
                }}
                autoFocus={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
