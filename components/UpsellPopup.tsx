'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { addToCart } from '@/lib/cart'

interface Product {
  id: string
  name: string
  slug: string
  images: string[]
  price: number
  sale_price: number | null
  coin_reward: number
}

interface UpsellPopupProps {
  productId: string
  productName: string
  onAddToCart?: (productId: string) => void
}

export default function UpsellPopup({
  productId,
  productName,
  onAddToCart
}: UpsellPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchRecommendations()
    setIsVisible(true)

    trackView()
  }, [productId])

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/cross-sell?productId=${productId}&type=upsell`)
      const data = await response.json()
      setRecommendations(data.products?.slice(0, 3) || [])
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const trackView = async () => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'upsell_view',
          product_id: productId,
        }),
      })
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const handleAddToCart = async (recommendedProduct: Product) => {
    addToCart({
      product_id: recommendedProduct.id,
      product_name: recommendedProduct.name,
      product_image: recommendedProduct.images?.[0] || '',
      unit_price: recommendedProduct.sale_price || recommendedProduct.price,
    })

    setAddedItems(prev => new Set(prev).add(recommendedProduct.id))

    if (onAddToCart) onAddToCart(recommendedProduct.id)

    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'upsell_purchase',
        product_id: productId,
        revenue_impact: recommendedProduct.sale_price || recommendedProduct.price,
        metadata: { recommended_product_id: recommendedProduct.id },
      }),
    })
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible || loading || recommendations.length === 0) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
        <div className="sticky top-0 z-10 bg-white p-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold" style={{ color: '#0F2747' }}>Added to Cart!</h2>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 font-medium px-1">
            People who bought <span className="text-gray-900 font-bold">"{productName}"</span> also loved these:
          </p>
        </div>

        <div className="p-6 pt-2">
          <div className="space-y-3">
            {recommendations.map(product => {
              const displayPrice = product.sale_price || product.price
              const isAdded = addedItems.has(product.id)

              return (
                <div
                  key={product.id}
                  className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-[#5FAE9B] hover:bg-white transition-all group"
                >
                  <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded-xl overflow-hidden border border-gray-100">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold" style={{ color: '#0F2747' }}>
                        £{Number(displayPrice).toFixed(2)}
                      </span>
                      {product.sale_price && (
                        <span className="text-xs text-gray-400 line-through">
                          £{Number(product.price).toFixed(2)}
                        </span>
                      )}
                      {product.coin_reward > 0 && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-100">
                          🪙 {product.coin_reward}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={isAdded}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                      isAdded
                        ? 'bg-green-500 text-white cursor-default'
                        : 'bg-[#0F2747] text-white hover:opacity-90 active:scale-95'
                    }`}
                  >
                    {isAdded ? 'Added' : 'Add'}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-4 rounded-xl font-bold text-sm bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
            >
              Continue Shopping
            </button>
            <a
              href="/cart"
              className="flex-1 py-4 rounded-xl font-bold text-sm text-white text-center transition-all hover:opacity-90 shadow-lg shadow-emerald-100"
              style={{ backgroundColor: '#5FAE9B' }}
            >
              Go to Cart
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
