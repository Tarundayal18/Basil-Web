/**
 * Tooltip Component
 * Provides contextual help and information tooltips throughout the application
 */

"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { HelpCircle, X, Info } from "lucide-react";

export interface TooltipProps {
  /**
   * The content to display in the tooltip
   */
  content: string | ReactNode;
  /**
   * Optional title for the tooltip
   */
  title?: string;
  /**
   * Position of the tooltip relative to the trigger element
   */
  position?: "top" | "bottom" | "left" | "right";
  /**
   * Size of the tooltip
   */
  size?: "sm" | "md" | "lg";
  /**
   * Optional custom trigger element. If not provided, defaults to HelpCircle icon
   */
  children?: ReactNode;
  /**
   * Whether to show the tooltip on hover (default) or click
   */
  trigger?: "hover" | "click";
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Optional icon to display (default: HelpCircle)
   */
  icon?: "help" | "info";
}

/**
 * Tooltip component for contextual help
 */
export default function Tooltip({
  content,
  title,
  position = "top",
  size = "md",
  children,
  trigger = "hover",
  className = "",
  icon = "help",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();

    // Calculate position based on position prop
    let top = 0;
    let left = 0;

    const tooltipWidth = size === "sm" ? 200 : size === "md" ? 280 : 360;
    const tooltipHeight = tooltip.offsetHeight || 150;

    switch (position) {
      case "top":
        top = rect.top - tooltipHeight - 10;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + 10;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - 10;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + 10;
        break;
    }

    // Adjust if tooltip goes off screen
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    if (top < 10) top = 10;
    if (top + tooltipHeight > window.innerHeight - 10) {
      top = window.innerHeight - tooltipHeight - 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }, [isVisible, position, size]);

  // Handle click outside to close
  useEffect(() => {
    if (trigger !== "click" || !isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, trigger]);

  const handleTrigger = () => {
    if (trigger === "click") {
      setIsVisible(!isVisible);
    } else {
      setIsVisible(true);
    }
  };

  const handleLeave = () => {
    if (trigger === "hover") {
      setIsVisible(false);
    }
  };

  const sizeClasses = {
    sm: "max-w-[200px] text-xs",
    md: "max-w-[280px] text-sm",
    lg: "max-w-[360px] text-base",
  };

  const IconComponent = icon === "help" ? HelpCircle : Info;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Element */}
      <div
        ref={triggerRef}
        onMouseEnter={trigger === "hover" ? handleTrigger : undefined}
        onMouseLeave={trigger === "hover" ? handleLeave : undefined}
        onClick={trigger === "click" ? handleTrigger : undefined}
        className="inline-flex items-center cursor-help"
        role="button"
        tabIndex={0}
        aria-label="Show help tooltip"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleTrigger();
          }
        }}
      >
        {children || (
          <IconComponent className="w-4 h-4 text-gray-400 hover:text-indigo-600 transition-colors" />
        )}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-[10000] ${sizeClasses[size]} bg-gray-900 text-white rounded-lg shadow-xl p-3 pointer-events-auto animate-in fade-in zoom-in-95 duration-200`}
          role="tooltip"
          onMouseEnter={trigger === "hover" ? () => setIsVisible(true) : undefined}
          onMouseLeave={trigger === "hover" ? () => setIsVisible(false) : undefined}
        >
          {/* Arrow indicator */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === "top"
                ? "bottom-[-4px] left-1/2 -translate-x-1/2"
                : position === "bottom"
                ? "top-[-4px] left-1/2 -translate-x-1/2"
                : position === "left"
                ? "right-[-4px] top-1/2 -translate-y-1/2"
                : "left-[-4px] top-1/2 -translate-y-1/2"
            }`}
          />

          {/* Close button for click trigger */}
          {trigger === "click" && (
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-1 right-1 text-gray-400 hover:text-white transition-colors"
              aria-label="Close tooltip"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Title */}
          {title && (
            <div className="font-semibold mb-2 text-white">{title}</div>
          )}

          {/* Content */}
          <div className="text-gray-200 leading-relaxed">
            {typeof content === "string" ? (
              <p className="whitespace-normal">{content}</p>
            ) : (
              content
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * InlineHelp component - Simple inline help icon with tooltip
 */
export function InlineHelp({
  content,
  title,
  position = "top",
  className = "",
}: {
  content: string | ReactNode;
  title?: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <Tooltip
      content={content}
      title={title}
      position={position}
      size="sm"
      className={className}
      trigger="hover"
    />
  );
}

/**
 * HelpBadge component - Info badge with tooltip
 */
export function HelpBadge({
  content,
  title,
  position = "right",
  className = "",
}: {
  content: string | ReactNode;
  title?: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <Tooltip
      content={content}
      title={title}
      position={position}
      size="md"
      className={className}
      trigger="hover"
      icon="info"
    />
  );
}
