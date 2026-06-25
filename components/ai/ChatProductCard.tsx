'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ProductMatch } from '@/lib/ai-assistant'

interface Props {
  product: ProductMatch
  onAddToCart: (product: ProductMatch) => void
  compact?: boolean
}

export default function ChatProductCard({ product, onAddToCart, compact }: Props) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-2.5 hover:border-gray-200 transition-colors">
      <Link href={`/products/${product.slug}`} className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-50 shrink-0">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="56px"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.slug}`} className="block">
          <p className="text-xs font-semibold text-gray-800 line-clamp-1">{product.name}</p>
          {product.matchedIngredient && (
            <p className="text-[10px] mt-0.5" style={{ color: '#5FAE9B' }}>
              {product.matchedIngredient}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm font-bold" style={{ color: '#0F2747' }}>
              £{product.offer_price.toFixed(2)}
            </span>
            {product.price !== product.offer_price && (
              <span className="text-[10px] text-gray-400 line-through">
                £{product.price.toFixed(2)}
              </span>
            )}
          </div>
        </Link>
      </div>
      {!compact && (
        <button
          onClick={() => onAddToCart(product)}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-90"
          style={{ backgroundColor: '#5FAE9B' }}
          aria-label={`Add ${product.name} to cart`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  )
}
