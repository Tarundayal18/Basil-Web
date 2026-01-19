/**
 * BenefitsSection component for the BASIL landing page.
 * This is the fifth section (FIVE) - Benefits you get Instantly Section
 * Reference: https://optiiflow.framer.website/home-03
 * Displays 3 benefit cards with UI mockups and descriptions matching the reference design.
 */

"use client";

import Image from "next/image";

/**
 * Benefit item interface for type safety
 */
interface Benefit {
  title: string;
  description: string;
  mockupType: "bill-inventory" | "pricing" | "barcode";
}

/**
 * BillInventoryMockup - Displays a mockup showing bill scanning with growth metrics
 * @returns JSX element with the bill to inventory image
 */
function BillInventoryMockup() {
  return (
    <div className="rounded-xl p-3 sm:p-5 h-full flex items-center justify-center">
      <Image
        src="/Benefits/instantBills.jpg"
        alt="Instant Bill to Inventory"
        width={700}
        height={600}
        className="w-full h-full object-contain rounded-lg"
      />
    </div>
  );
}

/**
 * PricingMockup - Displays a mockup card showing pricing interface
 * @returns JSX element with the pricing image
 */
function PricingMockup() {
  return (
    <div className="rounded-xl p-3 sm:p-5 h-full flex items-center justify-center">
      <Image
        src="/Benefits/pricing.jpg"
        alt="Pricing Without Guesswork"
        width={700}
        height={600}
        className="w-full h-full object-contain rounded-lg"
      />
    </div>
  );
}

/**
 * BarcodeMockup - Displays a mockup card showing barcode generation
 * @returns JSX element with the barcode image
 */
function BarcodeMockup() {
  return (
    <div className="rounded-xl p-3 sm:p-5 h-full flex items-center justify-center">
      <Image
        src="/Benefits/barcode.jpg"
        alt="No Barcode No Problem"
        width={700}
        height={600}
        className="w-full h-full object-contain rounded-lg"
      />
    </div>
  );
}

/**
 * BenefitsSection displays the instant benefits users get with BASIL.
 * Contains 3 benefit cards with UI mockups matching the reference design.
 * @returns JSX element containing the benefits section
 */
export default function BenefitsSection() {
  const benefits: Benefit[] = [
    {
      title: "Instant Bill to Inventory",
      description:
        "Click bill photo, stock gets created instantly—no typing, no mistakes.",
      mockupType: "bill-inventory",
    },
    {
      title: "Pricing Without Guesswork",
      description:
        "Set margin once. Basil calculates MRP, costs, and updates everything.",
      mockupType: "pricing",
    },
    {
      title: "No Barcode? No Problem",
      description:
        "Create barcodes or QR tags instantly for fast, smooth billing.",
      mockupType: "barcode",
    },
  ];

  /**
   * Renders the appropriate mockup component based on type
   * @param type - The mockup type to render
   * @returns JSX element for the mockup
   */
  const renderMockup = (type: Benefit["mockupType"]) => {
    switch (type) {
      case "bill-inventory":
        return <BillInventoryMockup />;
      case "pricing":
        return <PricingMockup />;
      case "barcode":
        return <BarcodeMockup />;
    }
  };

  return (
    <section
      id="benefits"
      className="py-12 sm:py-16 md:py-20 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-white"
    >
      <div className="max-w-[1260px] mx-auto">
        <div className="text-center mb-10 sm:mb-12 md:mb-14 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-bold text-gray-900 leading-tight px-4">
            Benefits you get instantly
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-[#f9f9fb] rounded-2xl p-4 sm:p-5 md:p-6 transition-transform duration-300 hover:-translate-y-1 min-h-[350px] sm:min-h-[380px] md:h-[400px] flex flex-col"
            >
              {/* Mockup Image Section */}
              <div className="mb-4 sm:mb-5 md:mb-6 rounded-xl overflow-hidden h-[200px] sm:h-[220px] md:h-[250px] flex items-center justify-center flex-shrink-0">
                {renderMockup(benefit.mockupType)}
              </div>
              {/* Card Title Section */}
              <div className="flex-grow">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-black mb-2">
                  {benefit.title}
                </h3>
                <p className="text-[#3b3b3b] leading-relaxed text-sm sm:text-[15px]">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}