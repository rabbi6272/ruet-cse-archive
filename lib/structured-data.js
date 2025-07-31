export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "RUET CSE Archive",
  alternateName:
    "Rajshahi University of Engineering and Technology CSE Archive",
  url: "https://csearchive.vercel.app",
  sameAs: [
    "https://ruet-cse-archive.vercel.app",
    "https://csearchive.vercel.app"
  ],
  logo: "https://csearchive.vercel.app/icon.png",
  description:
    "Comprehensive archive of Computer Science & Engineering resources for RUET students. Access study materials, code libraries, alumni network, and academic guides for all semesters.",
  foundingDate: "2024",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Rajshahi",
    addressCountry: "Bangladesh",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "support",
    url: "https://csearchive.vercel.app/contact&help/help",
  },
  sameAs: ["https://www.ruet.ac.bd/"],
  department: {
    "@type": "CollegeOrUniversity",
    name: "Department of Computer Science and Engineering",
    parentOrganization: {
      "@type": "University",
      name: "Rajshahi University of Engineering and Technology",
      url: "https://www.ruet.ac.bd/",
    },
  },
};

export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RUET CSE Archive",
  url: "https://ruet-cse-archive.vercel.app",
  description:
    "Academic resources and study materials for Computer Science Engineering students at RUET",
  publisher: {
    "@type": "Organization",
    name: "RUET CSE Archive Team",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate:
        "https://ruet-cse-archive.vercel.app/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://ruet-cse-archive.vercel.app",
    },
  ],
};
