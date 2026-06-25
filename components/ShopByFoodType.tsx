'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getFoodTypesWithCounts, type FoodType } from '@/lib/food-types'

const PLACEHOLDER = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'

// ─── Single collection card ───────────────────────────────────────────────────

function FoodTypeCard({ ft, index }: { ft: FoodType; index: number }) {
  // Pick up to 4 sample images for the collage
  const images = ft.sample_images.slice(0, 4)
  const hasImages = images.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/collections/${ft.slug}`} className="group block h-full">
        <div
          className="relative rounded-2xl overflow-hidden h-full transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1"
          style={{ backgroundColor: ft.bg_color }}
        >
          {/* Background image or collage */}
          {ft.banner_image ? (
            <div className="absolute inset-0">
              <Image
                src={ft.banner_image}
                alt={ft.name}
                fill
                className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                unoptimized
              />
            </div>
          ) : hasImages ? (
            <div className="absolute inset-0 grid grid-cols-2 gap-0.5 opacity-25 group-hover:opacity-35 transition-opacity duration-300">
              {images.map((src, i) => (
                <div key={i} className="relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content */}
          <div className="relative z-10 p-4 flex flex-col justify-between min-h-[160px] md:min-h-[200px]">
            {/* Top: emoji + count */}
            <div className="flex items-start justify-between">
              <motion.span
                className="text-3xl md:text-4xl leading-none drop-shadow-sm"
                whileHover={{ scale: 1.15, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {ft.emoji}
              </motion.span>
              {ft.product_count > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
                  style={{
                    backgroundColor: `${ft.accent_color}30`,
                    color: ft.accent_color,
                    border: `1px solid ${ft.accent_color}40`,
                  }}
                >
                  {ft.product_count} items
                </span>
              )}
            </div>

            {/* Bottom: name + description + CTA */}
            <div>
              <h3 className="text-white font-extrabold text-base md:text-lg leading-tight mb-0.5">
                {ft.name}
              </h3>
              <p className="text-white/60 text-[11px] leading-snug line-clamp-2 mb-3">
                {ft.description}
              </p>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all group-hover:gap-2.5"
                style={{
                  backgroundColor: ft.accent_color,
                  color: '#fff',
                }}
              >
                Shop Now
                <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="rounded-2xl bg-gray-200 animate-pulse min-h-[160px] md:min-h-[200px]" />
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ShopByFoodType() {
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getFoodTypesWithCounts().then((data) => {
      setFoodTypes(data.filter((ft) => ft.is_active && ft.show_on_homepage))
      setLoaded(true)
    })
  }, [])

  return (
    <section className="py-10 md:py-14" style={{ backgroundColor: '#0F2747' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: '#5FAE9B' }}>
              Curated collections
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              Shop By Food Type
            </h2>
            <p className="text-white/50 text-sm mt-1.5 max-w-sm">
              Discover products grouped the way you cook
            </p>
          </div>
          <Link
            href="/collections"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ color: '#5FAE9B' }}
          >
            View all
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {!loaded
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
            : foodTypes.map((ft, i) => (
                <FoodTypeCard key={ft.id} ft={ft} index={i} />
              ))}
        </div>

        {/* Bottom CTA strip */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/collections"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white border border-white/20 hover:bg-white/10 transition-all"
          >
            Browse All Collections
          </Link>
          <Link
            href="/products"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: '#5FAE9B', color: '#fff' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
