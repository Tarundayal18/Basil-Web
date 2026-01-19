/**
 * ThreeTierFeaturesSection component for the BASIL landing page.
 * This is the sixth section (SIX) - 3 Tier Features Section
 * Contains three feature showcases:
 * - GST Made Totally Stress Free
 * - Live Profit At A Glance
 * - Turn Customers Into Regular Buyers
 */

"use client";

import { ArrowUpRight, FileText, Check } from "lucide-react";

/**
 * FeatureImage component that displays an image with rounded corners
 * @param src - The source path of the image
 * @param alt - Alt text for the image
 * @returns JSX element containing the styled feature image
 */
function FeatureImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-cover"
      />
    </div>
  );
}

/**
 * IconBox component for feature highlights with colored background
 * @param color - The background color class for the icon box
 * @param children - The icon to display
 * @returns JSX element containing the styled icon box
 */
function IconBox({
  color,
  children,
}: {
  color: "orange" | "cyan";
  children: React.ReactNode;
}) {
  const bgColor = color === "orange" ? "bg-[#f1b02b]" : "bg-cyan-400";
  return (
    <div
      className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}
    >
      {children}
    </div>
  );
}

/**
 * ThreeTierFeaturesSection displays three major features in alternating
 * layouts with images and detailed descriptions.
 * @returns JSX element containing the three-tier features section
 */
export default function ThreeTierFeaturesSection() {
  return (
    <section
      id="three-tier"
      className="py-20 md:py-32 px-6 md:px-10 lg:px-12 bg-white"
    >
      <div className="max-w-7xl mx-auto space-y-24 md:space-y-32">
        {/* GST Made Totally Stress Free - Image Left, Text Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <FeatureImage 
            src="/Feature1.jpg" 
            alt="GST Made Totally Stress Free"
          />

          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              GST Made Totally Stress Free.
            </h2>
            <p className="text-lg text-gray-500 mb-10 leading-relaxed">
              Automatic GST billing with compliant invoices, always ready for
              audits. Correct tax calculation every bill, eliminating manual
              errors.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <IconBox color="orange">
                  <FileText className="w-6 h-6 text-white" />
                </IconBox>
                <h4 className="font-semibold text-gray-900 mt-4 mb-2">
                  Correct tax calculation.
                </h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Eliminating manual errors and last-minute CA corrections
                  during audit filings.
                </p>
              </div>
              <div>
                <IconBox color="cyan">
                  <ArrowUpRight className="w-6 h-6 text-white" />
                </IconBox>
                <h4 className="font-semibold text-gray-900 mt-4 mb-2">
                  GST-ready invoices.
                </h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Matching Indian regulations and simplifying returns filing
                  each month.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Profit At A Glance - Text Left, Image Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Live Profit At A Glance.
            </h2>
            <p className="text-lg text-gray-500 mb-10 leading-relaxed">
              Track income and profits live across today, week, month instantly.
              Make faster decisions with real-time business clarity.
            </p>
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#46499e] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-600">
                  See today&apos;s earnings update after every bill
                </p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#46499e] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-600">
                  Know weekly and monthly profit without reports
                </p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#46499e] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-600">
                  Make faster decisions with real-time business clarity
                </p>
              </li>
            </ul>
          </div>

          <div className="order-1 lg:order-2">
            <FeatureImage 
              src="/Feature2.jpg" 
              alt="Live Profit At A Glance"
            />
          </div>
        </div>

        {/* Turn Customers Into Regular Buyers - Image Left, Text Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <FeatureImage 
            src="/Feature3.jpg" 
            alt="Turn Customers Into Regular Buyers"
          />

          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Customers Into Regular Buyers.
            </h2>
            <p className="text-lg text-gray-500 mb-10 leading-relaxed">
              Automatically track customer purchases using phone numbers to
              drive loyalty, repeat visits, and predictable sales. Build lasting
              relationships.
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-400">%</span>
                <span className="text-gray-700 font-medium">
                  30% increase in repeat sales.
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-400">×</span>
                <span className="text-gray-700 font-medium">
                  2× customer retention improvement.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}