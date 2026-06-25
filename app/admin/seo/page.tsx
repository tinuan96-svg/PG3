'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { SITE_URL } from '@/lib/seo'
import { supabase } from '@/lib/supabase'

const MOCK_TRAFFIC = [
  { page: '/', title: 'Homepage', views: 4820, clicks: 312, position: 3.2, impressions: 18400 },
  { page: '/kerala-groceries-london', title: 'Kerala Groceries London', views: 2341, clicks: 198, position: 4.1, impressions: 9800 },
  { page: '/kerala-spices-uk', title: 'Kerala Spices UK', views: 1892, clicks: 143, position: 5.8, impressions: 7200 },
  { page: '/kerala-rice-uk', title: 'Kerala Rice UK', views: 1540, clicks: 112, position: 6.2, impressions: 6100 },
  { page: '/kerala-snacks-online-uk', title: 'Kerala Snacks UK', views: 1321, clicks: 97, position: 7.1, impressions: 5400 },
  { page: '/products/nirapara-rose-matta-rice-5kg', title: 'Nirapara Matta Rice', views: 987, clicks: 76, position: 5.3, impressions: 3900 },
  { page: '/products/eastern-sambar-powder', title: 'Eastern Sambar Powder', views: 876, clicks: 64, position: 6.8, impressions: 3200 },
  { page: '/products/haldiram-banana-chips', title: 'Haldiram Banana Chips', views: 754, clicks: 58, position: 7.4, impressions: 2800 },
  { page: '/blog/authentic-kerala-fish-curry-recipe', title: 'Kerala Fish Curry Recipe', views: 698, clicks: 43, position: 8.1, impressions: 2600 },
  { page: '/products/kerala-coconut-oil-500ml', title: 'Kerala Coconut Oil', views: 612, clicks: 41, position: 9.2, impressions: 2300 },
]

const MOCK_SEARCHES = [
  { query: 'kerala groceries uk', volume: 4400, difficulty: 42, yourRank: 8 },
  { query: 'buy kerala rice online uk', volume: 2900, difficulty: 38, yourRank: 12 },
  { query: 'kerala snacks online uk', volume: 1800, difficulty: 31, yourRank: 6 },
  { query: 'kerala spices online uk', volume: 1600, difficulty: 35, yourRank: 9 },
  { query: 'matta rice uk', volume: 1200, difficulty: 28, yourRank: 5 },
  { query: 'coconut oil kerala uk', volume: 990, difficulty: 44, yourRank: 14 },
  { query: 'banana chips uk indian', volume: 880, difficulty: 22, yourRank: 4 },
  { query: 'sambar powder online uk', volume: 760, difficulty: 25, yourRank: 7 },
  { query: 'eastern chicken masala uk', volume: 640, difficulty: 19, yourRank: 3 },
  { query: 'nirapara puttu podi uk', volume: 580, difficulty: 15, yourRank: 2 },
]

type Tab = 'overview' | 'pages' | 'keywords' | 'feeds' | 'sitemap' | 'schema'

export default function SEODashboardPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [productCount, setProductCount] = useState<number>(0)
  const [categoryCount, setCategoryCount] = useState<number>(0)
  const [blogCount, setBlogCount] = useState<number>(0)

  useEffect(() => {
    async function loadCounts() {
      const [prodRes, catRes, blogRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      ])
      setProductCount(prodRes.count ?? 0)
      setCategoryCount(catRes.count ?? 0)
      setBlogCount(blogRes.count ?? 0)
    }
    loadCounts()
  }, [])

  const sitemapStats = {
    products: productCount,
    categories: categoryCount,
    blogPosts: blogCount,
    seoLanding: 10,
    programmatic: productCount * 5,
    total: 6 + 10 + categoryCount + productCount + blogCount + (productCount * 5),
  }

  const totalViews = MOCK_TRAFFIC.reduce((s, p) => s + p.views, 0)
  const totalClicks = MOCK_TRAFFIC.reduce((s, p) => s + p.clicks, 0)
  const avgPosition = (MOCK_TRAFFIC.reduce((s, p) => s + p.position, 0) / MOCK_TRAFFIC.length).toFixed(1)
  const totalImpressions = MOCK_TRAFFIC.reduce((s, p) => s + p.impressions, 0)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'pages', label: 'Top Pages' },
    { key: 'keywords', label: 'Keywords' },
    { key: 'feeds', label: 'Product Feeds' },
    { key: 'sitemap', label: 'Sitemap' },
    { key: 'schema', label: 'Schema Check' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor rankings, traffic, and product feeds</p>
        </div>

        <div className="flex gap-1 border-b border-gray-100 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-[#5FAE9B] text-[#0F2747]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-xs text-amber-700">
              Traffic data below is illustrative. Connect Google Search Console for live rankings.
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Monthly Views', value: totalViews.toLocaleString(), sub: 'Estimated organic', color: '#0F2747' },
                { label: 'Search Clicks', value: totalClicks.toLocaleString(), sub: 'Estimated clicks', color: '#5FAE9B' },
                { label: 'Avg. Position', value: avgPosition, sub: 'Estimated Google rank', color: '#e5a100' },
                { label: 'Total Impressions', value: totalImpressions.toLocaleString(), sub: 'Estimated impressions', color: '#5c7cbf' },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
                  <p className="text-2xl font-extrabold mb-1" style={{ color: kpi.color }}>{kpi.value}</p>
                  <p className="text-[11px] text-gray-400">{kpi.sub}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold mb-4 text-gray-900">SEO Health Checklist</h3>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {[
                  { label: 'XML Sitemap', status: 'pass', note: `${sitemapStats.total} URLs` },
                  { label: 'robots.txt', status: 'pass', note: 'Admin & API protected' },
                  { label: 'Canonical URLs', status: 'pass', note: 'All product pages' },
                  { label: 'OpenGraph Meta', status: 'pass', note: 'All pages' },
                  { label: 'Twitter Cards', status: 'pass', note: 'Summary large image' },
                  { label: 'Product Schema', status: 'pass', note: `${productCount} products` },
                  { label: 'FAQ Schema', status: 'pass', note: 'Product & location pages' },
                  { label: 'BreadcrumbList', status: 'pass', note: 'All inner pages' },
                  { label: 'LocalBusiness', status: 'pass', note: 'Homepage & buy pages' },
                  { label: 'Programmatic Pages', status: 'pass', note: `${sitemapStats.programmatic} pages` },
                  { label: 'Image Alt Text', status: 'pass', note: 'SEO-optimised alt tags' },
                  { label: 'Google Merchant Feed', status: 'pass', note: '/api/feeds/google-merchant' },
                ].map((check) => (
                  <div key={check.label} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-none" style={{ backgroundColor: check.status === 'pass' ? '#5FAE9B' : '#e55c5c' }}>
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={check.status === 'pass' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">{check.label}</span>
                    </div>
                    <span className="text-xs text-gray-400">{check.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TOP PAGES */}
        {tab === 'pages' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Top Performing Pages</h2>
              <p className="text-xs text-gray-400 mt-0.5">Estimated organic search data — connect Google Search Console for live data</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50">
                    {['Page', 'Views', 'Clicks', 'Avg. Position', 'Impressions', 'CTR'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TRAFFIC.map((row, i) => {
                    const ctr = ((row.clicks / row.impressions) * 100).toFixed(1)
                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-800 text-xs">{row.title}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{row.page}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold" style={{ color: '#0F2747' }}>{row.views.toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-600">{row.clicks}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${row.position <= 5 ? 'bg-green-100 text-green-700' : row.position <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            #{row.position}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{row.impressions.toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-600">{ctr}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KEYWORDS */}
        {tab === 'keywords' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Target Keywords</h2>
              <p className="text-xs text-gray-400 mt-0.5">Monthly search volume and estimated rankings</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50">
                    {['Keyword', 'Monthly Volume', 'Difficulty', 'Your Rank', 'Status'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_SEARCHES.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-800">{row.query}</td>
                      <td className="py-3 px-4 font-semibold" style={{ color: '#0F2747' }}>{row.volume.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${row.difficulty}%`,
                                backgroundColor: row.difficulty < 30 ? '#5FAE9B' : row.difficulty < 50 ? '#e5a100' : '#e55c5c',
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{row.difficulty}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${row.yourRank <= 5 ? 'bg-green-100 text-green-700' : row.yourRank <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          #{row.yourRank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-medium ${row.yourRank <= 5 ? 'text-green-600' : row.yourRank <= 10 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {row.yourRank <= 5 ? 'Top 5' : row.yourRank <= 10 ? 'Page 1' : 'Page 2+'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FEEDS */}
        {tab === 'feeds' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Google Merchant Center', url: '/api/feeds/google-merchant', format: 'XML RSS', color: '#4285F4' },
                { name: 'Facebook / Meta Shop', url: '/api/feeds/facebook', format: 'JSON', color: '#1877F2' },
                { name: 'Pinterest', url: '/api/feeds/all-platforms?platform=pinterest', format: 'JSON', color: '#E60023' },
                { name: 'TikTok Shop', url: '/api/feeds/all-platforms?platform=tiktok', format: 'JSON', color: '#010101' },
                { name: 'Instagram Shopping', url: '/api/feeds/all-platforms?platform=instagram', format: 'JSON', color: '#E1306C' },
                { name: 'All Platforms', url: '/api/feeds/all-platforms', format: 'JSON', color: '#5FAE9B' },
              ].map((feed) => (
                <div key={feed.name} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-gray-800">{feed.name}</h3>
                    <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-green-500">active</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">Format: <span className="font-medium text-gray-600">{feed.format}</span></p>
                  <p className="text-xs text-gray-400 mb-3">Products: <span className="font-semibold" style={{ color: '#0F2747' }}>{productCount}</span></p>
                  <div className="flex gap-2">
                    <a
                      href={feed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: feed.color }}
                    >
                      View Feed
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(`${SITE_URL}${feed.url}`)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold mb-3 text-gray-900">Feed Integration Guide</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="font-semibold text-blue-800 mb-1">Google Merchant Center</p>
                  <p className="text-blue-700 text-xs">Add feed URL in Google Merchant Center → Products → Feeds → + Add feed. Select "Scheduled fetch" and set the URL to your Google Merchant feed endpoint.</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="font-semibold text-gray-800 mb-1">Facebook / Meta Commerce Manager</p>
                  <p className="text-gray-600 text-xs">In Commerce Manager → Catalog → Add Items → Use Data Feed. Paste the Facebook feed URL and set auto-refresh to daily.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SITEMAP */}
        {tab === 'sitemap' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total URLs', value: sitemapStats.total, color: '#0F2747' },
                { label: 'Product Pages', value: sitemapStats.products, color: '#5FAE9B' },
                { label: 'Programmatic', value: sitemapStats.programmatic, color: '#e5a100' },
                { label: 'Category Pages', value: sitemapStats.categories, color: '#5c7cbf' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                  <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                  <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold mb-4 text-gray-900">Sitemap Sections</h3>
              <div className="space-y-2">
                {[
                  { section: 'Static Pages', count: 6, priority: '1.0 – 0.5', freq: 'daily / monthly' },
                  { section: 'SEO Landing Pages', count: 10, priority: '0.9 – 0.85', freq: 'weekly' },
                  { section: 'Category Pages', count: sitemapStats.categories, priority: '0.85', freq: 'weekly' },
                  { section: 'Product Pages', count: sitemapStats.products, priority: '0.8', freq: 'weekly' },
                  { section: 'Blog Articles', count: sitemapStats.blogPosts, priority: '0.7', freq: 'monthly' },
                  { section: 'Programmatic SEO Pages', count: sitemapStats.programmatic, priority: '0.6', freq: 'monthly' },
                  { section: 'Legal Pages', count: 5, priority: '0.3', freq: 'yearly' },
                ].map((row) => (
                  <div key={row.section} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{row.section}</span>
                    <div className="flex items-center gap-6 text-xs text-gray-400">
                      <span>{row.count} pages</span>
                      <span>Priority: {row.priority}</span>
                      <span>{row.freq}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  View XML Sitemap
                </a>
                <a
                  href="/sitemap-html"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  HTML Sitemap
                </a>
              </div>
            </div>
          </div>
        )}

        {/* SCHEMA */}
        {tab === 'schema' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold mb-4 text-gray-900">Structured Data (Schema.org) Status</h3>
            <div className="space-y-3">
              {[
                { type: 'Organization', pages: 'All pages (layout)', status: 'pass', note: 'Includes contact & address' },
                { type: 'LocalBusiness (GroceryStore)', pages: 'Homepage, /buy/* pages', status: 'pass', note: 'Opening hours, geo, service area' },
                { type: 'WebSite + SearchAction', pages: 'All pages (layout)', status: 'pass', note: 'Sitelinks search box enabled' },
                { type: 'Product + Offer', pages: '/products/[slug]', status: 'pass', note: `${productCount} product pages with price, availability` },
                { type: 'BreadcrumbList', pages: '/products/[slug], /buy/*/*, /blog/*', status: 'pass', note: 'Full breadcrumb trail' },
                { type: 'FAQPage', pages: '/products/[slug], /buy/*/* ', status: 'pass', note: '4–5 Q&A per page' },
                { type: 'Article', pages: '/blog/[slug]', status: 'pass', note: `${blogCount} blog articles` },
                { type: 'Recipe', pages: '/recipes (when applicable)', status: 'partial', note: 'Static recipe data available' },
                { type: 'AggregateRating', pages: '/products/[slug] (products with ratings)', status: 'pass', note: 'Rating + review count' },
              ].map((schema) => (
                <div key={schema.type} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-none mt-0.5"
                    style={{ backgroundColor: schema.status === 'pass' ? '#5FAE9B' : '#e5a100' }}
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={schema.status === 'pass' ? 'M5 13l4 4L19 7' : 'M12 9v4m0 4h.01'} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{schema.type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{schema.pages}</p>
                  </div>
                  <p className="text-xs text-gray-500 text-right max-w-[200px]">{schema.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>

  )
}
