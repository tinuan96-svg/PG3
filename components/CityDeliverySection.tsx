'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type DeliveryRegion = {
  id: string
  name: string
  description: string
  href: string
  display_order: number
  is_active: boolean
}

export default function CityDeliverySection() {
  const [regions, setRegions] = useState<DeliveryRegion[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('delivery_regions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .then(({ data }: { data: DeliveryRegion[] | null }) => {
        setRegions(data ?? [])
        setLoaded(true)
      })
  }, [])

  if (loaded && regions.length === 0) return null
  if (!loaded) return null

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#0F2747' }}>
            Kerala Groceries Delivered Across the UK
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Order before 4 PM for next day delivery to any UK address. Authentic Kerala groceries
            at your door, wherever you are.
          </p>
        </div>
        <div className={`grid gap-3 ${regions.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : regions.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}>
          {regions.map((region) => (
            <Link
              key={region.id}
              href={region.href || '/products'}
              className="bg-white rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 border border-gray-100 group"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-sm font-bold group-hover:scale-105 transition-transform"
                style={{ backgroundColor: '#0F2747' }}
              >
                {region.name.slice(0, 2).toUpperCase()}
              </div>
              <p className="font-semibold text-sm mb-0.5" style={{ color: '#0F2747' }}>{region.name}</p>
              {region.description && (
                <p className="text-xs text-gray-400">{region.description}</p>
              )}
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: '#0F2747' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Order by 4 PM today for next day delivery
          </div>
        </div>
      </div>
    </section>
  )
}
