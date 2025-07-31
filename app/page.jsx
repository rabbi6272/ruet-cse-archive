import { FeaturesList } from "@/components/home/features_list";

export const metadata = {
  title: "RUET CSE Archive - Complete Resource Hub for CSE Students",
  description: "The ultimate archive of Computer Science & Engineering resources for RUET students. Access comprehensive notes, code libraries, academic materials, alumni network, and study resources all in one place.",
  keywords: [
    "RUET CSE", "Computer Science Engineering", "Study Resources", "Notes", 
    "Code Library", "Academic Materials", "Programming", "Algorithms", 
    "Data Structures", "Software Engineering", "Database", "Web Development",
    "RUET Students", "CSE Archive", "Educational Resources"
  ],
  openGraph: {
    title: "RUET CSE Archive - Complete Resource Hub for CSE Students",
    description: "The ultimate archive of Computer Science & Engineering resources for RUET students. Access comprehensive notes, code libraries, academic materials, alumni network, and study resources all in one place.",
    url: "https://csearchive.vercel.app/",
    images: [
      {
        url: "/images/home-og-image.png",
        width: 1200,
        height: 630,
        alt: "RUET CSE Archive Homepage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RUET CSE Archive - Complete Resource Hub for CSE Students",
    description: "The ultimate archive of Computer Science & Engineering resources for RUET students. Access comprehensive notes, code libraries, academic materials, alumni network, and study resources all in one place.",
    images: ["/images/home-twitter-image.png"],
  },
  alternates: {
    canonical: "https://csearchive.vercel.app/",
  },
};

export default function Home() {
  return (
    <div className="w-full">
      <br />
      {/*Features List*/}
      <FeaturesList />
      <br />

      {/* Slideshow */}
      <br />
    </div>
  );
}
