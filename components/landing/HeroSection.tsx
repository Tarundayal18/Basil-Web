// /**
//  * HeroSection component for the BASIL landing page.
//  * This is the first section (ONE) - HOME PAGE - HERO SECTION
//  * Reference: https://optiiflow.framer.website/home-03
//  * Clean white background with subtle gradient blobs, split layout
//  */

// "use client";

// import { useState } from "react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/contexts/AuthContext";
// import { useAnalytics } from "@/hooks/useAnalytics";

// /**
//  * HeroSection displays the main hero content with navigation bar,
//  * headline, subtitle, description, and CTA buttons.
//  * @returns JSX element containing the hero section
//  */
// export default function HeroSection() {
//   const router = useRouter();
//   const { isAuthenticated } = useAuth();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const { trackButton, trackLink } = useAnalytics("Landing Page", false);

//   /**
//    * Handles the "Get Started" button click.
//    * Redirects to login page.
//    */
//   const handleGetStarted = () => {
//     trackButton("Get Started", {
//       location: "hero_section",
//     });
//     router.push("/login");
//   };

//   /**
//    * Handles the "Book A Demo" button click.
//    * Redirects to demo form page.
//    */
//   const handleDemo = () => {
//     trackButton("Book A Demo", {
//       location: "hero_section",
//     });
//     router.push("/demo-form");
//   };

//   /**
//    * Handles the "Login" button click.
//    * Redirects to login page.
//    */
//   const handleLogin = () => {
//     trackButton("Login", {
//       location: "hero_navigation",
//     });
//     router.push("/login");
//   };

//   // Navigation links anchored to sections below
//   const navLinks = [
//     { name: "Features", href: "#features" },
//     { name: "Solutions", href: "#problems" },
//     { name: "Benefits", href: "#benefits" },
//     { name: "Pricing", href: "#pricing" },
//     { name: "FAQ", href: "#faq" },
//   ];

//   return (
//     <section id="hero" className="relative min-h-screen flex flex-col">
//       {/* Navigation Bar */}
//       <nav className="relative z-50 px-6 md:px-10 lg:px-12 py-6">
//         <div className="flex items-center justify-between">
//           {/* Logo - Single combined logo */}
//           <a href="#hero" className="flex items-center">
//             <Image
//               src="/Basil-logo.png"
//               alt="Basil"
//               width={140}
//               height={48}
//               className="h-10 md:h-12 w-auto"
//               priority
//               unoptimized
//             />
//           </a>

//           {/* Desktop Navigation */}
//           <div className="hidden lg:flex items-center space-x-8">
//             {navLinks.map((link) => (
//               <a
//                 key={link.name}
//                 href={link.href}
//                 onClick={() => trackLink(link.name, link.href)}
//                 className="text-gray-700 hover:text-[#46499e] transition-colors font-medium text-sm"
//               >
//                 {link.name}
//               </a>
//             ))}
//             <button
//               onClick={handleLogin}
//               className="text-gray-700 hover:text-[#46499e] transition-colors font-medium text-sm cursor-pointer"
//             >
//               Login
//             </button>
//             <button
//               onClick={handleGetStarted}
//               className="bg-[#46499e] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#3a3d85] transition-all shadow-lg hover:shadow-xl"
//             >
//               Get 14 Day Free Trial
//             </button>
//           </div>

//           {/* Mobile Menu Button */}
//           <button
//             className="lg:hidden text-gray-700 p-2"
//             onClick={() => {
//               trackButton("Mobile Menu Toggle", {
//                 is_open: !mobileMenuOpen,
//               });
//               setMobileMenuOpen(!mobileMenuOpen);
//             }}
//           >
//             <svg
//               className="w-6 h-6"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d={
//                   mobileMenuOpen
//                     ? "M6 18L18 6M6 6l12 12"
//                     : "M4 6h16M4 12h16M4 18h16"
//                 }
//               />
//             </svg>
//           </button>
//         </div>

//         {/* Mobile Navigation */}
//         {mobileMenuOpen && (
//           <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg px-4 py-6 space-y-4 shadow-lg border-t border-gray-100">
//             {navLinks.map((link) => (
//               <a
//                 key={link.name}
//                 href={link.href}
//                 className="block text-gray-700 hover:text-[#46499e] transition-colors font-medium py-2"
//                 onClick={() => {
//                   trackLink(link.name, link.href, { location: "mobile_menu" });
//                   setMobileMenuOpen(false);
//                 }}
//               >
//                 {link.name}
//               </a>
//             ))}
//             <button
//               onClick={() => {
//                 handleLogin();
//                 setMobileMenuOpen(false);
//               }}
//               className="w-full text-gray-700 hover:text-[#46499e] transition-colors font-medium py-3 border border-gray-200 rounded-lg cursor-pointer"
//             >
//               Login
//             </button>
//             <button
//               onClick={() => {
//                 handleGetStarted();
//                 setMobileMenuOpen(false);
//               }}
//               className="w-full bg-[#46499e] text-white px-6 py-3 rounded-lg font-semibold"
//             >
//               Get 14 Day Free Trial
//             </button>
//           </div>
//         )}
//       </nav>

//       {/* Hero Content - Full Width */}
//       <div className="flex-1 flex flex-col justify-between px-6 md:px-10 lg:px-12 pt-12 md:pt-20 pb-0">
//         {/* Top Content - Heading and Subtitle */}
//         <div className="w-full pt-12 md:pt-16">
//           {/* Main Heading - Full Width */}
//           <div className="relative z-10 mb-6 text-center lg:text-left">
//             <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
//               आपके Vyapaar का Eagle!
//             </h1>
//           </div>

//           {/* Subtitle - Full Width */}
//           <div className="relative z-10 text-center lg:text-left">
//             <p className="text-xl md:text-2xl text-gray-600 font-medium">
//               India&apos;s most awaited Mobile-First Retail ERP Solution.
//             </p>
//           </div>
//         </div>

//         {/* Bottom Content - Description, CTAs and Meta tagline */}
//         <div className="w-full mt-auto">
//           {/* Two column layout: Meta tagline left, Description + CTAs right */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-end">
//             {/* Left - Description and CTAs */}
//             <div className="relative z-10 text-center lg:text-left order-2 lg:order-1">
//               {/* Text above action buttons */}
//               <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-8 max-w-md mx-auto lg:mr-auto lg:ml-0">
//                 Basil watches your retail business end-to-end—billing, stock,
//                 GST, and profits—giving Indian shop owners complete control and
//                 confidence.
//               </p>

//               {/* CTA Buttons */}
//               <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
//                 <button
//                   onClick={handleGetStarted}
//                   className="bg-[#46499e] text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-[#3a3d85] transition-all shadow-lg hover:shadow-xl"
//                 >
//                   Get 14 Days Free Trial
//                 </button>
//                 <button
//                   onClick={handleDemo}
//                   className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-base hover:bg-gray-50 transition-all border border-gray-200 shadow-sm"
//                 >
//                   Book A Demo
//                 </button>
//               </div>
//             </div>

//             {/* Right - Image */}
//             <div className="relative z-10 text-center lg:text-right order-1 lg:order-2">
//               <div className="relative w-full h-full flex items-center justify-center lg:justify-end">
//                 <Image
//                   src="/heroimage.png"
//                   alt="Basil Dashboard Preview"
//                   width={600}
//                   height={400}
//                   className="w-full max-w-md lg:max-w-lg h-auto object-contain"
//                   priority
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }



/**
 * HeroSection component for the BASIL landing page.
 * This is the first section (ONE) - HOME PAGE - HERO SECTION
 * Reference: https://optiiflow.framer.website/home-03
 * Clean white background with subtle gradient blobs, split layout
 * Full viewport height - no scroll needed
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";

/**
 * HeroSection displays the main hero content with navigation bar,
 * headline, subtitle, description, and CTA buttons.
 * @returns JSX element containing the hero section
 */
export default function HeroSection() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { trackButton, trackLink } = useAnalytics("Landing Page", false);

  /**
   * Handles the "Get Started" button click.
   * Redirects to login page.
   */
  const handleGetStarted = () => {
    trackButton("Get Started", {
      location: "hero_section",
    });
    router.push("/login");
  };

  /**
   * Handles the "Book A Demo" button click.
   * Redirects to demo form page.
   */
  const handleDemo = () => {
    trackButton("Book A Demo", {
      location: "hero_section",
    });
    router.push("/demo-form");
  };

  /**
   * Handles the "Login" button click.
   * Redirects to login page.
   */
  const handleLogin = () => {
    trackButton("Login", {
      location: "hero_navigation",
    });
    router.push("/login");
  };

  // Navigation links anchored to sections below
  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Solutions", href: "#problems" },
    { name: "Benefits", href: "#benefits" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <section id="hero" className="relative h-screen flex flex-col overflow-hidden">
      {/* Navigation Bar */}
      <nav className="relative z-50 px-6 md:px-10 lg:px-12 py-4 md:py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Logo - Single combined logo */}
          <a href="#hero" className="flex items-center">
            <Image
              src="/Basil-logo.png"
              alt="Basil"
              width={140}
              height={48}
              className="h-8 md:h-10 lg:h-12 w-auto"
              priority
              unoptimized
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => trackLink(link.name, link.href)}
                className="text-gray-700 hover:text-[#46499e] transition-colors font-medium text-sm"
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={handleLogin}
              className="text-gray-700 hover:text-[#46499e] transition-colors font-medium text-sm cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={handleGetStarted}
              className="bg-[#46499e] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#3a3d85] transition-all shadow-lg hover:shadow-xl"
            >
              Get 14 Day Free Trial
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-gray-700 p-2"
            onClick={() => {
              trackButton("Mobile Menu Toggle", {
                is_open: !mobileMenuOpen,
              });
              setMobileMenuOpen(!mobileMenuOpen);
            }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  mobileMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg px-4 py-6 space-y-4 shadow-lg border-t border-gray-100">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block text-gray-700 hover:text-[#46499e] transition-colors font-medium py-2"
                onClick={() => {
                  trackLink(link.name, link.href, { location: "mobile_menu" });
                  setMobileMenuOpen(false);
                }}
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={() => {
                handleLogin();
                setMobileMenuOpen(false);
              }}
              className="w-full text-gray-700 hover:text-[#46499e] transition-colors font-medium py-3 border border-gray-200 rounded-lg cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => {
                handleGetStarted();
                setMobileMenuOpen(false);
              }}
              className="w-full bg-[#46499e] text-white px-6 py-3 rounded-lg font-semibold"
            >
              Get 14 Day Free Trial
            </button>
          </div>
        )}
      </nav>

      {/* Hero Content - Flex container to fill remaining space */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-10 lg:px-12 pb-4 md:pb-8 overflow-y-auto">
        {/* Grid Layout - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center min-h-0">
          {/* Left Column - Text Content */}
          <div className="flex flex-col justify-center space-y-3 md:space-y-4 lg:space-y-6">
            {/* Main Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              आपके Vyapaar का Eagle!
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg lg:text-xl text-gray-600 font-medium">
              India&apos;s most awaited Mobile-First Retail ERP Solution.
            </p>

            {/* Description */}
            <p className="text-xs md:text-sm lg:text-base text-gray-600 leading-relaxed max-w-xl">
              Basil watches your retail business end-to-end—billing, stock,
              GST, and profits—giving Indian shop owners complete control and
              confidence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-1 md:pt-2">
              <button
                onClick={handleGetStarted}
                className="bg-[#46499e] text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-[#3a3d85] transition-all shadow-lg hover:shadow-xl"
              >
                Get 14 Days Free Trial
              </button>
              <button
                onClick={handleDemo}
                className="bg-white text-gray-700 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-gray-50 transition-all border border-gray-200 shadow-sm"
              >
                Book A Demo
              </button>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="flex items-center justify-center lg:justify-end mt-4 lg:mt-0">
            <div className="relative w-full max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
              <Image
                src="/heroimage.png"
                alt="Basil Dashboard Preview"
                width={600}
                height={400}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}