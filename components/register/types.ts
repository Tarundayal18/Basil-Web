/**
 * Type definitions for the registration flow components
 */

import { RegisterRequest } from "@/lib/auth";
import { SubscriptionPlan } from "@/services/subscription.service";

/**
 * Registration step types
 */
export type Step = "account" | "store" | "plan" | "payment" | "complete";

/**
 * Progress step definition
 */
export interface ProgressStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Store data interface
 */
export interface StoreData {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
}

/**
 * Account step props
 */
export interface AccountStepProps {
  accountData: RegisterRequest;
  setAccountData: (data: RegisterRequest) => void;
  error: string;
  setError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  isGoogleAuth: boolean;
  setIsGoogleAuth: (value: boolean) => void;
  setCurrentStep: (step: Step) => void;
  setExistingStoreId: (id: string) => void;
  invitationToken?: string;
}

/**
 * Store step props
 */
export interface StoreStepProps {
  storeData: StoreData;
  setStoreData: (data: StoreData) => void;
  error: string;
  setError: (error: string) => void;
  setCurrentStep: (step: Step) => void;
  setRegisteredStoreId: (id: string) => void;
}

/**
 * Plan step props
 */
export interface PlanStepProps {
  plans: SubscriptionPlan[];
  selectedPlan: string;
  setSelectedPlan: (id: string) => void;
  billingCycle: "monthly" | "annual";
  setBillingCycle: (cycle: "monthly" | "annual") => void;
  existingStoreId: string;
  storeData: StoreData;
  accountData: RegisterRequest;
  isGoogleAuth: boolean;
  error: string;
  setError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setCurrentStep: (step: Step) => void;
  setSubscriptionId: (id: string) => void;
  setRegisteredStoreId: (id: string) => void;
}

/**
 * Payment step props
 */
export interface PaymentStepProps {
  plans: SubscriptionPlan[];
  selectedPlan: string;
  billingCycle: "monthly" | "annual";
  storeData: StoreData;
  accountData: RegisterRequest;
  subscriptionId: string;
  registeredStoreId: string;
  error: string;
  setError: (error: string) => void;
  processingPayment: boolean;
  setProcessingPayment: (processing: boolean) => void;
  setCurrentStep: (step: Step) => void;
}

/**
 * Complete step props
 */
export interface CompleteStepProps {
  accountData: RegisterRequest;
  registeredStoreId: string;
}

/**
 * Branding panel props
 */
export interface BrandingPanelProps {
  title: string;
  subtitle: string;
  description: string;
  benefits?: string[];
  progressSteps?: ProgressStep[];
  currentStep?: Step;
  showProgress?: boolean;
}

/**
 * Progress indicator props
 */
export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: Step;
  variant?: "vertical" | "horizontal";
}
