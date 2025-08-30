import "./globals.css";

import { Navbar } from "@/components/home/navbar/navbar";
import { FooterComponent } from "@/components/home/footer";
import { PageTitleProvider } from "@/components/providers/PageTitleProvider";
import { P2PChatProvider } from "@/components/providers/P2PChatProvider";
import GlobalPresenceTracker from "@/components/providers/GlobalPresenceTracker";
import AIAssistant from "@/components/ai/AIAssistant";
import NoSSR from "@/components/ui/NoSSR";
import FirebaseObfuscationInit from "@/components/security/FirebaseObfuscationInit";

import { lato } from "./ui/fonts";
import { Toaster } from "react-hot-toast";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  metadataBase: new URL("https://csearchive.vercel.app"),
  title: {
    default: "RUET CSE Archive - Complete Resource Hub for CSE Students",
    template: "%s | RUET CSE Archive",
  },
  description:
    "The ultimate archive of Computer Science & Engineering resources for RUET students. Access notes, code libraries, academic materials, alumni network, and comprehensive study resources.",
  keywords: [
    "RUET",
    "CSE",
    "Computer Science",
    "Engineering",
    "Archive",
    "Resources",
    "Notes",
    "Code Library",
    "Academic Materials",
    "Study Resources",
    "Alumni Network",
    "Rajshahi University",
    "Bangladesh",
    "Programming",
    "Software Engineering",
    "Database",
    "Algorithms",
    "Data Structures",
    "Web Development",
  ],
  authors: [{ name: "RUET CSE Archive Team" }],
  creator: "RUET CSE Archive",
  publisher: "RUET CSE Archive",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://csearchive.vercel.app/",
    siteName: "RUET CSE Archive",
    title: "RUET CSE Archive - Complete Resource Hub for CSE Students",
    description:
      "The ultimate archive of Computer Science & Engineering resources for RUET students. Access notes, code libraries, academic materials, alumni network, and comprehensive study resources.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "RUET CSE Archive - Complete Resource Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RUET CSE Archive - Complete Resource Hub for CSE Students",
    description:
      "The ultimate archive of Computer Science & Engineering resources for RUET students. Access notes, code libraries, academic materials, alumni network, and comprehensive study resources.",
    images: ["/images/twitter-image.png"],
    creator: "@ruetcsearchive",
  },
  verification: {
    google: "your-google-verification-code", // Add your actual verification code
    yandex: "your-yandex-verification-code", // Add your actual verification code
    yahoo: "your-yahoo-verification-code", // Add your actual verification code
  },
  alternates: {
    canonical: "https://csearchive.vercel.app/",
    languages: {
      "en-US": "https://csearchive.vercel.app/",
      "bn-BD": "https://csearchive.vercel.app/bn",
    },
  },
  category: "education",
  classification: "Educational Resource Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://csearchive.vercel.app/" />
        <link rel="alternate" href="https://ruet-cse-archive.vercel.app/" />
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="theme-color" content="#071a26" />
        <meta name="msapplication-TileColor" content="#071a26" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Fira+Code:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link
          precedence="default"
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              name: "RUET CSE Archive",
              description:
                "The ultimate archive of Computer Science & Engineering resources for RUET students.",
              url: "https://csearchive.vercel.app/",
              logo: "https://csearchive.vercel.app/icon.png",
              sameAs: ["https://ruet-cse-archive.vercel.app/"],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Support",
                email: "support@csearchive.vercel.app",
              },
              address: {
                "@type": "PostalAddress",
                addressCountry: "BD",
                addressLocality: "Rajshahi",
              },
              founder: {
                "@type": "Organization",
                name: "RUET CSE Students",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${lato.className} antialiased bg-gray-200 dark:bg-[#071a26f1]`}
        suppressHydrationWarning={true}
      >
        <PageTitleProvider>
          <P2PChatProvider>
            <SpeedInsights />
            <Analytics />
            <Toaster />
            <NoSSR fallback={null}>
              <FirebaseObfuscationInit />
            </NoSSR>
            <GlobalPresenceTracker />
            <Navbar />

            {children}

            <FooterComponent />
            <NoSSR fallback={null}>
              <AIAssistant />
            </NoSSR>
          </P2PChatProvider>
        </PageTitleProvider>
      </body>
    </html>
  );
}
