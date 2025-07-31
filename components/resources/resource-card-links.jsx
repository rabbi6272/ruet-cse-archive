"use client";

import Link from "next/link";
import { useState } from "react";

// Minimal client component only for interactive links with lazy toast loading
export function ResourceCardLinks({ links }) {
  const [toastLoaded, setToastLoaded] = useState(false);

  const showToast = async (message) => {
    if (!toastLoaded) {
      // Dynamically import toast only when needed
      const { toast } = await import("react-hot-toast");
      setToastLoaded(true);
      toast.error(message, {
        duration: 2000,
        position: "bottom-center",
      });
    } else {
      const { toast } = await import("react-hot-toast");
      toast.error(message, {
        duration: 2000,
        position: "bottom-center",
      });
    }
  };

  return (
    <div className="flex gap-3">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.url || "#"}
          className={`w-full rounded px-4 py-2 text-center font-semibold transition-all duration-200 transform hover:scale-105 ${
            link.url !== ""
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
              : "bg-gray-600 hover:bg-gray-700 text-gray-200 cursor-not-allowed"
          }`}
          onClick={(e) => {
            if (link.url === "") {
              e.preventDefault();
              showToast("Link not ready yet!");
            }
          }}
          aria-label={`${link.label} ${link.url === "" ? "(coming soon)" : ""}`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
