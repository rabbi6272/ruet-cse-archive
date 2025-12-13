"use client";

import { ibmPlexSans } from "@/app/ui/fonts";

export function AppsHeader() {
  return (
    <div className="text-center mb-8">
      <h1 className={`${ibmPlexSans.className} text-4xl lg:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100`}>
        Student Apps
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        Discover amazing applications built by RUET CSE students. Vote for your favorites and get inspired by innovative projects.
      </p>
    </div>
  );
}