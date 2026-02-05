import withFlowbiteReact from "flowbite-react/plugin/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix Windows OneDrive symlink issues
  outputFileTracingIncludes: {},
  outputFileTracingExcludes: {},

  // Disable symlinks to avoid Windows/OneDrive issues
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  // SEO and Performance optimizations
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Content-Type",
            value: "text/plain",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400",
          },
        ],
      },
    ];
  },

  // Enable compression
  compress: true,

  // Optimize images
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // Generate static sitemap
  async redirects() {
    return [
      // Redirect old URLs if needed
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // Enable trailing slash for consistent URLs
  trailingSlash: false,

  // Allow dev origins for cross-origin requests
  allowedDevOrigins: ["192.168.56.1", "192.168.0.235"],
};

export default withFlowbiteReact(nextConfig);
