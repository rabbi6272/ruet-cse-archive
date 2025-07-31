import { ResourcesHeader } from "@/components/resources/resources-header";
import { ResourcesGridOptimized } from "@/components/resources/resources-grid-super-optimized";
import { resourcesMetadata } from "@/components/resources/resources-data";

// Add metadata for SEO optimization
export const metadata = {
  title: resourcesMetadata.title,
  description: resourcesMetadata.description,
  keywords: resourcesMetadata.keywords.join(", "),
  openGraph: {
    title: resourcesMetadata.title,
    description: resourcesMetadata.description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: resourcesMetadata.title,
    description: resourcesMetadata.description,
  },
};

// Server component - no client-side JavaScript needed for the page structure
export default function Resources() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResourcesHeader />
        <ResourcesGridOptimized />
      </div>
    </main>
  );
}
