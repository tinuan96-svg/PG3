'use client'

import { useEffect, useState, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Types ────────────────────────────────────────────────────────────────────

type FoodType = {
  id: string; name: string; slug: string; emoji: string
  description: string; banner_image: string | null
  bg_color: string; accent_color: string; sort_order: number
  is_active: boolean; show_on_homepage: boolean; keywords: string[]
  product_count?: number
}

type AssignedProduct = {
  id: string; product_id: string; name: string; image: string | null; source: 'ai' | 'manual'
}

type Product = { id: string; name: string; image: string | null }

type FoodTypeForm = {
  name: string; slug: string; emoji: string; description: string
  banner_image: string; bg_color: string; accent_color: string
  sort_order: string; is_active: boolean; show_on_homepage: boolean; keywords: string
}

const EMPTY_FORM: FoodTypeForm = {
  name: '', slug: '', emoji: '🍽️', description: '',
  banner_image: '', bg_color: '#0F2747', accent_color: '#5FAE9B',
  sort_order: '0', is_active: true, show_on_homepage: true, keywords: '',
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ─── Availability bar ─────────────────────────────────────────────────────────

function CountBadge({ count }: { count: number }) {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5FAE9B]/15 text-[#5FAE9B]">
      {count} products
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FoodTypesPage() {
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'editor' | 'products'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FoodTypeForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Products panel
  const [activeFt, setActiveFt] = useState<FoodType | null>(null)
  const [assigned, setAssigned] = useState<AssignedProduct[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [classifying, setClassifying] = useState(false)
  const [classifyMsg, setClassifyMsg] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await db.rpc('get_food_types_with_counts')
    setFoodTypes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Product search
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!productSearch.trim()) { setProductResults([]); return }
      const { data } = await db.from('products').select('id,name,image')
        .ilike('name', `%${productSearch}%`)
        .eq('approval_status', 'approved').limit(8)
      setProductResults(data ?? [])
    }, 300)
    return () => clearTimeout(t)
  }, [productSearch])

  async function openProducts(ft: FoodType) {
    setActiveFt(ft)
    const { data } = await db
      .from('food_type_products')
      .select('id, product_id, source, product:products(id, name, image)')
      .eq('food_type_id', ft.id)
      .order('sort_order')
    setAssigned((data ?? []).map((row: { id: string; product_id: string; source: string; product: Product }) => ({
      id: row.id,
      product_id: row.product_id,
      name: row.product?.name ?? '',
      image: row.product?.image ?? null,
      source: row.source as 'ai' | 'manual',
    })))
    setProductSearch('')
    setProductResults([])
    setView('products')
  }

  async function addProduct(p: Product) {
    if (!activeFt) return
    if (assigned.some((a) => a.product_id === p.id)) return
    await db.from('food_type_products').insert({
      food_type_id: activeFt.id, product_id: p.id, source: 'manual', sort_order: assigned.length,
    })
    setAssigned((prev) => [...prev, { id: '', product_id: p.id, name: p.name, image: p.image, source: 'manual' }])
    setProductSearch('')
    setProductResults([])
  }

  async function removeProduct(productId: string) {
    if (!activeFt) return
    await db.from('food_type_products').delete().eq('food_type_id', activeFt.id).eq('product_id', productId)
    setAssigned((prev) => prev.filter((a) => a.product_id !== productId))
  }

  async function runAIClassify() {
    if (!activeFt) return
    setClassifying(true)
    setClassifyMsg('')
    const { data } = await db.rpc('classify_all_approved_products')
    setClassifyMsg(`AI classified ${data ?? 0} products across all food types`)
    await openProducts(activeFt)
    setClassifying(false)
    load()
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setError('')
    setView('editor')
  }

  function openEdit(ft: FoodType) {
    setForm({
      name: ft.name, slug: ft.slug, emoji: ft.emoji,
      description: ft.description, banner_image: ft.banner_image ?? '',
      bg_color: ft.bg_color, accent_color: ft.accent_color,
      sort_order: String(ft.sort_order), is_active: ft.is_active,
      show_on_homepage: ft.show_on_homepage,
      keywords: ft.keywords.join(', '),
    })
    setEditId(ft.id)
    setError('')
    setView('editor')
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    const payload = {
      name: form.name.trim(),
      slug: form.slug || toSlug(form.name),
      emoji: form.emoji,
      description: form.description,
      banner_image: form.banner_image || null,
      bg_color: form.bg_color,
      accent_color: form.accent_color,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      show_on_homepage: form.show_on_homepage,
      keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    }
    if (!editId) {
      const { error: err } = await db.from('food_types').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await db.from('food_types').update(payload).eq('id', editId)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setView('list')
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this food type? All product assignments will be removed.')) return
    await db.from('food_types').delete().eq('id', id)
    setFoodTypes((prev) => prev.filter((f) => f.id !== id))
  }

  async function handleToggle(ft: FoodType) {
    await db.from('food_types').update({ is_active: !ft.is_active }).eq('id', ft.id)
    setFoodTypes((prev) => prev.map((f) => f.id === ft.id ? { ...f, is_active: !f.is_active } : f))
  }

  // ─── Products panel ─────────────────────────────────────────────────────────

  if (view === 'products' && activeFt) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{activeFt.emoji} {activeFt.name} — Products</h1>
              <p className="text-sm text-gray-500 mt-0.5">{assigned.length} products assigned</p>
            </div>
            <button onClick={() => { setView('list'); load() }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
            </button>
          </div>

          {/* AI classify button */}
          <div className="bg-gradient-to-r from-[#0F2747] to-[#1a3a6b] rounded-2xl p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-sm mb-1">✨ AI Auto-Classification</p>
                <p className="text-white/60 text-xs leading-relaxed">
                  Automatically match all approved products to food types based on product name, tags and description. Existing manual assignments are preserved.
                </p>
                {classifyMsg && <p className="text-[#5FAE9B] text-xs mt-2 font-medium">{classifyMsg}</p>}
              </div>
              <button
                onClick={runAIClassify}
                disabled={classifying}
                className="flex-none px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
                style={{ backgroundColor: '#5FAE9B' }}
              >
                {classifying ? 'Classifying…' : 'Run AI Classify'}
              </button>
            </div>
          </div>

          {/* Product search */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
            <p className="text-sm font-semibold text-gray-700">Manually assign product</p>
            <div className="relative">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]"
                placeholder="Search approved products…"
              />
              {productResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                  {productResults.map((p) => (
                    <button key={p.id} onClick={() => addProduct(p)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-100" />
                      ) : <div className="w-8 h-8 rounded-lg bg-gray-100" />}
                      <span className="text-sm text-gray-800">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned list */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {assigned.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No products assigned yet.</p>
              ) : (
                assigned.map((a) => (
                  <div key={a.product_id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                    {a.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.image} alt="" className="w-9 h-9 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                    ) : <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />}
                    <span className="flex-1 text-sm text-gray-800 truncate">{a.name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${a.source === 'manual' ? 'bg-blue-100 text-blue-600' : 'bg-[#5FAE9B]/15 text-[#5FAE9B]'}`}>
                      {a.source === 'manual' ? '✎ Manual' : '✨ AI'}
                    </span>
                    <button onClick={() => removeProduct(a.product_id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // ─── Editor ──────────────────────────────────────────────────────────────────

  if (view === 'editor') {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{editId ? 'Edit Food Type' : 'New Food Type'}</h1>
            <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
            </button>
          </div>

          {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Emoji</label>
                <input value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-lg text-center focus:outline-none focus:border-[#5FAE9B]" />
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Name *</label>
                <input value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || toSlug(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]"
                  placeholder="e.g. Vegetarian" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Slug</label>
                <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#5FAE9B]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Sort order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] resize-none"
                placeholder="Short description shown on cards" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Background colour</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.bg_color} onChange={(e) => setForm((f) => ({ ...f, bg_color: e.target.value }))} className="w-10 h-10 rounded-xl border border-gray-200 p-1 cursor-pointer" />
                  <input value={form.bg_color} onChange={(e) => setForm((f) => ({ ...f, bg_color: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#5FAE9B]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Accent colour</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.accent_color} onChange={(e) => setForm((f) => ({ ...f, accent_color: e.target.value }))} className="w-10 h-10 rounded-xl border border-gray-200 p-1 cursor-pointer" />
                  <input value={form.accent_color} onChange={(e) => setForm((f) => ({ ...f, accent_color: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#5FAE9B]" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Banner Image URL</label>
              <div className="flex items-center gap-2">
                <input value={form.banner_image} onChange={(e) => setForm((f) => ({ ...f, banner_image: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#5FAE9B]" placeholder="https://…" />
                {form.banner_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.banner_image} alt="" className="w-12 h-12 rounded-xl border border-gray-100 object-cover" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                AI Classification Keywords
                <span className="text-gray-400 font-normal ml-1">(comma separated — products matching any keyword will be auto-assigned)</span>
              </label>
              <textarea rows={3} value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] resize-none font-mono"
                placeholder="puttu, appam, idli, dosa, upma…" />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <span className="text-xs text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.show_on_homepage} onChange={(e) => setForm((f) => ({ ...f, show_on_homepage: e.target.checked }))} className="rounded" />
                <span className="text-xs text-gray-700">Show on homepage</span>
              </label>
            </div>

            {/* Preview */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Card preview</p>
              <div className="rounded-2xl overflow-hidden w-36" style={{ backgroundColor: form.bg_color }}>
                <div className="p-4">
                  <p className="text-3xl mb-2">{form.emoji}</p>
                  <p className="text-white font-bold text-sm">{form.name || 'Food Type'}</p>
                  <div className="mt-2 inline-block text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: form.accent_color }}>
                    Shop Now →
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setView('list')} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#0F2747' }}>
              {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // ─── List view ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Food Type Center</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage homepage collections and AI product classification</p>
          </div>
          <button onClick={openCreate} className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '#0F2747' }}>
            + New Food Type
          </button>
        </div>

        {/* AI classify all */}
        <div className="bg-gradient-to-r from-[#0F2747] to-[#1a3a6b] rounded-2xl p-5 text-white flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm mb-1">✨ AI Bulk Classification</p>
            <p className="text-white/60 text-xs">Re-run keyword matching across all approved products to update assignments</p>
          </div>
          <button
            onClick={async () => {
              setClassifying(true)
              const { data } = await db.rpc('classify_all_approved_products')
              setClassifyMsg(`Classified ${data ?? 0} products`)
              setClassifying(false)
              load()
            }}
            disabled={classifying}
            className="flex-none px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
            style={{ backgroundColor: '#5FAE9B' }}
          >
            {classifying ? 'Running…' : 'Run AI Classify'}
          </button>
        </div>
        {classifyMsg && <p className="text-sm text-[#5FAE9B] font-medium">{classifyMsg}</p>}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {foodTypes.map((ft) => (
              <div key={ft.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Coloured header */}
                <div className="px-4 pt-4 pb-3 flex items-center gap-3" style={{ backgroundColor: `${ft.bg_color}20` }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: ft.bg_color }}
                  >
                    {ft.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{ft.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">/collections/{ft.slug}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${ft.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {ft.is_active ? 'Active' : 'Hidden'}
                    </span>
                    {ft.show_on_homepage && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#0F2747]/10 text-[#0F2747]">Homepage</span>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between mb-3 mt-2">
                    <CountBadge count={ft.product_count ?? 0} />
                    {ft.keywords.length > 0 && (
                      <span className="text-[9px] text-gray-400">{ft.keywords.length} keywords</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openProducts(ft)}
                      className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg text-white text-center transition-opacity hover:opacity-90"
                      style={{ backgroundColor: ft.accent_color }}>
                      Manage Products
                    </button>
                    <button onClick={() => openEdit(ft)}
                      className="px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleToggle(ft)}
                      className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${ft.is_active ? 'border border-amber-200 text-amber-600 hover:bg-amber-50' : 'border border-green-200 text-green-600 hover:bg-green-50'}`}>
                      {ft.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => handleDelete(ft.id)}
                      className="px-2 py-1.5 text-xs font-medium rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                      Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
