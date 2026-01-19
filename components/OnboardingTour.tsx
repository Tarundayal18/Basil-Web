/**
 * Onboarding Tour Component
 * Provides interactive tour guide for new shopkeepers
 */
"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  CreditCard,
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  position: "top" | "bottom" | "left" | "right";
  icon: React.ReactNode;
}

/**
 * OnboardingTour component
 * Displays interactive tour for new users
 */
export default function OnboardingTour({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const tourSteps: TourStep[] = [
    {
      id: "dashboard",
      title: "Welcome to Your Dashboard",
      description:
        "This is your main dashboard where you can see an overview of your business. You'll find key metrics, recent orders, and quick actions here.",
      target: "[data-tour='dashboard']",
      position: "bottom",
      icon: <Package className="w-6 h-6" />,
    },
    {
      id: "products",
      title: "Manage Your Products",
      description:
        "The Products page is where you'll manage your inventory. Add new products, update prices, track stock levels, and organize your catalog.",
      target: "[data-tour='products']",
      position: "right",
      icon: <Package className="w-6 h-6" />,
    },
    {
      id: "orders",
      title: "Process Orders",
      description:
        "Create and manage customer orders here. Generate bills, track sales, and manage your billing operations efficiently.",
      target: "[data-tour='orders']",
      position: "right",
      icon: <ShoppingCart className="w-6 h-6" />,
    },
    {
      id: "customers",
      title: "Customer Management",
      description:
        "Keep track of all your customers. View customer history, manage contact information, and analyze customer behavior.",
      target: "[data-tour='customers']",
      position: "right",
      icon: <Users className="w-6 h-6" />,
    },
    {
      id: "reports",
      title: "View Reports",
      description:
        "Access comprehensive reports including sales reports, GST reports, and inventory analytics to make data-driven decisions.",
      target: "[data-tour='reports']",
      position: "right",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      id: "subscription",
      title: "Manage Subscription",
      description:
        "View your current subscription plan, payment history, and manage your subscription settings from here.",
      target: "[data-tour='subscription']",
      position: "right",
      icon: <CreditCard className="w-6 h-6" />,
    },
    {
      id: "settings",
      title: "Configure Settings",
      description:
        "Customize your store settings, manage categories, brands, suppliers, and configure operational preferences.",
      target: "[data-tour='settings']",
      position: "right",
      icon: <Settings className="w-6 h-6" />,
    },
  ];

  useEffect(() => {
    if (!isVisible) return;

    const currentStepData = tourSteps[currentStep];
    if (!currentStepData) return;

    const targetElement = document.querySelector(
      currentStepData.target
    ) as HTMLElement;

    if (targetElement && overlayRef.current && tooltipRef.current) {
      const rect = targetElement.getBoundingClientRect();
      const overlay = overlayRef.current;
      const tooltip = tooltipRef.current;

      // Position overlay highlight
      overlay.style.top = `${rect.top}px`;
      overlay.style.left = `${rect.left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;

      // Position tooltip based on position preference
      const tooltipWidth = 320;
      const tooltipHeight = 200;
      let top = 0;
      let left = 0;

      switch (currentStepData.position) {
        case "bottom":
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case "top":
          top = rect.top - tooltipHeight - 20;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case "right":
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + 20;
          break;
        case "left":
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - 20;
          break;
      }

      // Adjust if tooltip goes off screen
      if (left < 20) left = 20;
      if (left + tooltipWidth > window.innerWidth - 20) {
        left = window.innerWidth - tooltipWidth - 20;
      }
      if (top < 20) top = 20;
      if (top + tooltipHeight > window.innerHeight - 20) {
        top = window.innerHeight - tooltipHeight - 20;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;

      // Scroll target into view
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [currentStep, isVisible, tourSteps]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    // Mark onboarding as completed
    if (typeof window !== "undefined") {
      localStorage.setItem("onboardingCompleted", "true");
    }
    onComplete();
  };

  if (!isVisible) return null;

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" />

      {/* Highlight overlay */}
      <div
        ref={overlayRef}
        className="absolute border-4 border-indigo-500 rounded-lg shadow-2xl pointer-events-none transition-all duration-300"
        style={{
          boxShadow:
            "0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.5)",
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute bg-white rounded-xl shadow-2xl p-6 w-80 pointer-events-auto"
      >
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Skip Tour
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              {currentStepData.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {currentStepData.title}
            </h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {currentStepData.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <span>
              {currentStep === tourSteps.length - 1 ? "Complete" : "Next"}
            </span>
            {currentStep === tourSteps.length - 1 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
