'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { addToCart } from '@/lib/cart'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

interface BundleProduct {
  id: string
  name: string
  slug: string
  image: string | null
  price: number
  unit?: string | null
  weight_grams?: number | null
}

interface BundleDetail {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  product_ids: string[]
  original_price: number
  bundle_price: number
  savings_amount: number
  coin_reward: number
  is_active: boolean
}

interface Props {
  slug: string
}

export default function BundleDetailClient({ slug }: Props) {
  const router = useRouter()
  const [bundle, setBundle] = useState<BundleDetail | null>(null)
  const [products, setProducts] = useState<BundleProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: b, error } = await db
        .from('product_bundles')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle()

      if (error || !b) {
        setLoading(false)
        return
      }
      setBundle(b)

      if (b.product_ids?.length > 0) {
        const { data: prods } = await db
          .from('products')
          .select('id, name, slug, image, price, unit, weight_grams')
          .in('id', b.product_ids)
        setProducts(prods ?? [])
      }
      setLoading(false)
    }
    load()
  }, [slug])

  function handleAddAll() {
    for (const p of products) {
      addToCart({
        product_id: p.id,
        product_name: p.name,
        product_image: p.image ?? undefined,
        unit_price: p.price,
        quantity: 1,
      })
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  const savingsPercentage = bundle
    ? Math.round((bundle.savings_amount / bundle.original_price) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#5FAE9B', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Bundle not found</h1>
        <p className="text-gray-500">This bundle may no longer be available.</p>
        <Link href="/bundles" className="text-sm font-semibold underline" style={{ color: '#5FAE9B' }}>Back to all bundles</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Hero card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="md:flex">
            {/* Image */}
            <div className="relative h-56 md:h-auto md:w-64 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #EBF4F1 0%, #D6EAE4 100%)' }}>
              {bundle.image_url ? (
                <Image src={bundle.image_url} alt={bundle.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-20 h-20" fill="none" stroke="#5FAE9B" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
              {/* Savings badge */}
              <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow">
                SAVE {savingsPercentage}%
              </div>
            </div>

            {/* Details */}
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{bundle.name}</h1>
                {bundle.description && (
                  <p className="text-gray-600 mb-5 leading-relaxed">{bundle.description}</p>
                )}

                {/* Pricing */}
                <div className="flex items-end gap-4 mb-2">
                  <span className="text-3xl font-bold" style={{ color: '#0F2747' }}>
                    £{Number(bundle.bundle_price).toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-400 line-through mb-0.5">
                    £{Number(bundle.original_price).toFixed(2)}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-2 rounded-xl mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  You save £{Number(bundle.savings_amount).toFixed(2)} on this bundle
                </div>

                {bundle.coin_reward > 0 && (
                  <p className="text-sm font-medium" style={{ color: '#5FAE9B' }}>
                    + {bundle.coin_reward} PocketCoins on purchase
                  </p>
                )}
              </div>

              <button
                onClick={handleAddAll}
                disabled={products.length === 0}
                className="mt-6 w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: added ? '#5FAE9B' : '#0F2747' }}
              >
                {added ? 'Added to Pocket!' : `Add All ${products.length} Items to Pocket`}
              </button>
            </div>
          </div>
        </div>

        {/* Products in bundle */}
        {products.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                What&apos;s in this bundle ({products.length} items)
              </h2>
            </div>
            <ul className="divide-y divide-gray-50">
              {products.map((product) => (
                <li key={product.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${product.slug}`} className="text-sm font-semibold text-gray-900 hover:underline line-clamp-1">
                      {product.name}
                    </Link>
                    {product.weight_grams && (
                      <p className="text-xs text-gray-400 mt-0.5">{product.weight_grams}g</p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                    £{Number(product.price).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
