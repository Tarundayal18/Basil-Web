/**
 * FeaturesSection component for the BASIL landing page.
 * This is the third section (THREE) - Features Section
 * Bento-style grid layout with 6 colored tiles
 * Layout: Left column (2 stacked), Center (1 large USP), Right column (1 + 2 side by side)
 */

"use client";

import {
  Zap,
  FileText,
  Smartphone,
  TrendingUp,
  Package,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";

/**
 * FeaturesSection displays the main features in a bento-style grid layout.
 * Contains 6 feature tiles with neomorphic styling and brand colors.
 * @returns JSX element containing the features section
 */
export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-10 md:py-16 px-6 md:px-10 lg:px-12"
      style={{
        background: "linear-gradient(180deg, #e8e8ec 0%, #eaeaee 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Bento Grid Layout - 30% | 40% | 30% on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[30%_40%_30%] gap-5 md:gap-6">
          {/* LEFT COLUMN - Two stacked cards */}
          <div className="flex flex-col gap-5 md:gap-6">
            {/* Tile 1: Instant Start (Today's Meeting style) */}
            <div
              className="group relative rounded-[28px] p-4 sm:p-3 transition-all duration-500 hover:-translate-y-1 cursor-pointer overflow-hidden"
              style={{
                backgroundColor: "#f9f9fb",
                boxShadow: "8px 8px 16px #d0d0d4, -8px -8px 16px #fafafa",
              }}
            >
              {/* Background Shape with mask */}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  aspectRatio: "1.1075581395348837 / 1",
                  backgroundColor: "#3b3b3b",
                  bottom: "-72px",
                  top: "-27px",
                  height: "310px",
                  width: "94%",
                  opacity: 0.04,
                  zIndex: 1,
                  mask: "url('/images/bento-mask.svg') alpha no-repeat center / cover add",
                  WebkitMask:
                    "url('/images/bento-mask.svg') alpha no-repeat center / cover add",
                }}
              ></div>

              {/* Inner white content card */}
              <div
                className="m-4 p-1 rounded-[25px]"
                style={{
                  backgroundColor: "#ffffff52",
                  boxShadow: "0 4px 16px #00000014",
                }}
              >
                <div className="relative bg-white rounded-[20px] p-4 sm:p-3">
                  {/* Icon and Heading */}
                  <div className="flex items-center gap-3 mb-3 sm:mb-2">
                    <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-xl bg-[#46499e]/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-7 h-7 sm:w-6 sm:h-6 text-[#46499e]" />
                    </div>
                    <h3 className="text-2xl sm:text-xl font-bold text-gray-900">
                      Instant Start
                    </h3>
                  </div>
                  <p className="text-gray-600 text-base sm:text-sm leading-relaxed">
                    Start billing in minutes. No training, no confusion, no
                    setup stress.
                  </p>
                </div>
              </div>
            </div>

            {/* Tile 2: GST Peace (Total Customers style) */}
            <div
              className="group relative rounded-[28px] p-4 sm:p-3 transition-all duration-500 hover:-translate-y-1 cursor-pointer overflow-hidden"
              style={{
                backgroundColor: "#f9f9fb",
                boxShadow: "8px 8px 16px #d0d0d4, -8px -8px 16px #fafafa",
              }}
            >
              {/* Background Shape with mask */}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  aspectRatio: "1.1075581395348837 / 1",
                  backgroundColor: "#3b3b3b",
                  bottom: "-72px",
                  top: "-27px",
                  height: "310px",
                  width: "94%",
                  opacity: 0.04,
                  zIndex: 1,
                  mask: "url('/images/bento-mask.svg') alpha no-repeat center / cover add",
                  WebkitMask:
                    "url('/images/bento-mask.svg') alpha no-repeat center / cover add",
                }}
              ></div>

              {/* Inner white content card */}
              <div
                className="m-3 p-1 rounded-[25px]"
                style={{
                  backgroundColor: "#ffffff52",
                  boxShadow: "0 4px 16px #00000014",
                }}
              >
                <div className="relative bg-white rounded-[20px] p-4 sm:p-3">
                  {/* Header with icon */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl sm:text-xl font-bold text-gray-900">
                      GST Peace
                    </h3>
                    <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-[#ed4734]/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 sm:w-5 sm:h-5 text-[#ed4734]" />
                    </div>
                  </div>

                  <p className="text-gray-600 text-base sm:text-sm leading-relaxed mb-4">
                    Automatic GST billing with proper invoices, ready for CA
                    anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER - Image and Text Section */}
          <div className="flex flex-col items-center justify-end text-center h-full">
            {/* Image Container */}
            <div className="relative w-full max-w-lg mb-6 mx-auto">
              <Image
                src="/smartphoneeagle.png"
                alt="Manage Business from Smartphone"
                width={450}
                height={450}
                className="w-full h-auto"
                priority
              />
            </div>

            {/* Text Content */}
            <div className="text-center">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight" style={{ color: "#4f52a3" }}>
                Manage Business from a SmartPhone
              </h3>
              <p className="text-base md:text-lg" style={{ color: "#4f52a3" }}>
                End to End Mobile First Features enabled to help you run your business on the go.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN - One card + two side by side */}
          <div className="flex flex-col gap-5 md:gap-6">
            {/* Tile 4: Live Profits (New Payment style) */}
            <div
              className="group relative rounded-[28px] p-4 sm:p-3 transition-all duration-500 hover:-translate-y-1 cursor-pointer overflow-hidden"
              style={{
                backgroundColor: "#f9f9fb",
                boxShadow: "8px 8px 16px #d0d0d4, -8px -8px 16px #fafafa",
              }}
            >
              {/* Background Shape with mask */}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  aspectRatio: "1.1075581395348837 / 1",
                  backgroundColor: "#3b3b3b",
                  bottom: "-72px",
                  top: "-27px",
                  height: "310px",
                  width: "94%",
                  opacity: 0.04,
                  zIndex: 1,
                  mask: "url('/images/bento-mask.svg') alpha no-repeat center / cover add",
                  WebkitMask:
                    "url('/images/bento-mask.svg') alpha no-repeat center / cover add",
                }}
              ></div>

              {/* Inner white content card */}
              <div
                className="m-3 p-1 rounded-[25px]"
                style={{
                  backgroundColor: "#ffffff52",
                  boxShadow: "0 4px 16px #00000014",
                }}
              >
                <div className="relative bg-white rounded-[20px] p-4 sm:p-3">
                  {/* Icon with accent */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-xl bg-[#e1b0d1]/20 flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 sm:w-6 sm:h-6 text-[#e1b0d1]" />
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-xl font-bold text-gray-900">
                        Live Profits
                      </h3>
                      <p className="text-sm sm:text-xs text-gray-500 mt-1">
                        Real-time tracking
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-base sm:text-sm leading-relaxed">
                    See today&apos;s income and profit clearly, anytime, from
                    anywhere.
                  </p>
                </div>
              </div>
            </div>

            {/* Two side by side cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tile 5: Auto Stock (Salary style) */}
              <div
                className="group relative rounded-[28px] p-4 sm:p-3 transition-all duration-500 hover:-translate-y-1 cursor-pointer overflow-hidden"
                style={{
                  backgroundColor: "#f9f9fb",
                  boxShadow: "8px 8px 16px #d0d0d4, -8px -8px 16px #fafafa",
                }}
              >
                {/* Background Shape with mask */}
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    aspectRatio: "1.1075581395348837 / 1",
                    backgroundColor: "#3b3b3b",
                    bottom: "-72px",
                    top: "-27px",
                    height: "310px",
                    width: "94%",
                    opacity: 0.04,
                    zIndex: 1,
                    mask: "url('/images/bento-mask.svg') alpha no-repeat center / cover add",
                    WebkitMask:
                      "url('/images/bento-mask.svg') alpha no-repeat center / cover add",
                  }}
                ></div>

                {/* Inner white content card */}
                <div className="relative rounded-[20px] py-4 sm:py-4 p-2 sm:p-0">
                  <h4 className="text-lg sm:text-base font-bold text-gray-900 mb-3">
                    Auto Stock
                  </h4>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl sm:text-2xl font-bold text-[#46499e]">
                      100%
                    </span>
                    <span className="text-sm sm:text-xs font-medium text-[#46499e] bg-[#46499e]/10 px-2 py-0.5 rounded-full">
                      Accurate
                    </span>
                  </div>

                  <p className="text-gray-500 text-sm sm:text-xs leading-relaxed">
                    Every sale updates stock automatically. No night counting,
                    no mistakes.
                  </p>

                  {/* Icon */}
                  <div className="absolute top-4 right-4 w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-[#46499e]/10 flex items-center justify-center">
                    <Package className="w-5 h-5 sm:w-4 sm:h-4 text-[#46499e]" />
                  </div>
                </div>
              </div>

              {/* Tile 6: Paper Zero (Phone Bills style) */}
              <div
                className="group relative rounded-[28px] p-4 sm:p-3 transition-all duration-500 hover:-translate-y-1 cursor-pointer overflow-hidden"
                style={{
                  backgroundColor: "#f9f9fb",
                  boxShadow: "8px 8px 16px #d0d0d4, -8px -8px 16px #fafafa",
                }}
              >
                {/* Background Shape with mask */}
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    aspectRatio: "1.1075581395348837 / 1",
                    backgroundColor: "#3b3b3b",
                    bottom: "-72px",
                    top: "-27px",
                    height: "310px",
                    width: "94%",
                    opacity: 0.04,
                    zIndex: 1,
                    mask: "url('/images/bento-mask.svg') alpha no-repeat center / cover add",
                    WebkitMask:
                      "url('/images/bento-mask.svg') alpha no-repeat center / cover add",
                  }}
                ></div>

                {/* Inner white content card */}
                <div className="relative rounded-[20px] py-4 sm:py-4 p-2 sm:p-0">
                  <h4 className="text-lg sm:text-base font-bold text-gray-900 mb-3">
                    Paper Zero Model
                  </h4>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl sm:text-2xl font-bold text-[#ed4734]">
                      0
                    </span>
                    <span className="text-sm sm:text-xs font-medium text-[#ed4734] bg-[#ed4734]/10 px-2 py-0.5 rounded-full">
                      Paper
                    </span>
                  </div>

                  <p className="text-gray-500 text-sm sm:text-xs leading-relaxed">
                    Send Bills to your customers Directly on WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
