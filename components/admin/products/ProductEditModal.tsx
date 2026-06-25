'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import ProductImagesManager from '@/components/admin/products/ProductImagesManager'
import MediaPicker from '@/components/admin/MediaPicker'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase as any)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

type Tab = 'general' | 'pricing' | 'inventory' | 'images' | 'seo' | 'diagnostics'

type FullProduct = {
  id: string; name: string; slug: string; brand: string; sku: string
  short_description: string; description: string; image: string; gallery: unknown[]
  category_id: string | null; category_name: string
  price: number; compare_price: number; cost_price: number
  selling_price: number; markup_percentage: number | null
  stock_qty: number; weight_grams: number | null; barcode: string
  unit: string; warehouse_location: string
  seo_title: string; seo_description: string; seo_keywords: string
  featured: boolean; tags: string[]
  approval_status: string; visibility_status: string; approval_notes: string
  needs_admin_review: boolean; centralhub_status: string
  source_product_id: string; centralhub_product_id: string; product_type: string
  original_image_url: string | null; processed_image_url: string | null; thumbnail_url: string | null
  synced_at: string | null; approved_at: string | null
  created_at: string; updated_at: string
}

type DiagRow = { check_name: string; passed: boolean; value: string }
type Category = { id: string; name: string }

type Props = {
  productId: string | null
  queueIds: string[]
  onClose: () => void
  onSaved: (id: string) => void
  onApproved: (id: string) => void
  onRejected: (id: string) => void
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'general',     label: 'General' },
  { key: 'pricing',     label: 'Pricing' },
  { key: 'inventory',   label: 'Inventory' },
  { key: 'images',      label: 'Images' },
  { key: 'seo',         label: 'SEO' },
  { key: 'diagnostics', label: 'Diagnostics' },
]

const STATUS_COLORS: Record<string, string> = {
  draft:    'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string | number; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white"
    />
  )
}

function Textarea({ value, onChange, rows = 3, placeholder }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white resize-none"
    />
  )
}

function AIFieldButton({ loading, disabled, onClick, label }: {
  loading: boolean; disabled: boolean; onClick: () => void; label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 disabled:opacity-40 transition-colors z-10"
    >
      {loading ? (
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        <SparkleIcon className="w-3 h-3" />
      )}
      {loading ? 'Generating…' : label}
    </button>
  )
}

export default function ProductEditModal({ productId, queueIds, onClose, onSaved, onApproved, onRejected }: Props) {
  const [product, setProduct] = useState<FullProduct | null>(null)
  const [form, setForm] = useState<Partial<FullProduct>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [tab, setTab] = useState<Tab>('general')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [flash, setFlash] = useState('')
  const [error, setError] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [diags, setDiags] = useState<DiagRow[]>([])
  const [diagLoading, setDiagLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState<Set<string>>(new Set())

  const setAiField = (field: string, on: boolean) =>
    setAiGenerating((prev) => { const s = new Set(prev); on ? s.add(field) : s.delete(field); return s })

  const isAiRunning = (field: string) => aiGenerating.has(field)
  const anyAiRunning = aiGenerating.size > 0

  const f = (key: keyof FullProduct) => (form[key] ?? product?.[key] ?? '') as string

  const patch = useCallback((updates: Partial<FullProduct>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }, [])

  const loadProduct = useCallback(async (id: string) => {
    setLoading(true)
    setError('')
    setForm({})
    setTab('general')
    const { data, error: err } = await db().rpc('get_admin_product_full', { p_id: id })
    if (err || !data || data.length === 0) {
      setError('Failed to load product')
    } else {
      setProduct(data[0] as FullProduct)
    }
    setLoading(false)
  }, [])

  const loadDiags = useCallback(async (id: string) => {
    setDiagLoading(true)
    const { data } = await db().rpc('get_product_visibility_check', { p_id: id })
    setDiags((data ?? []) as DiagRow[])
    setDiagLoading(false)
  }, [])

  useEffect(() => {
    if (!productId) return
    loadProduct(productId)
  }, [productId, loadProduct])

  useEffect(() => {
    if (tab === 'diagnostics' && productId) loadDiags(productId)
  }, [tab, productId, loadDiags])

  useEffect(() => {
    db().from('categories').select('id, name').order('name').then(({ data }: { data: Category[] | null }) => {
      setCategories(data ?? [])
    })
  }, [])

  async function generateContent(action: 'short_description' | 'full_description' | 'seo' | 'everything') {
    if (!product) return
    const name    = (form.name  ?? product.name  ?? '').trim()
    const brand   = (form.brand ?? product.brand ?? '').trim()
    const catName = (form.category_id ?? product.category_id)
      ? (categories.find((c) => c.id === (form.category_id ?? product.category_id))?.name ?? '')
      : ''
    const wg = form.weight_grams ?? product.weight_grams
    const unit = form.unit ?? product.unit ?? ''
    const weightLabel = wg
      ? (wg >= 1000 ? `${(wg / 1000).toFixed(wg % 1000 === 0 ? 0 : 1)}${unit || 'kg'}` : `${wg}${unit || 'g'}`)
      : unit

    const fields: string[] =
      action === 'short_description' ? ['short_description']
      : action === 'full_description' ? ['full_description']
      : action === 'seo'              ? ['seo']
      : ['short_description', 'full_description', 'seo']

    for (const field of fields) setAiField(field, true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token ?? ''
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-product-content`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action, productName: name, brand, category: catName,
          description: form.description ?? product.description ?? '',
          weight: weightLabel, productId: product.id,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)

      const updates: Partial<FullProduct> = {}
      if (json.short_description) updates.short_description = json.short_description
      if (json.full_description)  updates.description       = json.full_description
      if (json.seo_title)         updates.seo_title         = json.seo_title
      if (json.seo_description)   updates.seo_description   = json.seo_description
      if (json.seo_keywords)      updates.seo_keywords      = json.seo_keywords
      if (json.tags)              updates.tags              = json.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      if (Object.keys(updates).length > 0) patch(updates)
    } catch (err) {
      setError(`AI generation failed: ${err instanceof Error ? err.message : String(err)}`)
    }

    for (const field of fields) setAiField(field, false)
  }

  async function saveFields(extraUpdates: Partial<FullProduct> = {}) {
    if (!product) return
    const merged = { ...form, ...extraUpdates }
    setSaving(true)
    setError('')
    const { error: err } = await db().rpc('update_product_fields', {
      p_id:              product.id,
      p_name:            merged.name            ?? product.name,
      p_brand:           merged.brand           ?? product.brand,
      p_short_desc:      merged.short_description ?? product.short_description,
      p_description:     merged.description      ?? product.description,
      p_category_id:     merged.category_id      ?? product.category_id ?? null,
      p_image:           merged.image            ?? product.image,
      p_price:           merged.price            ?? product.price,
      p_compare_price:   merged.compare_price    ?? product.compare_price,
      p_cost_price:      merged.cost_price       ?? product.cost_price,
      p_selling_price:   merged.selling_price    ?? product.selling_price,
      p_stock_qty:       merged.stock_qty        ?? product.stock_qty,
      p_sku:             merged.sku              ?? product.sku,
      p_barcode:         merged.barcode          ?? product.barcode,
      p_weight_grams:    merged.weight_grams     ?? product.weight_grams,
      p_unit:            merged.unit             ?? product.unit,
      p_seo_title:       merged.seo_title        ?? product.seo_title,
      p_seo_description: merged.seo_description  ?? product.seo_description,
      p_seo_keywords:    merged.seo_keywords     ?? product.seo_keywords,
      p_featured:        merged.featured         ?? product.featured,
      p_tags:            merged.tags             ?? product.tags,
      p_approval_notes:  merged.approval_notes   ?? product.approval_notes,
    })
    setSaving(false)
    if (err) { setError(err.message); return false }
    setProduct((prev) => prev ? { ...prev, ...merged } as FullProduct : prev)
    setForm({})
    return true
  }

  async function handleSave() {
    const ok = await saveFields()
    if (ok) {
      setFlash('Saved')
      setTimeout(() => setFlash(''), 2000)
      if (product) onSaved(product.id)
    }
  }

  async function handleApprove(andNext = false) {
    if (!product) return
    setApproving(true)
    setError('')
    const saved = await saveFields()
    if (!saved) { setApproving(false); return }
    const { error: err } = await db().rpc('approve_product', { p_id: product.id })
    setApproving(false)
    if (err) { setError(err.message); return }
    onApproved(product.id)
    if (andNext) {
      const idx = queueIds.indexOf(product.id)
      const nextId = queueIds[idx + 1] ?? null
      if (nextId) { await loadProduct(nextId) }
      else onClose()
    } else {
      onClose()
    }
  }

  async function handleReject() {
    if (!product) return
    setRejecting(true)
    setError('')
    const { error: err } = await db().rpc('reject_product', { p_id: product.id })
    setRejecting(false)
    if (err) { setError(err.message); return }
    onRejected(product.id)
    onClose()
  }

  if (!productId) return null

  const currentStatus = (form.approval_status ?? product?.approval_status ?? 'draft') as string
  const isDirty = Object.keys(form).length > 0

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto flex flex-col w-full max-w-4xl bg-white shadow-2xl h-full">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
          {loading ? (
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900 truncate">{product?.name ?? '—'}</h2>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{product?.sku || product?.brand || product?.slug}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[currentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                {currentStatus}
              </span>
            </>
          )}
          {isDirty && !loading && (
            <span className="text-xs text-amber-600 font-medium flex-shrink-0">Unsaved changes</span>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 overflow-x-auto flex-shrink-0 px-2">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === key ? 'border-[#0F2747] text-[#0F2747]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : !product ? (
            <div className="p-6 text-center text-sm text-red-500">{error || 'Product not found'}</div>
          ) : (
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
              )}

              {/* ── General ── */}
              {tab === 'general' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex items-center gap-2">
                      <SparkleIcon className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-800">AI Content Generation</span>
                      <span className="text-xs text-amber-600 hidden sm:block">Uses product name, brand, category and weight</span>
                    </div>
                    <button
                      onClick={() => generateContent('everything')}
                      disabled={anyAiRunning}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      {anyAiRunning ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <SparkleIcon className="w-3 h-3" />
                      )}
                      {anyAiRunning ? 'Generating…' : 'Generate Everything'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Product Name">
                      <Input value={f('name')} onChange={(v) => patch({ name: v })} />
                    </Field>
                    <Field label="Brand">
                      <Input value={f('brand')} onChange={(v) => patch({ brand: v })} />
                    </Field>
                  </div>
                  <Field label="Category">
                    <select
                      value={(form.category_id ?? product.category_id) ?? ''}
                      onChange={(e) => patch({ category_id: e.target.value || null })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    >
                      <option value="">— No category —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Short Description">
                    <div className="relative">
                      <Textarea value={f('short_description')} onChange={(v) => patch({ short_description: v })} rows={2} placeholder="One or two sentences…" />
                      <AIFieldButton loading={isAiRunning('short_description')} disabled={anyAiRunning} onClick={() => generateContent('short_description')} label="Generate" />
                    </div>
                  </Field>
                  <Field label="Description">
                    <div className="relative">
                      <Textarea value={f('description')} onChange={(v) => patch({ description: v })} rows={8} placeholder="Full product description…" />
                      <AIFieldButton loading={isAiRunning('full_description')} disabled={anyAiRunning} onClick={() => generateContent('full_description')} label="Generate" />
                    </div>
                  </Field>
                  <Field label="Main Image URL" hint="Paste a direct image URL or use the Images tab to upload.">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input value={f('image')} onChange={(v) => patch({ image: v })} placeholder="https://…" />
                      </div>
                      <button
                        onClick={() => setShowPicker(true)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Pick
                      </button>
                      {(form.image || product.image) && (
                        <img src={form.image ?? product.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" loading="lazy" />
                      )}
                    </div>
                  </Field>
                  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Featured Product</p>
                      <p className="text-xs text-gray-400">Highlights product in featured sections</p>
                    </div>
                    <button
                      onClick={() => patch({ featured: !(form.featured ?? product.featured) })}
                      className={`relative rounded-full transition-colors ${(form.featured ?? product.featured) ? 'bg-[#5FAE9B]' : 'bg-gray-200'}`}
                      style={{ width: 40, height: 22 }}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(form.featured ?? product.featured) ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <Field label="Tags" hint="Comma-separated, e.g. rice, organic, kerala">
                    <Input
                      value={(form.tags ?? product.tags ?? []).join(', ')}
                      onChange={(v) => patch({ tags: v.split(',').map((t) => t.trim()).filter(Boolean) })}
                      placeholder="tag1, tag2, tag3"
                    />
                  </Field>
                  <Field label="Approval Notes">
                    <Textarea value={f('approval_notes')} onChange={(v) => patch({ approval_notes: v })} rows={2} placeholder="Optional notes for rejection or review…" />
                  </Field>
                </div>
              )}

              {/* ── Pricing ── */}
              {tab === 'pricing' && (
                <div className="space-y-5">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                    Cost price comes from CentralHub. Set selling price and compare price for the storefront.
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Cost Price (CentralHub)" hint="Synced from CentralHub. Do not edit unless correcting.">
                      <Input type="number" value={Number(form.cost_price ?? product.cost_price ?? 0)} onChange={(v) => patch({ cost_price: Number(v) })} />
                    </Field>
                    <Field label="Selling Price" hint="Price shown on storefront.">
                      <Input type="number" value={Number(form.selling_price ?? product.selling_price ?? form.price ?? product.price ?? 0)} onChange={(v) => patch({ selling_price: Number(v), price: Number(v) })} />
                    </Field>
                    <Field label="Compare Price" hint="Crossed-out 'was' price for promotions.">
                      <Input type="number" value={Number(form.compare_price ?? product.compare_price ?? 0)} onChange={(v) => patch({ compare_price: Number(v) })} />
                    </Field>
                    <Field label="Markup %" hint="Auto-calculated from cost vs selling price.">
                      <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500">
                        {product.markup_percentage != null
                          ? `${Number(product.markup_percentage).toFixed(1)}%`
                          : product.cost_price && product.price
                            ? `${(((product.price - product.cost_price) / product.cost_price) * 100).toFixed(1)}%`
                            : '—'}
                      </div>
                    </Field>
                  </div>
                </div>
              )}

              {/* ── Inventory ── */}
              {tab === 'inventory' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Stock Quantity">
                      <Input type="number" value={Number(form.stock_qty ?? product.stock_qty ?? 0)} onChange={(v) => patch({ stock_qty: Number(v) })} />
                    </Field>
                    <Field label="SKU">
                      <Input value={f('sku')} onChange={(v) => patch({ sku: v })} placeholder="e.g. RICE-5KG" />
                    </Field>
                    <Field label="Barcode / EAN">
                      <Input value={f('barcode')} onChange={(v) => patch({ barcode: v })} />
                    </Field>
                    <Field label="Weight (grams)">
                      <Input type="number" value={Number(form.weight_grams ?? product.weight_grams ?? 0)} onChange={(v) => patch({ weight_grams: Number(v) })} />
                    </Field>
                    <Field label="Unit">
                      <Input value={f('unit')} onChange={(v) => patch({ unit: v })} placeholder="e.g. 5kg, 500g, each" />
                    </Field>
                    <Field label="Warehouse Location">
                      <Input value={f('warehouse_location')} onChange={(v) => patch({ warehouse_location: v })} placeholder="e.g. A1-B3" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-xs font-medium text-gray-500">CentralHub Status</p>
                      <p className="text-sm text-gray-800 mt-0.5">{product.centralhub_status}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">CentralHub Product ID</p>
                      <p className="text-sm font-mono text-gray-800 mt-0.5 truncate">{product.centralhub_product_id || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Last Synced</p>
                      <p className="text-sm text-gray-800 mt-0.5">{product.synced_at ? new Date(product.synced_at).toLocaleString('en-GB') : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Product Type</p>
                      <p className="text-sm text-gray-800 mt-0.5">{product.product_type}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Images ── */}
              {tab === 'images' && (
                <ProductImagesManager productId={product.id} productName={product.name} />
              )}

              {/* ── SEO ── */}
              {tab === 'seo' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex items-center gap-2">
                      <SparkleIcon className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-800">AI SEO Generation</span>
                      <span className="text-xs text-amber-600 hidden sm:block">Optimised for Malayali UK audience</span>
                    </div>
                    <button
                      onClick={() => generateContent('seo')}
                      disabled={anyAiRunning}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      {isAiRunning('seo') ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <SparkleIcon className="w-3 h-3" />
                      )}
                      {isAiRunning('seo') ? 'Generating…' : 'Generate SEO'}
                    </button>
                  </div>
                  <Field label="SEO Title" hint="50–60 characters recommended. Leave blank to use product name.">
                    <Input value={f('seo_title')} onChange={(v) => patch({ seo_title: v })} />
                    <p className="text-xs text-gray-400 mt-1">{f('seo_title').length} chars</p>
                  </Field>
                  <Field label="SEO Description" hint="150–160 characters recommended.">
                    <Textarea value={f('seo_description')} onChange={(v) => patch({ seo_description: v })} rows={3} />
                    <p className="text-xs text-gray-400 mt-1">{f('seo_description').length} chars</p>
                  </Field>
                  <Field label="Keywords" hint="Comma-separated.">
                    <Input value={f('seo_keywords')} onChange={(v) => patch({ seo_keywords: v })} placeholder="kerala rice, indian groceries…" />
                  </Field>
                  <Field label="URL Slug" hint="Auto-generated. Contact dev team to change.">
                    <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 font-mono">
                      {product.slug}
                    </div>
                  </Field>
                </div>
              )}

              {/* ── Diagnostics ── */}
              {tab === 'diagnostics' && (
                <div className="space-y-4">
                  <div className="bg-[#0F2747]/5 border border-[#0F2747]/10 rounded-xl p-4 text-sm text-gray-700">
                    This panel shows exactly why a product is or is not appearing on the storefront.
                    A product needs <strong>Approval Status = approved</strong> and <strong>Visibility Status = visible</strong> to be live.
                  </div>
                  {diagLoading ? (
                    <div className="space-y-2">
                      {[...Array(10)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      {diags.map((row, i) => (
                        <div key={i} className={`flex items-center justify-between px-4 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${row.passed ? 'bg-emerald-500' : 'bg-red-400'}`}>
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {row.passed
                                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />}
                              </svg>
                            </span>
                            <span className="text-sm font-medium text-gray-800">{row.check_name}</span>
                          </div>
                          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${row.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!loading && product && (
          <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-3">
              {flash && (
                <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {flash}
                </span>
              )}
              {currentStatus === 'approved' && (
                <button
                  onClick={() => { db().rpc('restore_product_to_draft', { p_id: product.id }); onRejected(product.id); onClose() }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
                >
                  Move to Draft
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentStatus !== 'approved' && (
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {rejecting ? 'Rejecting…' : 'Reject'}
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
              {currentStatus !== 'approved' && (
                <button
                  onClick={() => handleApprove(true)}
                  disabled={approving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#5FAE9B' }}
                >
                  {approving ? 'Approving…' : 'Approve & Next'}
                </button>
              )}
              <button
                onClick={() => handleApprove(false)}
                disabled={approving}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#0F2747' }}
              >
                {approving ? '…' : currentStatus === 'approved' ? 'Save & Close' : 'Approve'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showPicker && (
        <MediaPicker
          onSelect={(url) => { patch({ image: url }); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
          title="Select Product Image"
        />
      )}
    </div>
  )
}