'use client';

import Head from 'next/head';
import { seoConfig, generateWebsiteStructuredData } from '@/lib/seo-config';

export default function SEOComponent({ 
  title, 
  description, 
  keywords = [], 
  image, 
  url, 
  structuredData = null,
  breadcrumbs = null 
}) {
  const pageTitle = title ? `${title} | ${seoConfig.siteName}` : seoConfig.defaultTitle;
  const pageDescription = description || seoConfig.defaultDescription;
  const pageImage = image || seoConfig.openGraph.images.default;
  const pageUrl = url || seoConfig.baseUrl;
  const allKeywords = [...seoConfig.defaultKeywords, ...keywords].join(', ');

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={allKeywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={`${seoConfig.baseUrl}${pageImage}`} />
      <meta property="og:site_name" content={seoConfig.siteName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageUrl} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={pageDescription} />
      <meta property="twitter:image" content={`${seoConfig.baseUrl}${pageImage}`} />
      <meta property="twitter:creator" content={seoConfig.twitter.handle} />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="RUET CSE Archive Team" />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={pageUrl} />
      
      {/* Alternate URLs */}
      <link rel="alternate" href={seoConfig.alternateUrl} />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      
      {/* Website Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(generateWebsiteStructuredData()) 
        }}
      />
      
      {/* Breadcrumbs Structured Data */}
      {breadcrumbs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": breadcrumbs.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.name,
                "item": item.url
              }))
            })
          }}
        />
      )}
    </Head>
  );
}
