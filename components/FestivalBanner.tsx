'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { getActiveFestivalCampaigns, type FestivalCampaign } from '@/lib/occasions'

function daysRemaining(endsAt: string): number {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000))
}

export default function FestivalBanner() {
  const [campaigns, setCampaigns] = useState<FestivalCampaign[]>([])
  const [idx, setIdx] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getActiveFestivalCampaigns().then((data) => {
      setCampaigns(data)
      setLoaded(true)
    })
  }, [])

  // Auto-rotate
  useEffect(() => {
    if (campaigns.length <= 1) return
    const t = setInterval(() => setIdx((i) => (i + 1) % campaigns.length), 5000)
    return () => clearInterval(t)
  }, [campaigns.length])

  if (!loaded || campaigns.length === 0) return null

  const c = campaigns[idx]
  const days = daysRemaining(c.ends_at)

  return (
    <div className="w-full overflow-hidden" style={{ backgroundColor: c.bg_color }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {c.banner_image && (
            <div className="absolute inset-0">
              <Image src={c.banner_image} alt={c.name} fill className="object-cover opacity-15" unoptimized />
            </div>
          )}
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl flex-shrink-0">{c.emoji}</span>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight truncate">{c.name}</p>
                <p className="text-white/70 text-[11px] truncate">{c.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {days <= 7 && days > 0 && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white border border-white/30">
                  {days}d left
                </span>
              )}
              {c.banner_link && (
                <Link href={c.banner_link}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: c.accent_color }}>
                  Shop Now →
                </Link>
              )}
              {campaigns.length > 1 && (
                <div className="flex gap-1 ml-1">
                  {campaigns.map((_, i) => (
                    <button key={i} onClick={() => setIdx(i)}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{ backgroundColor: i === idx ? c.accent_color : 'rgba(255,255,255,0.3)' }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
