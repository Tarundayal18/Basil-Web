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
 * FeatureCard component that displays a card with soft blue gradient glow effect
 * @param children - The content to display inside the card
 * @returns JSX element containing the styled feature card
 */
function FeatureCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Soft blue gradient glow background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-cyan-50/60 to-transparent rounded-[2rem] blur-xl scale-105" />
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        {children}
      </div>
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
 * layouts with chart cards and detailed descriptions.
 * @returns JSX element containing the three-tier features section
 */
export default function ThreeTierFeaturesSection() {
  return (
    <section
      id="three-tier"
      className="py-20 md:py-32 px-6 md:px-10 lg:px-12 bg-white"
    >
      <div className="max-w-7xl mx-auto space-y-24 md:space-y-32">
        {/* GST Made Totally Stress Free - Chart Left, Text Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <FeatureCard>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Weekly GST Summary
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  ₹12,450{" "}
                  <span className="text-lg font-normal text-gray-500">
                    Tax Collected
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  This is the total GST for this week
                </p>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#46499e]" />
                  <span className="text-gray-600">CGST</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-gray-600">SGST</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-900" />
                  <span className="text-gray-600">IGST</span>
                </div>
              </div>
            </div>
            {/* Line Chart SVG */}
            <div className="relative h-40 mt-4">
              <svg
                viewBox="0 0 400 120"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Grid lines */}
                <line
                  x1="0"
                  y1="30"
                  x2="400"
                  y2="30"
                  stroke="#f0f0f0"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="60"
                  x2="400"
                  y2="60"
                  stroke="#f0f0f0"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="90"
                  x2="400"
                  y2="90"
                  stroke="#f0f0f0"
                  strokeWidth="1"
                />
                {/* CGST Line - Blue */}
                <path
                  d="M0,80 Q50,70 100,75 T200,50 T300,60 T400,55"
                  fill="none"
                  stroke="#46499e"
                  strokeWidth="2"
                />
                {/* SGST Line - Cyan */}
                <path
                  d="M0,90 Q50,85 100,80 T200,70 T300,75 T400,65"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                />
                {/* IGST Line - Black */}
                <path
                  d="M0,100 Q50,95 100,90 T200,85 T300,80 T400,85"
                  fill="none"
                  stroke="#111827"
                  strokeWidth="2"
                />
                {/* Data point with tooltip */}
                <circle cx="200" cy="50" r="4" fill="#46499e" />
                <rect
                  x="160"
                  y="20"
                  width="80"
                  height="25"
                  rx="4"
                  fill="white"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x="175"
                  y="32"
                  fill="#46499e"
                  fontSize="8"
                  fontWeight="500"
                >
                  ● CGST
                </text>
                <text
                  x="200"
                  y="40"
                  fill="#111827"
                  fontSize="10"
                  fontWeight="600"
                >
                  ₹2,400
                </text>
              </svg>
              {/* X-axis labels */}
              <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
              </div>
            </div>
          </FeatureCard>

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

        {/* Live Profit At A Glance - Text Left, Chart Right */}
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
            <FeatureCard>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-semibold text-gray-900">
                  Live Profit
                </h3>
                <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              {/* Circular Progress Gauge */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <svg viewBox="0 0 200 200" className="w-48 h-48">
                    {/* Background arc */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#f0f0f0"
                      strokeWidth="12"
                      strokeDasharray="377 503"
                      strokeDashoffset="-63"
                      strokeLinecap="round"
                    />
                    {/* Progress bars - segmented style */}
                    {Array.from({ length: 24 }).map((_, i) => {
                      const angle = -135 + i * 11.25;
                      const isActive = i < 17;
                      return (
                        <line
                          key={i}
                          x1={100 + 70 * Math.cos((angle * Math.PI) / 180)}
                          y1={100 + 70 * Math.sin((angle * Math.PI) / 180)}
                          x2={100 + 88 * Math.cos((angle * Math.PI) / 180)}
                          y2={100 + 88 * Math.sin((angle * Math.PI) / 180)}
                          stroke={isActive ? "#46499e" : "#e5e7eb"}
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      72%
                    </span>
                    <span className="text-sm text-gray-500">Profit margin</span>
                  </div>
                </div>
              </div>
              {/* Legend */}
              <div className="flex justify-between text-xs text-gray-500 px-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#46499e]" />
                  <span>Total profit per day</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Average sales</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 px-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                  <span>For week</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-900" />
                  <span>Profit today</span>
                </div>
              </div>
            </FeatureCard>
          </div>
        </div>

        {/* Turn Customers Into Regular Buyers - Chart Left, Text Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <FeatureCard>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Customer Retention
              </h3>
              <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ArrowUpRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {/* Wave Chart SVG */}
            <div className="relative h-48 mb-4">
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 py-2">
                <span>FRI</span>
                <span>SUN</span>
                <span>SAT</span>
              </div>
              <svg
                viewBox="0 0 350 150"
                className="w-full h-full ml-8"
                preserveAspectRatio="none"
              >
                {/* Grid lines */}
                <line
                  x1="0"
                  y1="37.5"
                  x2="350"
                  y2="37.5"
                  stroke="#f0f0f0"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="75"
                  x2="350"
                  y2="75"
                  stroke="#f0f0f0"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="112.5"
                  x2="350"
                  y2="112.5"
                  stroke="#f0f0f0"
                  strokeWidth="1"
                />
                {/* New Customers Wave - Light cyan */}
                <path
                  d="M0,100 C30,90 60,110 100,95 C140,80 160,120 200,100 C240,80 280,95 320,85 C340,80 350,90 350,90"
                  fill="none"
                  stroke="#a5f3fc"
                  strokeWidth="2.5"
                />
                {/* Repeat Customers Wave - Blue with dot */}
                <path
                  d="M0,80 C30,60 60,90 100,70 C140,50 180,100 220,60 C260,20 300,80 350,50"
                  fill="none"
                  stroke="#46499e"
                  strokeWidth="2.5"
                />
                {/* Data point */}
                <circle cx="220" cy="60" r="5" fill="#46499e" />
              </svg>
            </div>
            {/* Legend */}
            <div className="flex gap-8 text-sm ml-8">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-200" />
                <span className="text-gray-600">New Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#46499e]" />
                <span className="text-gray-600">Repeat Buyers</span>
              </div>
            </div>
          </FeatureCard>

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
