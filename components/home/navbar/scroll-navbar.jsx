"use client";

import { useState, useEffect } from "react";

export function ScrollNavbar({ children, className }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === "undefined") return;

    // Simple and reliable scroll listener approach
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(scrolled);
    };

    // Set initial state
    setIsScrolled(window.scrollY > 50);

    // Add scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollClasses = isScrolled
    ? "bg-[#ffffff]/95 dark:bg-[#071a26]/95 backdrop-blur-md shadow-lg border-b border-gray-200/20 dark:border-gray-700/20"
    : "bg-transparent shadow-none border-b border-transparent";

  return (
    <nav
      className={`${className} ${scrollClasses}`}
      style={{
        transition: "all 0.3s ease-in-out",
      }}
    >
      {children}
    </nav>
  );
}
