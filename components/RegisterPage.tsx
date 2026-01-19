/**
 * Registration Page Component
 * Multi-step registration flow for new shopkeepers
 * Step 1 (standalone): Account creation
 * Steps 2-4 (with progress): Store → Plan → Payment
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { authService, RegisterRequest } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import {
  SubscriptionService,
  SubscriptionPlan,
} from "@/services/subscription.service";
import Script from "next/script";
import { Building2, CreditCard, CheckCircle2 } from "lucide-react";

import {
  AccountStep,
  StoreStep,
  PlanStep,
  PaymentStep,
  CompleteStep,
  MobileHeader,
  Step,
  StoreData,
  ProgressStep,
} from "./register";
import Snackbar from "./Snackbar";

/**
 * RegistrationPage component
 * Handles complete shopkeeper registration flow
 */
export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth();
  const isGoogleAuthFromUrl = searchParams.get("googleAuth") === "true";
  const stepFromUrl = searchParams.get("step");
  const invitationToken = searchParams.get("invitationToken");
  const invitationEmail = searchParams.get("email");
  const invitationPhone = searchParams.get("phone");

  // Track if user authenticated via Google (from URL or from clicking Google login)
  // Initialize directly from URL param or authUser presence
  const [isGoogleAuth, setIsGoogleAuth] = useState(
    () => isGoogleAuthFromUrl || (isGoogleAuthFromUrl && !!authUser)
  );

  // Determine initial step based on auth status and URL params
  const getInitialStep = (): Step => {
    if (stepFromUrl === "store" || stepFromUrl === "plan") {
      return stepFromUrl as Step;
    }
    return "account";
  };

  const [currentStep, setCurrentStep] = useState<Step>(getInitialStep());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Use ref to track if plans have been loaded (avoids setState in effect)
  const plansLoadedRef = useRef(false);

  // Step 3: Plan selection - declare early for use in callbacks
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );

  /**
   * Load available subscription plans
   * Called when transitioning to plan step
   * @param force - Force refetch even if plans were already loaded
   */
  const loadPlans = useCallback(async (force: boolean = false) => {
    if (plansLoadedRef.current && !force) return;
    if (force) {
      plansLoadedRef.current = false;
    }
    plansLoadedRef.current = true;

    try {
      const availablePlans = await SubscriptionService.getAvailablePlans();
      setPlans(availablePlans);
      if (availablePlans.length > 0) {
        setSelectedPlan(availablePlans[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subscription plans"
      );
      // Reset ref on error so plans can be refetched
      plansLoadedRef.current = false;
    }
  }, []);

  /**
   * Handle step change with side effects
   * @param step - The step to navigate to
   */
  const handleStepChange = useCallback(
    (step: Step) => {
      // Check if navigating from payment to plan (coming back after API failure)
      // currentStep still has the old value before state update
      const isComingBackFromPayment =
        currentStep === "payment" && step === "plan";

      setCurrentStep(step);

      if (step === "plan") {
        // Force refetch if coming back from payment step
        loadPlans(isComingBackFromPayment);
      }
    },
    [loadPlans, currentStep]
  );

  // Step 1: Account details - Initialize from authUser if Google auth or invitation email
  const [accountData, setAccountData] = useState<RegisterRequest>(() => ({
    name: (isGoogleAuthFromUrl && authUser?.name) || "",
    email: (isGoogleAuthFromUrl && authUser?.email) || invitationEmail || "",
    phone: (isGoogleAuthFromUrl && authUser?.phone) || invitationPhone || "",
    password: "",
    confirmPassword: "",
  }));

  // Step 2: Store details
  const [storeData, setStoreData] = useState<StoreData>({
    name: "",
    address: "",
    phone: "",
    email: "",
    gstin: "",
  });

  // Existing store ID (when user has stores but no subscription)
  const [existingStoreId, setExistingStoreId] = useState<string>("");

  // Step 4: Payment
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Step 5: Complete
  const [registeredStoreId, setRegisteredStoreId] = useState<string>("");

  // Check logged-in user's registration status and redirect accordingly
  useEffect(() => {
    const checkUserStatus = async () => {
      const token = authService.getToken();
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      // User is logged in, check their store/subscription status
      if (currentStep === "account") {
        try {
          // Fetch user profile to get their status using apiClient (proper routing)
          const profileResponse = await apiClient.get<{ data: any }>(
            "/shopkeeper/profile"
          );

          if (profileResponse.data) {
            const profile = profileResponse.data.data || profileResponse.data;

            // Update account data from profile
            if (profile) {
              setAccountData({
                name: profile.name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                password: "",
                confirmPassword: "",
              });
            }

            // Check stores and subscriptions using apiClient
            try {
              const storesResponse = await apiClient.get<{ data: any[] }>(
                "/shopkeeper/stores"
              );

              // Ensure we always get an array, handling both response formats
              const stores: any[] = Array.isArray(storesResponse.data?.data)
                ? storesResponse.data.data
                : Array.isArray(storesResponse.data)
                ? storesResponse.data
                : [];

              if (stores.length > 0) {
                // User has stores, check for active subscription
                const store = stores[0];
                setExistingStoreId(store.id);

                // Check subscription status
                try {
                  const subscription =
                    await SubscriptionService.getStoreSubscription(store.id);
                  if (
                    subscription &&
                    (subscription.status === "active" ||
                      subscription.status === "trial")
                  ) {
                    // Has active subscription or trial, redirect to dashboard
                    router.push("/dashboard");
                    return;
                  }
                } catch {
                  // No subscription, continue to plan step
                }

                // Has store but no active subscription, go to plan
                setIsGoogleAuth(true);
                handleStepChange("plan");
              } else {
                // No stores, go to store step
                setIsGoogleAuth(true);
                setCurrentStep("store");
              }
            } catch (storesErr) {
              // Error fetching stores, default to store step
              // Don't log expected errors (401, 403, 404)
              if (storesErr instanceof Error && !(storesErr as any).isAuthError) {
                // Only log unexpected errors
                if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                  console.warn("Could not fetch stores, continuing to store step:", storesErr);
                }
              }
              setIsGoogleAuth(true);
              setCurrentStep("store");
            }
          } else {
            // Profile fetch failed, token might be invalid
            setCheckingAuth(false);
          }
        } catch (err) {
          // Don't log expected authentication errors
          // Only log unexpected errors in development
          if (err instanceof Error && !(err as any).isAuthError) {
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
              console.warn("Error checking user status, continuing to store step:", err);
            }
          }
          setIsGoogleAuth(true);
          setCurrentStep("store");
        }
      }
      setCheckingAuth(false);
    };

    checkUserStatus();
  }, [currentStep, router, handleStepChange]);

  // Steps for the progress indicator (only shown after account creation)
  const progressSteps: ProgressStep[] = [
    { id: "store", label: "Store", icon: Building2 },
  ];

  const currentProgressIndex = progressSteps.findIndex(
    (s) => s.id === currentStep
  );

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#46499e] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="mt-4 text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  // Account creation step (standalone, with split layout)
  if (currentStep === "account") {
    return (
      <>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <AccountStep
          accountData={accountData}
          setAccountData={setAccountData}
          error={error}
          setError={setError}
          loading={loading}
          setLoading={setLoading}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          isGoogleAuth={isGoogleAuth}
          setIsGoogleAuth={setIsGoogleAuth}
          setCurrentStep={handleStepChange}
          setExistingStoreId={setExistingStoreId}
          invitationToken={invitationToken || undefined}
        />
        <Snackbar
          message={error}
          type="error"
          isOpen={!!error}
          onClose={() => setError("")}
          duration={6000}
        />
      </>
    );
  }

  // Main registration flow (Store → Plan → Payment → Complete)
  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="min-h-screen flex">
        {/* Left Side - Progress & Branding */}
        <div className="hidden lg:flex lg:w-2/5 bg-[#46499e] relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-[#e1b0d1]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#f1b02b]/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ed4734]/10 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center w-full px-12">
            <div className="mb-12 bg-white/10 backdrop-blur-sm rounded-2xl p-5 inline-block self-start">
              <Image
                src="/Basil-logo.png"
                alt="BASIL"
                width={140}
                height={56}
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>

            <h2 className="text-3xl font-bold text-white mb-8">
              Set Up Your Store
            </h2>

            {/* Progress Steps - Vertical */}
            {currentStep !== "complete" && (
              <div className="space-y-6">
                {progressSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === currentProgressIndex;
                  const isCompleted = index < currentProgressIndex;

                  return (
                    <div key={step.id} className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-[#f1b02b] text-[#46499e]"
                            : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-white/20 text-white/50"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <StepIcon className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-medium ${
                            isActive
                              ? "text-white"
                              : isCompleted
                              ? "text-green-300"
                              : "text-white/50"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-white/40 text-sm">
                          {step.id === "store" && "Enter your store details"}
                          {step.id === "plan" && "Choose your subscription"}
                          {step.id === "payment" && "Complete payment"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {currentStep === "complete" && (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <p className="text-white text-lg">
                  All steps completed successfully!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-3/5 flex items-center justify-center bg-gray-50 px-4 md:px-6 py-8 md:py-12 overflow-y-auto overflow-x-hidden">
          <div
            className={`w-full ${
              currentStep === "plan" ? "max-w-6xl" : "max-w-2xl"
            }`}
          >
            {/* Mobile Logo & Progress */}
            <MobileHeader
              progressSteps={progressSteps}
              currentStep={currentStep}
              showProgress={true}
            />

            {/* Form Card */}
            <div
              className={`bg-white rounded-2xl shadow-xl border border-gray-100 ${
                currentStep === "plan" ? "p-4 md:p-6" : "p-6 md:p-8"
              }`}
            >
              {/* Step 1: Store Details */}
              {currentStep === "store" && (
                <StoreStep
                  storeData={storeData}
                  setStoreData={setStoreData}
                  error={error}
                  setError={setError}
                  setCurrentStep={handleStepChange}
                  setRegisteredStoreId={setRegisteredStoreId}
                />
              )}

              {/* Step 2: Plan Selection */}
              {currentStep === "plan" && (
                <PlanStep
                  plans={plans}
                  selectedPlan={selectedPlan}
                  setSelectedPlan={setSelectedPlan}
                  billingCycle={billingCycle}
                  setBillingCycle={setBillingCycle}
                  existingStoreId={existingStoreId}
                  storeData={storeData}
                  accountData={accountData}
                  isGoogleAuth={isGoogleAuth}
                  error={error}
                  setError={setError}
                  loading={loading}
                  setLoading={setLoading}
                  setCurrentStep={handleStepChange}
                  setSubscriptionId={setSubscriptionId}
                  setRegisteredStoreId={setRegisteredStoreId}
                />
              )}

              {/* Step 3: Payment */}
              {currentStep === "payment" && (
                <PaymentStep
                  plans={plans}
                  selectedPlan={selectedPlan}
                  billingCycle={billingCycle}
                  storeData={storeData}
                  accountData={accountData}
                  subscriptionId={subscriptionId}
                  registeredStoreId={registeredStoreId}
                  error={error}
                  setError={setError}
                  processingPayment={processingPayment}
                  setProcessingPayment={setProcessingPayment}
                  setCurrentStep={handleStepChange}
                />
              )}

              {/* Step 4: Complete */}
              {currentStep === "complete" && (
                <CompleteStep
                  accountData={accountData}
                  registeredStoreId={registeredStoreId}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <Snackbar
        message={error}
        type="error"
        isOpen={!!error}
        onClose={() => setError("")}
        duration={6000}
      />
    </>
  );
}
