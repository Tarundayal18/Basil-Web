"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomePopup({ isOpen, onClose }: WelcomePopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Popup Content */}
      <div
        className={`relative rounded-3xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        style={{ backgroundColor: '#4c499d' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-full"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        {/* Content Container */}
        <div className="p-10">
          {/* Logo */}
            <div className="flex justify-center mb-8">
                <div className="w-40 h-40 flex items-center justify-center">
                    <img
                        src="/popup.png"
                        alt="Basil Logo"
                        className="w-full h-full object-contain"
                        loading="eager"
                    />
                </div>
            </div>

          {/* Welcome Text */}
          <div className="text-white space-y-5">
            <p className="text-base text-white/90">Dear <span className="font-bold">Vyapaar Owner</span>,</p>
            
            <h2 className="text-base text-white leading-tight">
              Welcome to Basil
            </h2>
            
            <p className="text-base leading-relaxed text-white/90">
              Your <span className="font-bold text-white">30-day FREE</span> access starts now. No cost. No commitment.
            </p>
            
            <p className="text-base leading-relaxed text-white/80">
              Explore powerful features built to simplify your business and boost clarity.
            </p>
            
            <div className="bg-white/10 border-l-4 border-white/30 p-4 rounded-r-lg">
              <p className="text-sm leading-relaxed text-white/90">
                <span className="font-semibold text-white">Loved it? Missed something?</span><br />
                Tell us directly on WhatsApp. Your feedback shapes Basil.
              </p>
            </div>
          </div>

          {/* Founder Signature */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="text-right text-white/80">
              <p className="text-sm font-semibold text-white">— Sauhitya Garabadu</p>
              <p className="text-xs text-white/70">Founder, Basil</p>
            </div>
          </div>

          {/* OK Button */}
          <div className="mt-10">
            <button
              onClick={onClose}
              className="w-full bg-white hover:bg-white/90 text-[#4c499d] font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Let's Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}