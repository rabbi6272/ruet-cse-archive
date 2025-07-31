// Comprehensive structured data for RUET CSE Archive
export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://csearchive.vercel.app/#website",
      "url": "https://csearchive.vercel.app/",
      "name": "RUET CSE Archive",
      "description": "The ultimate archive of Computer Science & Engineering resources for RUET students.",
      "publisher": {
        "@id": "https://csearchive.vercel.app/#organization"
      },
      "potentialAction": [
        {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://csearchive.vercel.app/search?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      ],
      "inLanguage": "en-US",
      "sameAs": [
        "https://ruet-cse-archive.vercel.app/"
      ]
    },
    {
      "@type": "Organization",
      "@id": "https://csearchive.vercel.app/#organization",
      "name": "RUET CSE Archive",
      "url": "https://csearchive.vercel.app/",
      "logo": {
        "@type": "ImageObject",
        "inLanguage": "en-US",
        "@id": "https://csearchive.vercel.app/#/schema/logo/image/",
        "url": "https://csearchive.vercel.app/icon.png",
        "contentUrl": "https://csearchive.vercel.app/icon.png",
        "width": 512,
        "height": 512,
        "caption": "RUET CSE Archive"
      },
      "image": {
        "@id": "https://csearchive.vercel.app/#/schema/logo/image/"
      },
      "sameAs": [
        "https://ruet-cse-archive.vercel.app/"
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://csearchive.vercel.app/#webpage",
      "url": "https://csearchive.vercel.app/",
      "name": "RUET CSE Archive - Complete Resource Hub for CSE Students",
      "isPartOf": {
        "@id": "https://csearchive.vercel.app/#website"
      },
      "about": {
        "@id": "https://csearchive.vercel.app/#organization"
      },
      "description": "The ultimate archive of Computer Science & Engineering resources for RUET students. Access comprehensive notes, code libraries, academic materials, alumni network, and study resources all in one place.",
      "breadcrumb": {
        "@id": "https://csearchive.vercel.app/#breadcrumb"
      },
      "inLanguage": "en-US",
      "potentialAction": [
        {
          "@type": "ReadAction",
          "target": [
            "https://csearchive.vercel.app/"
          ]
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://csearchive.vercel.app/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://csearchive.vercel.app/"
        }
      ]
    }
  ]
};

// Generate page-specific structured data
export const generatePageStructuredData = (pageType, pageData = {}) => {
  const baseUrl = "https://csearchive.vercel.app";
  
  const commonStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "url": pageData.url || baseUrl,
    "name": pageData.title || "RUET CSE Archive",
    "description": pageData.description || "The ultimate archive of Computer Science & Engineering resources for RUET students.",
    "isPartOf": {
      "@type": "WebSite",
      "name": "RUET CSE Archive",
      "url": baseUrl
    },
    "inLanguage": "en-US",
    "publisher": {
      "@type": "Organization",
      "name": "RUET CSE Archive",
      "url": baseUrl
    }
  };

  switch (pageType) {
    case 'codelibrary':
      return {
        ...commonStructuredData,
        "@type": ["WebPage", "CollectionPage"],
        "about": {
          "@type": "Thing",
          "name": "Programming Code Library",
          "description": "Collection of programming solutions, algorithms, and code examples"
        },
        "mainEntity": {
          "@type": "ItemList",
          "name": "Code Examples",
          "description": "Programming solutions and code snippets for CSE students"
        }
      };

    case 'resources':
      return {
        ...commonStructuredData,
        "@type": ["WebPage", "CollectionPage"],
        "about": {
          "@type": "Thing",
          "name": "Academic Resources",
          "description": "Educational materials and study resources for computer science"
        },
        "mainEntity": {
          "@type": "ItemList",
          "name": "Study Materials",
          "description": "Academic resources and educational content"
        }
      };

    case 'alumni':
      return {
        ...commonStructuredData,
        "@type": ["WebPage", "ProfilePage"],
        "about": {
          "@type": "Thing",
          "name": "Alumni Network",
          "description": "Network of RUET CSE graduates and professionals"
        },
        "mainEntity": {
          "@type": "Organization",
          "name": "RUET CSE Alumni Network",
          "description": "Professional network of CSE graduates"
        }
      };

    case 'drive':
      return {
        ...commonStructuredData,
        "@type": ["WebPage", "CollectionPage"],
        "about": {
          "@type": "Thing",
          "name": "Academic Drive",
          "description": "Shared repository of academic documents and resources"
        }
      };

    case 'shelf':
      return {
        ...commonStructuredData,
        "@type": ["WebPage", "CollectionPage"],
        "about": {
          "@type": "Thing",
          "name": "Digital Library",
          "description": "Collection of academic books and reference materials"
        },
        "mainEntity": {
          "@type": "ItemList",
          "name": "Academic Books",
          "description": "Digital library of CSE textbooks and references"
        }
      };

    default:
      return commonStructuredData;
  }
};
