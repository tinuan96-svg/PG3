'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { addToCart } from '@/lib/cart'
import { formatPackSize } from '@/lib/api/products'
import { usePocket } from '@/lib/pocket-context'

const STORAGE_KEY = 'pg_recently_viewed'
const MAX_ITEMS = 10

interface RecentProduct {
  id: string
  name: string
  slug: string
  brand: string
  price: number
  offer_price: number
  images: string[]
  weight: string
}

function RecentCard({ product }: { product: RecentProduct }) {
  const [added, setAdded] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const { triggerFly } = usePocket()
  const discount = product.price > product.offer_price
    ? Math.round(((product.price - product.offer_price) / product.price) * 100)
    : 0

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    const img = product.images[0]
    addToCart({
      product_id: product.id,
      product_name: product.name,
      product_image: img,
      unit_price: product.offer_price,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    if (img && btnRef.current) {
      triggerFly({ imageUrl: img, originRect: btnRef.current.getBoundingClientRect() })
    }
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex-none w-[148px] rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col"
    >
      <div className="relative w-full h-[130px] bg-gray-50 overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-contain group-hover:scale-105 transition-transform duration-300 p-2"
          sizes="148px"
          loading="lazy"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md" style={{ backgroundColor: '#5FAE9B' }}>
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-2.5 flex flex-col flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wide mb-0.5 truncate" style={{ color: '#5FAE9B' }}>{product.brand}</p>
        <p className="text-[11px] font-semibold text-gray-800 line-clamp-2 leading-tight mb-1 flex-1 min-h-[26px]">{product.name}</p>
        {product.weight && (
          <p className="text-[10px] text-gray-400 font-medium mb-1.5">{product.weight}</p>
        )}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs font-extrabold" style={{ color: '#0F2747' }}>£{product.offer_price.toFixed(2)}</span>
          {product.price !== product.offer_price && (
            <span className="text-[9px] text-gray-400 line-through">£{product.price.toFixed(2)}</span>
          )}
        </div>
        <button
          ref={btnRef}
          onClick={handleAdd}
          className="w-full text-[10px] font-bold py-1.5 rounded-xl text-white transition-all active:scale-95"
          style={{ backgroundColor: added ? '#5FAE9B' : '#0F2747' }}
        >
          {added ? 'Added!' : 'Add to Pocket'}
        </button>
      </div>
    </Link>
  )
}

export function trackRecentlyViewed(slug: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const slugs: string[] = raw ? JSON.parse(raw) : []
    const filtered = slugs.filter((s) => s !== slug)
    filtered.unshift(slug)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)))
  } catch {
    // localStorage may be unavailable
  }
}

export default function RecentlyViewedSection() {
  const [products, setProducts] = useState<RecentProduct[]>([])
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const slugs: string[] = JSON.parse(raw)
      if (!slugs.length) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(supabase as any)
        .from('products')
        .select('id,name,slug,brand,price,compare_price,image,gallery,weight_grams,unit')
        .in('slug', slugs)
        .then(({ data }: { data: Array<{ id: string; name: string; slug: string; brand: string; price: number; compare_price: number | null; image: string | null; gallery: string[] | null; weight_grams: number | null; unit: string | null }> | null }) => {
          if (!data?.length) return
          const map = new Map(data.map((p) => [p.slug, p]))
          const ordered = slugs
            .map((s) => {
              const p = map.get(s)
              if (!p) return null
              const images = p.gallery?.length ? p.gallery : p.image ? [p.image] : []
              return {
                id: p.id,
                name: p.name,
                slug: p.slug,
                brand: p.brand ?? '',
                price: p.price ?? 0,
                offer_price: p.compare_price ?? p.price ?? 0,
                images,
                weight: formatPackSize(p.weight_grams, p.unit, null),
              } as RecentProduct
            })
            .filter(Boolean) as RecentProduct[]
          setProducts(ordered)
        })
    } catch {
      // ignore
    }
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    if (!trackRef.current) return
    trackRef.current.scrollBy({ left: dir === 'right' ? 180 : -180, behavior: 'smooth' })
  }

  if (!products.length) return null

  return (
    <section className="py-5 md:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold" style={{ color: '#0F2747' }}>Recently Viewed</h2>
            <p className="text-xs text-gray-500 mt-0.5">Continue where you left off</p>
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
              href="/products"
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
              <RecentCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
