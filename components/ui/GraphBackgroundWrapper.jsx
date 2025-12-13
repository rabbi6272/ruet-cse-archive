"use client";

import dynamic from "next/dynamic";

// Dynamically import GraphBackground to avoid SSR issues
const GraphBackground = dynamic(() => import("@/components/ui/GraphBackground"), {
  ssr: false,
});

export default function GraphBackgroundWrapper() {
  return <GraphBackground className="fixed inset-0 -z-10" />;
}