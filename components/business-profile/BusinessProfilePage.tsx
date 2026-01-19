/**
 * Business Profile Page Component
 * Enterprise-grade business profile management with country-aware fields
 * Uses India's beautiful UI/UX patterns
 */

"use client";

import { useMemo, useState, useEffect } from "react";
import { businessProfileService, BusinessProfile } from "@/services/businessProfile.service";
import { useCountry } from "@/contexts/CountryContext";
import { useI18n } from "@/contexts/I18nContext";
import { useStore } from "@/contexts/StoreContext";
import { storeService } from "@/services/store.service";
import { ordersService } from "@/services/orders.service";
import {
  Building2,
  Save,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { validateNLVATID, validateDEVATID } from "@/lib/vatValidation";

export default function BusinessProfilePage() {
  const { country, isIN, isNL, isDE } = useCountry();
  const { t } = useI18n();
  const { selectedStore, refreshStores } = useStore();

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Company defaults (owner-level). Used as fallback if store identity fields are missing.
  const [businessName, setBusinessName] = useState("");
  const [companyStreet, setCompanyStreet] = useState("");
  const [companyPostcode, setCompanyPostcode] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  // Company/legal identity (owner-level)
  const [pan, setPan] = useState("");
  const [kvkNumber, setKvkNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");

  // Store logo (store-level, used on invoices)
  const [logoUploading, setLogoUploading] = useState(false);
  const storeLogo = selectedStore?.logo || "";

  // Optional fallback company logo (owner-level). Store logo is preferred.
  const [logoUrl, setLogoUrl] = useState("");
  const [companyLogoUploading, setCompanyLogoUploading] = useState(false);

  // Tax defaults (owner-level)
  const [defaultTaxMode, setDefaultTaxMode] = useState<"INTRA" | "INTER">(
    "INTRA"
  );
  const [defaultVatMode, setDefaultVatMode] = useState<
    "normal" | "reverse_charge" | "kor" | "intra_eu_b2b" | "export"
  >("normal");

  const [invoiceFooterText, setInvoiceFooterText] = useState("");
  const [invoiceNumberFormat, setInvoiceNumberFormat] = useState("INV-{YEAR}-{NUMBER}");
  const [invoiceNumberReset, setInvoiceNumberReset] = useState<"yearly" | "continuous">("yearly");
  const [invoiceNumberStart, setInvoiceNumberStart] = useState<number>(1000);
  const [defaultInvoiceLanguage, setDefaultInvoiceLanguage] = useState<"NL" | "EN" | "HI" | "EN-IN">(
    isIN ? "EN-IN" : "EN"
  );

  const [previewMode, setPreviewMode] = useState<"receipt" | "a4">("receipt");
  const [downloadingLatestPdf, setDownloadingLatestPdf] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await businessProfileService.getBusinessProfile();
      if (data) {
        setProfile(data);
        setBusinessName(data.businessName || "");
        setCompanyStreet(data.address?.street || "");
        setCompanyPostcode(data.address?.postcode || "");
        setCompanyCity(data.address?.city || "");
        setCompanyState(data.address?.state || "");
        setCompanyPhone(data.phone || "");
        setCompanyEmail(data.email || "");
        setPan(data.pan || "");
        setKvkNumber(data.kvkNumber || "");
        setVatNumber(data.vatNumber || "");
        setIban(data.iban || "");
        setBic(data.bic || "");
        setLogoUrl(data.logoUrl || "");
        setDefaultTaxMode(data.defaultTaxMode || "INTRA");
        setDefaultVatMode(data.defaultVatMode || "normal");
        setInvoiceFooterText(data.invoiceFooterText || "");
        setInvoiceNumberFormat(
          data.invoiceNumberFormat ||
            (isIN ? "INV-{NUMBER}" : "INV-{YEAR}-{NUMBER}")
        );
        setInvoiceNumberReset(data.invoiceNumberReset || (isIN ? "continuous" : "yearly"));
        setInvoiceNumberStart(
          typeof data.invoiceNumberStart === "number" && Number.isFinite(data.invoiceNumberStart)
            ? Math.max(1000, Math.floor(data.invoiceNumberStart))
            : 1000
        );
        setDefaultInvoiceLanguage(
          data.defaultInvoiceLanguage || (isIN ? "EN-IN" : "EN")
        );
      } else {
        // No profile yet: auto-fill with store values (no duplication; user can tweak and Save once).
        if (selectedStore) {
          setBusinessName(selectedStore.name || "");
          setCompanyStreet(selectedStore.address || "");
          setCompanyPhone(selectedStore.phone || "");
          setCompanyEmail(selectedStore.email || "");
        }
        setInvoiceNumberFormat(isIN ? "INV-{NUMBER}" : "INV-{YEAR}-{NUMBER}");
        setInvoiceNumberReset(isIN ? "continuous" : "yearly");
        setInvoiceNumberStart(1000);
        setDefaultInvoiceLanguage(isIN ? "EN-IN" : "EN");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load business profile");
    } finally {
      setLoading(false);
    }
  };

  const storeSummary = useMemo(() => {
    if (!selectedStore) return null;
    return {
      name: selectedStore.name || "",
      address: selectedStore.address || "",
      phone: selectedStore.phone || "",
      email: selectedStore.email || "",
      gstin: selectedStore.gstin || "",
    };
  }, [selectedStore]);

  const effectiveHeader = useMemo(() => {
    const name = (selectedStore?.name || "").trim() || (businessName || "").trim() || "Store";
    const address = (selectedStore?.address || "").trim() || (companyStreet || "").trim() || "";
    const phone = (selectedStore?.phone || "").trim() || (companyPhone || "").trim() || "";
    const email = (selectedStore?.email || "").trim() || (companyEmail || "").trim() || "";
    const gstin = (selectedStore?.gstin || "").trim();
    const logo = (selectedStore?.logo || "").trim() || (logoUrl || "").trim();
    return { name, address, phone, email, gstin, logo };
  }, [
    selectedStore?.name,
    selectedStore?.address,
    selectedStore?.phone,
    selectedStore?.email,
    selectedStore?.gstin,
    selectedStore?.logo,
    businessName,
    companyStreet,
    companyPhone,
    companyEmail,
    logoUrl,
  ]);

  const invoiceNumberPreview = useMemo(() => {
    const year = new Date().getFullYear();
    const sampleNumber = String(Math.max(1000, invoiceNumberStart || 1000));
    const fmt = (invoiceNumberFormat || "").trim() || (isIN ? "INV-{NUMBER}" : "INV-{YEAR}-{NUMBER}");
    return fmt.replaceAll("{YEAR}", String(year)).replaceAll("{NUMBER}", sampleNumber);
  }, [invoiceNumberFormat, invoiceNumberStart, isIN]);

  const openPrintWindow = () => {
    if (typeof window === "undefined") return;

    const footer = (invoiceFooterText || "").trim();
    const title = previewMode === "receipt" ? "Receipt Preview" : "A4 Invoice Preview";

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 24px; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #111827; }
      .page { margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; }
      .receipt { width: 280px; padding: 14px; }
      .a4 { width: 794px; padding: 32px; } /* ~A4 at 96dpi */
      .muted { color: #6b7280; }
      .row { display: flex; justify-content: space-between; gap: 12px; }
      .hr { border-top: 1px dashed #d1d5db; margin: 12px 0; }
      .logo { width: 56px; height: 56px; object-fit: contain; display: block; margin: 0 auto 10px auto; }
      .h1 { font-weight: 800; font-size: ${previewMode === "receipt" ? "16px" : "22px"}; margin: 0; text-align: center; }
      .center { text-align: center; }
      .small { font-size: ${previewMode === "receipt" ? "11px" : "12px"}; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 6px 0; font-size: ${previewMode === "receipt" ? "11px" : "12px"}; }
      th { text-align: left; color: #374151; border-bottom: 1px solid #e5e7eb; }
      .right { text-align: right; }
      @media print {
        body { padding: 0; }
        .page { border: none; }
      }
    </style>
  </head>
  <body>
    <div class="page ${previewMode === "receipt" ? "receipt" : "a4"}">
      ${effectiveHeader.logo ? `<img class="logo" src="${effectiveHeader.logo}" alt="Logo" />` : ``}
      <h1 class="h1">${effectiveHeader.name}</h1>
      <div class="center small muted" style="margin-top:6px;">
        ${effectiveHeader.address ? `<div>${effectiveHeader.address}</div>` : ``}
        ${effectiveHeader.phone ? `<div>Phone: ${effectiveHeader.phone}</div>` : ``}
        ${effectiveHeader.email ? `<div>Email: ${effectiveHeader.email}</div>` : ``}
        ${effectiveHeader.gstin ? `<div>GSTIN: ${effectiveHeader.gstin}</div>` : ``}
      </div>

      <div class="hr"></div>

      <div class="row small">
        <div><div class="muted">Invoice No</div><div><strong>${invoiceNumberPreview}</strong></div></div>
        <div class="right"><div class="muted">Date</div><div><strong>${new Date().toLocaleDateString()}</strong></div></div>
      </div>

      <div class="hr"></div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="right">Qty</th>
            <th class="right">Price</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Sample Product A</td><td class="right">1</td><td class="right">499</td><td class="right">499</td></tr>
          <tr><td>Sample Product B</td><td class="right">2</td><td class="right">199</td><td class="right">398</td></tr>
          <tr><td>Service Charge</td><td class="right">1</td><td class="right">99</td><td class="right">99</td></tr>
        </tbody>
      </table>

      <div class="hr"></div>

      <div class="row small"><div class="muted">Subtotal</div><div><strong>996</strong></div></div>
      <div class="row small"><div class="muted">${isIN ? "GST" : "VAT"} (example)</div><div><strong>180</strong></div></div>
      <div class="row small" style="margin-top:6px;"><div><strong>Grand Total</strong></div><div><strong>1,176</strong></div></div>

      <div class="hr"></div>

      ${footer ? `<div class="center small muted" style="white-space:pre-wrap;">${footer}</div><div style="height:8px"></div>` : ``}
      <div class="center small muted">This is a computer generated invoice.</div>
    </div>
    <script>
      window.onload = () => setTimeout(() => { window.print(); }, 150);
    </script>
  </body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const downloadLatestInvoicePdf = async () => {
    if (!selectedStore?.id) {
      setError("No store selected");
      return;
    }
    setDownloadingLatestPdf(true);
    setError("");
    setSuccess("");
    try {
      const res = await ordersService.getOrders({ limit: 1, storeId: selectedStore.id });
      const latest = res.data?.[0];
      if (!latest) {
        throw new Error("No invoices found for this store yet.");
      }

      let orderToDownload = latest;
      if (!orderToDownload.bill?.pdfUrl) {
        orderToDownload = await ordersService.generateBill(orderToDownload.id);
      }

      const billNumber = orderToDownload.bill?.billNumber || orderToDownload.id;
      const pdfUrl = orderToDownload.bill?.pdfUrl || "";
      await ordersService.downloadBillPdf(pdfUrl, billNumber, orderToDownload.id);
      setSuccess("Downloaded latest invoice PDF.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download latest invoice PDF");
    } finally {
      setDownloadingLatestPdf(false);
    }
  };

  const readAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  async function downscaleImage(dataUrl: string, maxSize: number): Promise<string> {
    // Keep it simple and reliable: only downscale if browser APIs are available
    // and if the image is larger than maxSize.
    if (typeof window === "undefined") return dataUrl;
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Invalid image"));
    });
    const { width, height } = img;
    if (!width || !height) return dataUrl;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    if (scale >= 1) return dataUrl;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // Use PNG for best quality on invoices
    return canvas.toDataURL("image/png");
  }

  const handleLogoFile = async (file: File) => {
    if (!selectedStore?.id) {
      setError("No store selected");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG/JPG).");
      return;
    }
    // Guardrails: keep DynamoDB item size safe
    if (file.size > 2 * 1024 * 1024) {
      setError("Please upload a logo under 2MB.");
      return;
    }

    setLogoUploading(true);
    setError("");
    setSuccess("");
    try {
      const dataUrl = await readAsDataUrl(file);
      const optimized = await downscaleImage(dataUrl, 256);
      await storeService.updateStore(selectedStore.id, { logo: optimized });
      await refreshStores();
      setSuccess("Logo updated for this store.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleCompanyLogoFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG/JPG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Please upload a logo under 2MB.");
      return;
    }

    setCompanyLogoUploading(true);
    setError("");
    setSuccess("");
    try {
      const dataUrl = await readAsDataUrl(file);
      const optimized = await downscaleImage(dataUrl, 256);
      setLogoUrl(optimized);
      setSuccess("Company logo set. Click Save to apply.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read logo");
    } finally {
      setCompanyLogoUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    // Validation
    if (isNL && vatNumber && !validateNLVATID(vatNumber)) {
      setError(t("validation.invalidVATID") || "Invalid VAT ID format");
      setSaving(false);
      return;
    }
    if (isDE && vatNumber && !validateDEVATID(vatNumber)) {
      setError(t("validation.invalidVATID") || "Invalid VAT ID format");
      setSaving(false);
      return;
    }

    try {
      const profileData = {
        // Owner-level defaults (used as fallback if store fields are missing)
        businessName: businessName.trim() || undefined,
        address: {
          street: companyStreet.trim() || undefined,
          postcode: companyPostcode.trim() || undefined,
          city: companyCity.trim() || undefined,
          state: companyState.trim() || undefined,
          country,
        },
        phone: companyPhone.trim() || undefined,
        email: companyEmail.trim() || undefined,
        pan: isIN ? (pan.trim() || undefined) : undefined,
        kvkNumber: isNL ? (kvkNumber.trim() || undefined) : undefined,
        vatNumber: (isNL || isDE) ? (vatNumber.trim() || undefined) : undefined,
        iban: iban.trim() || undefined,
        bic: bic.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        defaultTaxMode: isIN ? defaultTaxMode : undefined,
        defaultVatMode: isNL ? defaultVatMode : undefined,
        invoiceFooterText: invoiceFooterText.trim() || undefined,
        invoiceNumberFormat: invoiceNumberFormat.trim() || undefined,
        invoiceNumberReset: invoiceNumberReset,
        invoiceNumberStart: isIN ? Math.max(1000, Math.floor(Number(invoiceNumberStart) || 1000)) : undefined,
        defaultInvoiceLanguage: defaultInvoiceLanguage,
      };

      if (profile) {
        await businessProfileService.updateBusinessProfile(profileData);
      } else {
        await businessProfileService.saveBusinessProfile(profileData);
      }

      setSuccess(t("businessProfile.saveSuccess") || "Business profile saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save business profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">{t("common.loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <Building2 className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t("businessProfile.title") || "Company & Invoicing"}
              </h1>
              <p className="text-gray-600 mt-1">
                Configure legal identity and invoice preferences. Store identity is managed in Settings.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 text-red-800 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 text-green-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Store identity (GST mandate) - store scoped */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-1">Invoice header (this store)</h2>
          <p className="text-sm text-gray-600 mb-4">
            We automatically use your store’s name, address, phone, email and GSTIN on invoices (GST mandate). Edit these in{" "}
            <a href="/settings" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
              Settings <ExternalLink className="w-4 h-4" />
            </a>
            .
          </p>

          {!selectedStore ? (
            <div className="text-sm text-gray-700">No store selected.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="text-xs font-medium text-gray-500 uppercase">Business Name</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">{storeSummary?.name || "-"}</div>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="text-xs font-medium text-gray-500 uppercase">Address</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">{storeSummary?.address || "-"}</div>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="text-xs font-medium text-gray-500 uppercase">Phone</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">{storeSummary?.phone || "-"}</div>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="text-xs font-medium text-gray-500 uppercase">Email</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">{storeSummary?.email || "-"}</div>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="text-xs font-medium text-gray-500 uppercase">GSTIN</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">{storeSummary?.gstin || "-"}</div>
                <div className="mt-1 text-xs text-gray-500">GSTIN is store-specific.</div>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Invoice Logo</div>
                    <div className="mt-1 text-xs text-gray-500">Shown on A4 + receipt invoices.</div>
                  </div>
                  <div className="w-12 h-12 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                    {storeLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={storeLogo} alt="Store logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <label className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 cursor-pointer disabled:opacity-50">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      disabled={logoUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) handleLogoFile(f);
                      }}
                    />
                    {logoUploading ? "Uploading..." : "Upload logo"}
                  </label>
                  {storeLogo && (
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
                      onClick={async () => {
                        if (!selectedStore?.id) return;
                        setLogoUploading(true);
                        setError("");
                        try {
                          await storeService.updateStore(selectedStore.id, { logo: "" });
                          await refreshStores();
                          setSuccess("Logo removed for this store.");
                          setTimeout(() => setSuccess(""), 3000);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Failed to remove logo");
                        } finally {
                          setLogoUploading(false);
                        }
                      }}
                      disabled={logoUploading}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Tip: use a square logo (transparent PNG works best).
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Company defaults (owner-level) */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-lg font-semibold">Company defaults (optional)</h2>
              <p className="text-sm text-gray-600 mt-1">
                These are used as a <span className="font-medium">fallback</span> when a store field is missing. This keeps multi-store clean while still supporting a registered company identity.
              </p>
            </div>
            {selectedStore && (
              <button
                type="button"
                className="shrink-0 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
                onClick={() => {
                  setBusinessName(selectedStore.name || "");
                  setCompanyStreet(selectedStore.address || "");
                  setCompanyPhone(selectedStore.phone || "");
                  setCompanyEmail(selectedStore.email || "");
                }}
              >
                Copy from this store
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Registered business name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder={selectedStore?.name || "Your legal business name"}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Registered address</label>
              <input
                type="text"
                value={companyStreet}
                onChange={(e) => setCompanyStreet(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder={selectedStore?.address || "Address line"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={companyCity}
                onChange={(e) => setCompanyCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isIN ? "State" : "Region/State"}</label>
              <input
                type="text"
                value={companyState}
                onChange={(e) => setCompanyState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postcode</label>
              <input
                type="text"
                value={companyPostcode}
                onChange={(e) => setCompanyPostcode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder={selectedStore?.phone || ""}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder={selectedStore?.email || ""}
              />
            </div>
          </div>
        </div>

        {/* Legal identity + invoicing settings */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Legal identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isIN && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("businessProfile.pan") || "PAN"}</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="ABCDE1234F"
                  />
                </div>
              </>
            )}
            {isNL && (
              <div>
                <label className="block text-sm font-medium mb-1">{t("businessProfile.kvkNumber") || "KVK Number"}</label>
                <input
                  type="text"
                  value={kvkNumber}
                  onChange={(e) => setKvkNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="12345678"
                />
              </div>
            )}
            {(isNL || isDE) && (
              <div>
                <label className="block text-sm font-medium mb-1">{t("businessProfile.vatNumber") || "VAT Number"}</label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={isNL ? "NL123456789B01" : "DE123456789"}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">{t("businessProfile.iban") || "IBAN"}</label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="NL91 ABNA 0417 1643 00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("businessProfile.bic") || "BIC"}</label>
              <input
                type="text"
                value={bic}
                onChange={(e) => setBic(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="ABNANL2A"
              />
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-gray-900">Fallback company logo (optional)</div>
                <div className="text-xs text-gray-500">
                  Prefer the <span className="font-medium">store logo</span> above. This is only used if a store has no logo.
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <label className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 cursor-pointer disabled:opacity-50">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  disabled={companyLogoUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) handleCompanyLogoFile(f);
                  }}
                />
                {companyLogoUploading ? "Reading..." : "Upload fallback logo"}
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Or paste a data:image/... URL"
              />
              {logoUrl && (
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
                  onClick={() => setLogoUrl("")}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">{t("businessProfile.invoiceSettings") || "Invoice Settings"}</h2>
          <div className="space-y-4">
            {isIN && (
              <div>
                <label className="block text-sm font-medium mb-1">Default tax mode (India)</label>
                <select
                  value={defaultTaxMode}
                  onChange={(e) => setDefaultTaxMode(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="INTRA">INTRA (CGST + SGST)</option>
                  <option value="INTER">INTER (IGST)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Used as a default when tax mode can’t be inferred from place of supply.
                </p>
              </div>
            )}

            {isNL && (
              <div>
                <label className="block text-sm font-medium mb-1">Default VAT mode (Netherlands)</label>
                <select
                  value={defaultVatMode}
                  onChange={(e) => setDefaultVatMode(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="normal">Normal VAT</option>
                  <option value="reverse_charge">Reverse charge</option>
                  <option value="kor">KOR (small business scheme)</option>
                  <option value="intra_eu_b2b">Intra-EU B2B</option>
                  <option value="export">Export (0%)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">{t("businessProfile.defaultInvoiceLanguage") || "Default Invoice Language"}</label>
              <select
                value={defaultInvoiceLanguage}
                onChange={(e) => setDefaultInvoiceLanguage(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {isIN && <option value="EN-IN">English</option>}
                {isIN && <option value="HI">Hindi</option>}
                {isNL && <option value="NL">Dutch</option>}
                {isNL && <option value="EN">English</option>}
                {isDE && <option value="DE">German</option>}
                {isDE && <option value="EN">English</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("businessProfile.invoiceFooterText") || "Invoice Footer Text"}</label>
              <p className="text-xs text-gray-500 mb-2">
                Scope: <span className="font-medium">company-wide</span> (applies to all stores). Printed on both <span className="font-medium">Receipt</span> and <span className="font-medium">A4</span>.
              </p>
              <textarea
                value={invoiceFooterText}
                onChange={(e) => setInvoiceFooterText(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder={t("businessProfile.invoiceFooterTextPlaceholder") || "Text to display at the bottom of invoices..."}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("businessProfile.invoiceNumberFormat") || "Invoice Number Series"}</label>
              <input
                type="text"
                value={invoiceNumberFormat}
                onChange={(e) => setInvoiceNumberFormat(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder={isIN ? "INV-{NUMBER}" : "INV-{YEAR}-{NUMBER}"}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t("businessProfile.invoiceNumberFormatHelp") || "Use {YEAR} for year and {NUMBER} for sequential number"}
              </p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Start number (India)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1}
                    value={invoiceNumberStart}
                    onChange={(e) =>
                      setInvoiceNumberStart(
                        Math.max(1000, Math.floor(Number(e.target.value) || 1000))
                      )
                    }
                    disabled={!isIN}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Safe default: <span className="font-mono">1000</span>. Each store keeps its own sequence.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="text-xs font-medium text-gray-500 uppercase">Preview</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{invoiceNumberPreview}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Reset policy:{" "}
                    <span className="font-medium">
                      {invoiceNumberReset === "yearly" ? "Yearly" : "Continuous"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("businessProfile.invoiceNumberReset") || "Invoice Number Reset"}</label>
              <select
                value={invoiceNumberReset}
                onChange={(e) => setInvoiceNumberReset(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="yearly">{t("businessProfile.yearly") || "Yearly (reset each year)"}</option>
                <option value="continuous">{t("businessProfile.continuous") || "Continuous (no reset)"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview & Test Print */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold">Preview & Test print</h2>
              <p className="text-sm text-gray-600 mt-1">
                Preview how your invoices will look and run a test print. For a real PDF, download the latest invoice.
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                className={[
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  previewMode === "receipt"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-white hover:text-gray-900",
                ].join(" ")}
                onClick={() => setPreviewMode("receipt")}
              >
                Receipt
              </button>
              <button
                type="button"
                className={[
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  previewMode === "a4"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-white hover:text-gray-900",
                ].join(" ")}
                onClick={() => setPreviewMode("a4")}
              >
                A4
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 overflow-auto">
            <div
              className={[
                "mx-auto bg-white border border-gray-200 shadow-sm",
                previewMode === "receipt" ? "w-[280px] p-4" : "w-full max-w-[820px] p-8",
              ].join(" ")}
            >
              {effectiveHeader.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={effectiveHeader.logo}
                  alt="Logo"
                  className={[
                    "mx-auto object-contain",
                    previewMode === "receipt" ? "w-14 h-14 mb-2" : "w-16 h-16 mb-3",
                  ].join(" ")}
                />
              ) : null}

              <div className="text-center">
                <div className={["font-extrabold", previewMode === "receipt" ? "text-base" : "text-2xl"].join(" ")}>
                  {effectiveHeader.name}
                </div>
                <div className={["text-gray-600 mt-1", previewMode === "receipt" ? "text-xs" : "text-sm"].join(" ")}>
                  {effectiveHeader.address ? <div>{effectiveHeader.address}</div> : null}
                  {effectiveHeader.phone ? <div>Phone: {effectiveHeader.phone}</div> : null}
                  {effectiveHeader.email ? <div>Email: {effectiveHeader.email}</div> : null}
                  {effectiveHeader.gstin ? <div>GSTIN: {effectiveHeader.gstin}</div> : null}
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 my-4" />

              <div className={["flex items-start justify-between", previewMode === "receipt" ? "text-xs" : "text-sm"].join(" ")}>
                <div>
                  <div className="text-gray-500">Invoice No</div>
                  <div className="font-semibold">{invoiceNumberPreview}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500">Date</div>
                  <div className="font-semibold">{new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 my-4" />

              <div className={previewMode === "receipt" ? "text-xs" : "text-sm"}>
                <div className="grid grid-cols-4 gap-2 font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  <div className="col-span-2">Item</div>
                  <div className="text-right">Qty</div>
                  <div className="text-right">Amount</div>
                </div>
                <div className="grid grid-cols-4 gap-2 py-2 border-b border-gray-100">
                  <div className="col-span-2">Sample Product A</div>
                  <div className="text-right">1</div>
                  <div className="text-right">499</div>
                </div>
                <div className="grid grid-cols-4 gap-2 py-2 border-b border-gray-100">
                  <div className="col-span-2">Sample Product B</div>
                  <div className="text-right">2</div>
                  <div className="text-right">398</div>
                </div>
                <div className="grid grid-cols-4 gap-2 py-2">
                  <div className="col-span-2">Service Charge</div>
                  <div className="text-right">1</div>
                  <div className="text-right">99</div>
                </div>

                <div className="border-t border-dashed border-gray-300 my-4" />

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">996</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{isIN ? "GST (example)" : "VAT (example)"}</span>
                    <span className="font-semibold">180</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold">Grand Total</span>
                    <span className="font-bold">1,176</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 my-4" />

                {invoiceFooterText?.trim() ? (
                  <div className="text-center text-gray-600 whitespace-pre-wrap">
                    {invoiceFooterText.trim()}
                  </div>
                ) : null}
                <div className="text-center text-gray-500 mt-2">
                  This is a computer generated invoice.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              onClick={openPrintWindow}
            >
              Test print this preview
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              disabled={downloadingLatestPdf}
              onClick={downloadLatestInvoicePdf}
            >
              {downloadingLatestPdf ? "Preparing..." : "Download latest invoice PDF"}
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t("common.saving") || "Saving..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t("common.save") || "Save Business Profile"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
