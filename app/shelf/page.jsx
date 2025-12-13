import { ShelfHeader } from "@/components/shelf/shelf-header";
import { ShelfGrid } from "@/components/shelf/shelf-grid";
import GraphBackgroundWrapper from "@/components/ui/GraphBackgroundWrapper";

export const metadata = {
  title: "Digital Bookshelf || RUET CSE Archive",
  description:
    "Browse our curated collection of programming books, technical guides, and educational resources for computer science students at RUET.",
  keywords: [
    "RUET",
    "CSE",
    "programming books",
    "technical books",
    "computer science",
    "bookshelf",
  ],
  openGraph: {
    title: "Digital Bookshelf || RUET CSE Archive",
    description:
      "Browse our curated collection of programming books, technical guides, and educational resources for computer science students at RUET.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Bookshelf || RUET CSE Archive",
    description:
      "Browse our curated collection of programming books, technical guides, and educational resources for computer science students at RUET.",
  },
};

export default function Shelf() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative">
      {/* Graph Background */}
      <GraphBackgroundWrapper />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 relative z-10">
        <ShelfHeader />
        <ShelfGrid />
      </div>
    </div>
  );
}
