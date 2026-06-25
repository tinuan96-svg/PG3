'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type Recipe = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  prep_time_mins: number | null
  cook_time_mins: number | null
  servings: number | null
  difficulty: string | null
  show_on_homepage: boolean
  is_featured: boolean
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const totalMins = (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)
  const timeLabel = totalMins > 0 ? `${totalMins} min` : null
  const diff = recipe.difficulty
  const diffColor = diff === 'Easy' ? '#5FAE9B' : diff === 'Medium' ? '#e5a100' : diff === 'Hard' ? '#e55c5c' : '#9CA3AF'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {recipe.featured_image ? (
          <Image
            src={recipe.featured_image}
            alt={recipe.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-3 right-3 flex gap-1.5">
          {timeLabel && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-700">
              {timeLabel}
            </span>
          )}
          {diff && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: diffColor }}>
              {diff}
            </span>
          )}
        </div>
        {recipe.servings && (
          <div className="absolute bottom-3 left-3">
            <span className="text-[10px] font-semibold text-white/80">Serves {recipe.servings}</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-base mb-1" style={{ color: '#0F2747' }}>{recipe.title}</h3>
        {recipe.excerpt && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{recipe.excerpt}</p>
        )}
        <div className="mt-auto">
          <Link
            href={`/blog/${recipe.slug}`}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#5FAE9B', color: '#5FAE9B' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            View Recipe
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CookAndShop() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('recipes')
      .select('id,title,slug,excerpt,featured_image,prep_time_mins,cook_time_mins,servings,difficulty,show_on_homepage,is_featured')
      .eq('show_on_homepage', true)
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .limit(4)
      .then(({ data }: { data: Recipe[] | null }) => {
        setRecipes(data ?? [])
        setLoaded(true)
      })
  }, [])

  if (loaded && recipes.length === 0) return null
  if (!loaded) return null

  return (
    <section className="py-8 md:py-10" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#0F2747' }}>Cook & Shop</h2>
            <p className="text-sm text-gray-500 mt-0.5">Authentic Kerala recipes — discover and cook with our ingredients</p>
          </div>
          <Link
            href="/recipes"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold hover:opacity-75 transition-opacity"
            style={{ color: '#5FAE9B' }}
          >
            All Recipes
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border font-semibold text-sm transition-all hover:bg-white"
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
