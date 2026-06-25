'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/products-data'
import { addToCart } from '@/lib/cart'
import { usePocket } from '@/lib/pocket-context'

const PLACEHOLDER = 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400'

const CATEGORIES = [
  { emoji: '🍚', label: 'Rice', slug: 'rice' },
  { emoji: '🫘', label: 'Dals', slug: 'dals' },
  { emoji: '🌾', label: 'Flours', slug: 'flours' },
  { emoji: '🌶️', label: 'Spices', slug: 'spices' },
  { emoji: '🫕', label: 'Masalas', slug: 'masalas' },
  { emoji: '🫒', label: 'Oils', slug: 'oils' },
  { emoji: '🫙', label: 'Pickles', slug: 'pickles' },
  { emoji: '🍪', label: 'Snacks', slug: 'snacks' },
  { emoji: '🍮', label: 'Sweets', slug: 'sweets' },
  { emoji: '☕', label: 'Tea & Coffee', slug: 'tea-coffee' },
  { emoji: '🥨', label: 'Fryums', slug: 'fryums' },
  { emoji: '⚡', label: 'Instant Foods', slug: 'instant-foods' },
  { emoji: '🥦', label: 'Vegetables', slug: 'vegetables' },
  { emoji: '🥭', label: 'Fruits', slug: 'fruits' },
  { emoji: '🧹', label: 'Household', slug: 'household' },
  { emoji: '🌿', label: 'Personal Care', slug: 'personal-care' },
]

const PROMO_BANNERS = [
  {
    id: 1,
    title: 'Kerala Essentials',
    subtitle: 'Everything your kitchen needs',
    cta: 'Shop Now',
    href: '/products',
    bg: 'from-[#0F2747] to-[#1a3a6b]',
    accent: '#5FAE9B',
    emoji: '🛒',
  },
  {
    id: 2,
    title: 'Best Selling Rice',
    subtitle: 'Matta, Jeerakasala, Basmati & more',
    cta: 'Browse Rice',
    href: '/products?category=rice',
    bg: 'from-[#5FAE9B] to-[#3d9480]',
    accent: '#fff',
    emoji: '🍚',
  },
  {
    id: 3,
    title: 'Weekly Offers',
    subtitle: 'Save up to 30% this week',
    cta: 'View Deals',
    href: '/products?filter=deals',
    bg: 'from-[#e5a100] to-[#c48a00]',
    accent: '#fff',
    emoji: '🏷️',
  },
  {
    id: 4,
    title: 'New Arrivals',
    subtitle: 'Fresh stock just landed',
    cta: 'Shop New',
    href: '/products?filter=new',
    bg: 'from-[#2d6a4f] to-[#1b4332]',
    accent: '#95d5b2',
    emoji: '✨',
  },
  {
    id: 5,
    title: 'Festival Specials',
    subtitle: 'Authentic flavours for every occasion',
    cta: 'Explore',
    href: '/products',
    bg: 'from-[#7b2d8b] to-[#4a1060]',
    accent: '#f4a261',
    emoji: '🪔',
  },
]

const POPULAR_WITH = [
  { label: 'Rice', emoji: '🍚', count: '12 products', slug: 'rice' },
  { label: 'Snacks', emoji: '🍪', count: '18 products', slug: 'snacks' },
  { label: 'Spices', emoji: '🌶️', count: '24 products', slug: 'spices' },
  { label: 'Tea & Coffee', emoji: '☕', count: '8 products', slug: 'tea-coffee' },
  { label: 'Pickles', emoji: '🫙', count: '10 products', slug: 'pickles' },
  { label: 'Oils', emoji: '🫒', count: '6 products', slug: 'oils' },
]

const TRUST_ITEMS = [
  { icon: '✓', text: 'Authentic Kerala Products' },
  { icon: '✓', text: 'UK Based Stock' },
  { icon: '✓', text: 'Next Day Delivery' },
  { icon: '✓', text: 'Secure Payments' },
]

function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const { triggerFly } = usePocket()
  const discount = product.price > product.offer_price
    ? Math.round(((product.price - product.offer_price) / product.price) * 100)
    : 0

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    const img = product.images[0] || PLACEHOLDER
    addToCart({
      product_id: product.id,
      product_name: product.name,
      product_image: img,
      unit_price: product.offer_price,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    if (btnRef.current) {
      triggerFly({ imageUrl: img, originRect: btnRef.current.getBoundingClientRect() })
    }
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex-none bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
      style={{ width: 148 }}
    >
      <div className="relative w-full bg-gray-50" style={{ height: 148 }}>
        <Image
          src={product.images[0] || PLACEHOLDER}
          alt={product.name}
          fill
          className="object-contain p-2"
          sizes="148px"
          loading="lazy"
          unoptimized
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-lg" style={{ backgroundColor: '#5FAE9B' }}>
            -{discount}%
          </span>
        )}
        {product.newArrival && (
          <span className="absolute top-2 right-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-lg" style={{ backgroundColor: '#0F2747' }}>
            NEW
          </span>
        )}
      </div>
      <div className="p-2.5 flex flex-col flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wide mb-0.5 truncate" style={{ color: '#5FAE9B' }}>{product.brand}</p>
        <p className="text-[11px] font-semibold text-gray-800 line-clamp-2 leading-tight mb-1 min-h-[28px]">{product.name}</p>
        {product.weight ? (
          <p className="text-[10px] text-gray-400 font-medium mb-1.5">{product.weight}</p>
        ) : (
          <div className="mb-1.5" />
        )}
        <div className="flex items-center justify-between gap-1">
          <div>
            <span className="text-sm font-extrabold" style={{ color: '#0F2747' }}>£{product.offer_price.toFixed(2)}</span>
            {product.price !== product.offer_price && (
              <span className="block text-[9px] text-gray-400 line-through">£{product.price.toFixed(2)}</span>
            )}
          </div>
          <button
            ref={btnRef}
            onClick={handleAdd}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all active:scale-90 flex-none"
            style={{ backgroundColor: added ? '#5FAE9B' : '#0F2747' }}
          >
            {added ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </Link>
  )
}

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-3 overflow-x-auto -mx-4 px-4"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  )
}

interface Props {
  bestSellers: Product[]
  newArrivals: Product[]
  trending: Product[]
}

export default function MobileHomepage({ bestSellers, newArrivals, trending }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeBanner, setActiveBanner] = useState(0)
  const bannerRef = useRef<HTMLDivElement>(null)

  function handleBannerScroll() {
    if (!bannerRef.current) return
    const idx = Math.round(bannerRef.current.scrollLeft / bannerRef.current.offsetWidth)
    setActiveBanner(idx)
  }

  return (
    <div className="pb-20" style={{ backgroundColor: '#F4F6F8' }}>

      {/* ── QUICK CATEGORY STRIP ── */}
      <div className="bg-white pt-4 pb-3 border-b border-gray-100">
        <div
          className="flex gap-4 overflow-x-auto px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.slug
            return (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                onClick={() => setActiveCategory(cat.slug)}
                className="flex flex-col items-center gap-1.5 flex-none"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
                  style={{
                    backgroundColor: isActive ? '#0F2747' : '#F4F6F8',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: isActive ? '0 4px 12px rgba(15,39,71,0.2)' : 'none',
                  }}
                >
                  {cat.emoji}
                </div>
                <span
                  className="text-[9px] font-semibold text-center leading-tight max-w-[52px] whitespace-nowrap overflow-hidden"
                  style={{ color: isActive ? '#0F2747' : '#6b7280' }}
                >
                  {cat.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── PROMOTIONAL BANNERS ── */}
      <div className="mt-3 px-4">
        <div
          ref={bannerRef}
          onScroll={handleBannerScroll}
          className="flex gap-3 overflow-x-auto rounded-2xl"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}
        >
          {PROMO_BANNERS.map((banner) => (
            <Link
              key={banner.id}
              href={banner.href}
              className={`flex-none w-full bg-gradient-to-br ${banner.bg} rounded-2xl p-5 flex items-center justify-between overflow-hidden relative`}
              style={{ scrollSnapAlign: 'start', minWidth: 'calc(100% - 32px)' }}
            >
              <div className="z-10">
                <p className="text-white font-extrabold text-xl leading-tight mb-1">{banner.title}</p>
                <p className="text-white text-xs opacity-80 mb-4">{banner.subtitle}</p>
                <span
                  className="inline-block text-xs font-bold px-4 py-2 rounded-xl"
                  style={{ backgroundColor: banner.accent, color: banner.bg.includes('5FAE') ? '#0F2747' : 'white' }}
                >
                  {banner.cta} →
                </span>
              </div>
              <div className="text-7xl opacity-20 absolute right-4 top-1/2 -translate-y-1/2 select-none">
                {banner.emoji}
              </div>
            </Link>
          ))}
        </div>
        {/* Banner dots */}
        <div className="flex justify-center gap-1.5 mt-2.5">
          {PROMO_BANNERS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: activeBanner === i ? 20 : 6,
                height: 6,
                backgroundColor: activeBanner === i ? '#0F2747' : '#d1d5db',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── CATEGORY GRID ── */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold" style={{ color: '#0F2747' }}>Shop by Category</h2>
          <Link href="/products" className="text-xs font-semibold" style={{ color: '#5FAE9B' }}>See all →</Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.slice(0, 8).map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1.5 border border-gray-100 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: '#F4F6F8' }}>
                {cat.emoji}
              </div>
              <span className="text-[9px] font-semibold text-gray-700 text-center leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {CATEGORIES.slice(8, 16).map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1.5 border border-gray-100 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: '#F4F6F8' }}>
                {cat.emoji}
              </div>
              <span className="text-[9px] font-semibold text-gray-700 text-center leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── POPULAR WITH CUSTOMERS ── */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold" style={{ color: '#0F2747' }}>Popular With Customers</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {POPULAR_WITH.map((item) => (
            <Link
              key={item.slug}
              href={`/products?category=${item.slug}`}
              className="bg-white rounded-2xl p-3.5 border border-gray-100 active:scale-95 transition-transform"
            >
              <div className="text-2xl mb-2">{item.emoji}</div>
              <p className="text-xs font-bold text-gray-800 leading-tight">{item.label}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">{item.count}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── BEST SELLERS ── */}
      {bestSellers.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <div>
              <h2 className="text-base font-extrabold" style={{ color: '#0F2747' }}>Best Sellers</h2>
              <p className="text-[10px] text-gray-400">Tried, trusted and loved</p>
            </div>
            <Link href="/products?filter=bestsellers" className="text-xs font-semibold" style={{ color: '#5FAE9B' }}>See all →</Link>
          </div>
          <HorizontalScroll>
            {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
            <div className="flex-none w-4" />
          </HorizontalScroll>
        </div>
      )}

      {/* ── NEW ARRIVALS ── */}
      {newArrivals.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <div>
              <h2 className="text-base font-extrabold" style={{ color: '#0F2747' }}>New Arrivals</h2>
              <p className="text-[10px] text-gray-400">Fresh stock just landed</p>
            </div>
            <Link href="/products?filter=new" className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#5FAE9B' }}>
              <span className="inline-block px-1.5 py-0.5 rounded-full text-white text-[8px] font-bold" style={{ backgroundColor: '#5FAE9B' }}>NEW</span>
              See all →
            </Link>
          </div>
          <HorizontalScroll>
            {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
            <div className="flex-none w-4" />
          </HorizontalScroll>
        </div>
      )}

      {/* ── TRENDING ── */}
      {trending.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <div>
              <h2 className="text-base font-extrabold" style={{ color: '#0F2747' }}>Trending Now</h2>
              <p className="text-[10px] text-gray-400">What Kerala families are buying</p>
            </div>
            <Link href="/products?filter=trending" className="text-xs font-semibold" style={{ color: '#5FAE9B' }}>See all →</Link>
          </div>
          <HorizontalScroll>
            {trending.map((p) => <ProductCard key={p.id} product={p} />)}
            <div className="flex-none w-4" />
          </HorizontalScroll>
        </div>
      )}

      {/* ── TRUST SECTION ── */}
      <div className="mt-6 mx-4 rounded-2xl p-5 border border-gray-100 bg-white">
        <h3 className="text-sm font-extrabold mb-4 text-center" style={{ color: '#0F2747' }}>Why Shop With Us</h3>
        <div className="grid grid-cols-2 gap-3">
          {TRUST_ITEMS.map((item) => (
            <div key={item.text} className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-none text-white text-xs font-bold" style={{ backgroundColor: '#5FAE9B' }}>
                {item.icon}
              </div>
              <span className="text-xs font-medium text-gray-700">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-center">
            <p className="text-base font-extrabold" style={{ color: '#0F2747' }}>100+</p>
            <p className="text-[9px] text-gray-400">Products</p>
          </div>
          <div className="text-center">
            <p className="text-base font-extrabold" style={{ color: '#0F2747' }}>Next Day</p>
            <p className="text-[9px] text-gray-400">Delivery</p>
          </div>
          <div className="text-center">
            <p className="text-base font-extrabold" style={{ color: '#0F2747' }}>Free</p>
            <p className="text-[9px] text-gray-400">Over £40</p>
          </div>
          <div className="text-center">
            <p className="text-base font-extrabold" style={{ color: '#0F2747' }}>4.8★</p>
            <p className="text-[9px] text-gray-400">Rating</p>
          </div>
        </div>
      </div>

      {/* ── DELIVERY CITIES ── */}
      <div className="mt-4 mx-4 rounded-2xl bg-white border border-gray-100 p-5">
        <h3 className="text-sm font-extrabold mb-3" style={{ color: '#0F2747' }}>Delivering Across the UK</h3>
        <div className="flex flex-wrap gap-2">
          {['London', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow', 'Leicester', 'Bristol', 'Sheffield'].map((city) => (
            <span key={city} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 bg-gray-50">
              {city}
            </span>
          ))}
        </div>
      </div>

    </div>
  )
}
