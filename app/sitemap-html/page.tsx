import type { Metadata } from 'next'
import Link from 'next/link'
import { ALL_PRODUCTS, CATEGORIES } from '@/lib/products-data'

export const metadata: Metadata = {
  title: 'Sitemap | PocketGrocery Kerala Groceries UK',
  description: 'Complete sitemap of PocketGrocery.com — browse all product pages, categories, blog articles, recipes, and more.',
  alternates: { canonical: 'https://pocketgrocery.com/sitemap-html' },
  robots: { index: true, follow: true },
}

const BLOG_ARTICLES = [
  { title: 'How to Make the Perfect Kerala Sadya', slug: 'how-to-make-perfect-kerala-sadya' },
  { title: '10 Essential Kerala Spices Every Kitchen Needs', slug: 'essential-kerala-spices-every-kitchen' },
  { title: 'Authentic Kerala Fish Curry Recipe', slug: 'authentic-kerala-fish-curry-recipe' },
  { title: 'A Complete Guide to Kerala Rice Varieties', slug: 'guide-to-kerala-rice-varieties' },
  { title: 'Kerala Breakfast Recipes: Puttu, Appam & More', slug: 'kerala-breakfast-recipes-puttu-appam' },
  { title: 'Health Benefits of Kerala Coconut Oil', slug: 'health-benefits-coconut-oil' },
]

const CITY_PAGES = [
  { title: 'Kerala Groceries UK', slug: 'kerala-groceries-uk' },
  { title: 'Kerala Groceries London', slug: 'kerala-groceries-london' },
  { title: 'Kerala Groceries Manchester', slug: 'kerala-groceries-manchester' },
  { title: 'Kerala Groceries Birmingham', slug: 'kerala-groceries-birmingham' },
  { title: 'Kerala Groceries Leeds', slug: 'kerala-groceries-leeds' },
  { title: 'Kerala Groceries Glasgow', slug: 'kerala-groceries-glasgow' },
  { title: 'Kerala Groceries Leicester', slug: 'kerala-groceries-leicester' },
]

const SEO_PAGES = [
  { title: 'Buy Kerala Rice Online UK', href: '/kerala-rice-uk' },
  { title: 'Kerala Snacks Online UK', href: '/kerala-snacks-online-uk' },
  { title: 'Kerala Spices UK', href: '/kerala-spices-uk' },
]

const LEGAL_PAGES = [
  { title: 'Privacy Policy', href: '/legal/privacy-policy' },
  { title: 'Terms & Conditions', href: '/legal/terms-conditions' },
  { title: 'Shipping Policy', href: '/legal/shipping-policy' },
  { title: 'Refund Policy', href: '/legal/refund-policy' },
  { title: 'Cookie Policy', href: '/legal/cookie-policy' },
  { title: 'Disclaimer', href: '/legal/disclaimer' },
  { title: 'Acceptable Use', href: '/legal/acceptable-use' },
]

export default function HTMLSitemap() {
  const productsByCategory = CATEGORIES.map((cat) => ({
    category: cat,
    products: ALL_PRODUCTS.filter((p) => p.category === cat.name),
  })).filter((c) => c.products.length > 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2" style={{ color: '#0F2747' }}>
            Site Map
          </h1>
          <p className="text-sm text-gray-500">
            Complete index of all pages on PocketGrocery.com
          </p>
        </div>

        <div className="space-y-8">

          {/* Main Pages */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: '#0F2747' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#5FAE9B' }} />
              Main Pages
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { title: 'Homepage', href: '/' },
                { title: 'All Products', href: '/products' },
                { title: 'Blog', href: '/blog' },
                { title: 'Recipes', href: '/recipes' },
                { title: 'My Account', href: '/account' },
                { title: 'Pocket Wallet', href: '/wallet' },
              ].map((p) => (
                <Link key={p.href} href={p.href} className="text-sm font-medium hover:opacity-75 transition-opacity py-1.5 flex items-center gap-2" style={{ color: '#0F2747' }}>
                  <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {p.title}
                </Link>
              ))}
            </div>
          </section>

          {/* Category Pages */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: '#0F2747' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#5FAE9B' }} />
              Category Pages
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="text-sm font-medium hover:opacity-75 transition-opacity py-1.5 flex items-center gap-2"
                  style={{ color: '#0F2747' }}
                >
                  <span className="text-sm">{cat.icon}</span>
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>

          {/* Products by category */}
          {productsByCategory.map(({ category, products }) => (
            <section key={category.name} className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: '#0F2747' }}>
                <span className="text-base">{category.icon}</span>
                {category.name}
                <span className="text-xs font-normal text-gray-400">({products.length})</span>
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                {products.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/products/${p.slug}`}
                    className="text-xs text-gray-600 hover:text-[#0F2747] transition-colors py-1 flex items-center gap-1.5"
                  >
                    <svg className="w-2.5 h-2.5 text-gray-200 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {p.name}
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {/* SEO Landing Pages */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: '#0F2747' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#e5a100' }} />
              SEO Landing Pages
            </h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {[...CITY_PAGES.map((p) => ({ title: p.title, href: `/${p.slug}` })), ...SEO_PAGES].map((p) => (
                <Link key={p.href} href={p.href} className="text-sm font-medium hover:opacity-75 transition-opacity py-1.5 flex items-center gap-2" style={{ color: '#0F2747' }}>
                  <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {p.title}
                </Link>
              ))}
            </div>
          </section>

          {/* Blog */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: '#0F2747' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#5c7cbf' }} />
              Blog Articles
            </h2>
            <div className="space-y-2">
              {BLOG_ARTICLES.map((a) => (
                <Link key={a.slug} href={`/blog/${a.slug}`} className="text-sm font-medium hover:opacity-75 transition-opacity py-1 flex items-center gap-2" style={{ color: '#0F2747' }}>
                  <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {a.title}
                </Link>
              ))}
            </div>
          </section>

          {/* Legal */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: '#0F2747' }}>
              <span className="w-2 h-2 rounded-full inline-block bg-gray-300" />
              Legal & Policies
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {LEGAL_PAGES.map((p) => (
                <Link key={p.href} href={p.href} className="text-sm text-gray-600 hover:text-[#0F2747] transition-colors py-1 flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-gray-200 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {p.title}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
