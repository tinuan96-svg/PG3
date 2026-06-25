'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { StoreProductCard as ProductData } from '@/lib/stores'

interface Props {
  product: ProductData
  currencySymbol: string
  maxDisplayStock: number
  showStockLevels: boolean
}

const PLACEHOLDER =
  'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400'

function resolveImageUrl(raw: string | null): string {
  if (!raw) return PLACEHOLDER
  return raw
}

export default function StoreProductCard({
  product,
  currencySymbol,
  maxDisplayStock,
  showStockLevels,
}: Props) {
  const hasDiscount =
    product.original_price != null &&
    product.original_price > product.price &&
    product.discount_percentage > 0

  const displayStock = Math.min(product.stock, maxDisplayStock)
  const lowStock = product.stock > 0 && product.stock <= 5
  const image = resolveImageUrl(product.image_url)

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative h-44 sm:h-48 bg-gray-100 overflow-hidden">
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          unoptimized
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
        />

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{product.discount_percentage}%
          </div>
        )}

        {/* Tag badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {product.is_bestseller && (
            <span className="bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full leading-tight">
              Best Seller
            </span>
          )}
          {product.is_new_arrival && (
            <span className="bg-sky-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full leading-tight">
              New
            </span>
          )}
          {product.is_trending && (
            <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full leading-tight">
              Trending
            </span>
          )}
        </div>

        {/* Out of stock / pre-order overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              {product.allow_backorder ? 'Pre-order' : 'Out of Stock'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1">
        {/* Brand */}
        {product.brand && (
          <p className="text-[10px] font-bold uppercase tracking-wide truncate" style={{ color: '#5FAE9B' }}>
            {product.brand}
          </p>
        )}

        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-[#0F2747] transition-colors leading-snug min-h-[36px]">
          {product.name}
        </h3>

        {/* Weight */}
        {product.weight && (
          <p className="text-[11px] text-gray-400 font-medium">{product.weight}</p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <span className="text-base font-bold" style={{ color: '#0F2747' }}>
            {currencySymbol}{product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {currencySymbol}{product.original_price!.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock level */}
        {showStockLevels && product.in_stock && (
          <div className="flex items-center gap-1.5">
            {lowStock ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-xs text-amber-600 font-medium">
                  Only {displayStock} left
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-xs text-green-600">In Stock</span>
              </>
            )}
          </div>
        )}

        {product.is_deal && (
          <div className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full self-start">
            Deal
          </div>
        )}
      </div>
    </Link>
  )
}
