import { MetadataRoute } from 'next'
import { getAllSitemapEntries } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const {
    now,
    staticPages,
    categoryPages,
    productPages,
    seoLandingPages,
    blogPages,
    programmaticPages,
    legalPages,
  } = getAllSitemapEntries()

  const toEntry = (p: { url: string; priority: number; changeFreq?: string }) => ({
    url: p.url,
    lastModified: now,
    changeFrequency: (p.changeFreq || 'monthly') as MetadataRoute.Sitemap[0]['changeFrequency'],
    priority: p.priority,
  })

  return [
    ...staticPages.map(toEntry),
    ...seoLandingPages.map(toEntry),
    ...categoryPages.map(toEntry),
    ...productPages.map(toEntry),
    ...blogPages.map(toEntry),
    ...programmaticPages.map(toEntry),
    ...legalPages.map(toEntry),
  ]
}
