'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { addToCart } from '@/lib/cart'
import { usePocket } from '@/lib/pocket-context'

const PLACEHOLDER = 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  offer_price?: number | null
  images?: string[]
  image_url?: string
  brand?: string
  category?: string
  coin_reward?: number
  stock_status?: string
  weight?: string
  // badge flags
  bestSeller?: boolean
  newArrival?: boolean
  communityFavorite?: boolean
  trending?: boolean
  is_bestseller?: boolean
  is_new_arrival?: boolean
  is_deal?: boolean
}

function getImage(product: Product): string {
  const fromArray = (product.images ?? []).find(Boolean)
  return fromArray ?? product.image_url ?? PLACEHOLDER
}

type BadgeVariant = 'bestseller' | 'new' | 'kerala' | 'offer' | 'trending'

interface BadgeProps { variant: BadgeVariant }

const BADGE_STYLES: Record<BadgeVariant, { label: string; bg: string; text: string }> = {
  bestseller: { label: 'Best Seller',       bg: '#fef3c7', text: '#92400e' },
  new:        { label: 'New Arrival',        bg: '#dbeafe', text: '#1e40af' },
  kerala:     { label: 'Kerala Favourite',   bg: '#dcfce7', text: '#166534' },
  offer:      { label: 'On Offer',           bg: '#fee2e2', text: '#991b1b' },
  trending:   { label: 'Trending',           bg: '#ffedd5', text: '#9a3412' },
}

function Badge({ variant }: BadgeProps) {
  const s = BADGE_STYLES[variant]
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

export default function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const { triggerFly } = usePocket()

  const isOutOfStock = product.stock_status === 'outofstock' || product.stock_status === 'out_of_stock'

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (isOutOfStock) return
    addToCart({
      product_id: product.id,
      product_name: product.name,
      product_image: getImage(product),
      unit_price: product.offer_price ?? product.price,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)

    const img = getImage(product)
    if (img && btnRef.current) {
      triggerFly({ imageUrl: img, originRect: btnRef.current.getBoundingClientRect() })
    }
  }

  const displayPrice = product.offer_price != null && product.offer_price > 0 && product.offer_price < product.price
    ? product.offer_price
    : product.price

  const hasDiscount = product.offer_price != null && product.offer_price > 0 && product.offer_price < product.price
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.offer_price!) / product.price) * 100)
    : 0

  const isBestSeller = product.bestSeller || product.is_bestseller
  const isNew = product.newArrival || product.is_new_arrival
  const isKerala = product.communityFavorite
  const isOffer = hasDiscount && (product.is_deal || discountPct >= 10)
  const isTrending = product.trending

  const imageUrl = getImage(product)

  return (
    <Link
      href={`/products/${product.slug}`}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200 group flex flex-col"
    >
      {/* Image */}
      <div className="relative w-full bg-gray-50 overflow-hidden" style={{ paddingBottom: '100%' }}>
        <Image
          src={imageUrl}
          alt={`${product.name} - Kerala grocery UK delivery`}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
        />

        {/* Discount badge */}
        {discountPct > 0 && (
          <span className="absolute top-2 left-2 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#5FAE9B' }}>
            -{discountPct}%
          </span>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3">
        {/* Brand */}
        {product.brand && (
          <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5 truncate" style={{ color: '#5FAE9B' }}>
            {product.brand}
          </p>
        )}

        {/* Product name */}
        <h3 className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug mb-1 flex-1 group-hover:opacity-80 transition-opacity min-h-[36px]">
          {product.name || 'Unnamed Product'}
        </h3>

        {/* Weight / pack size */}
        {product.weight && (
          <p className="text-[11px] text-gray-400 font-medium mb-2">{product.weight}</p>
        )}

        {/* Badges */}
        {(isBestSeller || isNew || isKerala || isOffer || isTrending) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {isBestSeller && <Badge variant="bestseller" />}
            {isNew       && <Badge variant="new" />}
            {isKerala    && <Badge variant="kerala" />}
            {isOffer     && !isBestSeller && <Badge variant="offer" />}
            {isTrending  && !isBestSeller && !isNew && <Badge variant="trending" />}
          </div>
        )}

        {/* Price row */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-base font-extrabold" style={{ color: '#0F2747' }}>
            £{displayPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-gray-400 line-through">£{product.price.toFixed(2)}</span>
          )}
        </div>

        {/* Stock status row */}
        {!isOutOfStock && (
          <p className="text-[10px] font-medium mb-2" style={{ color: '#5FAE9B' }}>
            In Stock
          </p>
        )}

        {/* Coin reward */}
        {product.coin_reward != null && product.coin_reward > 0 && (
          <p className="text-[10px] font-medium mb-2" style={{ color: '#5FAE9B' }}>
            +{product.coin_reward} coins
          </p>
        )}

        {/* Add to Cart */}
        <button
          ref={btnRef}
          className="mt-auto w-full py-2 rounded-xl text-white text-xs font-bold transition-all active:scale-95"
          style={{ backgroundColor: added ? '#5FAE9B' : '#0F2747' }}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          {added ? 'Added to Pocket!' : isOutOfStock ? 'Out of Stock' : 'Add to Pocket'}
        </button>
      </div>
    </Link>
  )
}
