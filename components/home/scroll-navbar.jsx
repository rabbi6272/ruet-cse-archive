"use client";

import { useState, useEffect } from "react";

export function ScrollNavbar({ children, className }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Use a simple scroll listener with throttling for better performance
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Set initial state
    setIsScrolled(window.scrollY > 50);

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
      className={`${className} transition-all duration-300 ease-in-out ${scrollClasses}`}
    >
      {children}
    </nav>
  );
}
