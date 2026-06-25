import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getProductsByCategory } from '@/lib/products-data'

export const metadata: Metadata = {
  title: 'Kerala Snacks Online UK | Banana Chips, Murukku, Halwa | Next Day Delivery',
  description: 'Order authentic Kerala snacks online in the UK. Banana chips, murukku, tapioca chips, halwa, mixture and more. Next day delivery across the UK from PocketGrocery.',
  keywords: 'Kerala snacks online UK, buy banana chips UK, murukku online UK, Kerala chips delivery UK, Indian snacks UK, tapioca chips UK',
}

const SNACK_CATEGORIES = [
  { name: 'Banana Chips', slug: 'banana-chips', desc: 'Crispy Kerala-style fried banana chips in various flavours' },
  { name: 'Murukku', slug: 'murukku', desc: 'Traditional rice-flour spirals, perfectly spiced and crunchy' },
  { name: 'Tapioca Chips', slug: 'tapioca-chips', desc: 'Thin, crispy kappa chips — a Kerala favourite' },
  { name: 'Halwa & Sweets', slug: 'halwa', desc: 'Kozhikodan halwa, coconut barfi and more traditional sweets' },
  { name: 'Mixture', slug: 'mixture', desc: 'Spiced namkeen mix with lentils, nuts and sev' },
]

const SNACK_FAQS = [
  { q: 'Where can I buy authentic Kerala banana chips in the UK?', a: 'PocketGrocery stocks Haldiram Banana Chips, Paragon Kerala-style banana chips, and more. All available with next day UK delivery.' },
  { q: 'Are Kerala snacks available for same-day or next-day delivery?', a: 'Yes — all orders placed before 4 PM qualify for next day delivery. We ship to all UK mainland addresses including London, Birmingham, Manchester, and Glasgow.' },
  { q: 'What is the shelf life of Kerala snacks?', a: 'Our snacks are dispatched fresh with a minimum shelf life of 3 months. Banana chips typically last 6 months in an unopened pack.' },
  { q: 'Do you sell murukku online in the UK?', a: 'Yes! We carry Nirapara Kerala Murukku and other varieties. Murukku is a traditional crispy snack made from rice flour and spices, perfect with a cup of Kerala tea.' },
]

export default function KeralaSnacksUKPage() {
  const snackProducts = getProductsByCategory('Snacks & Sweets', 10)

  return (
    <>
      <section className="py-12 md:py-16" style={{ backgroundColor: '#0F2747' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">Home</Link>
              <span className="text-white/40">/</span>
              <span className="text-white/80 text-sm">Kerala Snacks UK</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Kerala Snacks Online UK
            </h1>
            <p className="text-white/80 text-lg mb-6 leading-relaxed">
              Shop authentic Kerala snacks delivered next day across the UK. Banana chips, murukku, tapioca chips, halwa, mixture and more — all from trusted Kerala brands.
            </p>
            <Link
              href="/products?category=Snacks+%26+Sweets"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#5FAE9B' }}
            >
              Shop All Kerala Snacks
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 border-b border-gray-100" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {SNACK_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?q=${cat.slug}`}
                className="flex-none bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all min-w-[160px]"
              >
                <p className="font-bold text-sm mb-1" style={{ color: '#0F2747' }}>{cat.name}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#0F2747' }}>Shop Kerala Snacks & Sweets</h2>
              <p className="text-sm text-gray-500 mt-0.5">{snackProducts.length}+ products — next day UK delivery</p>
            </div>
            <Link href="/products?category=Snacks+%26+Sweets" className="text-sm font-semibold hover:opacity-75" style={{ color: '#5FAE9B' }}>
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {snackProducts.map((product) => {
              const discount = Math.round(((product.price - product.offer_price) / product.price) * 100)
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="200px"
                      loading="lazy"
                    />
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: '#5FAE9B' }}>
                        -{discount}%
                      </span>
                    )}
                    {product.bestSeller && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: '#0F2747' }}>
                        BEST
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-medium mb-0.5" style={{ color: '#5FAE9B' }}>{product.brand}</p>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1 leading-tight">{product.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold" style={{ color: '#0F2747' }}>£{product.offer_price.toFixed(2)}</span>
                      {product.price !== product.offer_price && (
                        <span className="text-[10px] text-gray-400 line-through">£{product.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-10" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#0F2747' }}>Frequently Asked Questions</h2>
          <div className="space-y-4">
            {SNACK_FAQS.map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="font-bold text-sm mb-2" style={{ color: '#0F2747' }}>{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
