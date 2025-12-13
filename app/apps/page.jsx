import { Suspense } from "react";
import { AppsBody } from "@/components/apps/AppsBody";
import { AppsHeader } from "@/components/apps/AppsHeader";
import Loading from "@/app/loading";
import GraphBackgroundWrapper from "@/components/ui/GraphBackgroundWrapper";

export const metadata = {
  title: "Published Apps || RUET CSE Archive",
  description:
    "Discover amazing applications built by RUET CSE students. Vote for your favorites and showcase your own projects.",
  keywords: [
    "RUET",
    "CSE",
    "student apps",
    "projects",
    "software",
    "applications",
    "portfolio",
  ],
  openGraph: {
    title: "Published Apps || RUET CSE Archive",
    description:
      "Discover amazing applications built by RUET CSE students. Vote for your favorites and showcase your own projects.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Published Apps || RUET CSE Archive",
    description:
      "Discover amazing applications built by RUET CSE students. Vote for your favorites and showcase your own projects.",
  },
};

export default function Apps() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative">
      {/* Graph Background */}
      <GraphBackgroundWrapper />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 relative z-10">
        <AppsHeader />
        <Suspense fallback={<Loading />}>
          <AppsBody />
        </Suspense>
      </div>
    </div>
  );
}