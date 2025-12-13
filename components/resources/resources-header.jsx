// Server component for static header
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ibmPlexSans } from "@/app/ui/fonts";
import { BookmarkPopup } from "@/components/drive/BookmarkPopup";

export function ResourcesHeader() {
  return (
    <div className={`${ibmPlexSans.className} mb-8`}>
      {/* Bookmark Icon in top right */}
      <div className="flex justify-end mb-4">
        <BookmarkPopup />
      </div>
      
      {/* Header content */}
      <div className="text-center">
        <h3 className="text-5xl md:text-5xl lg:text-5xl font-extrabold mb-4 text-nowrap">
          <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
            Academic Resources
          </span>
        </h3>
        <p className="text-md font-normal text-gray-500 lg:text-xl dark:text-gray-400 max-w-3xl mx-auto">
          Access comprehensive study materials, course resources, and academic
          guides for all years of your CSE journey at RUET.
        </p>
      </div>
    </div>
  );
}
