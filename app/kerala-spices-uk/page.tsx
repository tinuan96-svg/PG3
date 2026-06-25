import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getProductsByCategory } from '@/lib/products-data'

export const metadata: Metadata = {
  title: 'Buy Kerala Spices Online UK | Sambar Powder, Masalas, Curry Powder | PocketGrocery',
  description: 'Authentic Kerala spices delivered next day across the UK. Shop sambar powder, fish curry masala, turmeric, garam masala and more from Eastern, Brahmins, Nirapara.',
  keywords: 'Kerala spices UK, buy sambar powder UK, fish curry masala UK, Indian spices online UK, Eastern spices UK, Kerala masala UK next day delivery',
}

const SPICE_TYPES = [
  { name: 'Sambar Powder', description: 'The backbone of South Indian cooking' },
  { name: 'Fish Curry Masala', description: 'Perfect blend for Kerala-style fish curry' },
  { name: 'Garam Masala', description: 'Aromatic finishing spice for meat dishes' },
  { name: 'Turmeric Powder', description: 'Golden anti-inflammatory spice' },
  { name: 'Chilli Powder', description: 'Kashmiri and Kerala red chilli blends' },
  { name: 'Biryani Masala', description: 'Fragrant spice mix for biryani' },
]

const SPICE_FAQS = [
  { q: 'What are the most popular Kerala spices to buy online in the UK?', a: 'Our bestselling Kerala spices include Eastern Sambar Powder, Brahmins Fish Curry Masala, Eastern Chicken Masala, Melam Kashmiri Chilli Powder, and Eastern Turmeric Powder.' },
  { q: 'Which brands carry authentic Kerala spices?', a: 'We stock Eastern, Brahmins, Nirapara, Melam, Kitchen Treasures, and Aachi — all well-known brands from Kerala and Tamil Nadu known for their authentic spice blends.' },
  { q: 'Do Kerala spices have a long shelf life?', a: 'Properly sealed spice powders typically last 12–18 months. We dispatch products with at least 6 months remaining shelf life and recommend storing in a cool, dry place.' },
  { q: 'Can I order Kerala spices for next day delivery?', a: 'Yes — all orders placed before 4 PM qualify for next day delivery to any UK mainland address. Free delivery on orders over £40.' },
]

export default function KeralaSpicesUKPage() {
  const spiceProducts = getProductsByCategory('Spices & Masalas', 12)

  return (
    <>
      <section className="py-12 md:py-16" style={{ backgroundColor: '#0F2747' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">Home</Link>
              <span className="text-white/40">/</span>
              <span className="text-white/80 text-sm">Kerala Spices UK</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Authentic Kerala Spices Online UK
            </h1>
            <p className="text-white/80 text-lg mb-6 leading-relaxed">
              Shop authentic Kerala spice blends and masalas, delivered next day across the UK. Trusted brands — Eastern, Brahmins, Nirapara, Melam — for authentic South Indian flavours.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products?category=Spices+%26+Masalas"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#5FAE9B' }}
              >
                Shop All Spices
              </Link>
              <Link
                href="/recipes"
                className="inline-flex items-center px-5 py-3 rounded-xl font-semibold text-white/80 border border-white/20 hover:border-white/40 transition-all"
              >
                Kerala Recipes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 border-b border-gray-100" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SPICE_TYPES.map((s) => (
              <Link
                key={s.name}
                href={`/products?q=${encodeURIComponent(s.name)}`}
                className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:shadow-sm hover:border-gray-200 transition-all"
              >
                <p className="font-bold text-sm mb-1" style={{ color: '#0F2747' }}>{s.name}</p>
                <p className="text-[10px] text-gray-400 leading-relaxed">{s.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#0F2747' }}>Kerala Spices & Masalas</h2>
              <p className="text-sm text-gray-500 mt-0.5">{spiceProducts.length}+ products in stock</p>
            </div>
            <Link href="/products?category=Spices+%26+Masalas" className="text-sm font-semibold hover:opacity-75" style={{ color: '#5FAE9B' }}>
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {spiceProducts.map((product) => {
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
            {SPICE_FAQS.map((faq) => (
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
