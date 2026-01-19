/**
 * SectionWrapper provides a uniform container for all settings sections.
 * Ensures consistent styling and layout across all settings pages.
 */
import React from "react";
import { LucideIcon } from "lucide-react";

interface SectionWrapperProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
  children: React.ReactNode;
}

export function SectionWrapper({
  title,
  description,
  icon: Icon,
  gradientFrom,
  gradientTo,
  iconColor,
  children,
}: SectionWrapperProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
      <div
        className="px-6 py-4"
        style={{
          background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6" style={{ color: iconColor }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-white/90 text-sm">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
