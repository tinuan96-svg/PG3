import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Star, ShoppingBag, Truck, Award } from 'lucide-react'
import { fetchProducts } from '@/lib/api/products'
import Image from 'next/image'
import FeaturedProducts from '@/components/FeaturedProducts'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Best Sellers | PocketGrocery Kerala Groceries UK',
  description: 'Shop the best-selling Kerala and Indian groceries in the UK. Discover the most popular authentic spices, rice, snacks, pickles, and more.',
}

export default async function BestSellersPage() {
  const { products } = await fetchProducts({
    bestsellers_only: true,
    limit: 24,
    sort: 'popular'
  })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="text-white py-16 px-4" style={{ backgroundColor: '#0F2747' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-white/80 text-sm font-medium px-4 py-1.5 rounded-full mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <TrendingUp className="h-4 w-4" />
            Customer favourites
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Best-Selling Kerala Groceries in the UK
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Discover the most popular authentic Kerala and South Indian products chosen by our
            UK customers. From aromatic spices to traditional snacks — all delivered fast
            across the UK.
          </p>
          <Link
            href="/products?sort=popular"
            className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            style={{ backgroundColor: '#5FAE9B' }}
          >
            <ShoppingBag className="h-5 w-5" />
            Shop All Best Sellers
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <div className="bg-white border-b border-gray-100 py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-gray-600">
          <span className="flex items-center gap-1.5"><Truck className="h-4 w-4" style={{ color: '#5FAE9B' }} /> Free UK Delivery on orders over £40</span>
          <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-orange-500" /> 100% Authentic Kerala brands</span>
          <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-yellow-500" /> Customer-rated 4.8 / 5</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Product grid */}
        {products.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Most Popular Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
              {products.map((p, i) => (
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
                    {i < 3 && (
                      <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        #{i + 1}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-[#0F2747]">
                    {p.name}
                  </p>
                  <p className="text-sm font-bold mt-1" style={{ color: '#0F2747' }}>
                    £{p.price.toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
             <p className="text-gray-400">Loading our best sellers...</p>
          </div>
        )}

        <div className="mt-16">
           <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
             Featured Recommendations
           </h2>
           <FeaturedProducts />
        </div>
      </div>
    </main>
  )
}
