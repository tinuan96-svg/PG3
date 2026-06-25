import Link from 'next/link'
import Image from 'next/image'

interface CityData {
  name: string
  heroTitle: string
  heroSubtitle: string
  deliveryInfo: string
  popularAreas: string[]
  faq: { question: string; answer: string }[]
}

const popularProducts = [
  { name: 'Nirapara Rose Matta Rice 5kg', price: '8.99', image: 'https://images.pexels.com/photos/4110252/pexels-photo-4110252.jpeg?auto=compress&cs=tinysrgb&w=300', slug: 'nirapara-rose-matta-rice-5kg' },
  { name: 'Eastern Sambar Powder 100g', price: '1.89', image: 'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=300', slug: 'eastern-sambar-powder' },
  { name: 'Double Horse Appam Podi 1kg', price: '3.49', image: 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=300', slug: 'double-horse-appam-podi' },
  { name: 'Kerala Coconut Oil 500ml', price: '4.99', image: 'https://images.pexels.com/photos/725998/pexels-photo-725998.jpeg?auto=compress&cs=tinysrgb&w=300', slug: 'kerala-coconut-oil-500ml' },
]

const categories = [
  { name: 'Rice & Flour', icon: 'rice', count: 50 },
  { name: 'Spices & Masalas', icon: 'spice', count: 120 },
  { name: 'Pickles & Chutneys', icon: 'pickle', count: 35 },
  { name: 'Snacks & Sweets', icon: 'snack', count: 60 },
  { name: 'Oils & Ghee', icon: 'oil', count: 25 },
  { name: 'Ready to Cook', icon: 'cook', count: 40 },
]

export default function CityLandingPage({ city }: { city: CityData }) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pocketgrocery.com' },
      { '@type': 'ListItem', position: 2, name: `Kerala Groceries ${city.name}`, item: `https://pocketgrocery.com/kerala-groceries-${city.name.toLowerCase()}` },
    ],
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: city.faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="relative py-16 md:py-24" style={{ backgroundColor: '#0F2747' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <nav className="text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Kerala Groceries {city.name}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">{city.heroTitle}</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-6">{city.heroSubtitle}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(95,174,155,0.2)', color: '#5FAE9B' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {city.deliveryInfo}
          </div>
          <div className="flex justify-center gap-4 mt-8">
            <Link href="/products" className="px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '#5FAE9B' }}>
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#0F2747' }}>Popular Kerala Products in {city.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularProducts.map((product) => (
              <Link key={product.slug} href={`/products/${product.slug}`} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="relative aspect-square bg-gray-50">
                  <Image src={product.image} alt={`${product.name} delivery ${city.name}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 50vw, 25vw" />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">{product.name}</h3>
                  <p className="text-lg font-bold" style={{ color: '#0F2747' }}>£{product.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#0F2747' }}>Browse Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link key={cat.name} href={`/products?category=${cat.name.toLowerCase().replace(/ & /g, '-')}`} className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-md transition-shadow">
                <p className="font-medium text-sm" style={{ color: '#0F2747' }}>{cat.name}</p>
                <p className="text-xs text-gray-400 mt-1">{cat.count}+ products</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {city.popularAreas.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#0F2747' }}>We Deliver to All {city.name} Areas</h2>
            <div className="flex flex-wrap gap-2">
              {city.popularAreas.map((area) => (
                <span key={area} className="px-3 py-1.5 bg-white rounded-full text-sm border border-gray-200 text-gray-600">{area}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#0F2747' }}>
            Kerala Groceries in {city.name} - FAQs
          </h2>
          <div className="space-y-4">
            {city.faq.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-medium text-sm mb-2" style={{ color: '#0F2747' }}>{f.question}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: '#0F2747' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to order Kerala groceries in {city.name}?
          </h2>
          <p className="text-gray-300 mb-6">
            Browse 1000+ authentic Kerala products with next day delivery to your doorstep.
          </p>
          <Link href="/products" className="inline-flex items-center px-8 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '#5FAE9B' }}>
            Start Shopping
          </Link>
        </div>
      </section>
    </>
  )
}
