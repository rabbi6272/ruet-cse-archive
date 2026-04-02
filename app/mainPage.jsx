"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { Navbar } from "@/app/components/home/navbar/navbar";

export function MainPage({ children }) {
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef(null);
  const pathname = usePathname();

  // Reset scroll state on route change and disable observer temporarily
  useEffect(() => {
    setScrolled(false);
  }, [pathname]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        // Use requestAnimationFrame to ensure this runs after layout
        requestAnimationFrame(() => {
          setScrolled(!entry.isIntersecting);
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0,
      },
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return (
    <>
      <Navbar scrolled={scrolled} />
      <div ref={sentinelRef} style={{ height: 1 }} />
      <main>{children}</main>
    </>
  );
}
