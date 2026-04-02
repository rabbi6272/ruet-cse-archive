import { ResourcesHeader } from "@/app/components/resources/resources-header";
import { ResourcesGridOptimized } from "@/app/components/resources/resources-card-grid";

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
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <ResourcesHeader />
        <ResourcesGridOptimized />
      </div>
    </div>
  );
}
