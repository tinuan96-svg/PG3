import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  generateProgrammaticPageMetadata,
  generateProductSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateLocalBusinessSchema,
  SITE_URL,
  UK_CITIES,
} from '@/lib/seo'
import { ALL_PRODUCTS, getProductsByCategory } from '@/lib/products-data'

const CITY_DISPLAY: Record<string, string> = {
  london: 'London',
  birmingham: 'Birmingham',
  manchester: 'Manchester',
  leeds: 'Leeds',
  glasgow: 'Glasgow',
  leicester: 'Leicester',
  bristol: 'Bristol',
  sheffield: 'Sheffield',
  liverpool: 'Liverpool',
  coventry: 'Coventry',
  edinburgh: 'Edinburgh',
  nottingham: 'Nottingham',
  cardiff: 'Cardiff',
  southampton: 'Southampton',
  portsmouth: 'Portsmouth',
  uk: 'the UK',
}

const DELIVERY_INFO: Record<string, string> = {
  london: 'Same-day and next-day delivery available in London.',
  birmingham: 'Next-day delivery across Birmingham and the West Midlands.',
  manchester: 'Next-day delivery to Manchester and Greater Manchester.',
  leeds: 'Next-day delivery to Leeds and West Yorkshire.',
  glasgow: 'Next-day delivery to Glasgow and central Scotland.',
  uk: 'Next-day delivery to all UK mainland addresses.',
}

export async function generateStaticParams() {
  const topProducts = ALL_PRODUCTS.slice(0, 30)
  const topCities = UK_CITIES.slice(0, 6)
  return topProducts.flatMap((p) => topCities.map((c) => ({ product: p.slug, location: c.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: { product: string; location: string }
}): Promise<Metadata> {
  const product = ALL_PRODUCTS.find((p) => p.slug === params.product)
  const cityName = CITY_DISPLAY[params.location] || params.location.replace(/-/g, ' ')

  if (!product) return { title: 'Product Not Found | PocketGrocery' }

  return generateProgrammaticPageMetadata(
    product.name,
    cityName,
    `${params.product}/${params.location}`
  )
}

export default function BuyProductLocationPage({
  params,
}: {
  params: { product: string; location: string }
}) {
  const product = ALL_PRODUCTS.find((p) => p.slug === params.product)
  const cityName = CITY_DISPLAY[params.location] || params.location.replace(/-/g, ' ')

  if (!product) notFound()

  const price = product.offer_price || product.price
  const hasDiscount = product.offer_price && product.offer_price < product.price
  const discountPct = hasDiscount ? Math.round(((product.price - product.offer_price!) / product.price) * 100) : 0
  const deliveryText = DELIVERY_INFO[params.location] || `Next-day delivery to ${cityName} and surrounding areas.`
  const relatedProducts = getProductsByCategory(product.category, 6).filter((r) => r.slug !== product.slug).slice(0, 4)

  const faqs = [
    {
      q: `Where can I buy ${product.name} in ${cityName}?`,
      a: `You can buy ${product.name} online at PocketGrocery and receive it in ${cityName} with next-day delivery. Order before 4 PM for delivery the following working day.`,
    },
    {
      q: `How long does delivery of ${product.name} take to ${cityName}?`,
      a: `${deliveryText} All orders placed before 4 PM qualify for next-day delivery. Free delivery on orders over £40.`,
    },
    {
      q: `Is ${product.name} available in stock?`,
      a: `Yes, ${product.name} by ${product.brand} is currently in stock at PocketGrocery. We maintain large stock levels of all popular Kerala products including ${product.name}.`,
    },
    {
      q: `What is the price of ${product.name} delivered to ${cityName}?`,
      a: `${product.name} is priced at £${price.toFixed(2)} with free delivery to ${cityName} on orders over £40. Orders under £40 attract a small delivery fee.`,
    },
    {
      q: `Are there other Kerala groceries available for delivery in ${cityName}?`,
      a: `Yes! PocketGrocery delivers 100+ authentic Kerala grocery products to ${cityName} including rice, spices, snacks, pickles, coconut oil, and more from brands like Nirapara, Eastern, Brahmins, and Double Horse.`,
    },
  ]

  const otherCities = UK_CITIES.filter((c) => c.slug !== params.location).slice(0, 6)

  const productSchema = generateProductSchema(product, product.slug)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Products', url: `${SITE_URL}/products` },
    { name: product.name, url: `${SITE_URL}/products/${product.slug}` },
    { name: `Delivery to ${cityName}`, url: `${SITE_URL}/buy/${params.product}/${params.location}` },
  ])
  const faqSchema = generateFAQSchema(faqs)
  const localBizSchema = generateLocalBusinessSchema()

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBizSchema) }} />

      <div className="min-h-screen" style={{ backgroundColor: '#F4F6F8' }}>

        {/* Hero */}
        <section className="py-10 md:py-14" style={{ backgroundColor: '#0F2747' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-5">
              <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/products" className="hover:text-white/80 transition-colors">Products</Link>
              <span>/</span>
              <Link href={`/products/${product.slug}`} className="hover:text-white/80 transition-colors truncate max-w-[120px]">
                {product.name}
              </Link>
              <span>/</span>
              <span className="text-white/70">{cityName}</span>
            </nav>

            <div className="grid md:grid-cols-[1fr_300px] gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: '#5FAE9B' }}
                  >
                    Next Day Delivery to {cityName}
                  </span>
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
                  Buy {product.name} in {cityName}
                </h1>
                <p className="text-white/75 text-base mb-6 leading-relaxed">
                  Authentic {product.brand} {product.name} delivered next day to {cityName}. Order before 4 PM for guaranteed next-day delivery. Free delivery on orders over £40.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/products/${product.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: '#5FAE9B' }}
                  >
                    Order Now — £{price.toFixed(2)}
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center px-5 py-3 rounded-xl font-semibold text-white/70 border border-white/20 hover:border-white/40 transition-colors"
                  >
                    Browse All Products
                  </Link>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="relative aspect-square max-w-[260px] ml-auto rounded-2xl overflow-hidden border-2 border-white/10">
                  <Image
                    src={product.images[0]}
                    alt={`${product.name} ${product.weight} delivery ${cityName}`}
                    fill
                    className="object-cover"
                    sizes="260px"
                    priority
                  />
                  {discountPct > 0 && (
                    <div
                      className="absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: '#5FAE9B' }}
                    >
                      -{discountPct}% off
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust signals */}
        <section className="border-b border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { icon: '🚚', title: 'Next Day Delivery', sub: `To ${cityName}` },
                { icon: '✅', title: 'Authentic Kerala', sub: `${product.brand} brand` },
                { icon: '🆓', title: 'Free Delivery', sub: 'Orders over £40' },
                { icon: '🔄', title: 'Easy Returns', sub: '30-day returns policy' },
              ].map((t) => (
                <div key={t.title} className="py-2">
                  <span className="text-2xl">{t.icon}</span>
                  <p className="font-bold text-sm mt-1" style={{ color: '#0F2747' }}>{t.title}</p>
                  <p className="text-xs text-gray-400">{t.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Product detail */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
            <div className="grid md:grid-cols-[200px_1fr] gap-6 items-start">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 md:block hidden">
                <Image
                  src={product.images[0]}
                  alt={`${product.name} ${product.weight} - Kerala grocery delivery ${cityName}`}
                  fill
                  className="object-cover"
                  sizes="200px"
                  loading="lazy"
                />
              </div>
              <div>
                <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: '#5FAE9B' }}>{product.brand}</p>
                <h2 className="text-xl font-bold mb-2" style={{ color: '#0F2747' }}>{product.name}</h2>
                <p className="text-sm text-gray-500 mb-3">{product.weight} · {product.category}</p>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl font-extrabold" style={{ color: '#0F2747' }}>£{price.toFixed(2)}</span>
                  {hasDiscount && (
                    <span className="text-gray-400 line-through">£{product.price.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 font-medium">In Stock</span>
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">Next Day to {cityName}</span>
                  {product.coin_reward > 0 && (
                    <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-medium">
                      Earn {product.coin_reward} Pocket Coins
                    </span>
                  )}
                </div>
                <Link
                  href={`/products/${product.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  Add to Cart — £{price.toFixed(2)}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#0F2747' }}>
                Also Available in {cityName}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {relatedProducts.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/buy/${rel.slug}/${params.location}`}
                    className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      <Image
                        src={rel.images[0]}
                        alt={`${rel.name} delivery ${cityName}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="200px"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] text-gray-400 mb-0.5">{rel.brand}</p>
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">{rel.name}</p>
                      <span className="text-sm font-bold" style={{ color: '#0F2747' }}>
                        £{(rel.offer_price || rel.price).toFixed(2)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQs */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-5" style={{ color: '#0F2747' }}>
              Frequently Asked Questions — {product.name} in {cityName}
            </h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-sm text-gray-800 list-none">
                    {faq.q}
                    <svg className="w-4 h-4 text-gray-400 flex-none group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Delivery to other cities */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold mb-3" style={{ color: '#0F2747' }}>
              Also Available in These UK Cities
            </h3>
            <div className="flex flex-wrap gap-2">
              {otherCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/buy/${params.product}/${city.slug}`}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {product.name} in {city.name}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
