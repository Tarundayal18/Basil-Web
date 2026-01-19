
/**
 * Footer component for the BASIL landing page.
 * This is the ninth section (NINE) - Footer Section
 * Contains CTA section, navigation links, and copyright information.
 * Now includes WhatsApp floating button.
 */

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";

/**
 * WhatsApp Floating Button - Internal Component
 */
function WhatsAppFloating() {
  const phoneNumber = "917718064819";
  const message = "Please Help Me Know More About Basil.";
  
  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleWhatsAppClick}
        className="bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center group relative"
        aria-label="Chat on WhatsApp"
      >
        <svg 
          className="w-8 h-8 relative z-10" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20"></span>
      </button>
      
      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-gray-900 text-white text-sm py-2 px-3 rounded-lg whitespace-nowrap">
          WhatsApp पर चैट करें
          <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Footer displays the footer section with CTA, links, and copyright.
 * Includes navigation links and a prominent call-to-action button.
 * @returns JSX element containing the footer section
 */
export default function Footer() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { trackButton, trackLink } = useAnalytics("Landing Page", false);

  /**
   * Handles the "Get Started" button click.
   * Redirects to dashboard if authenticated, otherwise to register page.
   */
  const handleGetStarted = () => {
    trackButton("Get Started", {
      is_authenticated: isAuthenticated,
      location: "footer",
    });
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/register");
    }
  };

  return (
    <>
      {/* WhatsApp Floating Button */}
      <WhatsAppFloating />
      
      <footer className="bg-[#46499e] text-white">
        {/* CTA Section */}
        <div className="py-16 md:py-24 px-6 md:px-10 lg:px-12 border-b border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Eagle की नज़र, चीते की रफ्तार
            </h2>
            <p className="text-2xl md:text-3xl font-semibold text-white/90 mb-8">
              बनाओ Vyapaar को Smart!
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-[#f1b02b] text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-[#46499e] transition-all transform hover:scale-105 shadow-xl"
            >
              Get 14 Day Free Trial
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="py-12 px-6 md:px-10 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              {/* Logo */}
              <div className="md:col-span-2">
                <div className="flex items-center mb-6">
                  <Image
                    src="/footer.png"
                    alt="Basil"
                    width={140}
                    height={48}
                    className="h-28 w-28"
                    unoptimized
                  />
                </div>
                <p className="text-white/70 max-w-md">
                  India&apos;s most awaited Mobile-First Retail ERP Solution.
                  Manage your entire business from your smartphone.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="#hero"
                      onClick={() =>
                        trackLink("Home", "#hero", { location: "footer" })
                      }
                      className="text-white/70 hover:text-[#f1b02b] transition-colors"
                    >
                      Home
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      onClick={() =>
                        trackLink("Features", "#features", { location: "footer" })
                      }
                      className="text-white/70 hover:text-[#f1b02b] transition-colors"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pricing"
                      onClick={() =>
                        trackLink("Pricing", "#pricing", { location: "footer" })
                      }
                      className="text-white/70 hover:text-[#f1b02b] transition-colors"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      onClick={() =>
                        trackLink("FAQ", "#faq", { location: "footer" })
                      }
                      className="text-white/70 hover:text-[#f1b02b] transition-colors"
                    >
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-bold text-lg mb-4">Contact Us</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/70">
                    <span>sales@basil.ind.in</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <span>+91 7718064819</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-white/10 pt-8 text-center text-white/50">
              <p>
                &copy; A Brand Work Owned by{" "}
                <a 
                  href="https://fanatisch.co" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => trackLink("Company Website", "https://fanatisch.co", { location: "footer" })}
                  className="font-bold hover:text-white transition-colors"
                >
                  Fanatisch Marketing Services (P) Ltd.
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}