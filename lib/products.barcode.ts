// products.barcode.ts
// BARCODE + PRINT + PDF (NO REACT)

// -------------------- BARCODE GENERATION --------------------
export function generateEAN13(): string {
  const base12 = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = parseInt(base12[i], 10);
    sum += i % 2 === 0 ? n : n * 3;
  }

  const checksum = (10 - (sum % 10)) % 10;
  return base12 + checksum;
}

// -------------------- VALIDATE EAN13 BARCODE --------------------
export function isValidEAN13(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  const cleaned = code.trim().replace(/\D/g, "");
  if (cleaned.length !== 13) return false;

  // Validate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = parseInt(cleaned[i], 10);
    if (isNaN(n)) return false;
    sum += i % 2 === 0 ? n : n * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  return parseInt(cleaned[12], 10) === checksum;
}

// -------------------- EXPORT BARCODE PDF --------------------
export function exportBarcodePDF(p: { barcode?: string; name?: string; productId?: string }) {
  if (!p?.barcode) {
    alert("No barcode available");
    return;
  }

  // Check if JsBarcode is available
  if (typeof window === "undefined" || !(window as any).JsBarcode) {
    console.error("JsBarcode library not loaded. Please include it in your HTML.");
    alert("Barcode library not loaded. Please refresh the page.");
    return;
  }

  const canvas = document.createElement("canvas");

  (window as any).JsBarcode(canvas, p.barcode, {
    format: "EAN13",
    width: 2,
    height: 60,
    displayValue: true,
    fontSize: 12,
    margin: 2,
  });

  const png = canvas.toDataURL("image/png");

  // Check if jsPDF is available
  if (!(window as any).jsPDF) {
    console.error("jsPDF library not loaded. Please include it in your HTML.");
    alert("PDF library not loaded. Please refresh the page.");
    return;
  }

  const pdf = new (window as any).jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [50, 30],
  });

  pdf.addImage(png, "PNG", 2, 2, 46, 26);
  pdf.save(`barcode-${p.productId || p.barcode}.pdf`);
}

// -------------------- PRINT BARCODE --------------------
export function printBarcode(p: { barcode?: string; name?: string; productId?: string }) {
  if (!p || typeof p !== "object") {
    console.error("printBarcode: Invalid product object");
    return;
  }

  const code = String(p?.barcode || "").trim();
  if (!code) {
    console.warn("printBarcode: Barcode missing on product", p.productId || p.name);
    alert("Barcode is required for printing");
    return;
  }

  // Validate EAN13 format (but still allow printing other formats)
  const cleaned = code.replace(/\D/g, "");
  if (cleaned.length !== 13) {
    console.warn("printBarcode: Barcode is not 13 digits", code);
    // Still allow printing, just warn
  } else if (!isValidEAN13(code)) {
    console.warn("printBarcode: EAN13 checksum validation failed", code);
    // Still allow printing, just warn - user may have manually entered valid barcode
  }

  try {
    const win = window.open("", "PRINT", "width=420,height=320");
    if (!win) {
      console.error("printBarcode: Failed to open print window (popup blocked?)");
      alert("Please allow popups to print barcode labels");
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <style>
            body {
              margin: 0;
              padding: 16px;
              font-family: Arial, sans-serif;
              background: white;
            }
            .label {
              border: 1px solid #ddd;
              border-radius: 10px;
              padding: 12px;
              text-align: center;
            }
            .name {
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 6px;
              word-break: break-word;
            }
            svg {
              width: 100%;
              height: 70px;
              display: block;
            }
            .code {
              font-size: 11px;
              font-family: monospace;
              margin-top: 4px;
            }
            @media print {
              body {
                padding: 0;
              }
              .label {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="name">${escapeHtml(p.name || "Product")}</div>
            <svg id="barcode"></svg>
            <div class="code">${escapeHtml(code)}</div>
          </div>

          <script>
            function renderBarcode() {
              try {
                if (typeof JsBarcode === "undefined") {
                  console.warn("JsBarcode not loaded yet, retrying...");
                  setTimeout(renderBarcode, 100);
                  return;
                }

                const barcodeEl = document.getElementById("barcode");
                if (!barcodeEl) return;

                JsBarcode("#barcode", "${escapeHtml(code)}", {
                  format: "EAN13",
                  displayValue: false,
                  margin: 0,
                  width: 2,
                  height: 70,
                  valid: function(valid) {
                    if (!valid) {
                      console.warn("Barcode validation failed, but attempting to render");
                    }
                  }
                });

                // Wait for barcode to render, then print
                setTimeout(function() {
                  window.focus();
                  window.print();
                  // Close after a delay to allow print dialog
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                }, 800);
              } catch (err) {
                console.error("Barcode print error:", err);
                const barcodeEl = document.getElementById("barcode");
                if (barcodeEl) {
                  barcodeEl.innerHTML = "<text x='50%' y='50%' text-anchor='middle' dy='.3em'>Print error: " + escapeHtml(String(err.message || err)) + "</text>";
                }
              }
            }

            // Start rendering when script loads
            if (document.readyState === "loading") {
              document.addEventListener("DOMContentLoaded", renderBarcode);
            } else {
              // DOM already loaded, wait a bit for JsBarcode script to load
              setTimeout(renderBarcode, 200);
            }
          </script>
        </body>
      </html>
    `);

    win.document.close();
  } catch (err) {
    console.error("printBarcode: Failed to write print document", err);
    alert("Failed to open print dialog. Please check console for details.");
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

