"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { OnboardingService, OnboardingRequest } from "@/services/onboarding.service";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Loader2, Building2, Store, StoreIcon, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { validateGSTINFormat, formatGSTIN } from "@/utils/gstinValidation";
import { INDIAN_STATES, getStateByGSTCode } from "@/utils/indianStates";
import Tooltip from "@/components/ui/Tooltip";

function OnboardingPageContent() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { trackButton, track } = useAnalytics("Onboarding Page", true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [step, setStep] = useState<"info" | "store-type">("info");
  const [formData, setFormData] = useState({
    companyName: "",
    country: "IN",
    state: "",
    gstin: "",
  });
  
  // Redirect to dashboard if user already has tenantId (onboarding already completed)
  // Also redirect if user has stores (onboarding and store setup complete)
  useEffect(() => {
    if (user?.tenantId) {
      // Check if user has stores - if yes, onboarding is complete, go to dashboard
      if (user.stores && user.stores.length > 0) {
        router.push("/dashboard");
      } else if (user.tenantId) {
        // Has tenant but no stores yet - still allow onboarding to complete store setup
        // Don't redirect, let them complete onboarding
      }
    }
  }, [user, router]);

  // Load saved form data from localStorage on mount (error recovery)
  useEffect(() => {
    const savedData = localStorage.getItem("onboarding_form_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
        setCompanyName(parsed.companyName || "");
        setCountry(parsed.country || "IN");
        setState(parsed.state || "");
        setGstin(parsed.gstin || "");
      } catch (e) {
        console.error("Failed to load saved form data:", e);
      }
    }
  }, []);

  // Listen for storage events (race condition protection - other tab completed onboarding)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userFeatures" || e.key === "isAdmin") {
        // User data updated, check if tenantId is now present
        refreshUser().then(() => {
          if (user?.tenantId) {
            setSuccess("Onboarding was completed in another tab. Redirecting...");
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          }
        });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user, refreshUser, router]);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("IN");
  const [state, setState] = useState("");
  const [gstin, setGstin] = useState("");
  const [gstinError, setGstinError] = useState("");
  const [isMultiStore, setIsMultiStore] = useState<boolean | null>(null);
  
  // Update formData when inputs change (for localStorage persistence)
  const updateFormData = (updates: Partial<typeof formData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    localStorage.setItem("onboarding_form_data", JSON.stringify(newData));
  };

  // Handle GSTIN input change with validation and auto-populate state
  const handleGstinChange = (value: string) => {
    const formatted = formatGSTIN(value);
    setGstin(formatted);
    updateFormData({ gstin: formatted });
    
    // Clear error when user starts typing
    if (gstinError) {
      setGstinError("");
    }
    
    // Validate on blur or when 15 characters entered
    if (formatted.length === 15) {
      const validation = validateGSTINFormat(formatted);
      if (!validation.valid) {
        setGstinError(validation.error || "Invalid GSTIN format");
      } else {
        setGstinError("");
        
        // Auto-populate state from GSTIN (Step 6)
        if (country === "IN" && !state) {
          const stateCode = formatted.substring(0, 2);
          const stateByGST = getStateByGSTCode(stateCode);
          if (stateByGST) {
            setState(stateByGST.name);
            updateFormData({ state: stateByGST.name });
          }
        }
      }
    } else if (formatted.length > 0 && formatted.length < 15) {
      setGstinError("");
    }
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }
    
    // Validate company name length
    if (companyName.trim().length < 2) {
      setError("Company name must be at least 2 characters");
      return;
    }
    
    if (companyName.trim().length > 100) {
      setError("Company name must be less than 100 characters");
      return;
    }
    
    // Validate GSTIN if provided
    if (gstin.trim()) {
      const validation = validateGSTINFormat(gstin.trim());
      if (!validation.valid) {
        setError(validation.error || "Please enter a valid GSTIN");
        return;
      }
    }
    
    setError("");
    setGstinError("");
    trackButton("Onboarding Continue", { step: "info", country });
    setStep("store-type");
  };

  const handleStoreTypeSelect = (multiStore: boolean) => {
    setIsMultiStore(multiStore);
    trackButton("Onboarding Store Type Selected", { isMultiStore: multiStore });
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMultiStore === null) {
      setError("Please select a store type");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      trackButton("Onboarding Complete", { 
        companyName: companyName.trim(),
        isMultiStore,
        country,
        hasGSTIN: !!gstin.trim(),
      });

      const data: OnboardingRequest = {
        companyName: companyName.trim(),
        isMultiStore,
        country,
        state: state.trim() || undefined,
        gstin: gstin.trim() || undefined,
      };

      await OnboardingService.completeOnboarding(data);
      
      // Clear saved form data on success
      localStorage.removeItem("onboarding_form_data");
      
      // Show success page (Step 7)
      setShowSuccessPage(true);
      setSuccess("Onboarding completed successfully!");
      
      // Track onboarding completion
      track("Onboarding Completed", {
        companyName: companyName.trim(),
        isMultiStore,
        country,
        hasGSTIN: !!gstin.trim(),
      });
      
      // Refresh user to get updated tenant info
      await refreshUser();
      
      // Show success page for 3 seconds before redirect to dashboard
      // Store setup and Plan/Payment will be handled after trial expires
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to complete onboarding. Please try again.";
      setError(errorMessage);
      setLoading(false);
      
      // Handle duplicate tenant case (already completed)
      if (err.message?.includes("already completed") || err.message?.includes("Onboarding already")) {
        setSuccess("Onboarding was already completed. Redirecting...");
        localStorage.removeItem("onboarding_form_data");
        setTimeout(() => {
          refreshUser().then(() => {
            router.push("/dashboard");
          });
        }, 2000);
        return;
      }
      
      // Track error
      track("Onboarding Error", {
        error: errorMessage,
        companyName: companyName.trim(),
        isMultiStore,
      });
    }
  };
  
  // Retry onboarding with preserved form data (Step 9)
  const handleRetry = () => {
    setError("");
    setLoading(false);
    // Form data is already preserved in state via updateFormData
    // User can retry by clicking "Complete Setup" again
  };

  // Success page (Step 7)
  if (showSuccessPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Setup Complete!
            </h1>
            <p className="text-gray-600 mb-4">
              Your account has been configured successfully.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Setting up your workspace...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "info") {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Progress & Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#46499e] relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-[#e1b0d1]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#f1b02b]/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ed4734]/10 rounded-full blur-3xl" />

          {/* Content - Centered */}
          <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
            <div className="mb-12 bg-white/10 backdrop-blur-sm rounded-2xl p-5">
              <Image
                src="/Basil-logo.png"
                alt="BASIL"
                width={140}
                height={56}
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>

            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Set Up Your Store
            </h2>

            {/* Progress Steps - Vertical */}
            <div className="space-y-6 w-full max-w-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-[#f1b02b] text-[#46499e]">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium text-white">Company Information</p>
                  <p className="text-white/40 text-sm">Enter your company details</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-white/20 text-white/50">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium text-white/50">Store Type</p>
                  <p className="text-white/40 text-sm">Choose your store type</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-4 md:px-6 py-8 md:py-12 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-2xl">
            {/* Mobile Logo & Progress */}
            <div className="lg:hidden mb-8">
              <div className="flex justify-center mb-6">
                <div className="bg-[#46499e] rounded-2xl p-4">
                  <Image
                    src="/Basil_Symbol.png"
                    alt="BASIL"
                    width={48}
                    height={48}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              {/* Mobile Progress Steps */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-[#46499e] text-white">
                  1
                </div>
                <div className="w-12 h-0.5 bg-gray-200" />
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-gray-200 text-gray-500">
                  2
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
              {/* Progress Indicator (Step 8) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-600">Step 1 of 2</span>
                  <span className="text-sm text-gray-500">Company Information</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "50%" }}></div>
                </div>
              </div>
              
              <div className="text-center mb-8">
                <Building2 className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to Basil ERP
                </h1>
                <p className="text-gray-600">
                  Let's set up your business account
                </p>
              </div>

          <form onSubmit={handleInfoSubmit} className="space-y-6">
            <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                  >
                    Company Name *
                    <Tooltip
                      content="Enter your registered business name or company name. This will be used on invoices, reports, and official documents. Minimum 2 characters, maximum 100 characters."
                      title="Company Name Help"
                      position="right"
                      size="sm"
                      trigger="hover"
                    />
                  </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  updateFormData({ companyName: e.target.value });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your company name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Country
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
              </select>
            </div>

            {country === "IN" && (
              <>
                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                  >
                    State *
                    <Tooltip
                      content={
                        <div>
                          <p className="mb-2">
                            Select the state where your business is registered or operates.
                          </p>
                          <p className="mb-2">
                            <strong>Why it's required:</strong>
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Determines CGST/SGST vs IGST calculations</li>
                            <li>Required for GST compliance</li>
                            <li>Auto-filled if you enter GSTIN (first 2 digits)</li>
                          </ul>
                          <p className="mt-2 text-xs text-gray-300">
                            If you enter GSTIN, the state will be automatically selected based on the first 2 digits.
                          </p>
                        </div>
                      }
                      title="State Selection Help"
                      position="right"
                      size="md"
                      trigger="hover"
                    />
                  </label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      updateFormData({ state: e.target.value });
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((stateOption) => (
                      <option key={stateOption.code} value={stateOption.name}>
                        {stateOption.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select your business state (required for GST compliance)
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="gstin"
                    className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                  >
                    GSTIN (Optional)
                    <Tooltip
                      content={
                        <div>
                          <p className="mb-2">
                            <strong>GSTIN Format:</strong> 15 characters (2-digit state code + 10 characters + 1 check digit + 1 character)
                          </p>
                          <p className="mb-2">
                            <strong>Example:</strong> 27ABCDE1234F1Z5 (Maharashtra)
                          </p>
                          <p className="mb-2">
                            <strong>Benefits:</strong>
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Automatic GST calculations</li>
                            <li>GSTR-1, GSTR-3B report generation</li>
                            <li>Auto-populates state from GSTIN</li>
                            <li>Required for GST compliance</li>
                          </ul>
                          <p className="mt-2 text-xs text-gray-300">
                            You can add this later in Settings if you don't have it now.
                          </p>
                        </div>
                      }
                      title="What is GSTIN?"
                      position="right"
                      size="md"
                      trigger="hover"
                    />
                  </label>
                  <input
                    id="gstin"
                    type="text"
                    value={gstin}
                    onChange={(e) => handleGstinChange(e.target.value)}
                    onBlur={() => {
                      if (gstin.trim()) {
                        const validation = validateGSTINFormat(gstin.trim());
                        if (!validation.valid) {
                          setGstinError(validation.error || "Invalid GSTIN format");
                        }
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase ${
                      gstinError
                        ? "border-red-300 bg-red-50"
                        : gstin.trim().length === 15 && !gstinError
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300"
                    }`}
                    placeholder="27ABCDE1234F1Z5"
                    maxLength={15}
                  />
                  {gstinError && (
                    <p className="mt-1 text-xs text-red-600">{gstinError}</p>
                  )}
                  {gstin.trim().length === 15 && !gstinError && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Valid GSTIN format
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter 15-character GSTIN (e.g., 27ABCDE1234F1Z5). You can add this later in settings.
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{error}</p>
                    {/* Network error handling with retry (Step 12) */}
                    {(error.includes("network") || error.includes("fetch") || error.includes("timeout")) ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-red-600">
                          Network error detected. Check your connection and try again.
                        </p>
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="text-sm px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 font-medium transition-colors"
                        >
                          Retry Now
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm mt-1 text-red-600">
                        Don't worry, your information has been saved. You can retry anytime.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {success && !showSuccessPage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!gstinError || (country === "IN" && !state.trim())}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating...
                </span>
              ) : (
                "Continue"
              )}
            </button>
          </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Progress & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#46499e] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#e1b0d1]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#f1b02b]/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ed4734]/10 rounded-full blur-3xl" />

        {/* Content - Centered */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <div className="mb-12 bg-white/10 backdrop-blur-sm rounded-2xl p-5">
            <Image
              src="/Basil-logo.png"
              alt="BASIL"
              width={140}
              height={56}
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>

          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Set Up Your Store
          </h2>

          {/* Progress Steps - Vertical */}
          <div className="space-y-6 w-full max-w-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-green-500 text-white">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-green-300">Company Information</p>
                <p className="text-white/40 text-sm">Enter your company details</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-[#f1b02b] text-[#46499e]">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-white">Store Type</p>
                <p className="text-white/40 text-sm">Choose your store type</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-4 md:px-6 py-8 md:py-12 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-2xl">
          {/* Mobile Logo & Progress */}
          <div className="lg:hidden mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-[#46499e] rounded-2xl p-4">
                <Image
                  src="/Basil_Symbol.png"
                  alt="BASIL"
                  width={48}
                  height={48}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            {/* Mobile Progress Steps */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-green-500 text-white">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="w-12 h-0.5 bg-green-500" />
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-[#46499e] text-white">
                2
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
            {/* Progress Indicator (Step 8) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-indigo-600">Step 2 of 2</span>
                <span className="text-sm text-gray-500">Store Configuration</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>
            
            <div className="text-center mb-8">
              <StoreIcon className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Store Type
              </h1>
              <p className="text-gray-600">
                Select the option that best describes your business
              </p>
            </div>

        <form onSubmit={handleComplete} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Single Store Option */}
            <button
              type="button"
              onClick={() => handleStoreTypeSelect(false)}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                isMultiStore === false
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-300 hover:border-indigo-300"
              }`}
            >
              <Store className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Single Store</h3>
              <p className="text-sm text-gray-600">
                Perfect for individual shops and small businesses with one location
              </p>
            </button>

            {/* Multi-Store Option */}
            <button
              type="button"
              onClick={() => handleStoreTypeSelect(true)}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                isMultiStore === true
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-300 hover:border-indigo-300"
              }`}
            >
              <Building2 className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Multi-Store</h3>
              <p className="text-sm text-gray-600">
                Ideal for businesses with multiple locations or franchises
              </p>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{error}</p>
                  {/* Network error handling with retry (Step 12) */}
                  {(error.includes("network") || error.includes("fetch") || error.includes("timeout")) ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-red-600">
                        Network error detected. Check your connection and try again.
                      </p>
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="text-sm px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 font-medium transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retry Now
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm mt-1 text-red-600">
                      Don't worry, your information has been saved. You can retry anytime.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {success && !showSuccessPage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {success}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setStep("info");
                setError("");
                trackButton("Onboarding Back", { from: "store-type" });
              }}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || isMultiStore === null}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Setting up...
                </>
              ) : error ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </>
              ) : (
                "Complete Setup"
              )}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  // Wrap in ProtectedRoute to ensure authentication, but allow access even without tenantId
  return (
    <ProtectedRoute>
      <OnboardingPageContent />
    </ProtectedRoute>
  );
}
