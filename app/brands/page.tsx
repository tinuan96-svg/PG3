import type { Metadata } from 'next'
import Link from 'next/link'
import { fetchBrands, type ApiBrand } from '@/lib/api/products'

export const metadata: Metadata = {
  title: 'Popular Kerala Grocery Brands | PocketGrocery UK',
  description: 'Shop authentic Kerala grocery brands online in the UK. Nirapara, Eastern, Double Horse, Brahmins, Kitchen Treasures and more with next day delivery.',
}

export const dynamic = 'force-dynamic'

const BRAND_COLORS = [
  '#c0392b', '#e67e22', '#8e44ad', '#16a085', '#2980b9', '#27ae60',
  '#d35400', '#e74c3c', '#f39c12', '#1abc9c', '#9b59b6', '#2c3e50',
  '#0F2747', '#5FAE9B', '#e91e63', '#ff5722', '#607d8b', '#795548',
]

function colorForBrand(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return BRAND_COLORS[Math.abs(hash) % BRAND_COLORS.length]
}

function initialsForBrand(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return name.slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export default async function BrandsPage() {
  let brands: ApiBrand[] = []
  try {
    brands = await fetchBrands('pocket-grocery')
    brands = brands.sort((a, b) => b.product_count - a.product_count)
  } catch {
    // render empty state
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-700">Brands</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2" style={{ color: '#0F2747' }}>
            Popular Kerala Grocery Brands
          </h1>
          <p className="text-sm text-gray-500">
            Authentic brands trusted by Kerala families across the UK
            {brands.length > 0 && (
              <span className="ml-1 text-gray-400">— {brands.length} brands available</span>
            )}
          </p>
        </div>

        {brands.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-sm">No brands found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/products?brand_slug=${encodeURIComponent(brand.slug)}&brand_name=${encodeURIComponent(brand.name)}`}
                className="bg-white rounded-2xl p-5 text-center hover:shadow-md transition-all duration-200 group border border-gray-100 flex flex-col items-center"
              >
                {brand.logo_url ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 group-hover:scale-105 transition-transform shadow-sm bg-gray-50 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-1" />
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg group-hover:scale-105 transition-transform shadow-sm"
                    style={{ backgroundColor: colorForBrand(brand.name) }}
                  >
                    {initialsForBrand(brand.name)}
                  </div>
                )}
                <p className="text-sm font-bold leading-tight mb-1 truncate w-full text-center" style={{ color: '#0F2747' }}>
                  {brand.name}
                </p>
                {brand.description ? (
                  <p className="text-[11px] text-gray-400 leading-tight line-clamp-1">{brand.description}</p>
                ) : (
                  <p className="text-[11px] text-gray-400">
                    {brand.product_count} product{brand.product_count !== 1 ? 's' : ''}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          <h2 className="text-lg font-bold mb-3" style={{ color: '#0F2747' }}>About Our Brands</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            PocketGrocery stocks only the most trusted and authentic Kerala and South Indian grocery brands.
            From staple spices and masalas to traditional pickles and ready meals, every brand is hand-picked
            to ensure you get the genuine taste of Kerala delivered to your door anywhere in the UK.
          </p>
        </div>
      </div>
    </div>
  )
}
