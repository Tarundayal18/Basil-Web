"use client";

import { useEffect } from "react";

interface SnackbarProps {
  message: string;
  type?: "error" | "success" | "info";
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Snackbar({
  message,
  type = "error",
  isOpen,
  onClose,
  duration = 5000,
}: SnackbarProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const bgColor =
    type === "error"
      ? "bg-red-600"
      : type === "success"
      ? "bg-green-600"
      : "bg-blue-600";

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300 ${
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div
        className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-4 min-w-[300px] max-w-[500px]`}
      >
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 font-bold text-xl leading-none transition-colors"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

