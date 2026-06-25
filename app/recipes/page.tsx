'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getRecipesWithAvailability,
  getRecipeCategories,
  trackRecipeEvent,
  availableProducts,
  totalBasketValue,
  type RecipeSummary,
  type RecipeCategory,
} from '@/lib/recipes'
import { addToCart } from '@/lib/cart'

const PLACEHOLDER = 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=600'
const PAGE_SIZE = 12

// ─── Availability ring ────────────────────────────────────────────────────────

function AvailRing({ pct }: { pct: number }) {
  const r = 18, circ = 2 * Math.PI * r
  const color = pct === 100 ? '#5FAE9B' : pct >= 60 ? '#e5a100' : '#d1d5db'
  return (
    <div className="relative flex items-center justify-center w-14 h-14 flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" width={56} height={56} viewBox="0 0 56 56">
        <circle cx={28} cy={28} r={r} fill="none" stroke="#f3f4f6" strokeWidth={4} />
        <circle
          cx={28} cy={28} r={r} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[10px] font-bold" style={{ color }}>{pct}%</span>
    </div>
  )
}

// ─── Smart Basket button ──────────────────────────────────────────────────────

function SmartBasketBtn({ recipe }: { recipe: RecipeSummary }) {
  const [state, setState] = useState<'idle' | 'added'>('idle')
  const avail = availableProducts(recipe)
  const total = totalBasketValue(avail)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (!avail.length) return
    avail.forEach((p) => addToCart({
      product_id: p.id,
      product_name: p.name,
      product_image: p.image ?? undefined,
      unit_price: Number(p.price),
    }))
    trackRecipeEvent(recipe.id, 'add_to_pocket')
    setState('added')
    setTimeout(() => setState('idle'), 2200)
  }

  if (!avail.length) return (
    <span className="text-[10px] text-gray-400 font-medium">No stock</span>
  )

  return (
    <motion.button
      onClick={handleAdd}
      whileTap={{ scale: 0.96 }}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold flex-shrink-0 transition-all"
      style={{ background: state === 'added' ? '#5FAE9B' : 'linear-gradient(135deg, #0F2747, #1a3a6b)' }}
    >
      {state === 'added' ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Added!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          Add {avail.length} · £{total.toFixed(2)}
        </>
      )}
    </motion.button>
  )
}

// ─── Recipe card ──────────────────────────────────────────────────────────────

function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const totalMins = (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)
  const missing = recipe.total_products - recipe.available_products
  const diffColor = recipe.difficulty?.toLowerCase() === 'easy' ? '#5FAE9B'
    : recipe.difficulty?.toLowerCase() === 'medium' ? '#e5a100'
    : recipe.difficulty ? '#e55c5c' : '#9ca3af'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <Link href={`/recipes/${recipe.slug}`} className="relative block h-48 bg-gray-100 overflow-hidden flex-shrink-0">
        <Image
          src={recipe.featured_image || PLACEHOLDER}
          alt={recipe.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover hover:scale-105 transition-transform duration-500"
          unoptimized
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Featured crown */}
        {recipe.is_featured && (
          <div className="absolute top-3 left-3">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
              ⭐ Featured
            </span>
          </div>
        )}

        {/* Difficulty */}
        {recipe.difficulty && (
          <div className="absolute top-3 right-3">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white capitalize" style={{ backgroundColor: diffColor }}>
              {recipe.difficulty}
            </span>
          </div>
        )}

        {/* Bottom meta */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {recipe.category_emoji && recipe.category_name && (
              <span className="text-[9px] font-semibold bg-white/90 text-gray-700 px-2 py-0.5 rounded-full">
                {recipe.category_emoji} {recipe.category_name}
              </span>
            )}
            {totalMins > 0 && (
              <span className="text-[9px] font-semibold bg-white/90 text-gray-700 px-2 py-0.5 rounded-full">
                ⏱ {totalMins}m
              </span>
            )}
          </div>
          {recipe.servings && (
            <span className="text-[9px] text-white/80 font-medium">Serves {recipe.servings}</span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">
        {/* Title + ring */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <Link href={`/recipes/${recipe.slug}`}>
              <h2
                className="font-bold text-sm leading-snug hover:text-[#5FAE9B] transition-colors line-clamp-2"
                style={{ color: '#0F2747' }}
              >
                {recipe.title}
              </h2>
            </Link>
            {recipe.excerpt && (
              <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">{recipe.excerpt}</p>
            )}
          </div>
          {recipe.total_products > 0 && <AvailRing pct={recipe.availability_pct} />}
        </div>

        {/* Ingredient status */}
        {recipe.total_products > 0 && (
          <div className="rounded-xl p-2.5 space-y-1.5" style={{ backgroundColor: '#f8faf9' }}>
            <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500">
              <span>Ingredient availability</span>
              <span style={{ color: recipe.availability_pct === 100 ? '#5FAE9B' : '#e5a100' }}>
                {recipe.available_products} of {recipe.total_products} in stock
              </span>
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${recipe.availability_pct}%`,
                  backgroundColor: recipe.availability_pct === 100 ? '#5FAE9B' : recipe.availability_pct >= 60 ? '#e5a100' : '#d1d5db',
                }}
              />
            </div>
            {missing > 0 && (
              <p className="text-[9px] text-red-400 font-medium">{missing} ingredient{missing !== 1 ? 's' : ''} currently unavailable</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2">
          <SmartBasketBtn recipe={recipe} />
          <Link
            href={`/recipes/${recipe.slug}`}
            onClick={() => trackRecipeEvent(recipe.id, 'basket_click')}
            className="ml-auto text-xs font-semibold px-3 py-2 rounded-xl border transition-colors hover:bg-gray-50 flex-shrink-0"
            style={{ borderColor: '#5FAE9B', color: '#5FAE9B' }}
          >
            Full Recipe
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 animate-pulse overflow-hidden">
      <div className="h-48 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-3.5 bg-gray-100 rounded w-3/4" />
        <div className="h-2.5 bg-gray-100 rounded w-full" />
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="h-8 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Category filter bar ──────────────────────────────────────────────────────

function CategoryBar({
  categories,
  active,
  onSelect,
}: {
  categories: RecipeCategory[]
  active: string | null
  onSelect: (slug: string | null) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      <button
        onClick={() => onSelect(null)}
        className={`flex-none flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${active === null ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
        style={active === null ? { backgroundColor: '#0F2747' } : {}}
      >
        🍽️ All Recipes
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(active === cat.slug ? null : cat.slug)}
          className={`flex-none flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${active === cat.slug ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
          style={active === cat.slug ? { backgroundColor: '#5FAE9B' } : {}}
        >
          {cat.emoji} {cat.name}
        </button>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  const load = useCallback(async (opts: { category: string | null; append: boolean; off: number }) => {
    if (!opts.append) setLoading(true)
    else setLoadingMore(true)
    const data = await getRecipesWithAvailability({ limit: PAGE_SIZE, offset: opts.off, categorySlug: opts.category })
    if (opts.append) setRecipes((prev) => [...prev, ...data])
    else setRecipes(data)
    setHasMore(data.length === PAGE_SIZE)
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => {
    getRecipeCategories().then(setCategories)
    load({ category: null, append: false, off: 0 })
  }, [load])

  function handleCategory(slug: string | null) {
    setActiveCategory(slug)
    setOffset(0)
    load({ category: slug, append: false, off: 0 })
  }

  function handleLoadMore() {
    const next = offset + PAGE_SIZE
    setOffset(next)
    load({ category: activeCategory, append: true, off: next })
  }

  // Client-side search filter (recipes already fetched)
  const displayed = search
    ? recipes.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.excerpt ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.category_name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : recipes

  return (
    <>
      {/* Hero */}
      <section className="py-10 md:py-14" style={{ background: 'linear-gradient(135deg, #0F2747 0%, #1a3a6b 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">👨‍🍳</span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white">Kerala Recipes</h1>
              </div>
              <p className="text-gray-300 text-sm max-w-lg leading-relaxed">
                Authentic dishes from God&apos;s Own Country. Each recipe shows which ingredients are available right now — add them all to your Pocket in one tap.
              </p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 w-full md:w-72 focus-within:bg-white/15 transition-colors">
              <svg className="w-4 h-4 text-white/50 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setSearch(e.target.value) }}
                placeholder="Search recipes…"
                className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setSearch('') }} className="text-white/40 hover:text-white/70">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mt-6">
            {[
              { label: 'Recipes', value: recipes.length.toString() },
              { label: 'Categories', value: categories.length.toString() },
              { label: 'Ready to cook', value: recipes.filter((r) => r.availability_pct === 100).length.toString() },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category bar */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <CategoryBar categories={categories} active={activeCategory} onSelect={handleCategory} />
          </div>
        </div>
      )}

      {/* Grid */}
      <section className="py-8 md:py-10" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
              </motion.div>
            ) : displayed.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 text-gray-400">
                <p className="text-lg font-semibold mb-1">No recipes found</p>
                <p className="text-sm">Try a different category or search term</p>
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {displayed.map((r) => <RecipeCard key={r.id} recipe={r} />)}
              </motion.div>
            )}
          </AnimatePresence>

          {hasMore && !search && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-2xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: '#0F2747' }}
              >
                {loadingMore ? 'Loading…' : 'Load More Recipes'}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
