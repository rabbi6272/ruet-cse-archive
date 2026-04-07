import { collection, getDocs } from "firebase/firestore";
import { CodelibraryDB, COLLECTION } from "@/utils/CodelibraryDB";

function flattenSnippetDocuments(snapshots) {
  const snippets = [];

  for (const snippetDoc of snapshots.docs) {
    const data = snippetDoc.data();

    if (Array.isArray(data.snippets)) {
      for (const snippet of data.snippets) {
        if (!snippet) continue;
        snippets.push({
          id: snippet.id,
          rollNumber: snippet.rollNumber || snippetDoc.id,
          ...snippet,
        });
      }
      continue;
    }

    snippets.push({
      id: snippetDoc.id,
      rollNumber: data.rollNumber || snippetDoc.id,
      ...data,
    });
  }

  return snippets;
}

async function fetchAllCodeSnippetsServer() {
  try {
    const snippetsRef = collection(CodelibraryDB, COLLECTION);
    const snapshots = await getDocs(snippetsRef);
    return flattenSnippetDocuments(snapshots).sort(
      (left, right) => new Date(right.date || 0) - new Date(left.date || 0),
    );
  } catch (error) {
    console.error("Error fetching code snippets:", error);
    return [];
  }
}

// Generate sitemap entries for code library
export async function generateCodeLibrarySitemap() {
  try {
    const snippets = await fetchAllCodeSnippetsServer();

    if (!snippets || snippets.length === 0) {
      return [];
    }

    const baseUrl = "https://csearchive.vercel.app";

    const sitemapEntries = snippets.map((snippet) => {
      return {
        url: `${baseUrl}/codelibrary/${snippet.id}`,
        lastModified:
          snippet.lastModified || snippet.date || new Date().toISOString(),
        changeFrequency: "weekly",
        priority: 0.7,
        // Additional metadata for rich snippets
        title: snippet.title,
        description: snippet.description,
        language: snippet.language,
        author: snippet.rollNumber,
      };
    });

    // Add the main code library page
    sitemapEntries.unshift({
      url: `${baseUrl}/codelibrary`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.8,
      title: "Code Library - Programming Solutions & Examples",
      description:
        "Browse comprehensive code library with programming solutions and examples from RUET CSE students.",
    });

    return sitemapEntries;
  } catch (error) {
    console.error("Error generating code library sitemap:", error);
    return [];
  }
}

// Generate robots.txt entries for code library
export function generateCodeLibraryRobots() {
  return [
    "# Code Library",
    "Allow: /codelibrary",
    "Allow: /codelibrary/*",
    "",
    "# Sitemap",
    "Sitemap: https://csearchive.vercel.app/sitemap-codelibrary.xml",
  ];
}

// Generate structured data for code library collection
export function generateCodeLibraryStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "RUET CSE Code Library",
    description:
      "A comprehensive collection of programming code snippets, algorithms, and solutions from RUET Computer Science & Engineering students.",
    url: "https://csearchive.vercel.app/codelibrary",
    mainEntity: {
      "@type": "ItemList",
      name: "Programming Code Snippets",
      description:
        "Curated collection of programming solutions and code examples",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
    },
    publisher: {
      "@type": "Organization",
      name: "RUET CSE Archive",
      logo: {
        "@type": "ImageObject",
        url: "https://csearchive.vercel.app/icon.png",
      },
    },
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
    },
    educationalUse: "instruction",
    about: [
      {
        "@type": "Thing",
        name: "Computer Programming",
        description:
          "Programming languages and software development techniques",
      },
      {
        "@type": "Thing",
        name: "Algorithms",
        description: "Computer algorithms and problem-solving techniques",
      },
      {
        "@type": "Thing",
        name: "Data Structures",
        description: "Fundamental data structures in computer science",
      },
    ],
    keywords:
      "programming, code library, algorithms, data structures, RUET, CSE, computer science, software development",
    inLanguage: "en-US",
  };
}

// Generate individual code snippet structured data
export function generateCodeSnippetStructuredData(snippet, snippetId) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: snippet.title,
    description: snippet.description,
    text: snippet.codeSnippet,
    programmingLanguage: snippet.language,
    author: {
      "@type": "Person",
      name: snippet.rollNumber ? `Roll: ${snippet.rollNumber}` : "Anonymous",
      identifier: snippet.rollNumber,
    },
    dateCreated: snippet.date,
    dateModified: snippet.lastModified || snippet.date,
    url: `https://csearchive.vercel.app/codelibrary/${snippetId}`,
    codeRepository: "https://csearchive.vercel.app/codelibrary",
    publisher: {
      "@type": "Organization",
      name: "RUET CSE Archive",
      logo: {
        "@type": "ImageObject",
        url: "https://csearchive.vercel.app/icon.png",
      },
    },
    license: "https://creativecommons.org/licenses/by-sa/4.0/",
    educationalUse: "instruction",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
    },
    keywords: snippet.tags
      ? snippet.tags.join(", ")
      : `${snippet.language}, programming, code`,
    about: {
      "@type": "Thing",
      name: snippet.language,
      description: `${snippet.language} programming language`,
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: snippet.likesCount || 0,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ShareAction",
        userInteractionCount: snippet.copiesCount || 0,
      },
    ],
  };
}

const seoUtils = {
  generateCodeLibrarySitemap,
  generateCodeLibraryRobots,
  generateCodeLibraryStructuredData,
  generateCodeSnippetStructuredData,
};

export default seoUtils;
