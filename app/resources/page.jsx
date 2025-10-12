'use client';

import { useEffect } from "react";
import { ResourcesHeader } from "@/components/resources/resources-header";
import { ResourcesGridOptimized } from "@/components/resources/resources-grid-super-optimized";
import { resourcesMetadata } from "@/components/resources/resources-data";

// Client component to support dynamic data fetching
export default function Resources() {
  // Set page title and meta description for client-side routing
  useEffect(() => {
    document.title = resourcesMetadata.title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', resourcesMetadata.description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = resourcesMetadata.description;
      document.head.appendChild(meta);
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', resourcesMetadata.keywords.join(", "));
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = resourcesMetadata.keywords.join(", ");
      document.head.appendChild(meta);
    }
  }, []);
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResourcesHeader />
        <ResourcesGridOptimized />
      </div>
    </main>
  );
}
