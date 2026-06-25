'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { addToCart } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist-context'
import { getStoreCategories, type StoreCategory } from '@/lib/categories'
import { fetchProducts as apiFetchProducts, type ApiProduct } from '@/lib/api/products'
import { isProductHidden } from '@/lib/api/customizations'
import CategoryWheelPicker from '@/components/CategoryWheelPicker'
import { Heart } from 'lucide-react'

const STORE_SLUG = 'pocket-grocery'
const PAGE_SIZE = 24
const PLACEHOLDER = 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400'

function resolveImageUrl(raw: string | null): string {
  if (!raw) return PLACEHOLDER
  return raw
}

interface Product {
  product_id: string
  slug: string
  name: string
  image_url: string | null
  price: number
  original_price: number
  in_stock: boolean
  allow_backorder: boolean
  is_bestseller: boolean
  is_deal: boolean
  is_new_arrival: boolean
  is_trending: boolean
  main_category_id: string | null
}

function apiToProduct(p: ApiProduct): Product {
  return {
    product_id: p.id ?? p.product_id ?? '',
    slug: p.slug ?? '',
    name: p.name ?? '',
    image_url: p.image_url ?? p.image ?? null,
    price: Number(p.price ?? 0),
    original_price: Number(p.original_price ?? 0),
    in_stock: Boolean(p.in_stock),
    allow_backorder: Boolean(p.allow_backorder),
    is_bestseller: Boolean(p.is_bestseller),
    is_deal: Boolean(p.is_deal),
    is_new_arrival: Boolean(p.is_new_arrival),
    is_trending: Boolean(p.is_trending),
    main_category_id: p.category_id ?? null,
  }
}

async function fetchProducts(opts: {
  search: string
  categoryId: string | null
  sort: string
  offset: number
  brandSlug: string | null
  brandName: string | null
}): Promise<Product[]> {
  const { products } = await apiFetchProducts({
    store_slug: STORE_SLUG,
    search: opts.search || null,
    category_id: opts.categoryId || null,
    in_stock_only: false,
    sort: opts.sort,
    limit: PAGE_SIZE,
    offset: opts.offset,
    brand_slug: opts.brandSlug || null,
    brand_name: opts.brandName || null,
  })
  return products
    .filter((p) => !isProductHidden(p.id ?? p.product_id ?? ''))
    .map(apiToProduct)
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-1/3 mt-1" />
        <div className="h-8 bg-gray-100 rounded mt-2" />
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false)
  const { isInWishlist, toggleWishlist } = useWishlist()
  const price = Number(product.price)
  const original = Number(product.original_price)
  const hasDiscount = original > price && original > 0
  const discountPct = hasDiscount ? Math.round(((original - price) / original) * 100) : 0
  const imageUrl = resolveImageUrl(product.image_url)
  const isWishlisted = isInWishlist(product.product_id)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (!product.in_stock) return
    addToCart({
      product_id: product.product_id,
      product_name: product.name,
      product_image: product.image_url ?? undefined,
      unit_price: price,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist({
      id: product.product_id,
      name: product.name,
      price: product.price,
      image_url: product.image_url ?? undefined,
      slug: product.slug
    })
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col relative"
    >
      <button
        onClick={handleWishlist}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
      </button>
      <div className="relative h-44 bg-gray-50 overflow-hidden flex-shrink-0">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          unoptimized
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#5FAE9B' }}>
            -{discountPct}%
          </span>
        )}
        {product.is_bestseller && (
          <span className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            Best Seller
          </span>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {product.allow_backorder ? 'Pre-order' : 'Out of Stock'}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-auto group-hover:text-[#0F2747] transition-colors">
          {product.name}
        </h3>
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-base font-bold" style={{ color: '#0F2747' }}>
              £{price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">£{original.toFixed(2)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!product.in_stock}
            className="w-full py-2 rounded-lg text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: added ? '#5FAE9B' : '#0F2747' }}
          >
            {added ? 'Added!' : product.in_stock ? 'Add to Cart' : product.allow_backorder ? 'Pre-order' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </Link>
  )
}

function ProductsPageInner() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [sort, setSort] = useState('popular')
  const [offset, setOffset] = useState(0)
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [brandSlug, setBrandSlug] = useState<string | null>(null)
  const [brandName, setBrandName] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch categories and pre-select from ?category= URL param; also handle ?brand_slug=
  useEffect(() => {
    const slugParam = searchParams.get('category')
    const searchParam = searchParams.get('search')
    const bSlug = searchParams.get('brand_slug')
    const bName = searchParams.get('brand_name')
    if (searchParam) {
      setSearch(searchParam)
      setSearchInput(searchParam)
    }
    if (bSlug) setBrandSlug(bSlug)
    if (bName) setBrandName(bName)
    getStoreCategories(STORE_SLUG).then((cats) => {
      setCategories(cats)
      if (slugParam) {
        const match = cats.find((c) => c.store_category_slug === slugParam)
        if (match?.category_id) setCategoryId(match.category_id)
      }
    })
  }, [searchParams])

  const load = useCallback(async (opts: { search: string; categoryId: string | null; sort: string; offset: number; append: boolean; brandSlug: string | null; brandName: string | null }) => {
    if (!opts.append) setLoading(true)
    else setLoadingMore(true)

    const data = await fetchProducts({ search: opts.search, categoryId: opts.categoryId, sort: opts.sort, offset: opts.offset, brandSlug: opts.brandSlug, brandName: opts.brandName })

    if (opts.append) {
      setProducts((prev) => [...prev, ...data])
    } else {
      setProducts(data)
    }
    setHasMore(data.length === PAGE_SIZE)
    setLoading(false)
    setLoadingMore(false)
  }, [])

  // Initial load and when filters change
  useEffect(() => {
    setOffset(0)
    load({ search, categoryId, sort, offset: 0, append: false, brandSlug, brandName })
  }, [search, categoryId, sort, brandSlug, brandName, load])

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchInput(e.target.value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(e.target.value), 400)
  }

  function handleLoadMore() {
    const next = offset + PAGE_SIZE
    setOffset(next)
    load({ search, categoryId, sort, offset: next, append: true, brandSlug, brandName })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#0F2747' }}>
            {brandName
              ? `${brandName} Products`
              : categoryId
              ? (categories.find((c) => c.category_id === categoryId)?.store_category_name ?? 'All Products')
              : 'All Products'}
          </h1>
          <p className="text-sm text-gray-500">Authentic Kerala groceries with next day UK delivery</p>
        </div>

        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-gray-400 transition-colors">
            <svg className="w-4 h-4 text-gray-400 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products…"
              value={searchInput}
              onChange={handleSearchChange}
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearch('') }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* ── Category selector ── */}
        {/* Mobile: wheel picker button */}
        <div className="mb-5 sm:hidden">
          <CategoryWheelPicker
            categories={categories}
            activeCategoryId={categoryId}
            onSelect={(id) => { setCategoryId(id) }}
          />
        </div>

        {/* Desktop: horizontal pills */}
        <div className="hidden sm:flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setCategoryId(null)}
            className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              categoryId === null
                ? 'text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            style={categoryId === null ? { backgroundColor: '#0F2747' } : {}}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.store_category_id}
              onClick={() => setCategoryId(categoryId === cat.category_id ? null : (cat.category_id ?? null))}
              className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                categoryId === cat.category_id
                  ? 'text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              style={categoryId === cat.category_id ? { backgroundColor: '#5FAE9B' } : {}}
            >
              {cat.store_category_name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 font-medium mb-1">No products found</p>
            <p className="text-gray-400 text-sm">Try a different search or category</p>
            {(search || categoryId || brandSlug) && (
              <button
                onClick={() => { setSearchInput(''); setSearch(''); setCategoryId(null); setBrandSlug(null); setBrandName(null) }}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: '#0F2747' }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </span>
                  ) : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageInner />
    </Suspense>
  )
}
