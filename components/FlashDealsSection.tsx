'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type FlashDeal = {
  id: string
  name: string
  slug: string
  price: number
  deal_price: number
  deal_ends_at: string | null
  processed_image_url: string | null
  image: string | null
  compare_price: number | null
}

function Countdown({ endsAt }: { endsAt: string | null }) {
  const [remaining, setRemaining] = useState(() => {
    if (!endsAt) return 0
    return Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000))
  })

  useEffect(() => {
    if (remaining <= 0) return
    const interval = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(interval)
  }, [remaining])

  if (remaining <= 0) return <span className="font-mono font-bold text-sm">Expired</span>

  const h = Math.floor(remaining / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = remaining % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  return <span className="font-mono font-bold text-sm">{pad(h)}:{pad(m)}:{pad(s)}</span>
}

export default function FlashDealsSection() {
  const [deals, setDeals] = useState<FlashDeal[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('products')
      .select('id,name,slug,price,deal_price,deal_ends_at,processed_image_url,image,compare_price')
      .eq('is_flash_deal', true)
      .eq('approval_status', 'approved')
      .order('deal_ends_at', { ascending: true })
      .limit(6)
      .then(({ data }: { data: FlashDeal[] | null }) => {
        setDeals(data ?? [])
        setLoaded(true)
      })
  }, [])

  if (loaded && deals.length === 0) return null

  if (!loaded) return null

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5FAE9B' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#0F2747' }}>Flash Deals</h2>
            </div>
            <span className="text-xs px-3 py-1 rounded-full text-white font-medium" style={{ backgroundColor: '#5FAE9B' }}>
              Limited Time
            </span>
          </div>
          <Link href="/products" className="text-sm font-medium hover:opacity-75 transition-opacity" style={{ color: '#5FAE9B' }}>
            All Deals &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((deal) => {
            const originalPrice = deal.compare_price ?? deal.price
            const dealPrice = deal.deal_price ?? deal.price
            const discount = originalPrice > dealPrice
              ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
              : 0
            const imageUrl = deal.processed_image_url ?? deal.image ?? ''

            return (
              <Link
                key={deal.id}
                href={`/products/${deal.slug}`}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group"
              >
                <div className="relative h-40 bg-gray-50">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={deal.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: '#5FAE9B' }}>
                      -{discount}% OFF
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-gray-800 mb-2 line-clamp-1">{deal.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold" style={{ color: '#0F2747' }}>£{dealPrice.toFixed(2)}</span>
                    {originalPrice > dealPrice && (
                      <span className="text-sm text-gray-400 line-through">£{originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                  {deal.deal_ends_at && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Ends in:</span>
                      <span style={{ color: '#5FAE9B' }}><Countdown endsAt={deal.deal_ends_at} /></span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
