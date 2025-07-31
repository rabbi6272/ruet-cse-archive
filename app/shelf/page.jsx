import { BookShelfGrid } from "@/components/shelf/bookshelf";

export const metadata = {
  title: "Book Shelf - Digital Library & Academic Books",
  description: "Browse our digital library collection of CSE textbooks, reference materials, and academic books. Access essential reading materials for computer science studies.",
  keywords: [
    "Digital Library", "CSE Books", "Textbooks", "Reference Materials", 
    "Academic Books", "Computer Science Books", "Programming Books", 
    "Algorithm Books", "Database Books", "Software Engineering Books",
    "RUET Library", "Study Books", "Technical Books", "E-Books"
  ],
  openGraph: {
    title: "Book Shelf - Digital Library & Academic Books | RUET CSE Archive",
    description: "Browse our digital library collection of CSE textbooks, reference materials, and academic books. Access essential reading materials for computer science studies.",
    url: "https://csearchive.vercel.app/shelf",
    images: [
      {
        url: "/images/shelf-og-image.png",
        width: 1200,
        height: 630,
        alt: "RUET CSE Digital Library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book Shelf - Digital Library & Academic Books | RUET CSE Archive",
    description: "Browse our digital library collection of CSE textbooks, reference materials, and academic books.",
    images: ["/images/shelf-twitter-image.png"],
  },
  alternates: {
    canonical: "https://csearchive.vercel.app/shelf",
  },
};

export default function Shelf() {
  return (
    <div className="px-4 sm:px-6 lg:px-6">
      {/*Card Grid*/}
      <br />
      <br />
      <BookShelfGrid />
      <br />
      <br />
    </div>
  );
}
