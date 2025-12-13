import { ResourcesHeader } from "@/components/resources/resources-header";
import { ResourcesGridOptimized } from "@/components/resources/resources-card-grid";
import GraphBackgroundWrapper from "@/components/ui/GraphBackgroundWrapper";

// Page metadata for SEO
export const metadata = {
  title: "Academic Resources || RUET CSE Archive",
  description:
    "Access comprehensive study materials, course resources, and academic guides for all years of your CSE journey at RUET.",
  keywords: [
    "RUET",
    "CSE",
    "academic resources",
    "study materials",
    "computer science",
    "engineering",
  ],
  openGraph: {
    title: "Academic Resources || RUET CSE Archive",
    description:
      "Access comprehensive study materials, course resources, and academic guides for all years of your CSE journey at RUET.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Academic Resources || RUET CSE Archive",
    description:
      "Access comprehensive study materials, course resources, and academic guides for all years of your CSE journey at RUET.",
  },
};

// Client component to support dynamic data fetching
export default function Resources() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative">
      {/* Graph Background */}
      <GraphBackgroundWrapper />
      
      <div className="container mx-auto px-6 py-8 relative z-10">
        <ResourcesHeader />
        <ResourcesGridOptimized />
      </div>
    </div>
  );
}
