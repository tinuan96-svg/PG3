'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/products-data'
import { addToCart } from '@/lib/cart'
import { usePocket } from '@/lib/pocket-context'

interface Props {
  title: string
  subtitle?: string
  products: Product[]
  viewAllHref?: string
  badge?: string
}

function CarouselCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const { triggerFly } = usePocket()
  const discount = product.price > product.offer_price
    ? Math.round(((product.price - product.offer_price) / product.price) * 100)
    : 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addToCart({
      product_id: product.id,
      product_name: product.name,
      product_image: product.images[0],
      unit_price: product.offer_price,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    if (product.images[0] && btnRef.current) {
      triggerFly({ imageUrl: product.images[0], originRect: btnRef.current.getBoundingClientRect() })
    }
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex-none w-[160px] sm:w-[180px] md:w-[196px] rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col"
    >
      <div className="relative w-full h-[156px] sm:h-[172px] md:h-[188px] bg-gray-50 overflow-hidden flex-shrink-0">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-contain group-hover:scale-105 transition-transform duration-300 p-2"
          sizes="196px"
          loading="lazy"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#5FAE9B' }}>
            -{discount}%
          </span>
        )}
        {product.bestSeller && !product.newArrival && (
          <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
            Best Seller
          </span>
        )}
        {product.newArrival && (
          <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
            New
          </span>
        )}
        {product.communityFavorite && !product.bestSeller && !product.newArrival && (
          <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
            Kerala Fav
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        {product.brand && (
          <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5 truncate" style={{ color: '#5FAE9B' }}>{product.brand}</p>
        )}
        <p className="text-[12px] font-semibold text-gray-800 line-clamp-2 leading-tight mb-1 flex-1 min-h-[30px]">{product.name}</p>
        {product.weight && (
          <p className="text-[11px] text-gray-400 font-medium mb-1.5">{product.weight}</p>
        )}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm font-extrabold" style={{ color: '#0F2747' }}>£{product.offer_price.toFixed(2)}</span>
          {product.price !== product.offer_price && (
            <span className="text-[10px] text-gray-400 line-through">£{product.price.toFixed(2)}</span>
          )}
        </div>
        {product.coin_reward > 0 && (
          <p className="text-[9px] font-medium mb-1.5" style={{ color: '#5FAE9B' }}>+{product.coin_reward} coins</p>
        )}
        <button
          ref={btnRef}
          onClick={handleAddToCart}
          className="w-full text-[11px] font-bold py-2 rounded-xl text-white transition-all active:scale-95"
          style={{ backgroundColor: added ? '#5FAE9B' : '#0F2747' }}
        >
          {added ? 'Added!' : 'Add to Pocket'}
        </button>
      </div>
    </Link>
  )
}

export default function ProductCarousel({ title, subtitle, products, viewAllHref = '/products', badge }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!trackRef.current) return
    const amount = 220
    trackRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  if (!products.length) return null

  return (
    <section className="py-5 md:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-lg md:text-xl font-bold" style={{ color: '#0F2747' }}>{title}</h2>
              {badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#5FAE9B' }}>
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex w-8 h-8 rounded-full border border-gray-200 items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex w-8 h-8 rounded-full border border-gray-200 items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <Link
              href={viewAllHref}
              className="text-xs font-semibold hover:opacity-75 transition-opacity"
              style={{ color: '#5FAE9B' }}
            >
              View All
            </Link>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
        >
          {products.map((product) => (
            <div key={product.id} style={{ scrollSnapAlign: 'start' }}>
              <CarouselCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
