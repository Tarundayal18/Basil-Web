/**
 * Mobile Header Component
 * Logo and optional progress indicator for mobile devices
 */
"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { ProgressStep, Step } from "./types";

interface MobileHeaderProps {
  progressSteps?: ProgressStep[];
  currentStep?: Step;
  showProgress?: boolean;
}

/**
 * MobileHeader component
 * Displays logo and progress indicator for mobile screens
 * @param progressSteps - Optional progress steps to display
 * @param currentStep - Current active step
 * @param showProgress - Whether to show progress indicator
 */
export default function MobileHeader({
  progressSteps,
  currentStep,
  showProgress = false,
}: MobileHeaderProps) {
  const currentProgressIndex =
    progressSteps?.findIndex((s) => s.id === currentStep) ?? -1;

  return (
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
      {showProgress && progressSteps && currentStep !== "complete" && (
        <div className="flex items-center justify-center mb-6">
          {progressSteps.map((step, index) => {
            const isActive = index === currentProgressIndex;
            const isCompleted = index < currentProgressIndex;
            const isLast = index === progressSteps.length - 1;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    isActive
                      ? "bg-[#46499e] text-white"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-12 h-0.5 ${
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

