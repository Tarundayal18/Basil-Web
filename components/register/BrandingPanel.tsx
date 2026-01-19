/**
 * Branding Panel Component
 * Left side panel with logo, decorative elements, and optional content
 */
"use client";

import Image from "next/image";
import { CheckCircle2, Building2, CreditCard } from "lucide-react";
import { ProgressStep, Step } from "./types";

interface BrandingPanelProps {
  title: string;
  subtitle: string;
  description: string;
  benefits?: string[];
  progressSteps?: ProgressStep[];
  currentStep?: Step;
  showProgress?: boolean;
}

/**
 * BrandingPanel component
 * Displays the left side branding with logo and decorative elements
 * @param title - Main heading text
 * @param subtitle - Highlighted subtitle text
 * @param description - Description paragraph
 * @param benefits - Optional list of benefits to display
 * @param progressSteps - Optional progress steps to display
 * @param currentStep - Current active step
 * @param showProgress - Whether to show progress indicator
 */
export default function BrandingPanel({
  title,
  subtitle,
  description,
  benefits,
  progressSteps,
  currentStep,
  showProgress = false,
}: BrandingPanelProps) {
  const currentProgressIndex =
    progressSteps?.findIndex((s) => s.id === currentStep) ?? -1;

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-[#46499e] relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-[#e1b0d1]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#f1b02b]/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ed4734]/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 inline-block">
          <Image
            src="/Basil-logo.png"
            alt="BASIL"
            width={180}
            height={72}
            className="object-contain drop-shadow-lg"
            priority
          />
        </div>
        <h2 className="text-4xl font-bold text-white text-center mb-4">
          {title}
          <br />
          <span className="text-[#f1b02b]">{subtitle}</span>
        </h2>
        <p className="text-white/70 text-center text-lg max-w-md">
          {description}
        </p>

        {/* Benefits */}
        {benefits && benefits.length > 0 && (
          <div className="mt-12 space-y-4 max-w-md">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-3 text-white/80"
              >
                <div className="w-5 h-5 bg-[#f1b02b] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-[#46499e]" />
                </div>
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        )}

        {/* Progress Steps - Vertical */}
        {showProgress && progressSteps && currentStep !== "complete" && (
          <div className="mt-12 space-y-6 w-full max-w-md">
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

        {/* Completed state */}
        {showProgress && currentStep === "complete" && (
          <div className="mt-12 space-y-4">
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
  );
}

