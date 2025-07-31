export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/user/dashboard',
          '/reviewers/dashboard',
          '/admin/migrate',
          '/_next/',
          '/private/'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/user/dashboard',
          '/reviewers/dashboard',
          '/admin/migrate',
          '/_next/',
          '/private/'
        ],
      },
    ],
    sitemap: [
      'https://csearchive.vercel.app/sitemap.xml',
      'https://ruet-cse-archive.vercel.app/sitemap.xml'
    ],
    host: 'https://csearchive.vercel.app'
  }
}
