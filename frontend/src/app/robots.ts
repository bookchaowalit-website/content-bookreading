import type { MetadataRoute } from 'next'

const ORIGIN = 'https://bookreading.bookchaowalit.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/app', '/build-info'] },
    sitemap: `${ORIGIN}/sitemap.xml`,
  }
}
