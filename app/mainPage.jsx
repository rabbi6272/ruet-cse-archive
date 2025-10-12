"use client";
import { useEffect, useRef, useState } from "react";

import { Navbar } from "@/components/home/navbar/navbar";

export function MainPage({ children }) {
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setScrolled(!entry.isIntersecting);
      },
      {
        root: null, // viewport
        threshold: 0, // trigger as soon as it leaves/enters
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <Navbar scrolled={scrolled} />
      <div ref={sentinelRef} style={{ height: 1 }} />
      <main>{children}</main>
    </>
  );
}
