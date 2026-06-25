'use client'

import { useState, useCallback, useEffect, useRef, useTransition } from 'react'
import {
  getStoreProducts,
  type StoreCategory,
  type StoreProductCard as ProductData,
  type SortOption,
} from '@/lib/stores'
import StoreProductCard from './StoreProductCard'

interface Props {
  storeSlug: string
  categories: StoreCategory[]
  initialProducts: ProductData[]
  initialTotal: number
  currencySymbol: string
  maxDisplayStock: number
  showStockLevels: boolean
}

const SORT_LABELS: Record<SortOption, string> = {
  popular: 'Most Popular',
  newest: 'Newest',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
}

const PAGE_SIZE = 20

export default function StoreProductGrid({
  storeSlug,
  categories,
  initialProducts,
  initialTotal,
  currencySymbol,
  maxDisplayStock,
  showStockLevels,
}: Props) {
  const [products, setProducts] = useState<ProductData[]>(initialProducts)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialTotal > PAGE_SIZE)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [sort, setSort] = useState<SortOption>('popular')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Track whether filters have changed from initial SSR state
  const isFirstRender = useRef(true)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [, startTransition] = useTransition()

  const fetchProducts = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)
      setError(null)

      try {
        const result = await getStoreProducts(storeSlug, {
          categoryId: categoryId || null,
          search: search || null,
          minPrice: minPrice ? Number(minPrice) : null,
          maxPrice: maxPrice ? Number(maxPrice) : null,
          inStockOnly,
          sort,
          page: pageNum,
          pageSize: PAGE_SIZE,
        })

        setProducts((prev) => (append ? [...prev, ...result.products] : result.products))
        setTotal(result.total_count)
        setHasMore(result.hasMore)
        setPage(pageNum)
      } catch {
        setError('Failed to load products. Please try again.')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [storeSlug, categoryId, search, minPrice, maxPrice, inStockOnly, sort]
  )

  // Skip the very first render — we already have SSR data
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    fetchProducts(1, false)
  }, [fetchProducts])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => {
      startTransition(() => setSearch(value))
    }, 350)
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) fetchProducts(page + 1, true)
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setCategoryId('')
    setSort('popular')
    setInStockOnly(false)
    setMinPrice('')
    setMaxPrice('')
  }

  const activeFilterCount = [categoryId, inStockOnly, minPrice, maxPrice].filter(Boolean).length

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          {searchInput && (
            <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="text-sm border border-gray-200 rounded-xl bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
            <option key={s} value={s}>{SORT_LABELS[s]}</option>
          ))}
        </select>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className="relative flex items-center gap-2 text-sm border border-gray-200 rounded-xl bg-white px-4 py-2.5 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-teal-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.main_category_id} value={c.main_category_id}>
                  {c.name} ({c.product_count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Min Price</label>
            <input type="number" min="0" step="0.01" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0.00"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Max Price</label>
            <input type="number" min="0" step="0.01" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Any"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          <div className="flex flex-col justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div onClick={() => setInStockOnly((v) => !v)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${inStockOnly ? 'bg-teal-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${inStockOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-700">In stock only</span>
            </label>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-sm text-teal-600 hover:text-teal-700 font-medium text-left">
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setCategoryId('')}
            className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors whitespace-nowrap ${!categoryId ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.main_category_id}
              onClick={() => setCategoryId(c.main_category_id === categoryId ? '' : c.main_category_id)}
              className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors whitespace-nowrap ${categoryId === c.main_category_id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400'}`}
            >
              {c.name}
              {c.product_count > 0 && <span className="ml-1.5 text-xs opacity-70">({c.product_count})</span>}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500 mb-4">
          {total === 0 ? 'No products found' : `${total} product${total !== 1 ? 's' : ''}${search ? ` for "${search}"` : ''}`}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-6">
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={() => fetchProducts(1, false)} className="mt-3 text-sm text-red-600 underline hover:no-underline">Try again</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-5 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && !error && (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-700 font-semibold text-lg mb-1">No products found</p>
          <p className="text-gray-500 text-sm mb-4">{search ? `No results for "${search}"` : 'Try adjusting your filters'}</p>
          {(activeFilterCount > 0 || search) && (
            <button onClick={resetFilters} className="text-sm text-teal-600 font-semibold hover:underline">Clear filters</button>
          )}
        </div>
      )}

      {/* Product grid */}
      {!loading && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <StoreProductCard
                key={product.product_id}
                product={product}
                currencySymbol={currencySymbol}
                maxDisplayStock={maxDisplayStock}
                showStockLevels={showStockLevels}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 font-medium text-sm px-8 py-3 rounded-full hover:bg-gray-50 hover:border-teal-400 transition-colors disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading...
                  </>
                ) : (
                  `Load more (${total - products.length} remaining)`
                )}
              </button>
            </div>
          )}

          {loadingMore && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
                  <div className="h-44 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
