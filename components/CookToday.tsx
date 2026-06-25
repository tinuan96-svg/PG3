'use client'

import { useState, useEffect } from 'react'
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

// ─── Availability badge ───────────────────────────────────────────────────────

function AvailBadge({ pct }: { pct: number }) {
  const color = pct === 100 ? '#5FAE9B' : pct >= 60 ? '#e5a100' : '#9ca3af'
  const label = pct === 100 ? '100% available' : `${pct}% available`
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
      style={{ backgroundColor: color }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
      {label}
    </span>
  )
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

function DiffBadge({ diff }: { diff: string | null }) {
  if (!diff) return null
  const color = diff.toLowerCase() === 'easy' ? '#5FAE9B' : diff.toLowerCase() === 'medium' ? '#e5a100' : '#e55c5c'
  return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white capitalize" style={{ backgroundColor: color }}>
      {diff}
    </span>
  )
}

// ─── Smart Basket button ──────────────────────────────────────────────────────

function SmartBasketButton({ recipe }: { recipe: RecipeSummary }) {
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

  if (!avail.length) {
    return (
      <div className="w-full py-2.5 rounded-xl text-center text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100">
        No ingredients in stock
      </div>
    )
  }

  return (
    <motion.button
      onClick={handleAdd}
      whileTap={{ scale: 0.97 }}
      className="w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all"
      style={{ background: state === 'added' ? '#5FAE9B' : 'linear-gradient(135deg, #0F2747 0%, #1a3a6b 100%)' }}
    >
      {state === 'added' ? (
        <span className="flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Added to Pocket!
        </span>
      ) : (
        <span>
          Add {avail.length} Ingredient{avail.length !== 1 ? 's' : ''} · £{total.toFixed(2)}
        </span>
      )}
    </motion.button>
  )
}

// ─── Recipe card ──────────────────────────────────────────────────────────────

const PLACEHOLDER = 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=600'

function RecipeCard({ recipe, index }: { recipe: RecipeSummary; index: number }) {
  const totalMins = (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)
  const avail = availableProducts(recipe)
  const missing = recipe.total_products - recipe.available_products

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <Link href={`/recipes/${recipe.slug}`} className="relative block h-44 bg-gray-100 overflow-hidden flex-shrink-0">
        <Image
          src={recipe.featured_image || PLACEHOLDER}
          alt={recipe.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover hover:scale-105 transition-transform duration-500"
          unoptimized
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          <AvailBadge pct={recipe.availability_pct} />
          {recipe.category_emoji && recipe.category_name && (
            <span className="text-[9px] font-semibold bg-white/90 text-gray-700 px-2 py-0.5 rounded-full">
              {recipe.category_emoji} {recipe.category_name}
            </span>
          )}
        </div>
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
          <DiffBadge diff={recipe.difficulty} />
          {totalMins > 0 && (
            <span className="text-[9px] font-semibold bg-white/90 text-gray-700 px-2 py-0.5 rounded-full">
              {totalMins}m
            </span>
          )}
        </div>

        {/* Bottom: serves */}
        {recipe.servings && (
          <div className="absolute bottom-2 left-2.5">
            <span className="text-[9px] text-white/80 font-medium">Serves {recipe.servings}</span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <Link href={`/recipes/${recipe.slug}`}>
          <h3 className="font-bold text-sm leading-snug hover:text-[#5FAE9B] transition-colors line-clamp-2" style={{ color: '#0F2747' }}>
            {recipe.title}
          </h3>
        </Link>

        {recipe.excerpt && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{recipe.excerpt}</p>
        )}

        {/* Ingredient availability strip */}
        <div className="flex items-center gap-2 text-[10px]">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${recipe.availability_pct}%`,
                backgroundColor: recipe.availability_pct === 100 ? '#5FAE9B' : recipe.availability_pct >= 60 ? '#e5a100' : '#d1d5db',
              }}
            />
          </div>
          <span className="text-gray-500 flex-shrink-0">
            {recipe.available_products}/{recipe.total_products} in stock
            {missing > 0 && <span className="text-red-400"> · {missing} missing</span>}
          </span>
        </div>

        {/* Available products preview */}
        {avail.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {avail.slice(0, 3).map((p) => (
              <span key={p.id} className="text-[9px] text-[#5FAE9B] bg-[#5FAE9B]/8 border border-[#5FAE9B]/20 px-1.5 py-0.5 rounded-full font-medium truncate max-w-[100px]">
                ✓ {p.name}
              </span>
            ))}
            {avail.length > 3 && (
              <span className="text-[9px] text-gray-400">+{avail.length - 3}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-1 flex gap-2">
          <SmartBasketButton recipe={recipe} />
          <Link
            href={`/recipes/${recipe.slug}`}
            onClick={() => trackRecipeEvent(recipe.id, 'basket_click')}
            className="flex-shrink-0 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#5FAE9B', color: '#5FAE9B' }}
          >
            View
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RecipeSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-2.5 bg-gray-100 rounded w-1/2" />
        <div className="h-1.5 bg-gray-100 rounded-full" />
        <div className="h-8 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Category pills ───────────────────────────────────────────────────────────

function CategoryPills({
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
        className={`flex-none flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${active === null ? 'text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
        style={active === null ? { backgroundColor: '#0F2747' } : {}}
      >
        🍽️ All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(active === cat.slug ? null : cat.slug)}
          className={`flex-none flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${active === cat.slug ? 'text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
          style={active === cat.slug ? { backgroundColor: '#5FAE9B' } : {}}
        >
          {cat.emoji} {cat.name}
        </button>
      ))}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function CookToday({ compact = false }: { compact?: boolean }) {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load(catSlug: string | null) {
    setLoading(true)
    const data = await getRecipesWithAvailability({ limit: compact ? 4 : 12, categorySlug: catSlug })
    setRecipes(data)
    setLoading(false)
  }

  useEffect(() => {
    getRecipeCategories().then(setCategories)
    load(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCategory(slug: string | null) {
    setActiveCategory(slug)
    load(slug)
  }

  if (!loading && recipes.length === 0 && !activeCategory) return null

  return (
    <section className="py-8 md:py-12" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">👨‍🍳</span>
              <h2 className="text-xl md:text-2xl font-extrabold" style={{ color: '#0F2747' }}>
                Cook Today
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Recipes you can make with ingredients available right now
            </p>
          </div>
          <Link
            href="/recipes"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold hover:opacity-75 transition-opacity flex-shrink-0"
            style={{ color: '#5FAE9B' }}
          >
            All Recipes
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Category filter — only shown in full mode */}
        {!compact && categories.length > 0 && (
          <div className="mb-5">
            <CategoryPills categories={categories} active={activeCategory} onSelect={handleCategory} />
          </div>
        )}

        {/* Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}
            >
              {Array.from({ length: compact ? 4 : 8 }).map((_, i) => <RecipeSkeleton key={i} />)}
            </motion.div>
          ) : recipes.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-12 text-gray-400 text-sm"
            >
              No recipes in this category yet.
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}
            >
              {recipes.map((r, i) => <RecipeCard key={r.id} recipe={r} index={i} />)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <div className="mt-6 text-center">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm border transition-all hover:bg-white"
            style={{ borderColor: '#5FAE9B', color: '#5FAE9B' }}
          >
            Explore All Kerala Recipes
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
