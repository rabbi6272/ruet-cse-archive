"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function AdvancedScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Disable browser's automatic scroll restoration
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // Scroll to top when route changes
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto", // Use 'auto' for immediate scroll, 'smooth' for animated
      });
    };

    // Small delay to ensure the page has rendered
    const timeoutId = setTimeout(scrollToTop, 10);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname, searchParams]);

  return null;
}
