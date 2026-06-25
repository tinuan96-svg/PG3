'use client'

import { useRef, useState } from 'react'
import { addToCart, type CartItem } from '@/lib/cart'
import { usePush } from '@/lib/push-context'
import { useAuth } from '@/lib/auth-context'
import { usePocket } from '@/lib/pocket-context'

// ─── Product detail page variant (full-width, large) ─────────────────────────

interface DetailProps {
  productId: string
  productName: string
  productImage?: string
  price: number
  inStock: boolean
}

export default function AddToCartButton({ productId, productName, productImage, price, inStock }: DetailProps) {
  const [added, setAdded] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const { triggerPermission } = usePush()
  const { user } = useAuth()
  const { triggerFly } = usePocket()

  function handleAdd() {
    if (!inStock) return
    addToCart({ product_id: productId, product_name: productName, product_image: productImage, unit_price: price })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)

    if (productImage && btnRef.current) {
      triggerFly({ imageUrl: productImage, originRect: btnRef.current.getBoundingClientRect() })
    }

    if (user) triggerPermission(user.id)
  }

  return (
    <button
      ref={btnRef}
      onClick={handleAdd}
      disabled={!inStock}
      className="w-full py-4 rounded-xl text-white font-bold text-base transition-all active:scale-[0.98] mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ backgroundColor: added ? '#5FAE9B' : '#0F2747' }}
    >
      {added ? 'Added to Pocket!' : inStock ? 'Add to Pocket' : 'Out of Stock'}
    </button>
  )
}

// ─── Inline variant (used by product cards) ───────────────────────────────────

interface InlineProps {
  item: Omit<CartItem, 'quantity'> & { quantity?: number }
  variant?: 'full' | 'icon' | 'pill'
  className?: string
  disabled?: boolean
}

export function InlineAddToCartButton({ item, variant = 'full', className = '', disabled = false }: InlineProps) {
  const [added, setAdded] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const { triggerFly } = usePocket()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (disabled || added) return

    addToCart(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)

    if (item.product_image && btnRef.current) {
      triggerFly({ imageUrl: item.product_image, originRect: btnRef.current.getBoundingClientRect() })
    }
  }

  if (variant === 'icon') {
    return (
      <button
        ref={btnRef}
        onClick={handleClick}
        disabled={disabled}
        className={`w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all active:scale-90 flex-none ${className}`}
        style={{ backgroundColor: added ? '#5FAE9B' : '#0F2747' }}
        aria-label={added ? 'Added' : 'Add to pocket'}
      >
        {added ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>
    )
  }

  // Default: full-width
  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      disabled={disabled}
      className={`w-full py-2 rounded-xl text-white text-xs font-bold transition-all active:scale-95 ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      style={{ backgroundColor: added ? '#5FAE9B' : '#0F2747' }}
    >
      {added ? 'Added!' : disabled ? 'Out of Stock' : 'Add to Pocket'}
    </button>
  )
}
