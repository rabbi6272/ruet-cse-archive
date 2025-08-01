import { FAQSection } from "@/components/home/faq-section";
import { FeaturesList } from "@/components/home/features-list";
import { HeroSection } from "@/components/home/hero-section";

import Image from "next/image";
import image0 from "@/public/images/slideshow/image0.jpg";

export const metadata = {
  title: "RUET CSE Archive - Complete Resource Hub for CSE Students",
  description:
    "The ultimate archive of Computer Science & Engineering resources for RUET students. Access comprehensive notes, code libraries, academic materials, alumni network, and study resources all in one place.",
  keywords: [
    "RUET CSE",
    "Computer Science Engineering",
    "Study Resources",
    "Notes",
    "Code Library",
    "Academic Materials",
    "Programming",
    "Algorithms",
    "Data Structures",
    "Software Engineering",
    "Database",
    "Web Development",
    "RUET Students",
    "CSE Archive",
    "Educational Resources",
  ],
  openGraph: {
    title: "RUET CSE Archive - Complete Resource Hub for CSE Students",
    description:
      "The ultimate archive of Computer Science & Engineering resources for RUET students. Access comprehensive notes, code libraries, academic materials, alumni network, and study resources all in one place.",
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
    description:
      "The ultimate archive of Computer Science & Engineering resources for RUET students. Access comprehensive notes, code libraries, academic materials, alumni network, and study resources all in one place.",
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
      {/* Hero Section */}
      <HeroSection />
      <br />

      {/*Features List*/}
      <FeaturesList />
      <br />

      {/* Image Section */}
      <Image
        src={image0}
        alt={`Slide`}
        priority
        className="w-full md:w-[70%] lg:w-[50%] px-4 object-cover mx-auto"
      />
      <br />

      {/* FAQ Section */}
      <FAQSection />
      <br />
    </div>
  );
}
