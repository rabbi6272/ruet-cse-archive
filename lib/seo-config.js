// SEO Configuration for RUET CSE Archive
export const seoConfig = {
  baseUrl: 'https://csearchive.vercel.app',
  alternateUrl: 'https://ruet-cse-archive.vercel.app',
  siteName: 'RUET CSE Archive',
  defaultTitle: 'RUET CSE Archive - Complete Resource Hub for CSE Students',
  titleTemplate: '%s | RUET CSE Archive',
  defaultDescription: 'The ultimate archive of Computer Science & Engineering resources for RUET students. Access comprehensive notes, code libraries, academic materials, alumni network, and study resources all in one place.',
  
  defaultKeywords: [
    'RUET', 'CSE', 'Computer Science', 'Engineering', 'Archive', 'Resources', 
    'Notes', 'Code Library', 'Academic Materials', 'Study Resources', 'Alumni Network',
    'Rajshahi University', 'Bangladesh', 'Programming', 'Software Engineering',
    'Database', 'Algorithms', 'Data Structures', 'Web Development'
  ],

  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'RUET CSE Archive',
    images: {
      default: '/images/og-image.png',
      width: 1200,
      height: 630,
    }
  },

  twitter: {
    handle: '@ruetcsearchive',
    site: '@ruetcsearchive',
    cardType: 'summary_large_image',
  },

  verification: {
    google: 'your-google-verification-code', // Replace with actual code
    bing: 'your-bing-verification-code', // Replace with actual code
    yandex: 'your-yandex-verification-code', // Replace with actual code
  },

  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/icon.png',
    },
    {
      rel: 'apple-touch-icon',
      href: '/icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/manifest.json',
    },
  ],

  additionalMetaTags: [
    {
      name: 'theme-color',
      content: '#071a26',
    },
    {
      name: 'msapplication-TileColor',
      content: '#071a26',
    },
    {
      name: 'format-detection',
      content: 'telephone=no',
    },
    {
      httpEquiv: 'x-ua-compatible',
      content: 'IE=edge',
    },
  ],
};

// Generate metadata for specific pages
export const generatePageMetadata = (page) => {
  const pages = {
    home: {
      title: seoConfig.defaultTitle,
      description: seoConfig.defaultDescription,
      url: seoConfig.baseUrl,
      image: '/images/home-og-image.png',
    },
    codelibrary: {
      title: 'Code Library - Programming Solutions & Examples',
      description: 'Explore our comprehensive code library with programming solutions, algorithms, data structures, and code examples for CSE students.',
      url: `${seoConfig.baseUrl}/codelibrary`,
      image: '/images/codelibrary-og-image.png',
    },
    resources: {
      title: 'Academic Resources - Study Materials & Notes',
      description: 'Access comprehensive academic resources, study materials, lecture notes, and educational content for all CSE courses.',
      url: `${seoConfig.baseUrl}/resources`,
      image: '/images/resources-og-image.png',
    },
    alumni: {
      title: 'Alumni Network - Connect with RUET CSE Graduates',
      description: 'Connect with RUET CSE alumni worldwide. Explore career paths, get mentorship, and discover job opportunities.',
      url: `${seoConfig.baseUrl}/alumni`,
      image: '/images/alumni-og-image.png',
    },
    drive: {
      title: 'Drive - Academic Resources & Documents',
      description: 'Access shared academic resources, lecture notes, assignments, and study materials through our organized drive system.',
      url: `${seoConfig.baseUrl}/drive`,
      image: '/images/drive-og-image.png',
    },
    shelf: {
      title: 'Book Shelf - Digital Library & Academic Books',
      description: 'Browse our digital library collection of CSE textbooks, reference materials, and academic books.',
      url: `${seoConfig.baseUrl}/shelf`,
      image: '/images/shelf-og-image.png',
    },
  };

  const pageData = pages[page] || pages.home;

  return {
    title: pageData.title,
    description: pageData.description,
    keywords: seoConfig.defaultKeywords,
    openGraph: {
      title: pageData.title,
      description: pageData.description,
      url: pageData.url,
      siteName: seoConfig.siteName,
      images: [
        {
          url: pageData.image,
          width: seoConfig.openGraph.images.width,
          height: seoConfig.openGraph.images.height,
          alt: pageData.title,
        },
      ],
      locale: seoConfig.openGraph.locale,
      type: seoConfig.openGraph.type,
    },
    twitter: {
      card: seoConfig.twitter.cardType,
      title: pageData.title,
      description: pageData.description,
      images: [pageData.image],
      creator: seoConfig.twitter.handle,
    },
    alternates: {
      canonical: pageData.url,
      languages: {
        'en-US': pageData.url,
        'bn-BD': `${pageData.url}/bn`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
};

// Common structured data generators
export const generateWebsiteStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": seoConfig.siteName,
  "description": seoConfig.defaultDescription,
  "url": seoConfig.baseUrl,
  "sameAs": [seoConfig.alternateUrl],
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${seoConfig.baseUrl}/search?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
});

export const generateBreadcrumbStructuredData = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});
