'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/lib/auth-context'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase as any)
import { supabase } from '@/lib/supabase'
import ProductEditModal from '@/components/admin/products/ProductEditModal'
import AIContentQueue from '@/components/admin/AIContentQueue'

type QueueProduct = {
  id: string; name: string; slug: string; sku: string; brand: string
  image: string; price: number; stock_qty: number; unit: string; weight_grams: number | null
  approval_status: string; visibility_status: string
  category_id: string | null; category_name: string
  has_description: boolean; has_seo: boolean; has_image: boolean; has_category: boolean
  needs_admin_review: boolean
  synced_at: string | null; approved_at: string | null; created_at: string
  total_count: number
}

type FilterKey = 'all' | 'draft' | 'approved' | 'rejected' | 'missing_category' | 'missing_image' | 'missing_seo'
type AIAction = 'short_description' | 'full_description' | 'seo' | 'everything'

const PAGE_SIZE = 25

const FILTERS: { key: FilterKey; label: string; color: string }[] = [
  { key: 'all',              label: 'All',              color: 'text-gray-600' },
  { key: 'draft',            label: 'Draft',            color: 'text-amber-600' },
  { key: 'approved',         label: 'Approved',         color: 'text-emerald-600' },
  { key: 'rejected',         label: 'Rejected',         color: 'text-red-600' },
  { key: 'missing_category', label: 'No Category',      color: 'text-orange-600' },
  { key: 'missing_image',    label: 'No Image',         color: 'text-orange-600' },
  { key: 'missing_seo',      label: 'No SEO',           color: 'text-orange-600' },
]

const STATUS_BADGE: Record<string, string> = {
  draft:    'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

const AI_ACTIONS: { key: AIAction; label: string }[] = [
  { key: 'everything',        label: 'Generate Everything' },
  { key: 'short_description', label: 'Short Description' },
  { key: 'full_description',  label: 'Full Description' },
  { key: 'seo',               label: 'SEO Metadata' },
]

function MissingChip({ label, missing }: { label: string; missing: boolean }) {
  if (!missing) return null
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
      {label}
    </span>
  )
}

// Sparkle icon for AI buttons
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

export default function ProductDraftsPage() {
  useAuth()

  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setAccessToken(s?.access_token ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const [products, setProducts] = useState<QueueProduct[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<FilterKey>('draft')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const [editProductId, setEditProductId] = useState<string | null>(null)
  const [queueIds, setQueueIds] = useState<string[]>([])

  // Stats
  const [stats, setStats] = useState({ total: 0, draft: 0, approved: 0, rejected: 0 })

  // AI generation state
  const [aiDropdown, setAiDropdown] = useState<string | null>(null) // product id with open dropdown
  const [aiEnqueueing, setAiEnqueueing] = useState(false)
  const [aiBatchId, setAiBatchId] = useState<string | null>(null)
  const [aiRunning, setAiRunning] = useState(false)

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const fetchQueue = useCallback(async (f: FilterKey, s: string, p: number) => {
    setLoading(true)
    const { data, error } = await db().rpc('get_admin_approval_queue', {
      p_search: s || null,
      p_filter: f,
      p_limit:  PAGE_SIZE,
      p_offset: p * PAGE_SIZE,
    })
    if (!error && data) {
      setProducts(data as QueueProduct[])
      setTotal(data[0]?.total_count ?? 0)
      setQueueIds((data as QueueProduct[]).map((x) => x.id))
    }
    setLoading(false)
  }, [])

  const fetchStats = useCallback(async () => {
    const { data } = await db().rpc('get_admin_product_diagnostics')
    if (data && data[0]) {
      setStats({
        total:    data[0].total_products    ?? 0,
        draft:    data[0].draft_products    ?? 0,
        approved: data[0].approved_products ?? 0,
        rejected: data[0].rejected_products ?? 0,
      })
    }
  }, [])

  useEffect(() => { fetchQueue(filter, search, page) }, [filter, search, page, fetchQueue])
  useEffect(() => { fetchStats() }, [fetchStats])

  // Close AI dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAiDropdown(null)
      }
    }
    if (aiDropdown) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [aiDropdown])

  function handleSearchChange(v: string) {
    setSearchInput(v)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => { setSearch(v); setPage(0) }, 350)
  }

  function handleFilterChange(k: FilterKey) {
    setFilter(k); setPage(0); setSelected(new Set())
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === products.length) setSelected(new Set())
    else setSelected(new Set(products.map((p) => p.id)))
  }

  async function bulkApprove() {
    if (selected.size === 0) return
    setBulkLoading(true)
    for (const id of Array.from(selected)) await db().rpc('approve_product', { p_id: id })
    setSelected(new Set())
    setBulkLoading(false)
    fetchQueue(filter, search, page)
    fetchStats()
  }

  async function quickApprove(id: string) {
    await db().rpc('approve_product', { p_id: id })
    setProducts((prev) => prev.map((p) => p.id === id
      ? { ...p, approval_status: 'approved', visibility_status: 'visible' } : p))
    fetchStats()
  }

  async function quickReject(id: string) {
    await db().rpc('reject_product', { p_id: id })
    setProducts((prev) => prev.map((p) => p.id === id
      ? { ...p, approval_status: 'rejected', visibility_status: 'hidden' } : p))
    fetchStats()
  }

  // ── AI generation helpers ──────────────────────────────────────────────────

  async function enqueueAndRun(productIds: string[], action: AIAction) {
    if (!productIds.length) return
    setAiEnqueueing(true)
    setAiDropdown(null)
    try {
      const { data } = await db().rpc('enqueue_ai_content_jobs', {
        p_product_ids: productIds,
        p_action:      action,
      })
      const batchId: string = data?.[0]?.batch_id ?? null
      setAiBatchId(batchId)
      if (accessToken) {
        setAiRunning(true)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        fetch(`${supabaseUrl}/functions/v1/ai-content-worker`, {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify(batchId ? { batch_id: batchId } : {}),
        }).then(async (res) => {
          const json = await res.json()
          if ((json.remaining ?? 0) === 0) setAiRunning(false)
        }).catch(() => setAiRunning(false))
      }
    } catch (err) {
      console.error('[AI enqueue]', err)
    }
    setAiEnqueueing(false)
  }

  async function enqueueAllDraft(action: AIAction) {
    // Fetch all draft product IDs (no pagination limit for bulk enqueue)
    const { data } = await db().rpc('get_admin_approval_queue', {
      p_filter: 'draft',
      p_limit:  9999,
      p_offset: 0,
    })
    const ids = (data as QueueProduct[] ?? []).map((p) => p.id)
    await enqueueAndRun(ids, action)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-7xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F2747' }}>Product Approval Queue</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review, edit and approve products before they appear on the storefront.
            </p>
          </div>
          <button
            onClick={() => { fetchQueue(filter, search, page); fetchStats() }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total',    value: stats.total,    color: 'text-gray-800',    bg: 'bg-gray-50',    border: 'border-gray-100' },
            { label: 'Draft',    value: stats.draft,    color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-100' },
            { label: 'Approved', value: stats.approved, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-100' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-4`}>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* AI Content Queue progress dashboard */}
        <AIContentQueue
          accessToken={accessToken}
          batchId={aiBatchId}
          isRunning={aiRunning}
          onRunningChange={setAiRunning}
        />

        {/* Storefront visibility note */}
        {stats.approved === 0 && stats.total > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">No products are visible on the storefront yet</p>
              <p className="text-xs text-amber-700 mt-0.5">
                All {stats.total} products are in draft status. Approve products with a category, image, and price to make them visible.
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Search + bulk actions */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search name, SKU, brand…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
            </div>

            {/* Bulk approval */}
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{selected.size} selected</span>
                <button
                  onClick={bulkApprove}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: '#5FAE9B' }}
                >
                  {bulkLoading ? 'Approving…' : `Approve ${selected.size}`}
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              </div>
            )}

            {/* AI bulk actions — always visible */}
            <div className="flex items-center gap-2 ml-auto">
              {selected.size > 0 && (
                <AIActionMenu
                  label={`AI: ${selected.size} selected`}
                  disabled={aiEnqueueing}
                  onSelect={(action) => enqueueAndRun(Array.from(selected), action)}
                />
              )}
              <AIActionMenu
                label="AI: All Draft"
                disabled={aiEnqueueing || stats.draft === 0}
                onSelect={(action) => enqueueAllDraft(action)}
                variant="outline"
              />
            </div>

            <div className="text-xs text-gray-400">
              {loading ? 'Loading…' : `${total} product${total !== 1 ? 's' : ''}`}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100 px-1">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleFilterChange(key)}
                className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  filter === key
                    ? 'border-[#0F2747] text-[#0F2747]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-400">No products match the current filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.size === products.length && products.length > 0}
                        onChange={toggleAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3 w-12"></th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Product</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Unit</th>
                    <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Weight</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Category</th>
                    <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Price</th>
                    <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Stock</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Missing</th>
                    <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50/50 transition-colors group ${selected.has(p.id) ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      {/* Thumbnail */}
                      <td className="px-3 py-2.5">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt=""
                            loading="lazy"
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-100"
                            onError={(e) => { (e.target as HTMLImageElement).src = '' }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      {/* Name */}
                      <td className="px-3 py-2.5 max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400 truncate">{[p.brand, p.sku].filter(Boolean).join(' · ') || p.slug}</p>
                      </td>
                      {/* Unit */}
                      <td className="px-3 py-2.5">
                        {p.unit ? (
                          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {p.unit}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      {/* Weight */}
                      <td className="px-3 py-2.5 text-right">
                        {p.weight_grams != null ? (
                          <span className="text-xs font-medium text-gray-700">
                            {p.weight_grams >= 1000
                              ? `${(p.weight_grams / 1000).toFixed(p.weight_grams % 1000 === 0 ? 0 : 1)}kg`
                              : `${p.weight_grams}g`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      {/* Category */}
                      <td className="px-3 py-2.5">
                        <span className={`text-xs ${p.category_name ? 'text-gray-700' : 'text-gray-300 italic'}`}>
                          {p.category_name || 'None'}
                        </span>
                      </td>
                      {/* Price */}
                      <td className="px-3 py-2.5 text-right">
                        <span className={`text-sm ${p.price > 0 ? 'font-medium text-gray-800' : 'text-gray-300'}`}>
                          {p.price > 0 ? `£${Number(p.price).toFixed(2)}` : '—'}
                        </span>
                      </td>
                      {/* Stock */}
                      <td className="px-3 py-2.5 text-right">
                        <span className={`text-xs font-medium ${p.stock_qty > 0 ? 'text-gray-700' : 'text-red-500'}`}>
                          {p.stock_qty}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[p.approval_status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {p.approval_status}
                        </span>
                      </td>
                      {/* Missing flags */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          <MissingChip label="Category" missing={!p.has_category} />
                          <MissingChip label="Image"    missing={!p.has_image} />
                          <MissingChip label="SEO"      missing={!p.has_seo} />
                          <MissingChip label="Desc"     missing={!p.has_description} />
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          {/* Per-product AI button */}
                          <div className="relative" ref={aiDropdown === p.id ? dropdownRef : null}>
                            <button
                              onClick={() => setAiDropdown(aiDropdown === p.id ? null : p.id)}
                              disabled={aiEnqueueing}
                              title="Generate AI content"
                              className="px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-40"
                            >
                              <SparkleIcon className="w-3 h-3" />
                              AI
                            </button>
                            {aiDropdown === p.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
                                {AI_ACTIONS.map(({ key, label }) => (
                                  <button
                                    key={key}
                                    onClick={() => { enqueueAndRun([p.id], key); setAiDropdown(null) }}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => setEditProductId(p.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 border border-gray-300 text-gray-800 hover:bg-gray-200 transition-colors"
                          >
                            Edit
                          </button>
                          {p.approval_status !== 'approved' && (
                            <button
                              onClick={() => quickApprove(p.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: '#5FAE9B' }}
                            >
                              Approve
                            </button>
                          )}
                          {p.approval_status === 'draft' && (
                            <button
                              onClick={() => quickReject(p.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 border border-red-300 text-red-700 hover:bg-red-200 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pg = totalPages <= 7 ? i : i === 0 ? 0 : i === 6 ? totalPages - 1 : page - 2 + i
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-7 rounded-lg text-xs font-medium transition-colors ${pg === page ? 'text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                      style={pg === page ? { backgroundColor: '#0F2747' } : {}}
                    >
                      {pg + 1}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editProductId && (
        <ProductEditModal
          productId={editProductId}
          queueIds={queueIds}
          onClose={() => setEditProductId(null)}
          onSaved={() => { fetchQueue(filter, search, page); fetchStats() }}
          onApproved={() => { fetchQueue(filter, search, page); fetchStats(); setEditProductId(null) }}
          onRejected={() => { fetchQueue(filter, search, page); fetchStats(); setEditProductId(null) }}
        />
      )}
    </AdminLayout>
  )
}

// ── AI Action dropdown menu component ─────────────────────────────────────────

interface AIActionMenuProps {
  label: string
  disabled: boolean
  onSelect: (action: AIAction) => void
  variant?: 'solid' | 'outline'
}

function AIActionMenu({ label, disabled, onSelect, variant = 'solid' }: AIActionMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const solidClass = 'bg-amber-500 text-white hover:bg-amber-600 border-amber-500'
  const outlineClass = 'bg-white text-amber-700 hover:bg-amber-50 border-amber-300'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 ${variant === 'solid' ? solidClass : outlineClass}`}
      >
        <SparkleIcon className="w-3.5 h-3.5" />
        {label}
        <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-52">
          <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Generate content</p>
          {AI_ACTIONS.map(({ key, label: l }) => (
            <button
              key={key}
              onClick={() => { onSelect(key); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
