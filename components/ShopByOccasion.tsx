'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getOccasionsWithCounts, type Occasion } from '@/lib/occasions'

const PLACEHOLDER = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'

function OccasionCard({ occ, index }: { occ: Occasion; index: number }) {
  const images = occ.sample_images.slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/occasions/${occ.slug}`} className="group block h-full">
        <div
          className="relative rounded-2xl overflow-hidden h-full transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1"
          style={{ backgroundColor: occ.bg_color, minHeight: 200 }}
        >
          {occ.banner_image ? (
            <div className="absolute inset-0">
              <Image
                src={occ.banner_image} alt={occ.name} fill
                className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized
              />
            </div>
          ) : images.length > 0 ? (
            <div className="absolute inset-0 grid grid-cols-2 gap-0.5 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
              {images.map((src, i) => (
                <div key={i} className="relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }} />
                </div>
              ))}
            </div>
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          <div className="relative z-10 p-4 flex flex-col justify-between min-h-[200px]">
            <div className="flex items-start justify-between">
              <motion.span
                className="text-4xl leading-none drop-shadow-sm"
                whileHover={{ scale: 1.15, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {occ.emoji}
              </motion.span>
              {occ.product_count > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
                  style={{
                    backgroundColor: `${occ.accent_color}30`,
                    color: occ.accent_color,
                    border: `1px solid ${occ.accent_color}50`,
                  }}
                >
                  {occ.product_count} items
                </span>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-white font-extrabold text-base md:text-lg leading-tight mb-0.5">
                {occ.name}
              </h3>
              <p className="text-white/60 text-[11px] leading-snug line-clamp-2 mb-3">
                {occ.description}
              </p>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all group-hover:gap-2.5"
                style={{ backgroundColor: occ.accent_color, color: '#fff' }}
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

function Skeleton() {
  return <div className="rounded-2xl bg-gray-700/40 animate-pulse min-h-[200px]" />
}

export default function ShopByOccasion() {
  const [occasions, setOccasions] = useState<Occasion[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getOccasionsWithCounts(true).then((data) => {
      setOccasions(data)
      setLoaded(true)
    })
  }, [])

  return (
    <section className="py-10 md:py-14" style={{ backgroundColor: '#0A1929' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: '#FB923C' }}>
              Occasion shopping
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              Shop By Occasion
            </h2>
            <p className="text-white/50 text-sm mt-1.5 max-w-sm">
              One-click baskets for every celebration and meal
            </p>
          </div>
          <Link
            href="/occasions"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ color: '#FB923C' }}
          >
            All occasions
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {!loaded
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
            : occasions.map((occ, i) => (
                <OccasionCard key={occ.id} occ={occ} index={i} />
              ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/occasions"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white border border-white/20 hover:bg-white/10 transition-all"
          >
            Browse All Occasions
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
