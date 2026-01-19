/**
 * ProblemsSection component for the BASIL landing page.
 * This is the fourth section (FOUR) - Problems We Are Solving Section
 * Heading: Basil Solves Your Daily Life Problems
 * Displays 5 problems/solutions in a card grid layout with hover effects.
 */

"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Problem item interface for type safety
 */
interface Problem {
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

/**
 * Icon component for Zero Hardware Dependencies
 * @returns SVG icon element
 */
const HardwareIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

/**
 * Icon component for Zero Estimation Risk
 * @returns SVG icon element
 */
const EstimationIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

/**
 * Icon component for Zero Billing Errors
 * @returns SVG icon element
 */
const BillingIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

/**
 * Icon component for Zero Downtime
 * @returns SVG icon element
 */
const DowntimeIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

/**
 * Icon component for Zero Loss
 * @returns SVG icon element
 */
const LossIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

/**
 * ProblemsSection displays problems that BASIL solves for shopkeepers.
 * Contains 5 problem cards with icons and dark wavy hover effects.
 * @returns JSX element containing problems section
 */
export default function ProblemsSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Brand theme colors
  const themeColors = {
    primary: "#46499e",
    red: "#ed4734",
    pink: "#e1b0d1",
    yellow: "#f1b02b",
  };

  const problems: Problem[] = [
    {
      title: "Zero Hardware",
      description:
        "Your end to end business operations can be managed from click of a button through your smartphone.",
      color: themeColors.primary,
      icon: <Image src="/problemsection/hardware.svg" alt="Zero Hardware" width={30} height={30}/>,
    },
    {
      title: "Zero Estimation Risk",
      description:
        "Don't have to estimate your profits anymore, know your exact sales figures and profit earned in Real Time scenario - per minute, per product.",
      color: themeColors.red,
      icon: <Image src="/problemsection/estimate.svg" alt="Zero Estimation Risk" width={30} height={30}/>,
    },
    {
      title: "Zero Billing Errors",
      description:
        "All bills are generated from SmartPhone by scanning each product from your inventory.",
      color: themeColors.yellow,
      icon: <Image src="/problemsection/error.svg" alt="Zero Billing Errors" width={30} height={30} />,
    },
    {
      title: "Zero Downtime",
      description:
        "Internet Not working. No Issues. Basil supports an offline billing module which syncs on internet availability.",
      color: themeColors.pink,
      icon: <Image src="/problemsection/downtime1.svg" alt="Zero Downtime" width={30} height={30} />,
    },
    {
      title: "Zero Loss",
      description:
        "Real Time Inventory Monitoring helps you manage your stocks better. Thus reduce theft leading to losses.",
      color: themeColors.primary,
      icon: <Image src="/problemsection/loss.svg" alt="Zero Loss" width={30} height={30} />,
    },
  ];

  return (
    <section
      id="problems"
      className="py-20 md:py-32 px-6 md:px-10 lg:px-12 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#46499e] mb-4">
            Basil Solves Your Daily Life Problems
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {problems.map((problem, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={index}
                className="group relative p-6 rounded-2xl transition-all duration-500 cursor-pointer overflow-hidden"
                style={{
                  backgroundColor: isHovered ? "#2a2d5e" : "#f8f9fa",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Gradient overlay - visible on hover */}
                <div
                  className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
                  style={{
                    opacity: isHovered ? 1 : 0,
                    background: `linear-gradient(135deg, ${themeColors.primary}dd 0%, #1a1a2e 50%, #2a2d5e 100%)`,
                  }}
                />

                {/* Wavy pattern overlay using bento mask */}
                <div
                  className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
                  style={{
                    opacity: isHovered ? 0.15 : 0,
                    backgroundColor: themeColors.pink,
                    mask: "url('/images/bento-mask.svg') alpha no-repeat center / cover add",
                    WebkitMask:
                      "url('/images/bento-mask.svg') alpha no-repeat center / cover add",
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
                    style={{
                      backgroundColor: isHovered
                        ? "rgba(255,255,255,0.15)"
                        : problem.color,
                      color: "white",
                      backdropFilter: isHovered ? "blur(8px)" : "none",
                      border: isHovered
                        ? `1px solid ${problem.color}80`
                        : "none",
                    }}
                  >
                    {problem.icon}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-lg font-bold mb-3 transition-colors duration-300"
                    style={{
                      color: isHovered ? "white" : "#1a1a1a",
                    }}
                  >
                    {problem.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-sm leading-relaxed transition-colors duration-300"
                    style={{
                      color: isHovered ? "rgba(255,255,255,0.85)" : "#6b7280",
                    }}
                  >
                    {problem.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
