'use client'

import Link from 'next/link'
import ProductCard from './ProductCard'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  offer_price?: number | null
  images?: string[]
  brand?: string
  category?: string
  coin_reward?: number
  stock_status?: string
  weight?: string
}

interface ProductSectionProps {
  title: string
  subtitle?: string
  products: Product[]
  viewAllHref?: string
  accentColor?: string
}

export default function ProductSection({
  title,
  subtitle,
  products,
  viewAllHref = '/products',
  accentColor = '#5FAE9B',
}: ProductSectionProps) {
  if (!products.length) return null

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#0F2747' }}>
              {title}
            </h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <Link
            href={viewAllHref}
            className="text-sm font-medium hover:opacity-75 transition-opacity whitespace-nowrap"
            style={{ color: accentColor }}
          >
            View All &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
