// Since drive page is a client component, we'll handle SEO through layout or separate metadata
export const driveMetadata = {
  title: "Drive - Academic Resources & Documents",
  description: "Access shared academic resources, lecture notes, assignments, and study materials through our organized drive system. Download essential CSE documents and resources.",
  keywords: [
    "Academic Drive", "Study Materials", "Lecture Notes", "Assignments", 
    "CSE Resources", "Documents", "Academic Files", "Study Guide",
    "RUET Drive", "Course Materials", "Educational Resources", "Downloads"
  ],
  openGraph: {
    title: "Drive - Academic Resources & Documents | RUET CSE Archive",
    description: "Access shared academic resources, lecture notes, assignments, and study materials through our organized drive system.",
    url: "https://csearchive.vercel.app/drive",
    images: [
      {
        url: "/images/drive-og-image.png",
        width: 1200,
        height: 630,
        alt: "RUET CSE Academic Drive",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Drive - Academic Resources & Documents | RUET CSE Archive",
    description: "Access shared academic resources, lecture notes, assignments, and study materials through our organized drive system.",
    images: ["/images/drive-twitter-image.png"],
  },
  alternates: {
    canonical: "https://csearchive.vercel.app/drive",
  },
};
