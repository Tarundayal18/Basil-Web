// /**
//  * PricingSection component for the BASIL landing page.
//  * This is the seventh section (SEVEN) - Pricing Section
//  * Features Monthly/Annual toggle, 3 pricing plans with the middle one marked as "Most Popular"
//  */

// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/contexts/AuthContext";
// import { useAnalytics } from "@/hooks/useAnalytics";
// import { Zap, Gem } from "lucide-react";

// /**
//  * Plan item interface for type safety
//  */
// interface Plan {
//   name: string;
//   description: string;
//   monthlyPrice: number;
//   annualPrice: number;
//   features: string[];
//   color: string;
//   popular: boolean;
//   icon?: React.ReactNode;
// }

// /**
//  * PricingSection displays the pricing plans with a monthly/annual toggle.
//  * Contains 3 plan cards with features list and CTA buttons.
//  * @returns JSX element containing the pricing section
//  */
// export default function PricingSection() {
//   const [isAnnual, setIsAnnual] = useState(false);
//   const router = useRouter();
//   const { isAuthenticated } = useAuth();
//   const { trackButton, track } = useAnalytics("Landing Page", false);

//   /**
//    * Handles plan selection and navigation
//    */
//   const handlePlanSelect = (planName: string) => {
//     trackButton("Plan Selected", {
//       plan_name: planName,
//       billing_cycle: isAnnual ? "annual" : "monthly",
//       is_authenticated: isAuthenticated,
//     });
//     track("Subscription Plan Selected", {
//       plan_name: planName,
//       billing_cycle: isAnnual ? "annual" : "monthly",
//     });
//     if (isAuthenticated) {
//       router.push("/subscription");
//     } else {
//       router.push("/register");
//     }
//   };

//   const plans: Plan[] = [
//     {
//       name: "Starter",
//       description: "Perfect for small shops",
//       monthlyPrice: 499,
//       annualPrice: 399,
//       features: [
//         "Single device billing",
//         "Basic inventory management",
//         "GST invoicing",
//         "WhatsApp bill sharing",
//         "Email support",
//       ],
//       color: "#46499e",
//       popular: false,
//     },
//     {
//       name: "Business",
//       description: "Most popular for growing shops",
//       monthlyPrice: 999,
//       annualPrice: 799,
//       features: [
//         "3 device billing",
//         "Advanced inventory",
//         "GST + GSTR reports",
//         "Customer management",
//         "Profit analytics",
//         "Priority support",
//       ],
//       color: "#46499e",
//       popular: true,
//       icon: <Zap className="w-5 h-5 text-white" />,
//     },
//     {
//       name: "Enterprise",
//       description: "For multi-store businesses",
//       monthlyPrice: 1999,
//       annualPrice: 1599,
//       features: [
//         "Unlimited devices",
//         "Multi-store support",
//         "Advanced analytics",
//         "API access",
//         "Custom integrations",
//         "Dedicated support",
//       ],
//       color: "#ed4734",
//       popular: false,
//       icon: <Gem className="w-5 h-5 text-white" />,
//     },
//   ];

//   return (
//     <section
//       id="pricing"
//       className="py-20 md:py-32 px-6 md:px-10 lg:px-12 bg-white"
//     >
//       <div className="max-w-7xl mx-auto">
//         {/* Header with title left and toggle right */}
//         <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-16">
//           <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
//             Choose the plan that fits your business.
//           </h2>

//           {/* Monthly/Annual Toggle */}
//           <div className="inline-flex items-center p-1 bg-gray-100 rounded-full self-start">
//             <button
//               onClick={() => {
//                 trackButton("Billing Cycle Toggle", { cycle: "monthly" });
//                 setIsAnnual(false);
//               }}
//               className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
//                 !isAnnual
//                   ? "bg-white text-gray-900 shadow-sm"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               Monthly
//             </button>
//             <button
//               onClick={() => {
//                 trackButton("Billing Cycle Toggle", { cycle: "annual" });
//                 setIsAnnual(true);
//               }}
//               className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
//                 isAnnual
//                   ? "bg-white text-gray-900 shadow-sm"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               Annual
//             </button>
//             <span className="ml-2 px-2 py-1 text-xs font-semibold text-[#ed4734] bg-red-50 rounded-full">
//               SAVE 20%
//             </span>
//           </div>
//         </div>

//         {/* Pricing Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {plans.map((plan, index) => (
//             <div
//               key={index}
//               className={`relative bg-white rounded-2xl p-8 border transition-all duration-300 ${
//                 plan.popular
//                   ? "border-gray-200 shadow-xl"
//                   : "border-gray-200 hover:shadow-lg"
//               }`}
//             >
//               {/* Most Popular Badge */}
//               {plan.popular && (
//                 <div className="absolute -top-3 right-6 inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full">
//                   <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
//                   Most popular
//                 </div>
//               )}

//               {/* Plan Header */}
//               <div className="mb-6">
//                 <div className="flex items-center gap-2 mb-2">
//                   {plan.icon && (
//                     <div
//                       className="w-7 h-7 rounded-lg flex items-center justify-center"
//                       style={{
//                         backgroundColor: plan.popular ? "#46499e" : plan.color,
//                       }}
//                     >
//                       {plan.icon}
//                     </div>
//                   )}
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     {plan.name}
//                   </h3>
//                 </div>
//                 <p className="text-gray-500 text-sm">{plan.description}</p>
//               </div>

//               {/* Price */}
//               <div className="mb-2">
//                 <span className="text-4xl font-bold text-gray-900">
//                   ₹{isAnnual ? plan.annualPrice : plan.monthlyPrice}
//                 </span>
//                 <span className="text-gray-500 text-sm">/month</span>
//               </div>
//               <p className="text-gray-400 text-sm mb-8">
//                 Per month, billed {isAnnual ? "yearly" : "monthly"}
//               </p>

//               {/* CTA Button */}
//               <button
//                 onClick={() => handlePlanSelect(plan.name)}
//                 className={`w-full py-3 rounded-full text-sm font-semibold transition-all mb-8 ${
//                   plan.popular
//                     ? "bg-[#46499e] text-white hover:bg-[#3a3d82]"
//                     : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 Get Started Now
//               </button>

//               {/* Features */}
//               <div>
//                 <p className="text-sm font-semibold text-gray-900 mb-4">
//                   Features included:
//                 </p>
//                 <ul className="space-y-3">
//                   {plan.features.map((feature, i) => (
//                     <li key={i} className="flex items-start gap-3">
//                       <span className="text-gray-400 text-sm font-medium">
//                         #
//                       </span>
//                       <span className="text-gray-600 text-sm">{feature}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }








"use client";


 const  handlePlanSelect = () => {
return(
<div></div>
);
}

 export default handlePlanSelect;