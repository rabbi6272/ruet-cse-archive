"use client";

import { Toaster } from "react-hot-toast";

// Minimal client component for toast notifications
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 2000,
        style: {
          background: "var(--toast-bg, #374151)",
          color: "var(--toast-color, #fff)",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
