import type { MetadataRoute } from 'next'

const ORIGIN = 'https://bookreading.bookchaowalit.com'
const PUBLIC_PAGES = ['/', '/about', '/contact', '/privacy', '/terms', '/login', '/register']

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((path) => ({ url: `${ORIGIN}${path}`, changeFrequency: 'monthly', priority: path === '/' ? 1 : 0.5 }))
}
