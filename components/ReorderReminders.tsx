'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any
import { addToCart } from '@/lib/cart'

const PLACEHOLDER = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'

interface Reminder {
  product_id: string
  name: string
  slug: string
  image: string | null
  price: number
  predicted_reorder_at: string
  days_until_reorder: number
  times_ordered: number
}

function urgencyLabel(days: number) {
  if (days <= 0) return { label: 'Order now', color: '#ef4444' }
  if (days <= 3) return { label: `${days}d left`, color: '#f97316' }
  if (days <= 7) return { label: `${days} days`, color: '#f59e0b' }
  return { label: `${days} days`, color: '#6b7280' }
}

export default function ReorderReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    db.rpc('get_my_reorder_reminders', { p_days_ahead: 14 }).then(({ data }: { data: unknown }) => {
      setReminders((data ?? []) as Reminder[])
      setLoading(false)
    })
  }, [])

  function handleAdd(r: Reminder) {
    addToCart({ product_id: r.product_id, product_name: r.name, unit_price: r.price, product_image: r.image || '', quantity: 1 })
    setAdded((prev) => ({ ...prev, [r.product_id]: true }))
    setTimeout(() => setAdded((prev) => ({ ...prev, [r.product_id]: false })), 2000)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (reminders.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-gray-800 text-base">Time to Reorder</h2>
          <p className="text-xs text-gray-400 mt-0.5">Based on your purchase history</p>
        </div>
        <span className="text-[10px] font-bold text-white px-2 py-1 rounded-full" style={{ backgroundColor: '#5FAE9B' }}>
          AI
        </span>
      </div>

      <div className="space-y-3">
        {reminders.map((r) => {
          const { label, color } = urgencyLabel(r.days_until_reorder)
          return (
            <motion.div key={r.product_id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                <Image src={r.image || PLACEHOLDER} alt={r.name} fill className="object-cover"
                  unoptimized onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }} />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${r.slug}`}
                  className="text-xs font-semibold text-gray-800 hover:text-[#5FAE9B] transition-colors line-clamp-1">
                  {r.name}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold" style={{ color }}>
                    {label}
                  </span>
                  <span className="text-[10px] text-gray-400">·</span>
                  <span className="text-[10px] text-gray-400">ordered {r.times_ordered}x</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-gray-700">£{Number(r.price).toFixed(2)}</span>
                <button onClick={() => handleAdd(r)}
                  className="w-7 h-7 rounded-full text-white text-sm font-bold transition-all active:scale-90"
                  style={{ backgroundColor: added[r.product_id] ? '#5FAE9B' : '#0F2747' }}>
                  {added[r.product_id] ? '✓' : '+'}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
