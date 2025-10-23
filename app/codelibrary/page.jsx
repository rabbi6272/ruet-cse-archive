import { CodeLibraryHeader } from "@/components/codelibrary/LibraryHeader";
import { CodeLibraryBody } from "@/components/codelibrary/CodeLibraryClient";
// import { CodeLibraryPagination } from "@/components/codelibrary/Pagination";

export const metadata = {
  title: "Code Library - Programming Solutions & Examples",
  description:
    "Explore our comprehensive code library with programming solutions, algorithms, data structures, and code examples for CSE students. Find implementation guides and best practices.",
  keywords: [
    "Code Library",
    "Programming Solutions",
    "Algorithms",
    "Data Structures",
    "C++ Code",
    "Python Code",
    "Java Code",
    "JavaScript",
    "Programming Examples",
    "CSE Code",
    "RUET Programming",
    "Code Snippets",
    "Software Development",
  ],
  openGraph: {
    title: "Code Library - Programming Solutions & Examples | RUET CSE Archive",
    description:
      "Explore our comprehensive code library with programming solutions, algorithms, data structures, and code examples for CSE students.",
    url: "https://csearchive.vercel.app/codelibrary",
    images: [
      {
        url: "/images/codelibrary-og-image.png",
        width: 1200,
        height: 630,
        alt: "RUET CSE Code Library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Library - Programming Solutions & Examples | RUET CSE Archive",
    description:
      "Explore our comprehensive code library with programming solutions, algorithms, data structures, and code examples for CSE students.",
    images: ["/images/codelibrary-twitter-image.png"],
  },
  alternates: {
    canonical: "https://csearchive.vercel.app/codelibrary",
  },
};

export default function CodeLibrary() {
  return (
    <>
      <div className="mb-8">
        <CodeLibraryHeader />
      </div>

      <CodeLibraryBody />
      {/* <CodeLibraryPagination /> */}
    </>
  );
}
