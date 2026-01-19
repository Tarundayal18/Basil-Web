/**
 * This file contains the Toast component for displaying temporary notifications
 * to users. It supports success, error, and info types with smooth animations.
 */

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "info";
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

/**
 * Toast component displays temporary notifications to users.
 * @param message - The message to display
 * @param type - The type of toast (error, success, or info)
 * @param isOpen - Whether the toast is visible
 * @param onClose - Callback to close the toast
 * @param duration - Duration in milliseconds before auto-closing (0 = no auto-close)
 */
export default function Toast({
  message,
  type = "error",
  isOpen,
  onClose,
  duration = 4000,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation
      const showTimer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 10);

      // Auto-close timer
      if (duration > 0) {
        const closeTimer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => {
          clearTimeout(showTimer);
          clearTimeout(closeTimer);
        };
      }

      return () => {
        clearTimeout(showTimer);
      };
    } else {
      setIsVisible(false);
      setIsAnimating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, duration]);

  /**
   * Handles the close animation and calls onClose
   */
  const handleClose = () => {
    setIsAnimating(false);
    setIsVisible(false);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const bgColor =
    type === "error"
      ? "bg-red-600"
      : type === "success"
      ? "bg-green-600"
      : "bg-blue-600";

  const icon =
    type === "success" ? (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ) : type === "error" ? (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ) : (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );

  const toastContent = (
    <div
      className={`fixed top-4 right-4 z-[99999] transition-all duration-300 ease-in-out ${
        isAnimating && isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2"
      }`}
      style={{
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      <div
        className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[500px] transform transition-all duration-300 ${
          isAnimating && isVisible ? "scale-100" : "scale-95"
        }`}
      >
        <div className="flex-shrink-0">{icon}</div>
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-white hover:text-gray-200 font-bold text-xl leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent rounded"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );

  if (!isOpen && !isVisible) return null;

  // Use portal to render outside normal DOM hierarchy to ensure it's above modals
  if (typeof window !== "undefined") {
    return createPortal(toastContent, document.body);
  }

  return null;
}
