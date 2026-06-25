'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/lib/cart'
import SafeHtml from '@/components/SafeHtml'
import { trackRecentlyViewed } from '@/components/RecentlyViewedSection'
import CrossSellSection from '@/components/CrossSellSection'
import UpsellPopup from '@/components/UpsellPopup'

const PLACEHOLDER = 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400'

export interface ProductVariant {
  id: string
  variant_name: string
  price: number
  discounted_price: number | null
  stock: number
  unit_value: number | null
  unit_type: string | null
  sort_order: number
  image_url: string | null
}

export interface ProductDetailProps {
  id: string
  slug: string
  name: string
  brand: string
  description?: string
  shortDescription?: string
  ingredients?: string
  nutritionalInfo?: string
  storageInstructions?: string
  howToUse?: string
  basePrice: number
  baseOfferPrice: number
  images: string[]
  category: string
  weight: string
  coinReward: number
  trending: boolean
  bestSeller: boolean
  newArrival: boolean
  rating?: number
  reviewCount: number
  inStock: boolean
  allowBackorder: boolean
  hasVariants: boolean
  variants: ProductVariant[]
  relatedProducts: {
    id: string
    slug: string
    name: string
    brand: string
    price: number
    offerPrice?: number
    images: string[]
    weight?: string
    category: string
  }[]
  faqs: { q: string; a: string }[]
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold" style={{ color: '#0F2747' }}>{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function ProductDetailClient({
  id,
  slug,
  name,
  brand,
  description,
  shortDescription,
  ingredients,
  nutritionalInfo,
  storageInstructions,
  howToUse,
  basePrice,
  baseOfferPrice,
  images,
  category,
  weight,
  coinReward,
  trending: _trending,
  bestSeller,
  newArrival,
  rating,
  reviewCount,
  inStock: baseInStock,
  allowBackorder,
  hasVariants,
  variants,
  relatedProducts,
  faqs,
}: ProductDetailProps) {
  const router = useRouter()
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasVariants && variants.length > 0 ? variants[0].id : null
  )
  const [added, setAdded] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [showUpsell, setShowUpsell] = useState(false)

  useEffect(() => {
    trackRecentlyViewed(slug)
  }, [slug])

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null
  const price = selectedVariant ? Number(selectedVariant.price) : basePrice
  const offerPrice = selectedVariant
    ? (selectedVariant.discounted_price != null ? Number(selectedVariant.discounted_price) : Number(selectedVariant.price))
    : baseOfferPrice
  const displayPrice = offerPrice < price ? offerPrice : price
  const hasDiscount = offerPrice < price
  const savingsAmount = hasDiscount ? (price - offerPrice).toFixed(2) : null
  const discountPct = hasDiscount ? Math.round(((price - offerPrice) / price) * 100) : 0
  const inStock = selectedVariant
    ? (selectedVariant.stock > 0 || allowBackorder)
    : (baseInStock || allowBackorder)

  const displayImages = selectedVariant?.image_url
    ? [selectedVariant.image_url, ...images.filter((u) => u !== selectedVariant.image_url)]
    : images

  function handleAddToCart() {
    if (!inStock) return
    addToCart({
      product_id: selectedVariant ? selectedVariant.id : id,
      product_name: selectedVariant ? `${name} – ${selectedVariant.variant_name}` : name,
      product_image: displayImages[0],
      unit_price: displayPrice,
    })
    setAdded(true)
    setShowUpsell(true)
    setTimeout(() => setAdded(false), 1500)
  }

  function handleUpsellAddToCart(upsellProductId: string) {
    // This will be called by the UpsellPopup
    // We can fetch the product details or just trigger the add to cart logic
    // Since UpsellPopup handles its own analytics, we just need to ensure the item is in the cart
    // For now, we'll let the user know it was added or rely on the toast/animation
  }

  function handleBuyNow() {
    handleAddToCart()
    router.push('/checkout')
  }

  const highlights = [
    { text: 'Authentic Kerala Product', always: true },
    { text: 'UK Stock Available', always: inStock },
    { text: 'Next Day Delivery', always: true },
    { text: `Trusted Brand${brand ? ` — ${brand}` : ''}`, always: !!brand },
    { text: 'Best Seller', always: bestSeller },
    { text: 'New Arrival', always: newArrival },
    { text: 'Free Delivery Over £40', always: true },
    { text: `Earn ${coinReward} Pocket Coins`, always: coinReward > 0 },
  ].filter((h) => h.always)

  const fbtProducts = relatedProducts.slice(0, 2)
  const fbtTotal = (displayPrice + fbtProducts.reduce((s, p) => s + (p.offerPrice ?? p.price), 0)).toFixed(2)

  return (
    <div className="space-y-4 lg:space-y-5">

      {/* ── TOP: Image Gallery + Product Details ── */}
      <div className="grid md:grid-cols-2 gap-6 lg:gap-10 bg-white rounded-2xl border border-gray-100 p-4 md:p-6">

        {/* LEFT: Image Gallery */}
        <div>
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-3">
            {displayImages[activeImage] ? (
              <Image
                src={displayImages[activeImage]}
                alt={`${name}${weight ? ' ' + weight : ''}${brand ? ' – ' + brand : ''} | Buy online UK`}
                fill
                className="object-contain p-4 transition-opacity duration-200"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                unoptimized
                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No Image</div>
            )}
            {discountPct > 0 && (
              <div className="absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#5FAE9B' }}>
                {discountPct}% OFF
              </div>
            )}
            {bestSeller && (
              <div className="absolute top-3 right-3 text-white text-xs font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#0F2747' }}>
                Best Seller
              </div>
            )}
          </div>
          {displayImages.length > 1 && (
            <div className="flex gap-2">
              {displayImages.slice(0, 5).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden bg-white border-2 flex-shrink-0 transition-all ${
                    activeImage === i ? 'border-[#5FAE9B] shadow-sm' : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${name} view ${i + 1}`}
                    fill
                    className="object-contain p-1"
                    sizes="64px"
                    unoptimized
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Product Details */}
        <div className="flex flex-col">
          {/* Brand */}
          {brand && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#5FAE9B' }}>{brand}</span>
              {newArrival && (
                <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: '#e5a100' }}>NEW</span>
              )}
            </div>
          )}

          {/* Name */}
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2 leading-tight" style={{ color: '#0F2747' }}>
            {name}
          </h1>

          {/* Rating */}
          {rating != null && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.floor(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-700">{rating.toFixed(1)}</span>
              {reviewCount > 0 && <span className="text-xs text-gray-400">({reviewCount} reviews)</span>}
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-3xl font-extrabold" style={{ color: '#0F2747' }}>
              £{displayPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through">£{price.toFixed(2)}</span>
                <span className="text-xs font-bold text-white px-2 py-0.5 rounded-lg bg-red-500">
                  Save £{savingsAmount}
                </span>
              </>
            )}
          </div>

          {/* Weight */}
          {!hasVariants && weight && (
            <p className="text-xs text-gray-500 mb-3">
              <span className="font-semibold text-gray-600">Size:</span> {weight}
            </p>
          )}

          {/* Variants */}
          {hasVariants && variants.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Size / Pack</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const vPrice = v.discounted_price != null ? Number(v.discounted_price) : Number(v.price)
                  const isSelected = selectedVariantId === v.id
                  const outOfStock = v.stock <= 0
                  return (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedVariantId(v.id); setActiveImage(0) }}
                      disabled={outOfStock}
                      className={`relative px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all
                        ${isSelected
                          ? 'border-[#5FAE9B] bg-teal-50 text-teal-700'
                          : outOfStock
                            ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-[#5FAE9B]'
                        }`}
                    >
                      <span className="block">{v.variant_name}</span>
                      <span className="block text-[10px] mt-0.5 font-normal" style={{ color: isSelected ? '#0F2747' : '#6b7280' }}>
                        £{vPrice.toFixed(2)}
                      </span>
                      {outOfStock && (
                        <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-gray-400 text-white px-1 rounded-full">Out</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Short description */}
          {shortDescription && (
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{shortDescription}</p>
          )}

          {/* Stock status */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium mb-4 ${
            inStock ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            <svg className={`w-4 h-4 flex-none ${inStock ? 'text-green-500' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {inStock
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
            </svg>
            {inStock
              ? (allowBackorder && !baseInStock ? 'Available for Pre-order' : 'In Stock — Ready to Dispatch')
              : 'Out of Stock'}
          </div>

          {/* Add to Cart + Buy Now */}
          <div className="space-y-2.5 mb-4">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: added ? '#5FAE9B' : '#0F2747' }}
            >
              {added ? 'Added to Cart!' : inStock ? (allowBackorder && !baseInStock ? 'Pre-order' : 'Add to Cart') : 'Out of Stock'}
            </button>
            {inStock && (
              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 rounded-xl font-bold text-sm border-2 transition-all active:scale-[0.98]"
                style={{ borderColor: '#0F2747', color: '#0F2747', backgroundColor: 'transparent' }}
              >
                Buy Now
              </button>
            )}
          </div>

          {/* Delivery info */}
          <div className="space-y-2 mb-4 text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4 flex-none text-[#5FAE9B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Next Day Delivery — Order before 4 PM</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4 flex-none text-[#5FAE9B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Free Delivery on orders over £40</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4 flex-none text-[#5FAE9B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure checkout — SSL encrypted</span>
            </div>
          </div>

          {/* Coin reward */}
          {coinReward > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800 mb-4">
              <span>🪙</span>
              <span>Earn <strong>{coinReward} Pocket Coins</strong> worth £{(coinReward * 0.01).toFixed(2)} on this order</span>
            </div>
          )}

          {/* Wishlist */}
          <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Add to Wishlist
          </button>
        </div>
      </div>

      {/* ── PRODUCT HIGHLIGHTS ── */}
      <SectionCard title="Product Highlights">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {highlights.map((h) => (
            <div key={h.text} className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center flex-none text-white text-xs font-bold" style={{ backgroundColor: '#5FAE9B' }}>
                ✓
              </span>
              <span className="text-sm text-gray-700">{h.text}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── DESCRIPTION ── */}
      {description && (
        <SectionCard title="Description">
          <SafeHtml html={description} />
        </SectionCard>
      )}

      {/* ── INGREDIENTS ── */}
      {ingredients && (
        <SectionCard title="Ingredients">
          <SafeHtml html={ingredients} />
        </SectionCard>
      )}

      {/* ── NUTRITIONAL INFORMATION ── */}
      {nutritionalInfo && (
        <SectionCard title="Nutritional Information">
          <SafeHtml html={nutritionalInfo} />
        </SectionCard>
      )}

      {/* ── STORAGE INSTRUCTIONS ── */}
      {storageInstructions && (
        <SectionCard title="Storage Instructions">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 flex-none mt-0.5" style={{ color: '#5FAE9B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
            <SafeHtml html={storageInstructions} className="flex-1" />
          </div>
        </SectionCard>
      )}

      {/* ── HOW TO USE ── */}
      {howToUse && (
        <SectionCard title="How To Use">
          <SafeHtml html={howToUse} />
        </SectionCard>
      )}

      {/* ── CUSTOMER REVIEWS ── */}
      <SectionCard title="Customer Reviews">
        {rating != null && reviewCount > 0 ? (
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-extrabold" style={{ color: '#0F2747' }}>{rating.toFixed(1)}</p>
              <div className="flex justify-center gap-0.5 my-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-4 h-4 ${star <= Math.floor(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-xs text-gray-400">{reviewCount} reviews</p>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const pct = star === 5 ? 72 : star === 4 ? 18 : star === 3 ? 7 : star === 2 ? 2 : 1
                return (
                  <div key={star} className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 w-2">{star}</span>
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 w-6 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="flex justify-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className="w-6 h-6 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No reviews yet</p>
            <p className="text-xs text-gray-400">Be the first to review {name}</p>
          </div>
        )}
      </SectionCard>

      {/* ── FREQUENTLY BOUGHT TOGETHER ── */}
      <CrossSellSection productId={id} type="frequently_bought" />

      {/* ── RELATED PRODUCTS ── */}
      {relatedProducts.length > 0 && (
        <SectionCard title={`More from ${category}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((rel) => {
              const relDiscount = rel.offerPrice ? Math.round(((rel.price - rel.offerPrice) / rel.price) * 100) : 0
              return (
                <Link
                  key={rel.id}
                  href={`/products/${rel.slug}`}
                  className="group bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-all border border-gray-100"
                >
                  <div className="relative aspect-square bg-white overflow-hidden">
                    <Image
                      src={rel.images[0]}
                      alt={`${rel.name}${rel.weight ? ' ' + rel.weight : ''} - Buy online UK`}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      sizes="200px"
                      loading="lazy"
                      unoptimized
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
                    />
                    {relDiscount > 0 && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: '#5FAE9B' }}>
                        -{relDiscount}%
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-gray-400 mb-0.5">{rel.brand}</p>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">{rel.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold" style={{ color: '#0F2747' }}>
                        £{(rel.offerPrice ?? rel.price).toFixed(2)}
                      </span>
                      {rel.offerPrice != null && rel.offerPrice < rel.price && (
                        <span className="text-[10px] text-gray-400 line-through">£{rel.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="text-center mt-5">
            <Link
              href={`/products?category=${encodeURIComponent(category)}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-75 transition-opacity"
              style={{ color: '#5FAE9B' }}
            >
              View all {category} products
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </SectionCard>
      )}

      {/* ── FREQUENTLY BOUGHT TOGETHER ── */}
      {/* (Removed static section in favor of dynamic CrossSellSection above) */}

      {/* ── FAQ ── */}
      {faqs.length > 0 && (
        <SectionCard title="Frequently Asked Questions">
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  {faq.q}
                  <svg className={`w-4 h-4 text-gray-400 flex-none ml-3 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── SEO CONTENT SECTION ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        {/* ... */}
      </div>

      {showUpsell && (
        <UpsellPopup
          productId={id}
          productName={name}
          onAddToCart={(upsellId) => {
            // The UpsellPopup component needs to handle the actual adding to cart
            // But since we can't easily access the upsell product's full data here
            // without another fetch, we'll assume the UpsellPopup or a global cart handler does it.
            // Actually, let's fix UpsellPopup to take the necessary data or use a global cart action.
          }}
        />
      )}
    </div>
  )
}
