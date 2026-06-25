'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { addToCart } from '@/lib/cart'

interface Product {
  id: string
  name: string
  slug: string
  images: string[]
  price: number
  sale_price: number | null
  coin_reward: number
  brand?: string
}

interface CrossSellSectionProps {
  productId: string
  title?: string
  type?: 'frequently_bought' | 'you_may_like' | 'upsell'
}

const PLACEHOLDER = 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400'

export default function CrossSellSection({
  productId,
  title = 'Frequently Bought Together',
  type = 'frequently_bought'
}: CrossSellSectionProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCrossSellProducts()
  }, [productId])

  const fetchCrossSellProducts = async () => {
    try {
      const response = await fetch(`/api/cross-sell?productId=${productId}&type=${type}`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching cross-sell products:', error)
    } finally {
      setLoading(false)
    }
  }

  const trackClick = async (recommendedProductId: string) => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'cross_sell_click',
          product_id: productId,
          metadata: { recommended_product_id: recommendedProductId },
        }),
      })
    } catch (error) {
      console.error('Error tracking click:', error)
    }
  }

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()

    addToCart({
      product_id: product.id,
      product_name: product.name,
      product_image: product.images?.[0] || '',
      unit_price: product.sale_price || product.price,
    })

    setAddedItems(prev => new Set(prev).add(product.id))

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'cross_sell_purchase',
        product_id: productId,
        revenue_impact: product.sale_price || product.price,
        metadata: { recommended_product_id: product.id },
      }),
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse mb-6">
        <div className="h-4 bg-gray-100 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-gray-100 rounded-xl"></div>
              <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold" style={{ color: '#0F2747' }}>{title}</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {products.map(product => {
            const displayPrice = product.sale_price || product.price
            const hasDiscount = product.sale_price != null && product.sale_price < product.price
            const isAdded = addedItems.has(product.id)

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                onClick={() => trackClick(product.id)}
                className="group flex flex-col"
              >
                <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-3 group-hover:shadow-md transition-all duration-300">
                  <Image
                    src={product.images?.[0] || PLACEHOLDER}
                    alt={product.name}
                    fill
                    className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                    unoptimized
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
                  />
                  {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      OFF
                    </div>
                  )}
                  {product.coin_reward > 0 && (
                    <div className="absolute bottom-2 left-2 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                      <span>🪙</span>
                      <span>{product.coin_reward}</span>
                    </div>
                  )}

                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={isAdded}
                    className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                      isAdded
                        ? 'bg-green-500 text-white'
                        : 'bg-[#0F2747] text-white hover:bg-[#5FAE9B]'
                    }`}
                  >
                    {isAdded ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="flex-1">
                  {product.brand && (
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{product.brand}</p>
                  )}
                  <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-[#5FAE9B] transition-colors mb-1.5">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold" style={{ color: '#0F2747' }}>
                      £{Number(displayPrice).toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-gray-400 line-through">
                        £{Number(product.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
