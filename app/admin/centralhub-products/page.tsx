'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExportProduct {
  id?: string
  name: string
  brand: string
  weight: string
  price: number
  stock: number
  gtin: string
  product_type: string
  warehouse_location: string
  [key: string]: unknown
}

type SortField = 'name' | 'brand' | 'price' | 'stock' | 'product_type'
type SortDir = 'asc' | 'desc'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stockBadge(stock: number) {
  if (stock <= 0) return { label: 'Out of stock', cls: 'bg-red-100 text-red-700' }
  if (stock <= 10) return { label: `Low (${stock})`, cls: 'bg-amber-100 text-amber-700' }
  return { label: String(stock), cls: 'bg-green-100 text-green-700' }
}

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) {
    return (
      <svg className="w-3 h-3 text-gray-300 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }
  return dir === 'asc' ? (
    <svg className="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#0F2747' }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#0F2747' }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CentralHubProductsPage() {
  useAuth()

  const [token, setToken] = useState('')
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? '')
    })
  }, [])

  const [products, setProducts] = useState<ExportProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [limit, setLimit] = useState(200)

  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low' | 'out'>('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const abortRef = useRef<AbortController | null>(null)

  const fetchProducts = useCallback(async (accessToken: string) => {
    if (!accessToken) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/centralhub-export?limit=${limit}&page=1`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }

      const data = await res.json()
      const list: ExportProduct[] = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : []

      setProducts(list)
      setLastFetched(new Date())
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(String(err))
      }
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    if (token) fetchProducts(token)
  }, [token, fetchProducts])

  // Unique product types for the filter dropdown
  const productTypes = useMemo(() => {
    const types = new Set(products.map((p) => p.product_type).filter(Boolean))
    return ['all', ...Array.from(types).sort()]
  }, [products])

  // Filtered + sorted list
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()

    let list = products.filter((p) => {
      if (q && !p.name?.toLowerCase().includes(q) && !p.brand?.toLowerCase().includes(q)) {
        return false
      }
      if (stockFilter === 'in_stock' && p.stock <= 0) return false
      if (stockFilter === 'low' && (p.stock <= 0 || p.stock > 10)) return false
      if (stockFilter === 'out' && p.stock > 0) return false
      if (typeFilter !== 'all' && p.product_type !== typeFilter) return false
      return true
    })

    list = [...list].sort((a, b) => {
      let av = a[sortField]
      let bv = b[sortField]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av === bv) return 0
      const cmp = (av ?? '') < (bv ?? '') ? -1 : 1
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [products, search, sortField, sortDir, stockFilter, typeFilter])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const inStock = products.filter((p) => p.stock > 10).length
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length
  const outOfStock = products.filter((p) => p.stock <= 0).length

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F2747' }}>CentralHub Products</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Live product catalogue from the CentralHub export API.
              {lastFetched && (
                <span className="ml-2 text-gray-400">
                  Last fetched {lastFetched.toLocaleTimeString('en-GB')}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {[50, 100, 200, 500].map((n) => (
                <option key={n} value={n}>{n} products</option>
              ))}
            </select>
            <button
              onClick={() => fetchProducts(token)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 hover:opacity-90"
              style={{ backgroundColor: '#0F2747' }}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {loading ? 'Fetching...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Products', value: products.length, color: '#0F2747' },
              { label: 'In Stock', value: inStock, color: '#16a34a' },
              { label: 'Low Stock', value: lowStock, color: '#d97706' },
              { label: 'Out of Stock', value: outOfStock, color: '#dc2626' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or brand..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Stock filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 min-w-[140px]"
            >
              <option value="all">All stock levels</option>
              <option value="in_stock">In stock only</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>

            {/* Product type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 min-w-[160px]"
            >
              {productTypes.map((t) => (
                <option key={t} value={t}>{t === 'all' ? 'All product types' : t}</option>
              ))}
            </select>
          </div>

          {filtered.length !== products.length && (
            <p className="text-xs text-gray-400 mt-2">
              Showing {filtered.length} of {products.length} products
            </p>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">Failed to fetch products</p>
              <p className="text-xs text-red-600 mt-0.5 font-mono">{error}</p>
              <button
                onClick={() => fetchProducts(token)}
                className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && products.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50" />
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded flex-1" />
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-4 bg-gray-100 rounded w-16" />
                  <div className="h-4 bg-gray-100 rounded w-16" />
                  <div className="h-4 bg-gray-100 rounded w-20" />
                  <div className="h-4 bg-gray-100 rounded w-28" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state (loaded but nothing) */}
        {!loading && !error && products.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gray-100">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-600 font-semibold">No products returned</p>
            <p className="text-sm text-gray-400 mt-1">
              Check that <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">CENTRALHUB_API_URL</code> and{' '}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">CENTRALHUB_SITE_KEY</code> are set, then refresh.
            </p>
          </div>
        )}

        {/* Empty search state */}
        {!loading && !error && products.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500 font-medium">No products match your filters.</p>
            <button
              onClick={() => { setSearch(''); setStockFilter('all'); setTypeFilter('all') }}
              className="mt-3 text-sm font-semibold underline underline-offset-2"
              style={{ color: '#0F2747' }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Product table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {(
                      [
                        { key: 'name', label: 'Product Name', sortable: true },
                        { key: 'brand', label: 'Brand', sortable: true },
                        { key: 'weight', label: 'Weight', sortable: false },
                        { key: 'price', label: 'Price', sortable: true },
                        { key: 'stock', label: 'Stock', sortable: true },
                        { key: 'gtin', label: 'GTIN', sortable: false },
                        { key: 'product_type', label: 'Product Type', sortable: true },
                        { key: 'warehouse_location', label: 'Warehouse', sortable: false },
                      ] as const
                    ).map(({ key, label, sortable }) => (
                      <th
                        key={key}
                        className={`text-left py-3 px-4 text-xs font-semibold text-gray-500 whitespace-nowrap select-none ${sortable ? 'cursor-pointer hover:text-gray-700 transition-colors' : ''}`}
                        onClick={sortable ? () => toggleSort(key as SortField) : undefined}
                      >
                        {label}
                        {sortable && (
                          <SortIcon
                            field={key as SortField}
                            current={sortField}
                            dir={sortDir}
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((product, i) => {
                    const badge = stockBadge(product.stock)
                    return (
                      <tr key={product.id ?? i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-800 max-w-xs">
                          <span className="line-clamp-2">{product.name || '—'}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{product.brand || '—'}</td>
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{product.weight || '—'}</td>
                        <td className="py-3 px-4 font-semibold whitespace-nowrap" style={{ color: '#0F2747' }}>
                          {product.price != null ? `£${Number(product.price).toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 font-mono text-xs whitespace-nowrap">
                          {product.gtin || '—'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {product.product_type ? (
                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                              {product.product_type}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                          {product.warehouse_location || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <p className="text-xs text-gray-400">
                {filtered.length} product{filtered.length !== 1 ? 's' : ''} displayed
              </p>
              {loading && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Refreshing
                </span>
              )}
            </div>
          </div>
        )}

        {/* Config reminder */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-semibold text-blue-800">Required environment variables</p>
              <p><code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_API_BASE_URL</code> — CentralHub Supabase project URL</p>
              <p><code className="bg-blue-100 px-1 rounded">CENTRALHUB_ANON_KEY</code> — CentralHub project anon key (server-side only)</p>
              <p><code className="bg-blue-100 px-1 rounded">CENTRALHUB_SITE_KEY</code> — x-site-key secret (server-side only, never exposed to browser)</p>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
