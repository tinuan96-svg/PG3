'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ── Types ──────────────────────────────────────────────────────────────────────

type AiStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface MediaItem {
  id: string
  file_name: string
  storage_path: string
  public_url: string
  mime_type: string
  size_bytes: number
  created_at: string
  // AI fields
  display_name: string | null
  seo_filename: string | null
  brand: string | null
  product_name: string | null
  weight: string | null
  category: string | null
  keywords: string[] | null
  alt_text: string | null
  title: string | null
  description: string | null
  confidence_score: number | null
  ai_status: AiStatus
  ai_error: string | null
  ai_processed_at: string | null
  is_duplicate: boolean
}

interface AiStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  duplicates: number
  avg_confidence: number | null
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'All', 'Rice', 'Dals', 'Flours', 'Spices', 'Masalas', 'Oils', 'Pickles',
  'Snacks', 'Sweets', 'Tea & Coffee', 'Fryums', 'Instant Foods',
  'Vegetables', 'Fruits', 'Household', 'Personal Care',
]

const DEFAULT_STATS: AiStats = { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, duplicates: 0, avg_confidence: null }

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1048576).toFixed(1)}MB`
}

function confidenceColor(score: number | null) {
  if (score === null) return '#9CA3AF'
  if (score >= 85) return '#059669'
  if (score >= 60) return '#D97706'
  return '#DC2626'
}

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return null
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
      style={{ backgroundColor: confidenceColor(score) }}
    >
      {score}%
    </span>
  )
}

function AiStatusDot({ status }: { status: AiStatus }) {
  const colors: Record<AiStatus, string> = {
    pending: '#D97706',
    processing: '#2563EB',
    completed: '#059669',
    failed: '#DC2626',
  }
  return <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[status] }} />
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ImageLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deletingBulk, setDeletingBulk] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<'all' | AiStatus>('all')
  const [copied, setCopied] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [editItem, setEditItem] = useState<MediaItem | null>(null)
  const [linkItem, setLinkItem] = useState<MediaItem | null>(null)
  const [stats, setStats] = useState<AiStats>(DEFAULT_STATS)
  const [analyzing, setAnalyzing] = useState(false)
  const [autoLinking, setAutoLinking] = useState(false)
  const [autoLinkResult, setAutoLinkResult] = useState<{ linked: number; total: number } | null>(null)
  const [analyzeProgress, setAnalyzeProgress] = useState<{ done: number; total: number } | null>(null)
  const [duplicatesOnly, setDuplicatesOnly] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef(false)

  // ── Data loading ──────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    const { data } = await db.rpc('get_media_ai_stats')
    if (data?.[0]) {
      const r = data[0]
      setStats({
        total: Number(r.total),
        pending: Number(r.pending),
        processing: Number(r.processing),
        completed: Number(r.completed),
        failed: Number(r.failed),
        duplicates: Number(r.duplicates),
        avg_confidence: r.avg_confidence != null ? Number(r.avg_confidence) : null,
      })
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await db
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false })
    setItems((data ?? []) as MediaItem[])
    await loadStats()
    setLoading(false)
  }, [loadStats])

  useEffect(() => { load() }, [load])

  // ── Filtering ─────────────────────────────────────────────────────────────────

  const filtered = items.filter((item) => {
    const q = search.toLowerCase()
    const matchesSearch = !q || [
      item.display_name, item.brand, item.product_name,
      item.category, item.weight, item.file_name,
      ...(item.keywords ?? []),
    ].some((v) => v?.toLowerCase().includes(q))

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || item.ai_status === statusFilter
    const matchesDuplicates = !duplicatesOnly || item.is_duplicate

    return matchesSearch && matchesCategory && matchesStatus && matchesDuplicates
  })

  // ── Upload ────────────────────────────────────────────────────────────────────

  async function uploadFiles(files: File[]) {
    if (!files.length) return
    setUploading(true)

    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadErr) { console.error('[Images] upload error:', uploadErr); continue }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)

      const { data: row } = await db.from('media_library').insert({
        file_name: file.name,
        storage_path: path,
        public_url: urlData.publicUrl,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id ?? null,
        ai_status: 'pending',
      }).select('id').maybeSingle()

      // Auto-enqueue for AI analysis
      if (row?.id) {
        await db.rpc('enqueue_media_ai_jobs', { p_media_ids: [row.id] })
      }
    }

    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
    load()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    await uploadFiles(Array.from(e.target.files ?? []))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (files.length) uploadFiles(files)
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  async function deleteItem(item: MediaItem) {
    setDeleting(item.id)
    await supabase.storage.from('product-images').remove([item.storage_path])
    await db.from('media_library').delete().eq('id', item.id)
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    setSelected((prev) => { const n = new Set(prev); n.delete(item.id); return n })
    setDeleting(null)
    if (previewItem?.id === item.id) setPreviewItem(null)
  }

  async function deleteSelected() {
    if (!confirm(`Delete ${selected.size} selected image${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setDeletingBulk(true)
    const toDelete = items.filter((i) => selected.has(i.id))
    const paths = toDelete.map((i) => i.storage_path)
    if (paths.length) await supabase.storage.from('product-images').remove(paths)
    await Promise.all(toDelete.map((i) => db.from('media_library').delete().eq('id', i.id)))
    setItems((prev) => prev.filter((i) => !selected.has(i.id)))
    setSelected(new Set())
    setDeletingBulk(false)
    loadStats()
  }

  // ── AI Analysis ───────────────────────────────────────────────────────────────

  async function analyzeAll() {
    const toProcess = items.filter((i) => i.ai_status === 'pending' || i.ai_status === 'failed')
    if (!toProcess.length) return

    // Enqueue all pending/failed
    const ids = toProcess.map((i) => i.id)
    await db.rpc('enqueue_media_ai_jobs', { p_media_ids: ids })

    setAnalyzing(true)
    abortRef.current = false
    setAnalyzeProgress({ done: 0, total: toProcess.length })

    const token = (await supabase.auth.getSession()).data.session?.access_token ?? ''
    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-media-image`

    let done = 0
    for (let i = 0; i < toProcess.length; i++) {
      if (abortRef.current) break

      try {
        await fetch(fnUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ media_id: toProcess[i].id }),
        })
      } catch (e) {
        console.error('[analyze] error for', toProcess[i].id, e)
      }

      done++
      setAnalyzeProgress({ done, total: toProcess.length })

      // Refresh every 5 items
      if (done % 5 === 0) load()
    }

    setAnalyzing(false)
    setAnalyzeProgress(null)
    load()
  }

  async function analyzeSelected() {
    const ids = Array.from(selected)
    if (!ids.length) return
    await db.rpc('enqueue_media_ai_jobs', { p_media_ids: ids })

    setAnalyzing(true)
    abortRef.current = false
    setAnalyzeProgress({ done: 0, total: ids.length })

    const token = (await supabase.auth.getSession()).data.session?.access_token ?? ''
    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-media-image`

    let done = 0
    for (const id of ids) {
      if (abortRef.current) break
      try {
        await fetch(fnUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ media_id: id }),
        })
      } catch { /* continue */ }
      done++
      setAnalyzeProgress({ done, total: ids.length })
    }

    setAnalyzing(false)
    setAnalyzeProgress(null)
    load()
  }

  async function reprocessItem(item: MediaItem) {
    await db.rpc('enqueue_media_ai_jobs', { p_media_ids: [item.id] })
    const token = (await supabase.auth.getSession()).data.session?.access_token ?? ''
    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-media-image`
    await fetch(fnUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_id: item.id }),
    })
    load()
    if (previewItem?.id === item.id) {
      const { data } = await db.from('media_library').select('*').eq('id', item.id).maybeSingle()
      if (data) setPreviewItem(data as MediaItem)
    }
  }

  async function retryFailed() {
    await db.rpc('retry_failed_media_ai_jobs')
    await analyzeAll()
  }

  async function approveMetadata(item: MediaItem) {
    await db.from('media_library').update({ confidence_score: 100 }).eq('id', item.id)
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, confidence_score: 100 } : i))
  }

  // ── Edit metadata ─────────────────────────────────────────────────────────────

  async function saveEdit(updated: Partial<MediaItem>) {
    if (!editItem) return
    const parts = [updated.brand, updated.product_name, updated.weight].filter(Boolean)
    const displayName = parts.join(' ') || editItem.file_name.replace(/\.[^.]+$/, '')
    await db.from('media_library').update({ ...updated, display_name: displayName }).eq('id', editItem.id)
    setItems((prev) => prev.map((i) => i.id === editItem.id ? { ...i, ...updated, display_name: displayName } : i))
    if (previewItem?.id === editItem.id) setPreviewItem((prev) => prev ? { ...prev, ...updated, display_name: displayName } : prev)
    setEditItem(null)
  }

  // ── Auto-link all analyzed images to products ─────────────────────────────────

  async function autoLinkAll() {
    const candidates = items.filter(
      (i) => i.ai_status === 'completed' && (i.display_name || i.product_name)
    )
    if (!candidates.length) return
    setAutoLinking(true)
    setAutoLinkResult(null)

    let linked = 0
    for (const img of candidates) {
      const query = img.display_name ?? img.product_name ?? ''
      if (!query) continue

      // Try to find a product that loosely matches the AI display name
      const { data: matches } = await db
        .from('products')
        .select('id, name, image')
        .ilike('name', `%${(img.product_name ?? query).split(' ').slice(0, 3).join('%')}%`)
        .is('image', null)  // Only update products with no image
        .limit(1)

      if (matches && matches.length > 0) {
        await db.from('products').update({ image: img.public_url }).eq('id', matches[0].id)
        linked++
      }
    }

    setAutoLinkResult({ linked, total: candidates.length })
    setAutoLinking(false)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function selectAll() {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((i) => i.id)))
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => { setCopied(url); setTimeout(() => setCopied(null), 2000) })
  }

  const totalSize = items.reduce((s, i) => s + i.size_bytes, 0)
  const unprocessedCount = items.filter((i) => i.ai_status === 'pending' || i.ai_status === 'failed').length

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Media Library</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {items.length} images &middot; {formatSize(totalSize)} total
              {stats.avg_confidence != null && ` · ${stats.avg_confidence}% avg confidence`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selected.size > 0 && (
              <>
                <button
                  onClick={analyzeSelected}
                  disabled={analyzing}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#5FAE9B' }}
                >
                  Analyze {selected.size} selected
                </button>
                <button
                  onClick={deleteSelected}
                  disabled={deletingBulk}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deletingBulk ? 'Deleting…' : `Delete ${selected.size}`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── KPI Stats ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: stats.total, color: '#0F2747' },
            { label: 'Completed', value: stats.completed, color: '#059669' },
            { label: 'Pending', value: stats.pending, color: '#D97706' },
            { label: 'Processing', value: stats.processing, color: '#2563EB' },
            { label: 'Failed', value: stats.failed, color: '#DC2626' },
            { label: 'Duplicates', value: stats.duplicates, color: '#7C3AED' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-[11px] text-gray-500">{s.label}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── AI Processing Center ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">AI Processing Center</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {unprocessedCount > 0
                  ? `${unprocessedCount} image${unprocessedCount !== 1 ? 's' : ''} need analysis`
                  : 'All images processed'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {stats.failed > 0 && (
                <button
                  onClick={retryFailed}
                  disabled={analyzing}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Retry {stats.failed} Failed
                </button>
              )}
              <button
                onClick={analyzeAll}
                disabled={analyzing || unprocessedCount === 0}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#0F2747' }}
              >
                {analyzing ? 'Analyzing…' : `Analyze ${unprocessedCount > 0 ? unprocessedCount : 'All'} Images`}
              </button>
              {analyzing && (
                <button
                  onClick={() => { abortRef.current = true }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Stop
                </button>
              )}
              <button
                onClick={autoLinkAll}
                disabled={autoLinking || stats.completed === 0}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#5FAE9B' }}
                title="Search products by AI-generated names and assign images to matching products"
              >
                {autoLinking ? 'Linking…' : 'Auto-Link to Products'}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {analyzeProgress && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Analyzing images with OpenAI Vision…</span>
                <span>{analyzeProgress.done} / {analyzeProgress.total}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(analyzeProgress.done / analyzeProgress.total) * 100}%`, backgroundColor: '#5FAE9B' }}
                />
              </div>
            </div>
          )}

          {autoLinkResult && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-sm text-green-700 font-medium">
                Auto-linked {autoLinkResult.linked} of {autoLinkResult.total} analyzed images to products.
                {autoLinkResult.linked < autoLinkResult.total && (
                  <span className="text-green-600"> Use the per-card &ldquo;Link to Product&rdquo; button for the rest.</span>
                )}
              </p>
              <button onClick={() => setAutoLinkResult(null)} className="text-green-500 hover:text-green-700 ml-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* ── Upload zone ── */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${dragging ? 'border-[#5FAE9B] bg-[#5FAE9B]/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <svg className={`w-8 h-8 mx-auto mb-2 ${dragging ? 'text-[#5FAE9B]' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <p className="text-sm font-medium text-gray-600 mb-1">
            {uploading ? 'Uploading…' : 'Drop images here — they will be auto-analyzed'}
          </p>
          <label className={`inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 ${uploading ? 'opacity-50 pointer-events-none' : ''}`} style={{ backgroundColor: '#0F2747' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {uploading ? 'Uploading…' : 'Choose Images'}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} disabled={uploading} />
          </label>
          <p className="text-xs text-gray-400 mt-2">JPG, PNG, WebP, AVIF — auto-analyzed on upload</p>
        </div>

        {/* ── Search + Filters ── */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search brands, products, categories, weight, keywords…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#5FAE9B] transition-colors"
          />

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category pills */}
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={categoryFilter === cat
                    ? { backgroundColor: '#0F2747', color: '#fff' }
                    : { backgroundColor: '#F3F4F6', color: '#374151' }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | AiStatus)}
              className="ml-auto border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            {/* Duplicates toggle */}
            {stats.duplicates > 0 && (
              <button
                onClick={() => setDuplicatesOnly((v) => !v)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${duplicatesOnly ? 'border-[#7C3AED] text-[#7C3AED] bg-purple-50' : 'border-gray-200 text-gray-600'}`}
              >
                Duplicates ({stats.duplicates})
              </button>
            )}

            {filtered.length > 0 && (
              <button
                onClick={selectAll}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 ml-1"
              >
                {selected.size === filtered.length ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            {search || categoryFilter !== 'All' || statusFilter !== 'all'
              ? 'No images match your filters.'
              : 'No images yet. Upload some above.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((item) => {
              const isSelected = selected.has(item.id)
              const lowConfidence = item.confidence_score !== null && item.confidence_score < 85 && item.ai_status === 'completed'
              return (
                <div
                  key={item.id}
                  className={`group bg-white rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? 'border-[#0F2747] ring-2 ring-[#0F2747]/10' : 'border-transparent hover:border-gray-200 hover:shadow-md'}`}
                >
                  {/* Image */}
                  <div
                    className="relative aspect-square bg-gray-50 cursor-pointer overflow-hidden"
                    onClick={() => setPreviewItem(item)}
                  >
                    <img
                      src={item.public_url}
                      alt={item.alt_text ?? item.file_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      crossOrigin="anonymous"
                    />

                    {/* Checkbox */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(item.id) }}
                      className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${isSelected ? 'bg-[#0F2747] border-[#0F2747]' : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'}`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Confidence badge */}
                    {item.confidence_score !== null && (
                      <div className="absolute top-2 right-2 z-10">
                        <ConfidenceBadge score={item.confidence_score} />
                      </div>
                    )}

                    {/* Duplicate badge */}
                    {item.is_duplicate && (
                      <div className="absolute bottom-2 left-2 z-10">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white bg-purple-500">DUP</span>
                      </div>
                    )}

                    {/* AI status indicator */}
                    {item.ai_status !== 'completed' && (
                      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 bg-white/90 rounded-full px-2 py-0.5">
                        <AiStatusDot status={item.ai_status} />
                        <span className="text-[9px] font-medium text-gray-700 capitalize">{item.ai_status}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>

                  {/* Card body */}
                  <div className="p-3">
                    {item.ai_status === 'completed' || item.display_name ? (
                      <>
                        {item.brand && (
                          <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#5FAE9B' }}>
                            {item.brand}
                          </p>
                        )}
                        <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">
                          {item.product_name ?? item.display_name ?? item.file_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {item.weight && (
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">{item.weight}</span>
                          )}
                          {item.category && (
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">{item.category}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 truncate">{item.file_name}</p>
                    )}

                    {/* Low confidence action row */}
                    {lowConfidence && (
                      <div className="mt-2 pt-2 border-t border-amber-100">
                        <p className="text-[10px] text-amber-600 font-medium mb-1.5">Low confidence — review suggested</p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => approveMetadata(item)}
                            className="flex-1 py-1 text-[10px] font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setEditItem(item)}
                            className="flex-1 py-1 text-[10px] font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action row */}
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => copyUrl(item.public_url)}
                        className="flex-1 py-1 text-[10px] font-semibold rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {copied === item.public_url ? 'Copied!' : 'Copy URL'}
                      </button>
                      {item.ai_status === 'completed' && (
                        <button
                          onClick={() => setLinkItem(item)}
                          title="Search products by AI name and link this image"
                          className="py-1 px-2 text-[10px] font-semibold rounded-lg hover:opacity-90 transition-opacity text-white"
                          style={{ backgroundColor: '#5FAE9B' }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => reprocessItem(item)}
                        title="Re-analyze with AI"
                        className="py-1 px-2 text-[10px] font-semibold rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { if (!confirm('Delete this image?')) return; deleteItem(item) }}
                        disabled={deleting === item.id}
                        className="py-1 px-2 text-[10px] font-semibold rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {deleting === item.id ? '…' : '✕'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Preview Modal ── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70" onClick={() => setPreviewItem(null)}>
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{previewItem.display_name ?? previewItem.file_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatSize(previewItem.size_bytes)} &middot; {previewItem.mime_type} &middot; {new Date(previewItem.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => { setEditItem(previewItem); setPreviewItem(null) }} className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                  Edit
                </button>
                <button onClick={() => setPreviewItem(null)} className="text-gray-400 hover:text-gray-600 ml-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Image */}
              <div className="bg-gray-50 rounded-2xl flex items-center justify-center p-4" style={{ minHeight: 240 }}>
                <img
                  src={previewItem.public_url}
                  alt={previewItem.alt_text ?? previewItem.file_name}
                  className="max-h-60 max-w-full rounded-xl object-contain"
                  crossOrigin="anonymous"
                />
              </div>

              {/* AI Metadata grid */}
              {previewItem.ai_status === 'completed' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Brand', value: previewItem.brand },
                    { label: 'Product Name', value: previewItem.product_name },
                    { label: 'Weight', value: previewItem.weight },
                    { label: 'Category', value: previewItem.category },
                    { label: 'Confidence', value: previewItem.confidence_score !== null ? `${previewItem.confidence_score}%` : null },
                    { label: 'SEO Filename', value: previewItem.seo_filename },
                  ].map(({ label, value }) => value && (
                    <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5 break-all">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Alt text / description */}
              {(previewItem.alt_text || previewItem.description) && (
                <div className="space-y-3">
                  {previewItem.alt_text && (
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Alt Text</p>
                      <p className="text-sm text-gray-700">{previewItem.alt_text}</p>
                    </div>
                  )}
                  {previewItem.description && (
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm text-gray-700">{previewItem.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Keywords */}
              {previewItem.keywords && previewItem.keywords.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewItem.keywords.map((kw) => (
                      <span key={kw} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
                <p className="text-xs font-mono text-gray-400 truncate flex-1 min-w-0">{previewItem.public_url}</p>
                <button
                  onClick={() => copyUrl(previewItem.public_url)}
                  className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  {copied === previewItem.public_url ? 'Copied!' : 'Copy URL'}
                </button>
                <button
                  onClick={() => reprocessItem(previewItem)}
                  className="flex-shrink-0 px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Re-analyze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editItem && (
        <EditModal
          item={editItem}
          onSave={saveEdit}
          onClose={() => setEditItem(null)}
        />
      )}

      {/* ── Link to Product Modal ── */}
      {linkItem && (
        <LinkToProductModal
          item={linkItem}
          onClose={() => setLinkItem(null)}
          onLinked={() => { setLinkItem(null); load() }}
        />
      )}
    </AdminLayout>
  )
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

function EditModal({ item, onSave, onClose }: {
  item: MediaItem
  onSave: (updated: Partial<MediaItem>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    brand: item.brand ?? '',
    product_name: item.product_name ?? '',
    weight: item.weight ?? '',
    category: item.category ?? '',
    keywords: (item.keywords ?? []).join(', '),
    alt_text: item.alt_text ?? '',
    title: item.title ?? '',
    description: item.description ?? '',
    confidence_score: item.confidence_score ?? 100,
  })
  const [saving, setSaving] = useState(false)

  function field(key: keyof typeof form, label: string, multi?: boolean) {
    return (
      <div key={key}>
        <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
        {multi ? (
          <textarea
            value={form[key] as string}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B] transition-colors resize-none"
          />
        ) : (
          <input
            type="text"
            value={form[key] as string}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B] transition-colors"
          />
        )}
      </div>
    )
  }

  async function handleSave() {
    setSaving(true)
    await onSave({
      brand: form.brand || null,
      product_name: form.product_name || null,
      weight: form.weight || null,
      category: form.category || null,
      keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      alt_text: form.alt_text || null,
      title: form.title || null,
      description: form.description || null,
      confidence_score: Number(form.confidence_score),
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Edit Metadata</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Image preview */}
          <div className="w-full h-32 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
            <img src={item.public_url} alt={item.file_name} className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
          </div>

          {field('brand', 'Brand')}
          {field('product_name', 'Product Name')}

          <div className="grid grid-cols-2 gap-3">
            {field('weight', 'Weight (e.g. 500g)')}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B] transition-colors"
              >
                <option value="">Select…</option>
                {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {field('keywords', 'Keywords (comma-separated)')}
          {field('alt_text', 'Alt Text')}
          {field('title', 'Image Title')}
          {field('description', 'Description', true)}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#0F2747' }}
            >
              {saving ? 'Saving…' : 'Save Metadata'}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Link to Product Modal ──────────────────────────────────────────────────────

interface ProductMatch {
  id: string
  name: string
  slug: string
  image: string | null
  brand: string | null
  price: number
}

function LinkToProductModal({ item, onClose, onLinked }: {
  item: MediaItem
  onClose: () => void
  onLinked: () => void
}) {
  const initialQuery = item.display_name ?? item.product_name ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<ProductMatch[]>([])
  const [searching, setSearching] = useState(false)
  const [linking, setLinking] = useState<string | null>(null)
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Auto-search on mount
  useEffect(() => {
    if (initialQuery) doSearch(initialQuery)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function doSearch(q: string) {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    // Build tokens from query for fuzzy matching
    const tokens = q.split(/\s+/).filter(Boolean)
    const firstThree = tokens.slice(0, 3).join('%')

    const { data } = await db
      .from('products')
      .select('id, name, slug, image, brand, price')
      .ilike('name', `%${firstThree}%`)
      .limit(20)

    setResults((data ?? []) as ProductMatch[])
    setSearching(false)
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(v), 350)
  }

  async function linkToProduct(product: ProductMatch) {
    setLinking(product.id)
    await db.from('products').update({ image: item.public_url }).eq('id', product.id)
    setLinkedIds((prev) => new Set([...prev, product.id]))
    setResults((prev) => prev.map((p) => p.id === product.id ? { ...p, image: item.public_url } : p))
    setLinking(null)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-4 rounded-t-3xl sm:rounded-t-2xl">
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
            <img src={item.public_url} alt={item.file_name} className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-900">Link Image to Product</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {item.display_name ?? item.file_name}
              {item.confidence_score != null && (
                <span className="ml-2 font-semibold" style={{ color: confidenceColor(item.confidence_score) }}>
                  {item.confidence_score}% confidence
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* AI metadata chips */}
        <div className="px-5 pt-3 pb-0 flex flex-wrap gap-1.5">
          {item.brand && <Chip label="Brand" value={item.brand} onClick={() => { setQuery(item.brand!); doSearch(item.brand!) }} />}
          {item.product_name && <Chip label="Product" value={item.product_name} onClick={() => { setQuery(item.product_name!); doSearch(item.product_name!) }} />}
          {item.display_name && <Chip label="Full name" value={item.display_name} onClick={() => { setQuery(item.display_name!); doSearch(item.display_name!) }} />}
          {item.category && <Chip label="Category" value={item.category} color="#5FAE9B" />}
        </div>

        {/* Search bar */}
        <div className="px-5 py-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-[#5FAE9B] transition-colors">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search products by name…"
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
              autoFocus
            />
            {searching && (
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0" style={{ borderColor: '#5FAE9B', borderTopColor: 'transparent' }} />
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5 px-1">
            Pre-filled with AI-generated name. Tap any chip above to refine.
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
          {results.length === 0 && !searching ? (
            <div className="py-8 text-center text-sm text-gray-400">
              {query ? 'No products found. Try a different search term.' : 'Type a product name to search.'}
            </div>
          ) : (
            results.map((product) => {
              const isLinked = linkedIds.has(product.id)
              const alreadyHasImage = Boolean(product.image) && !isLinked
              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isLinked ? 'border-green-200 bg-green-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                >
                  {/* Current product image (or placeholder) */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {product.brand && <span className="text-[10px] text-gray-400">{product.brand}</span>}
                      <span className="text-[10px] font-semibold" style={{ color: '#5FAE9B' }}>£{Number(product.price).toFixed(2)}</span>
                      {alreadyHasImage && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Has image</span>
                      )}
                    </div>
                  </div>

                  {isLinked ? (
                    <div className="flex items-center gap-1.5 text-green-600 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-semibold">Linked</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => linkToProduct(product)}
                      disabled={linking === product.id}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-bold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: alreadyHasImage ? '#D97706' : '#0F2747' }}
                    >
                      {linking === product.id ? '…' : alreadyHasImage ? 'Replace' : 'Link'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {linkedIds.size > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-green-700 font-medium">{linkedIds.size} product{linkedIds.size !== 1 ? 's' : ''} updated</p>
            <button
              onClick={onLinked}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0F2747' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({ label, value, onClick, color }: { label: string; value: string; onClick?: () => void; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${onClick ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
      style={{ backgroundColor: `${color ?? '#0F2747'}18`, color: color ?? '#0F2747' }}
    >
      <span className="opacity-60">{label}:</span>
      <span className="font-semibold">{value}</span>
    </button>
  )
}
