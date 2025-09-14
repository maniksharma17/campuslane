"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface SnackProps {
  open: boolean;
  onClose: () => void;
  message: string;
  variant?: "success" | "error" | "info";
  duration?: number; // auto-hide ms
}

const variantClasses = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
};

export default function Snack({
  open,
  onClose,
  message,
  variant = "info",
  duration = 3000,
}: SnackProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideIn">
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-lg shadow-lg ${variantClasses[variant]}`}
      >
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:opacity-75 transition"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
