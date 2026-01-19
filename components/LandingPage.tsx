"use client";

/**
 * Landing page component for the BASIL shopkeeper dashboard.
 * A single-page website with 9 sections as per the brand document.
 * Features: Hero, Second Hero, Features, Problems, Benefits, 3-Tier Features, Pricing, FAQ, Footer
 */

import {
  HeroSection,
  SecondHeroSection,
  FeaturesSection,
  ProblemsSection,
  BenefitsSection,
  ThreeTierFeaturesSection,
  PricingSection,
  FAQSection,
  Footer,
} from "./landing";

/**
 * Main landing page component that assembles all 9 sections.
 * Includes decorative gradient background for hero sections.
 * @returns JSX element containing the complete landing page
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Sections Wrapper with continuous gradient */}
      <div className="relative bg-white">
        {/* Decorative gradient background blobs - spans both hero sections */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Top gradient blob - brand primary (blue/purple) */}
          <div
            className="absolute -top-20 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
            style={{
              background: "linear-gradient(180deg, #46499e 0%, #e1b0d1 100%)",
            }}
          ></div>
          {/* Right gradient blob - pink */}
          <div
            className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
            style={{
              background: "linear-gradient(180deg, #e1b0d1 0%, #46499e 100%)",
            }}
          ></div>
          {/* Center gradient blob - yellow/orange */}
          <div
            className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px]"
            style={{
              background: "linear-gradient(180deg, #f1b02b 0%, #ed4734 100%)",
            }}
          ></div>
          {/* Bottom gradient blob */}
          <div
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
            style={{
              background: "linear-gradient(180deg, #e1b0d1 0%, #46499e 100%)",
            }}
          ></div>
          {/* Vertical gradient lines effect */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 199px, rgba(70,73,158,0.03) 199px, rgba(70,73,158,0.03) 200px)`,
            }}
          ></div>
        </div>

        {/* ONE - Hero Section */}
        <HeroSection />

        {/* TWO - Second Hero Section */}
        <SecondHeroSection />
      </div>

      {/* THREE - Features Section (6 tiles) */}
      <FeaturesSection />

      {/* FOUR - Problems We Are Solving */}
      <ProblemsSection />

      {/* FIVE - Benefits you get Instantly */}
      <BenefitsSection />

      {/* SIX - 3 Tier Features */}
      <ThreeTierFeaturesSection />

      {/* SEVEN - Pricing */}
      <PricingSection />

      {/* EIGHT - FAQ */}
      <FAQSection />

      {/* NINE - Footer */}
      <Footer />
    </div>
  );
}
