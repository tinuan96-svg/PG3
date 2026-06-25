import type { Metadata } from 'next'
import Link from 'next/link'
import { Tag, Percent, ShoppingBag, Truck, Star } from 'lucide-react'
import { fetchProducts } from '@/lib/api/products'
import Image from 'next/image'
import FeaturedProducts from '@/components/FeaturedProducts'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Special Offers & Deals | PocketGrocery Kerala Groceries UK',
  description: 'Browse the latest special offers and deals on authentic Kerala groceries in the UK. Save on spices, rice, snacks, pickles, and more. Fast delivery across the UK.',
}

export default async function OffersPage() {
  const { products: offers } = await fetchProducts({
    deals_only: true,
    limit: 24,
    sort: 'popular'
  })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="text-white py-16 px-4" style={{ backgroundColor: '#0F2747' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-white/80 text-sm font-medium px-4 py-1.5 rounded-full mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <Percent className="h-4 w-4" />
            Current deals
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Special Offers on Kerala Groceries
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Save on authentic Kerala and Indian groceries. From spices and masalas to snacks
            and beverages — all delivered fast across the UK.
          </p>
          <Link
            href="/products?filter=deals"
            className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            style={{ backgroundColor: '#5FAE9B' }}
          >
            <ShoppingBag className="h-5 w-5" />
            Shop All Deals
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <div className="bg-white border-b border-gray-100 py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-gray-600">
          <span className="flex items-center gap-1.5"><Truck className="h-4 w-4" style={{ color: '#5FAE9B' }} /> Free UK Delivery on orders over £40</span>
          <span className="flex items-center gap-1.5"><Tag className="h-4 w-4 text-orange-500" /> Updated weekly</span>
          <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-yellow-500" /> Authentic Kerala brands</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Offer products */}
        {offers.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Current Discounts ({offers.length} products)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
              {offers.map((p) => {
                const salePrice = Number(p.price)
                const origPrice = Number(p.original_price || p.price)
                const savePct = origPrice > salePrice ? Math.round(((origPrice - salePrice) / origPrice) * 100) : 0
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="bg-white rounded-2xl border border-gray-200 p-3 hover:shadow-md transition-all group"
                  >
                    <div className="relative mb-3">
                      <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative">
                        <Image
                          src={p.image_url || '/placeholder.webp'}
                          alt={p.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      {savePct > 0 && (
                        <span className="absolute top-2 left-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#5FAE9B' }}>
                          -{savePct}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-[#0F2747]">
                      {p.name}
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-bold" style={{ color: '#0F2747' }}>£{salePrice.toFixed(2)}</span>
                      {savePct > 0 && (
                        <span className="text-[10px] text-gray-400 line-through">£{origPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 mb-12">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Tag className="h-8 w-8 text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">New offers coming soon</h2>
            <p className="text-gray-500 mb-6">
              Check back regularly — we update our deals every week.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              style={{ backgroundColor: '#0F2747' }}
            >
              <ShoppingBag className="h-5 w-5" />
              Browse All Products
            </Link>
          </div>
        )}

        <div className="mt-16">
           <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
             You Might Also Like
           </h2>
           <FeaturedProducts />
        </div>
      </div>
    </main>
  )
}
