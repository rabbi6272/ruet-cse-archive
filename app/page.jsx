import { FAQSection } from "@/app/components/home/faq-section";
import { FeaturesList } from "@/app/components/home/features-list";
import { HeroImage } from "@/app/components/home/hero-image";
import { HeroSection } from "@/app/components/home/hero-section";

export const metadata = {
  title: "RUET CSE Archive - A Complete Resource Hub for RUET CSE Students",
  description:
    "The ultimate archive of Computer Science & Engineering resources for RUET students. Access comprehensive notes, code libraries, academic materials, alumni network and study materials all in one place.",
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
    title: "RUET CSE Archive - A Complete Resource Hub for RUET CSE Students",
    description:
      "The ultimate archive of Computer Science & Engineering resources for RUET students. Access comprehensive notes, code libraries, academic materials, alumni network and study materials all in one place.",
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
    title: "RUET CSE Archive - A Complete Resource Hub for RUET CSE Students",
    description:
      "The ultimate archive of Computer Science & Engineering resources for RUET students. Access comprehensive notes, code libraries, academic materials, alumni network and study materials all in one place.",
    images: ["/images/home-twitter-image.png"],
  },
  alternates: {
    canonical: "https://csearchive.vercel.app/",
  },
};

export default function Home() {
  return (
    <section>
      {/* Hero Section */}
      <HeroSection />

      {/* Image Section */}
      <HeroImage />
      <br />

      {/*Features List*/}
      <FeaturesList />
      <br />

      {/* FAQ Section */}
      <FAQSection />
      <br />
    </section>
  );
}
