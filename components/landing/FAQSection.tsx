/**
 * FAQSection component for the BASIL landing page.
 * This is the eighth section (EIGHT) - FAQ Section
 * Displays frequently asked questions in an accordion-style layout.
 */

"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useAnalytics } from "@/hooks/useAnalytics";

/**
 * FAQ item interface for type safety
 */
interface FAQ {
  question: string;
  answer: string;
}

/**
 * FAQSection displays frequently asked questions with expandable answers.
 * First FAQ is open by default, clicking toggles visibility.
 * Features a clean card-based design with subtle borders and circular icon buttons.
 * @returns JSX element containing the FAQ section
 */
export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { trackButton, trackLink } = useAnalytics("Landing Page", false);

  const faqs: FAQ[] = [
    {
      question: "Do I need to buy a POS machine or hardware to use BASIL?",
      answer:
        "No. BASIL works completely on your mobile, tablet, or laptop. No costly machines required.",
    },
    {
      question: "Is BASIL GST-compliant as per Indian taxation rules?",
      answer:
        "Yes. BASIL automatically calculates GST and generates proper invoices, ready for CA and audits.",
    },
    {
      question: "Can I use BASIL if my products don't have barcodes or MRPs?",
      answer:
        "Absolutely. You can generate barcodes or QR codes and define your own cost-to-MRP pricing logic.",
    },
    {
      question: "Will BASIL slow down billing during rush hours?",
      answer:
        "No. BASIL is built for fast, one-tap billing, even during peak customer traffic. In fact you can have multiple mobile devices billing simultaneously during Rush Hours.",
    },
    {
      question: "Can I see profits and customer details in real time?",
      answer:
        "Yes. BASIL shows live profits, daily income, and tracks repeat customers using phone numbers.",
    },
  ];

  /**
   * Toggles the visibility of a FAQ answer
   * @param index - The index of the FAQ to toggle
   */
  const toggleFAQ = (index: number) => {
    const isOpening = openIndex !== index;
    trackButton("FAQ Toggled", {
      faq_index: index,
      faq_question: faqs[index].question,
      action: isOpening ? "open" : "close",
    });
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-20 md:py-32 px-6 md:px-10 lg:px-12 bg-white"
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
            Frequently asked questions
          </h2>
          <p className="text-[#3b3b3b] text-base md:text-lg">
            How BASIL can benefit your business, understanding its features
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? "bg-[#f9f9fb] border-[rgba(59,59,59,0.1)]"
                    : "bg-white border-[rgba(59,59,59,0.12)]"
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4"
                >
                  <span className="font-semibold text-lg text-black">
                    {faq.question}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-white" strokeWidth={2} />
                    ) : (
                      <Plus className="w-4 h-4 text-white" strokeWidth={2} />
                    )}
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-6">
                    <p className="text-[#3b3b3b] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Text */}
        <div className="text-center mt-12">
          <p className="text-black text-base">
            Have any further questions about BASIL?{" "}
            <Link
              href="/contact"
              onClick={() =>
                trackLink("Contact Us", "/contact", { location: "faq_section" })
              }
              className="text-[#46499e] hover:underline font-medium"
            >
              Contact Us
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
