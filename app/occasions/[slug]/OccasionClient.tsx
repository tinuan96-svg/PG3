'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { getOccasionProducts, type Occasion, type OccasionProduct } from '@/lib/occasions'
import { type RecipeSummary, availableProducts, totalBasketValue, trackRecipeEvent } from '@/lib/recipes'
import { addToCart } from '@/lib/cart'

const PLACEHOLDER = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'
const PAGE_SIZE = 24

const MEAL_SUGGESTIONS: Record<string, string[]> = {
  'onam-sadya':         ['Avial', 'Olan', 'Sambar', 'Parippu Curry', 'Payasam', 'Pappadam & Pickle'],
  'birthday-party':     ['Cake & Snack Platter', 'Chips & Dip Board', 'Murukku Mix Bowl', 'Sweet Bites Selection'],
  'christmas':          ['Plum Cake & Tea', 'Kerala Beef Roast', 'Mutton Stew & Appam', 'Christmas Snack Tray'],
  'eid-special':        ['Chicken Biriyani', 'Mutton Curry & Parotta', 'Dates & Sweets Platter', 'Sheer Khurma'],
  'diwali-sweets':      ['Halwa & Ladoo Box', 'Dry Fruit Mix', 'Kerala Mixture Platter', 'Chakka Pradhaman'],
  'family-kerala-meal': ['Fish Curry & Matta Rice', 'Sambar & Rasam', 'Thoran & Avial', 'Payasam Dessert'],
  'rainy-day-snacks':   ['Masala Chai & Murukku', 'Biscuit & Tea Time', 'Banana Chips Platter', 'Hot Upma'],
  'house-party':        ['Party Snack Board', 'Kerala Chips Mix', 'Soft Drink & Mixer Tray', 'Quick Appetiser Set'],
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ p, accentColor }: { p: OccasionProduct; accentColor: string }) {
  const [added, setAdded] = useState(false)
  const hasDiscount = p.compare_price && p.compare_price > p.price
  const discount = hasDiscount ? Math.round(((p.compare_price! - p.price) / p.compare_price!) * 100) : 0

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    addToCart({ product_id: p.product_id, product_name: p.name, unit_price: p.price, product_image: p.image || '', quantity: 1 })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    >
      <Link href={`/products/${p.slug}`} className="relative block h-40 bg-gray-50 overflow-hidden">
        <Image
          src={p.image || PLACEHOLDER}
          alt={p.name} fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover hover:scale-105 transition-transform duration-500"
          unoptimized
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#e55c5c' }}>
            -{discount}%
          </span>
        )}
        {p.is_flash_deal && (
          <span className="absolute top-2 right-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#e5a100' }}>
            ⚡ Deal
          </span>
        )}
        {p.source === 'ai' && (
          <span className="absolute bottom-2 right-2 text-[8px] text-white/70 bg-black/30 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            AI pick
          </span>
        )}
      </Link>

      <div className="p-3">
        <Link href={`/products/${p.slug}`}>
          <p className="text-xs font-semibold text-gray-800 line-clamp-2 hover:text-[#5FAE9B] transition-colors mb-1.5 leading-snug min-h-[2.5rem]">
            {p.name}
          </p>
        </Link>
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-sm font-extrabold" style={{ color: '#0F2747' }}>
              £{Number(p.price).toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-gray-400 line-through ml-1.5">
                £{Number(p.compare_price).toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold transition-all active:scale-90 flex-shrink-0"
            style={{ backgroundColor: added ? '#5FAE9B' : accentColor }}
          >
            {added ? '✓' : '+'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Smart basket for a recipe ────────────────────────────────────────────────

function RecipeMiniCard({ recipe }: { recipe: RecipeSummary }) {
  const avail = availableProducts(recipe)
  const value = totalBasketValue(avail)
  const [added, setAdded] = useState(false)

  function handleBasket(e: React.MouseEvent) {
    e.preventDefault()
    avail.forEach((mp) => addToCart({ product_id: mp.id, product_name: mp.name, unit_price: mp.price, product_image: mp.image || '', quantity: 1 }))
    trackRecipeEvent(recipe.id, 'add_to_pocket')
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
      <Link href={`/recipes/${recipe.slug}`} className="block">
        <p className="text-white font-bold text-sm mb-0.5 hover:opacity-80 transition-opacity">{recipe.title}</p>
        <p className="text-white/50 text-[10px] mb-2">{avail.length}/{recipe.total_products} ingredients available</p>
        <div className="w-full bg-white/10 rounded-full h-1 mb-2">
          <div
            className="h-1 rounded-full transition-all"
            style={{
              width: `${recipe.availability_pct}%`,
              backgroundColor: recipe.availability_pct >= 100 ? '#52B788' : recipe.availability_pct >= 60 ? '#f59e0b' : '#9ca3af',
            }}
          />
        </div>
      </Link>
      {avail.length > 0 && (
        <button
          onClick={handleBasket}
          className="w-full py-1.5 rounded-xl text-[11px] font-bold text-white transition-all"
          style={{ backgroundColor: added ? '#52B788' : '#5FAE9B' }}
        >
          {added ? 'Added to Pocket!' : `Add ${avail.length} items · £${value.toFixed(2)}`}
        </button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  occasion: Occasion | null
  slug: string
  initialProducts: OccasionProduct[]
  relatedRecipes: RecipeSummary[]
  allOccasions: Occasion[]
}

export default function OccasionClient({ occasion, slug, initialProducts, relatedRecipes, allOccasions }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE)

  const loadMore = useCallback(async () => {
    setLoading(true)
    const more = await getOccasionProducts(slug, PAGE_SIZE, products.length)
    setProducts((prev) => [...prev, ...more])
    setHasMore(more.length === PAGE_SIZE)
    setLoading(false)
  }, [slug, products.length])

  const suggestions = MEAL_SUGGESTIONS[slug] ?? []
  const accentColor = occasion?.accent_color ?? '#5FAE9B'

  if (!occasion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-24 text-center">
        <p className="text-5xl mb-4">🎉</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Occasion not found</h1>
        <p className="text-gray-500 mb-6">This occasion collection doesn&apos;t exist or has been removed.</p>
        <Link href="/occasions" className="px-6 py-3 rounded-2xl font-bold text-white text-sm" style={{ backgroundColor: '#5FAE9B' }}>
          Browse All Occasions
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Hero */}
      <section className="relative py-12 md:py-20 overflow-hidden" style={{ backgroundColor: occasion.bg_color }}>
        {occasion.banner_image && (
          <div className="absolute inset-0">
            <Image src={occasion.banner_image} alt={occasion.name} fill className="object-cover opacity-20" unoptimized />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="text-6xl mb-3">{occasion.emoji}</div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{occasion.name}</h1>
              <p className="text-white/70 text-base max-w-lg">{occasion.description}</p>
              {occasion.product_count > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/20 backdrop-blur-sm">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {occasion.product_count} products in this occasion
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Occasion switcher */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 min-w-max">
          {allOccasions.map((o) => (
            <Link
              key={o.id}
              href={`/occasions/${o.slug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
              style={o.slug === slug
                ? { backgroundColor: accentColor, color: '#fff' }
                : { backgroundColor: '#f3f4f6', color: '#374151' }}
            >
              <span>{o.emoji}</span> {o.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Main products grid */}
          <div className="lg:col-span-3">
            {products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">{occasion.emoji}</p>
                <h2 className="text-xl font-bold text-gray-700 mb-2">No products yet</h2>
                <p className="text-gray-500 text-sm">Products will appear here once they are assigned to this occasion.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  <AnimatePresence>
                    {products.map((p) => (
                      <ProductCard key={p.product_id} p={p} accentColor={accentColor} />
                    ))}
                  </AnimatePresence>
                </div>

                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-8 py-3 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-60"
                      style={{ backgroundColor: accentColor }}
                    >
                      {loading ? 'Loading...' : 'Load More Products'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">

            {/* AI meal suggestions */}
            {suggestions.length > 0 && (
              <div className="rounded-2xl p-4" style={{ backgroundColor: occasion.bg_color }}>
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: accentColor }}>
                  AI Meal Ideas
                </p>
                <ul className="space-y-1.5">
                  {suggestions.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                      <span className="text-base">{occasion.emoji}</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related recipes */}
            {relatedRecipes.length > 0 && (
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-3 text-gray-500">Related Recipes</p>
                <div className="space-y-2">
                  {relatedRecipes.slice(0, 4).map((r) => (
                    <RecipeMiniCard key={r.id} recipe={r} />
                  ))}
                </div>
                <Link href="/recipes" className="mt-3 block text-center text-xs font-semibold py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                  All Recipes
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
