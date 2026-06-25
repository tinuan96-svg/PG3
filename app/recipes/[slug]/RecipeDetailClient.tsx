'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getRecipeDetail,
  trackRecipeEvent,
  availableProducts,
  missingProducts,
  totalBasketValue,
  type RecipeDetail,
  type MatchedProduct,
} from '@/lib/recipes'
import { addToCart } from '@/lib/cart'

const PLACEHOLDER = 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800'

// ─── Availability arc ─────────────────────────────────────────────────────────

function AvailArc({ pct }: { pct: number }) {
  const r = 36, circ = 2 * Math.PI * r
  const color = pct === 100 ? '#5FAE9B' : pct >= 60 ? '#e5a100' : '#d1d5db'
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="-rotate-90 absolute inset-0" width={96} height={96} viewBox="0 0 96 96">
        <circle cx={48} cy={48} r={r} fill="none" stroke="#f3f4f6" strokeWidth={7} />
        <circle
          cx={48} cy={48} r={r} fill="none"
          stroke={color} strokeWidth={7}
          strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center">
        <p className="text-xl font-extrabold leading-none" style={{ color }}>{pct}%</p>
        <p className="text-[9px] text-gray-400 font-medium">available</p>
      </div>
    </div>
  )
}

// ─── Smart Basket panel ───────────────────────────────────────────────────────

function SmartBasket({ recipe }: { recipe: RecipeDetail }) {
  const [state, setState] = useState<'idle' | 'added'>('idle')
  const avail = availableProducts(recipe)
  const missing = missingProducts(recipe)
  const total = totalBasketValue(avail)

  function handleAddAvailable() {
    if (!avail.length) return
    avail.forEach((p) => addToCart({
      product_id: p.id,
      product_name: p.name,
      product_image: p.image ?? undefined,
      unit_price: Number(p.price),
    }))
    trackRecipeEvent(recipe.id, 'add_to_pocket')
    setState('added')
    setTimeout(() => setState('idle'), 2400)
  }

  function handleAddSingle(p: MatchedProduct) {
    addToCart({ product_id: p.id, product_name: p.name, product_image: p.image ?? undefined, unit_price: Number(p.price) })
    trackRecipeEvent(recipe.id, 'basket_click')
  }

  if (recipe.total_products === 0) return null

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0F2747, #1a3a6b)' }}>
        <div>
          <p className="text-white font-bold text-sm">Smart Basket</p>
          <p className="text-white/60 text-xs mt-0.5">
            {avail.length} of {recipe.total_products} ingredients in stock
          </p>
        </div>
        <AvailArc pct={recipe.availability_pct} />
      </div>

      {/* Available products */}
      {avail.length > 0 && (
        <div className="px-4 pt-4 pb-2 space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Available in store</p>
          {avail.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-1.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${p.slug}`} className="text-xs font-medium text-gray-800 hover:text-[#5FAE9B] transition-colors truncate block">
                  {p.name}
                </Link>
                <p className="text-[10px] text-gray-400">£{Number(p.price).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[9px] text-[#5FAE9B] font-bold">✓ In Stock</span>
                <button
                  onClick={() => handleAddSingle(p)}
                  className="text-[9px] font-bold px-2 py-1 rounded-lg text-white transition-colors"
                  style={{ backgroundColor: '#5FAE9B' }}
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Missing products */}
      {missing.length > 0 && (
        <div className="px-4 py-2 space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Currently unavailable</p>
          {missing.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-1 opacity-50">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex-shrink-0" />
              <span className="text-xs text-gray-500 flex-1 truncate">{p.name}</span>
              <span className="text-[9px] text-red-400 font-bold flex-shrink-0">✗ Out of stock</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="px-4 pb-4 pt-2">
        <motion.button
          onClick={handleAddAvailable}
          disabled={!avail.length}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-40"
          style={{ background: state === 'added' ? '#5FAE9B' : 'linear-gradient(135deg, #0F2747, #1a3a6b)' }}
        >
          {state === 'added' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Added {avail.length} ingredient{avail.length !== 1 ? 's' : ''}!
            </span>
          ) : (
            <span>
              Add {avail.length > 0 ? `${avail.length} Ingredients to Pocket` : 'Available Ingredients'}
              {total > 0 && ` · £${total.toFixed(2)}`}
            </span>
          )}
        </motion.button>
        {missing.length > 0 && (
          <p className="text-center text-[10px] text-gray-400 mt-2">
            {missing.length} ingredient{missing.length !== 1 ? 's' : ''} unavailable — we&apos;ll add them when back in stock
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RecipeDetailClient({ initialRecipe, slug }: { initialRecipe: any; slug: string }) {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(initialRecipe)
  const [loading, setLoading] = useState(!initialRecipe)

  useEffect(() => {
    if (recipe?.id) {
      trackRecipeEvent(recipe.id, 'view')
    }
  }, [recipe?.id])

  useEffect(() => {
    if (!initialRecipe) {
      getRecipeDetail(slug).then((r) => { setRecipe(r); setLoading(false) })
    }
  }, [slug, initialRecipe])

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="h-72 bg-gray-200 animate-pulse" />
        <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="text-center">
          <p className="text-4xl mb-4">🍽️</p>
          <h1 className="text-xl font-bold text-gray-700 mb-2">Recipe Not Found</h1>
          <p className="text-gray-400 text-sm mb-6">This recipe may have been removed or is not yet published.</p>
          <Link href="/recipes" className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: '#0F2747' }}>
            Browse Recipes
          </Link>
        </div>
      </div>
    )
  }

  const totalMins = (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)
  const diffColor = recipe.difficulty?.toLowerCase() === 'easy' ? '#5FAE9B'
    : recipe.difficulty?.toLowerCase() === 'medium' ? '#e5a100'
    : recipe.difficulty ? '#e55c5c' : '#9ca3af'

  // Parse instructions into steps
  const steps = (recipe.instructions ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  // Schema.org Recipe markup
  const recipeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.excerpt,
    image: recipe.featured_image,
    prepTime: recipe.prep_time_mins ? `PT${recipe.prep_time_mins}M` : undefined,
    cookTime: recipe.cook_time_mins ? `PT${recipe.cook_time_mins}M` : undefined,
    recipeYield: recipe.servings ? `${recipe.servings} servings` : undefined,
    recipeCategory: recipe.category_name ?? 'Kerala Recipe',
    recipeIngredient: recipe.ingredients.map((i) => `${i.quantity} ${i.unit} ${i.name}`.trim()),
    recipeInstructions: steps.map((s, idx) => ({ '@type': 'HowToStep', position: idx + 1, text: s })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeSchema) }} />

      {/* Hero banner */}
      <div className="relative h-64 md:h-80 bg-gray-800 overflow-hidden">
        <Image
          src={recipe.featured_image || PLACEHOLDER}
          alt={recipe.title}
          fill
          className="object-cover opacity-70"
          sizes="100vw"
          unoptimized
          priority
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/60 text-xs mb-3">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/recipes" className="hover:text-white transition-colors">Recipes</Link>
            <span>/</span>
            <span className="text-white">{recipe.title}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {recipe.category_emoji && recipe.category_name && (
              <span className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                {recipe.category_emoji} {recipe.category_name}
              </span>
            )}
            {recipe.difficulty && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full text-white capitalize" style={{ backgroundColor: diffColor }}>
                {recipe.difficulty}
              </span>
            )}
            <span
              className="text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: recipe.availability_pct === 100 ? '#5FAE9B' : recipe.availability_pct >= 60 ? '#e5a100' : '#9ca3af' }}
            >
              {recipe.availability_pct}% in stock
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">{recipe.title}</h1>

          {/* Meta strip */}
          <div className="flex items-center gap-4 mt-3 text-xs text-white/70">
            {recipe.prep_time_mins && <span>🧑‍🍳 Prep {recipe.prep_time_mins}m</span>}
            {recipe.cook_time_mins && <span>🔥 Cook {recipe.cook_time_mins}m</span>}
            {totalMins > 0 && <span>⏱ Total {totalMins}m</span>}
            {recipe.servings && <span>🍽 Serves {recipe.servings}</span>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left: description + ingredients + instructions */}
          <div className="lg:col-span-2 space-y-6">
            {recipe.excerpt && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-gray-600 text-sm leading-relaxed">{recipe.excerpt}</p>
              </div>
            )}

            {/* Ingredients list */}
            {recipe.ingredients.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold mb-4" style={{ color: '#0F2747' }}>
                  Ingredients
                  <span className="ml-2 text-xs font-normal text-gray-400">({recipe.ingredients.length} items)</span>
                </h2>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ing, i) => (
                    <motion.li
                      key={ing.id || i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3"
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: ing.is_optional ? '#d1d5db' : '#5FAE9B' }} />
                      <span className="text-sm text-gray-700 flex-1">
                        {ing.quantity && <span className="font-semibold text-gray-900 mr-1">{ing.quantity}</span>}
                        {ing.unit && <span className="text-gray-500 mr-1">{ing.unit}</span>}
                        {ing.name}
                        {ing.is_optional && <span className="ml-1.5 text-[9px] text-gray-400 font-medium">(optional)</span>}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            {steps.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold mb-4" style={{ color: '#0F2747' }}>Instructions</h2>
                <ol className="space-y-4">
                  {steps.map((step, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-3"
                    >
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                        style={{ backgroundColor: '#0F2747' }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed flex-1">{step}</p>
                    </motion.li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Right: Smart Basket + tags */}
          <div className="space-y-5 lg:sticky lg:top-20 self-start">
            <SmartBasket recipe={recipe} />

            {/* Tags */}
            {recipe.tags.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {recipe.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Back link */}
            <Link
              href="/recipes"
              className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-75"
              style={{ color: '#5FAE9B' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              All Recipes
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
