'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import type { Product } from '@/lib/products-data'
import { getStoreCategories, type StoreCategory } from '@/lib/categories'
import { addToCart } from '@/lib/cart'
import { usePocket } from '@/lib/pocket-context'
import { supabase } from '@/lib/supabase'

type HeroBanner = {
  id: string
  title: string
  subtitle: string
  cta_text: string
  cta_url: string
  badge_text: string
  badge_color: string
  background_color: string
  image_url: string
  display_order: number
  is_active: boolean
}

const CATEGORY_ICONS: Record<string, string> = {
  'Rice':                   '🍚',
  'Flour & Grains':         '🌾',
  'Spices':                 '🌶️',
  'Curry Masalas':          '🫕',
  'Snacks & Sweets':        '🍪',
  'Pickles & Preserves':    '🫙',
  'Oils & Fats':            '🫒',
  'Pulses & Beans':         '🫘',
  'Ready to Eat':           '🍛',
  'Tea & Coffee':           '☕',
  'Fryums':                 '🥨',
  'Condiments':             '🥫',
  'Desserts':               '🍮',
  'Household & Cleaning':   '🧹',
  'Health & Personal Care': '💊',
}

function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? '🛒'
}

type Tab = 'trending' | 'bestsellers'

interface SidebarProductCardProps {
  product: Product
}

function SidebarProductCard({ product }: SidebarProductCardProps) {
  const [added, setAdded] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const { triggerFly } = usePocket()
  const discount = product.price > product.offer_price
    ? Math.round(((product.price - product.offer_price) / product.price) * 100)
    : 0

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    addToCart({
      product_id: product.id,
      product_name: product.name,
      product_image: product.images[0],
      unit_price: product.offer_price,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
    if (product.images[0] && btnRef.current) {
      triggerFly({ imageUrl: product.images[0], originRect: btnRef.current.getBoundingClientRect() })
    }
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-2.5 hover:shadow-md hover:border-gray-200 transition-all duration-200"
    >
      <div className="relative w-12 h-12 flex-none rounded-lg overflow-hidden bg-gray-50">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300 p-0.5"
          sizes="48px"
          loading="eager"
        />
        {discount > 0 && (
          <span className="absolute top-0 left-0 text-[7px] font-bold text-white px-1 py-0.5 rounded-br-md" style={{ backgroundColor: '#5FAE9B' }}>
            -{discount}%
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wide mb-0.5 truncate" style={{ color: '#5FAE9B' }}>{product.brand}</p>
        <p className="text-[11px] font-semibold text-gray-800 line-clamp-2 leading-snug mb-0.5">{product.name}</p>
        {product.weight && (
          <p className="text-[10px] text-gray-400 mb-1">{product.weight}</p>
        )}
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold" style={{ color: '#0F2747' }}>£{product.offer_price.toFixed(2)}</span>
          {product.price !== product.offer_price && (
            <span className="text-[9px] text-gray-400 line-through">£{product.price.toFixed(2)}</span>
          )}
        </div>
      </div>
      <button
        ref={btnRef}
        onClick={handleAdd}
        className="flex-none w-7 h-7 rounded-full flex items-center justify-center text-white transition-all active:scale-90"
        style={{ backgroundColor: added ? '#5FAE9B' : '#0F2747' }}
        aria-label={added ? 'Added to pocket' : 'Add to pocket'}
      >
        {added ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>
    </Link>
  )
}

interface Props {
  featuredProducts: Product[]
  bestSellers?: Product[]
}

export default function HeroSection({ featuredProducts, bestSellers = [] }: Props) {
  const [slide, setSlide] = useState(0)
  const [banners, setBanners] = useState<HeroBanner[]>([])
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('trending')

  const trendingProducts = featuredProducts.slice(0, 6)
  const bestSellerProducts = bestSellers.slice(0, 6)

  const sidebarProducts = activeTab === 'trending' ? trendingProducts : bestSellerProducts

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('homepage_banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .then(({ data }: { data: HeroBanner[] | null }) => {
        if (data && data.length > 0) setBanners(data)
      })

    getStoreCategories('pocket-grocery').then(setCategories)
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setSlide((s) => (s + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])

  if (banners.length === 0) return null

  const current = banners[slide] ?? banners[0]
  const viewAllHref = activeTab === 'trending' ? '/products?filter=trending' : '/products?filter=bestsellers'

  return (
    <section className="py-3 lg:py-4" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main hero grid: banner (75%) + sidebar (25%) on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_292px] gap-3 items-stretch">

          {/* Banner */}
          <div
            className={`relative rounded-2xl overflow-hidden min-h-[220px] lg:min-h-[256px] flex flex-col justify-end shadow-sm bg-gradient-to-br ${current.background_color}`}
          >
            {current.image_url && (
              <div className="absolute inset-0 opacity-15">
                <Image
                  src={current.image_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 850px"
                  priority
                />
              </div>
            )}

            <div className="relative z-10 p-5 md:p-7">
              {current.badge_text && (
                <span
                  className="inline-block text-[11px] font-bold px-3 py-1 rounded-full text-white mb-3"
                  style={{ backgroundColor: current.badge_color }}
                >
                  {current.badge_text}
                </span>
              )}
              <h1
                className="text-2xl md:text-3xl lg:text-[2rem] font-extrabold text-white leading-tight mb-2"
                style={{ whiteSpace: 'pre-line' }}
              >
                {current.title}
              </h1>
              {current.subtitle && (
                <p className="text-white/80 text-sm mb-4">{current.subtitle}</p>
              )}
              <div className="flex items-center gap-3">
                <Link
                  href={current.cta_url || '/products'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: '#5FAE9B', color: '#fff' }}
                >
                  {current.cta_text || 'Shop Now'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/products" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                  Browse All
                </Link>
              </div>
            </div>

            {banners.length > 1 && (
              <div className="absolute top-4 right-4 flex gap-1.5 z-10">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{ backgroundColor: i === slide ? '#fff' : 'rgba(255,255,255,0.4)' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: tabbed product panel — desktop only */}
          <div className="hidden lg:flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tab header */}
            <div className="flex border-b border-gray-100">
              {(['trending', 'bestsellers'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2.5 text-xs font-bold transition-colors"
                  style={{
                    color: activeTab === tab ? '#0F2747' : '#9ca3af',
                    borderBottom: activeTab === tab ? '2px solid #0F2747' : '2px solid transparent',
                  }}
                >
                  {tab === 'trending' ? 'Trending' : 'Best Sellers'}
                </button>
              ))}
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
              {sidebarProducts.length > 0
                ? sidebarProducts.map((product) => (
                    <SidebarProductCard key={product.id} product={product} />
                  ))
                : <p className="text-xs text-gray-400 text-center py-6">No products available</p>
              }
            </div>

            {/* Footer link */}
            <Link
              href={viewAllHref}
              className="flex items-center justify-center gap-1 py-2.5 text-xs font-semibold border-t border-gray-100 hover:bg-gray-50 transition-colors"
              style={{ color: '#5FAE9B' }}
            >
              View All
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Desktop: horizontal category strip below hero */}
        {categories.length > 0 && (
          <div className="hidden lg:flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {categories.map((cat) => (
              <Link
                key={cat.store_category_id}
                href={`/products?category=${encodeURIComponent(cat.store_category_slug)}`}
                className="flex-none flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3.5 py-2 text-xs font-medium text-gray-700 hover:border-[#0F2747] hover:text-[#0F2747] transition-colors whitespace-nowrap shadow-sm"
              >
                <span className="text-sm">{getCategoryIcon(cat.store_category_name)}</span>
                {cat.store_category_name}
              </Link>
            ))}
            <Link
              href="/products"
              className="flex-none flex items-center gap-1 bg-white border border-gray-100 rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap shadow-sm hover:bg-gray-50 transition-colors"
              style={{ color: '#5FAE9B' }}
            >
              All Categories
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* Mobile: category chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 lg:hidden" style={{ scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <Link
              key={cat.store_category_id}
              href={`/products?category=${encodeURIComponent(cat.store_category_slug)}`}
              className="flex-none flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 transition-colors whitespace-nowrap"
            >
              <span>{getCategoryIcon(cat.store_category_name)}</span>
              {cat.store_category_name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
