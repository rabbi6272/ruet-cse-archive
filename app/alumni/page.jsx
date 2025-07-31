import { Leafletmap } from "@/components/alumni/leafletmap.jsx";

export const metadata = {
  title: "Alumni Network - Connect with RUET CSE Graduates",
  description: "Connect with RUET CSE alumni worldwide. Explore career paths, get mentorship, and discover job opportunities from successful CSE graduates working in top tech companies.",
  keywords: [
    "RUET CSE Alumni", "Alumni Network", "CSE Graduates", "Career Guidance", 
    "Mentorship", "Job Opportunities", "Tech Companies", "Professional Network",
    "RUET Alumni", "Computer Science Alumni", "Software Engineers", "Tech Careers"
  ],
  openGraph: {
    title: "Alumni Network - Connect with RUET CSE Graduates | RUET CSE Archive",
    description: "Connect with RUET CSE alumni worldwide. Explore career paths, get mentorship, and discover job opportunities from successful CSE graduates.",
    url: "https://csearchive.vercel.app/alumni",
    images: [
      {
        url: "/images/alumni-og-image.png",
        width: 1200,
        height: 630,
        alt: "RUET CSE Alumni Network",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alumni Network - Connect with RUET CSE Graduates | RUET CSE Archive",
    description: "Connect with RUET CSE alumni worldwide. Explore career paths, get mentorship, and discover job opportunities from successful CSE graduates.",
    images: ["/images/alumni-twitter-image.png"],
  },
  alternates: {
    canonical: "https://csearchive.vercel.app/alumni",
  },
};

export default function Alumni() {
  return <Leafletmap />;
}
