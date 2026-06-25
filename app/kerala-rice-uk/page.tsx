import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getProductsByCategory } from '@/lib/products-data'

export const metadata: Metadata = {
  title: 'Buy Kerala Rice Online UK | Matta Rice, Jeerakasala, Ponni | Next Day Delivery',
  description: 'Shop authentic Kerala rice varieties online in the UK. Matta rice, Jeerakasala, Ponni, Puttu Podi & more from Nirapara, Double Horse. Free delivery on orders over £40.',
  keywords: 'Kerala rice UK, buy matta rice online UK, jeerakasala rice UK, ponni rice UK, Kerala rice delivery UK, Indian rice online UK',
}

const RICE_BENEFITS = [
  { icon: '🌾', title: 'Authentic Kerala Varieties', text: 'Sourced directly from Kerala mills — Rose Matta, Jeerakasala, Ponni and more' },
  { icon: '🚚', title: 'Next Day Delivery UK', text: 'Order before 4 PM for guaranteed next day delivery across the UK' },
  { icon: '✅', title: 'Quality Guaranteed', text: 'Every batch tested for freshness and authenticity before dispatch' },
  { icon: '🪙', title: 'Earn Pocket Coins', text: 'Get coins on every order and redeem for discounts on your next shop' },
]

const RICE_FAQS = [
  { q: 'What is the best Kerala rice for everyday cooking?', a: 'Nirapara Rose Matta Rice is a Kerala staple for daily meals. Its high fibre content and distinctive flavour make it a favourite for rice and curry combinations.' },
  { q: 'Where can I buy Jeerakasala rice in the UK?', a: 'PocketGrocery stocks authentic Jeerakasala rice from Double Horse, a premium short-grain rice perfect for biryani and special occasions. We deliver next day across the UK.' },
  { q: 'Do you stock Kerala Puttu Podi?', a: 'Yes — we stock Nirapara Chemba Puttu Podi, Nirapara White Puttu Podi, and more. Perfect for making traditional Kerala puttu at home in the UK.' },
  { q: 'Is next day delivery available for rice orders?', a: 'Absolutely. All orders placed before 4 PM on working days qualify for next day delivery. Free delivery applies on orders over £40.' },
]

export default function KeralaRiceUKPage() {
  const riceProducts = getProductsByCategory('Rice & Flour', 10)

  return (
    <>
      <section className="py-12 md:py-16" style={{ backgroundColor: '#0F2747' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">Home</Link>
              <span className="text-white/40">/</span>
              <span className="text-white/80 text-sm">Kerala Rice UK</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Buy Kerala Rice Online in the UK
            </h1>
            <p className="text-white/80 text-lg mb-6 leading-relaxed">
              Authentic Kerala rice varieties delivered next day across the UK. Shop Rose Matta, Jeerakasala, Ponni, Puttu Podi and more from trusted brands like Nirapara and Double Horse.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products?category=Rice+%26+Flour"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#5FAE9B' }}
              >
                Shop All Rice & Flour
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white/80 border border-white/20 hover:border-white/40 transition-all"
              >
                Browse All Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 border-b border-gray-100" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RICE_BENEFITS.map((b) => (
              <div key={b.title} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                <span className="text-2xl">{b.icon}</span>
                <h3 className="font-bold text-sm mt-2 mb-1" style={{ color: '#0F2747' }}>{b.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#0F2747' }}>Kerala Rice & Flour</h2>
              <p className="text-sm text-gray-500 mt-0.5">{riceProducts.length} products available</p>
            </div>
            <Link href="/products?category=Rice+%26+Flour" className="text-sm font-semibold hover:opacity-75" style={{ color: '#5FAE9B' }}>
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {riceProducts.map((product) => {
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
            {RICE_FAQS.map((faq) => (
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
