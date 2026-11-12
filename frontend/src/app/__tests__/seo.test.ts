import { describe, expect, it, vi } from 'vitest'
import robots from '../robots'
import sitemap from '../sitemap'

// next/font/google only works inside a Next build; metadata needs none of it.
vi.mock('next/font/google', () => ({ Inter: () => ({ variable: 'v' }), Sarabun: () => ({ variable: 'v' }), Noto_Sans_Thai: () => ({ variable: 'v' }) }))

// Interface coverage: SEO basics (Open Graph, robots.txt, sitemap) for the public pages.
describe('SEO basics', () => {
  it('layout metadata carries an Open Graph title, description and Thai locale', async () => {
    const { metadata } = await import('../layout')
    expect(metadata.openGraph?.title).toBeTruthy()
    expect(metadata.openGraph?.description).toBeTruthy()
    expect(metadata.openGraph).toMatchObject({ locale: 'th_TH', type: 'website' })
  })

  it('robots.txt keeps private areas out and points at the sitemap', () => {
    const r = robots()
    expect(r.sitemap).toBe('https://bookreading.bookchaowalit.com/sitemap.xml')
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules
    expect(rules.disallow).toEqual(expect.arrayContaining(['/admin', '/api']))
  })

  it('the sitemap lists the public pages only', () => {
    const urls = sitemap().map((e) => e.url)
    expect(urls).toContain('https://bookreading.bookchaowalit.com/')
    expect(urls).toContain('https://bookreading.bookchaowalit.com/privacy')
    expect(urls.some((u) => u.includes('/admin'))).toBe(false)
  })
})
