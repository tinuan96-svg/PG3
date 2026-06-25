'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { getFoodTypeProducts, type FoodType, type FoodTypeProduct } from '@/lib/food-types'
import { type RecipeSummary, availableProducts, totalBasketValue, trackRecipeEvent } from '@/lib/recipes'
import { addToCart } from '@/lib/cart'

const PLACEHOLDER = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'
const PAGE_SIZE = 24

// ─── Meal suggestions (local AI) ─────────────────────────────────────────────

const MEAL_SUGGESTIONS: Record<string, string[]> = {
  'vegetarian': ['Avial with steamed rice', 'Thoran & Rasam', 'Moong dal cheela', 'Kerala Sambar Sadya'],
  'non-vegetarian': ['Chicken Roast & Parotta', 'Egg Curry with Appam', 'Kerala Beef Fry', 'Mutton Biryani'],
  'breakfast': ['Puttu & Kadala Curry', 'Appam & Vegetable Stew', 'Idli & Sambar', 'Upma with coconut chutney'],
  'lunch-dinner': ['Kerala Fish Curry & Rice', 'Sambar Rice', 'Chicken Curry & Pathiri', 'Prawn Masala with Ghee Rice'],
  'instant-cook': ['Quick Upma', '2-Min Instant Noodles', 'Ready Rice & Dal', 'Instant Sambar Mix'],
  'party-festival': ['Onam Sadya spread', 'Ada Pradhaman', 'Unniyappam platter', 'Chakka Pradhaman'],
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ p, accentColor }: { p: FoodTypeProduct; accentColor: string }) {
  const [added, setAdded] = useState(false)
  const hasDiscount = p.compare_price && p.compare_price > p.price
  const discount = hasDiscount ? Math.round(((p.compare_price! - p.price) / p.compare_price!) * 100) : 0

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
          alt={p.name}
          fill
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

          <motion.button
            onClick={() => {
              addToCart({ product_id: p.product_id, product_name: p.name, product_image: p.image ?? undefined, unit_price: Number(p.price) })
              setAdded(true)
              setTimeout(() => setAdded(false), 1800)
            }}
            whileTap={{ scale: 0.92 }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all"
            style={{ backgroundColor: added ? '#5FAE9B' : accentColor }}
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
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Recipe mini-card ─────────────────────────────────────────────────────────

function RecipeMini({ recipe, accentColor }: { recipe: RecipeSummary; accentColor: string }) {
  const [added, setAdded] = useState(false)
  const avail = availableProducts(recipe)
  const total = totalBasketValue(avail)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex gap-3 p-3 hover:shadow-md transition-all">
      <Link href={`/recipes/${recipe.slug}`} className="relative w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
        <Image
          src={recipe.featured_image || PLACEHOLDER}
          alt={recipe.title}
          fill
          className="object-cover"
          sizes="64px"
          unoptimized
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/recipes/${recipe.slug}`}>
          <p className="text-xs font-semibold text-gray-800 hover:text-[#5FAE9B] transition-colors line-clamp-2 leading-snug">
            {recipe.title}
          </p>
        </Link>
        <p className="text-[9px] text-gray-400 mt-0.5">{recipe.availability_pct}% in stock</p>
        {avail.length > 0 && (
          <button
            onClick={() => {
              avail.forEach((p) => addToCart({ product_id: p.id, product_name: p.name, product_image: p.image ?? undefined, unit_price: Number(p.price) }))
              trackRecipeEvent(recipe.id, 'add_to_pocket')
              setAdded(true)
              setTimeout(() => setAdded(false), 1800)
            }}
            className="mt-1.5 text-[9px] font-bold px-2 py-1 rounded-lg text-white transition-colors"
            style={{ backgroundColor: added ? '#5FAE9B' : accentColor }}
          >
            {added ? '✓ Added!' : `Add ${avail.length} · £${total.toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  foodType: FoodType | null
  slug: string
  initialProducts: FoodTypeProduct[]
  relatedRecipes: RecipeSummary[]
  allTypes: FoodType[]
}

export default function CollectionClient({ foodType, slug, initialProducts, relatedRecipes, allTypes }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE)
  const [offset, setOffset] = useState(PAGE_SIZE)

  const ft = foodType
  const accentColor = ft?.accent_color ?? '#5FAE9B'
  const bgColor = ft?.bg_color ?? '#0F2747'
  const suggestions = MEAL_SUGGESTIONS[slug] ?? []

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true)
    const more = await getFoodTypeProducts(slug, PAGE_SIZE, offset)
    setProducts((prev) => [...prev, ...more])
    setHasMore(more.length === PAGE_SIZE)
    setOffset((o) => o + PAGE_SIZE)
    setLoadingMore(false)
  }, [slug, offset])

  if (!ft) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="text-center">
          <p className="text-4xl mb-4">🍽️</p>
          <h1 className="text-xl font-bold text-gray-700 mb-2">Collection Not Found</h1>
          <Link href="/collections" className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#0F2747' }}>
            All Collections
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero banner */}
      <div className="relative py-10 md:py-16 overflow-hidden" style={{ backgroundColor: bgColor }}>
        {ft.banner_image && (
          <div className="absolute inset-0 opacity-20">
            <Image src={ft.banner_image} alt="" fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${bgColor}ee 0%, ${bgColor}99 100%)` }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/50 text-xs mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/collections" className="hover:text-white transition-colors">Collections</Link>
            <span>/</span>
            <span className="text-white">{ft.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-5xl md:text-6xl leading-none">{ft.emoji}</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-2 mb-2">{ft.name}</h1>
              <p className="text-white/60 text-sm max-w-md leading-relaxed">{ft.description}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${accentColor}25`, color: accentColor, border: `1px solid ${accentColor}40` }}>
                  {ft.product_count} products
                </span>
                <span className="text-xs text-white/40">Updated automatically as new products are approved</span>
              </div>
            </div>

            {/* AI meal suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 max-w-xs w-full">
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2.5">✨ Suggested meals</p>
                <ul className="space-y-1.5">
                  {suggestions.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-white/80">
                      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Other collections strip */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex gap-2 w-max">
          {allTypes.map((t) => (
            <Link
              key={t.id}
              href={`/collections/${t.slug}`}
              className={`flex-none flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${t.slug === slug ? 'text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300'}`}
              style={t.slug === slug ? { backgroundColor: accentColor } : {}}
            >
              {t.emoji} {t.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Products + sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="grid lg:grid-cols-4 gap-8">

          {/* Products grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: '#0F2747' }}>
                {products.length > 0 ? `${ft.product_count} Products` : 'Products'}
              </h2>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-3">{ft.emoji}</p>
                <p className="text-gray-500 font-semibold mb-1">No products yet</p>
                <p className="text-gray-400 text-sm">Products are automatically added as they are approved.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {products.map((p, i) => (
                      <motion.div
                        key={p.product_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      >
                        <ProductCard p={p} accentColor={accentColor} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 rounded-2xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                      style={{ backgroundColor: bgColor }}
                    >
                      {loadingMore ? 'Loading…' : 'Load More Products'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar: recipes */}
          <div className="space-y-5">
            {relatedRecipes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold" style={{ color: '#0F2747' }}>Related Recipes</h3>
                  <Link href="/recipes" className="text-[10px] font-semibold hover:opacity-75 transition-opacity" style={{ color: accentColor }}>
                    All →
                  </Link>
                </div>
                <div className="space-y-3">
                  {relatedRecipes.slice(0, 4).map((r) => (
                    <RecipeMini key={r.id} recipe={r} accentColor={accentColor} />
                  ))}
                </div>
              </div>
            )}

            {/* Meal plan suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">✨ AI Meal Ideas</p>
                <ul className="space-y-2">
                  {suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5" style={{ backgroundColor: accentColor }}>
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/recipes"
                  className="block mt-4 py-2.5 rounded-xl text-center text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accentColor }}
                >
                  Browse Full Recipes
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
