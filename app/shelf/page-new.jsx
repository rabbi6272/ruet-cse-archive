import { ShelfHeader } from "@/components/shelf/shelf-header";
import { ShelfGrid } from "@/components/shelf/shelf-grid";
import { shelfMetadata } from "@/components/shelf/shelf-data";
import { Suspense } from "react";
import Loading from "./loading";

// Add metadata for SEO optimization
export const metadata = {
  title: shelfMetadata.title,
  description: shelfMetadata.description,
  keywords: shelfMetadata.keywords.join(", "),
  openGraph: {
    title: shelfMetadata.title,
    description: shelfMetadata.description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: shelfMetadata.title,
    description: shelfMetadata.description,
  },
};

// Server component - no client-side JavaScript needed for the page structure
export default function Shelf() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<Loading />}>
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <ShelfHeader />
          <ShelfGrid />
        </div>
      </Suspense>
    </main>
  );
}
