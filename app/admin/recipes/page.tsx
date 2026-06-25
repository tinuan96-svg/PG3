'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type RecipeIngredient = { id?: string; name: string; quantity: string; unit: string; sort_order: number }
type Product = { id: string; name: string; image: string | null }
type RecipeCategory = { id: string; name: string; slug: string; emoji: string }

type Recipe = {
  id: string; title: string; slug: string; excerpt: string | null
  featured_image: string | null; prep_time_mins: number | null
  cook_time_mins: number | null; servings: number | null
  difficulty: string | null; status: 'draft' | 'published'; created_at: string
  category_id: string | null
}

type RecipeAnalytics = {
  recipe_id: string; title: string; slug: string; status: string
  availability_pct: number; total_products: number; available_products: number
  views: number; basket_clicks: number; add_to_pocket_count: number
  revenue_generated: number; last_viewed_at: string | null
}

type RecipeForm = {
  title: string; slug: string; excerpt: string; content: string
  featured_image: string; prep_time_mins: string; cook_time_mins: string
  servings: string; difficulty: string; status: 'draft' | 'published'
  seo_title: string; seo_description: string; seo_keywords: string
  category_id: string; show_on_homepage: boolean; is_featured: boolean
}

const EMPTY_FORM: RecipeForm = {
  title: '', slug: '', excerpt: '', content: '', featured_image: '',
  prep_time_mins: '', cook_time_mins: '', servings: '', difficulty: 'medium',
  status: 'draft', seo_title: '', seo_description: '', seo_keywords: '',
  category_id: '', show_on_homepage: false, is_featured: false,
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ─── Availability bar ─────────────────────────────────────────────────────────

function AvailBar({ pct, avail, total }: { pct: number; avail: number; total: number }) {
  const color = pct === 100 ? '#5FAE9B' : pct >= 60 ? '#e5a100' : '#e55c5c'
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
        <span>{avail}/{total} in stock</span>
        <span style={{ color }} className="font-bold">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RecipesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [analytics, setAnalytics] = useState<RecipeAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'list' | 'editor' | 'analytics'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<RecipeForm>(EMPTY_FORM)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [linkedProducts, setLinkedProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [tab, setTab] = useState<'all' | 'draft' | 'published'>('all')
  const [editorTab, setEditorTab] = useState<'content' | 'ingredients' | 'products' | 'seo'>('content')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const [{ data: recs }, { data: cats }] = await Promise.all([
      db.from('recipes').select('id,title,slug,excerpt,featured_image,prep_time_mins,cook_time_mins,servings,difficulty,status,created_at,category_id').order('created_at', { ascending: false }),
      db.from('recipe_categories').select('id,name,slug,emoji').order('sort_order'),
    ])
    setRecipes(recs ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }

  async function loadAnalytics() {
    const { data } = await db.rpc('get_recipe_analytics_admin')
    setAnalytics(data ?? [])
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (view === 'analytics') loadAnalytics()
  }, [view])

  async function searchProducts(q: string) {
    if (!q.trim()) { setProductResults([]); return }
    const { data } = await db.from('products').select('id,name,image').ilike('name', `%${q}%`).limit(8)
    setProductResults((data ?? []) as Product[])
  }

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 300)
    return () => clearTimeout(t)
  }, [productSearch])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setIngredients([])
    setLinkedProducts([])
    setError('')
    setEditorTab('content')
    setView('editor')
  }

  async function openEdit(r: Recipe) {
    const [{ data: rec }, { data: ings }, { data: prods }] = await Promise.all([
      db.from('recipes').select('*').eq('id', r.id).maybeSingle(),
      db.from('recipe_ingredients').select('*').eq('recipe_id', r.id).order('sort_order'),
      db.from('recipe_products').select('sort_order, product:products(id, name, image)').eq('recipe_id', r.id).order('sort_order'),
    ])
    if (!rec) return
    setForm({
      title: rec.title,
      slug: rec.slug,
      excerpt: rec.excerpt ?? '',
      content: rec.instructions ?? '',
      featured_image: rec.featured_image ?? '',
      prep_time_mins: rec.prep_time_mins != null ? String(rec.prep_time_mins) : '',
      cook_time_mins: rec.cook_time_mins != null ? String(rec.cook_time_mins) : '',
      servings: rec.servings != null ? String(rec.servings) : '',
      difficulty: rec.difficulty ?? 'medium',
      status: rec.status,
      seo_title: rec.seo_title ?? '',
      seo_description: rec.seo_description ?? '',
      seo_keywords: rec.seo_keywords ?? '',
      category_id: rec.category_id ?? '',
      show_on_homepage: Boolean(rec.show_on_homepage),
      is_featured: Boolean(rec.is_featured),
    })
    setIngredients((ings ?? []).map((i: RecipeIngredient & { id: string }) => ({
      id: i.id, name: i.name, quantity: i.quantity ?? '', unit: i.unit ?? '', sort_order: i.sort_order,
    })))
    setLinkedProducts((prods ?? []).map((p: { product: Product }) => p.product))
    setEditId(r.id)
    setError('')
    setEditorTab('content')
    setView('editor')
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '', sort_order: prev.length }])
  }

  function updateIngredient(idx: number, field: keyof RecipeIngredient, val: string) {
    setIngredients((prev) => prev.map((ing, i) => i === idx ? { ...ing, [field]: val } : ing))
  }

  function removeIngredient(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx))
  }

  function addProduct(p: Product) {
    if (linkedProducts.some((lp) => lp.id === p.id)) return
    setLinkedProducts((prev) => [...prev, p])
    setProductSearch('')
    setProductResults([])
  }

  function removeProduct(id: string) {
    setLinkedProducts((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleSave(publishNow = false) {
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    const status = publishNow ? 'published' : form.status
    const payload = {
      title: form.title.trim(),
      slug: form.slug || toSlug(form.title),
      excerpt: form.excerpt || null,
      instructions: form.content || null,
      featured_image: form.featured_image || null,
      prep_time_mins: form.prep_time_mins ? Number(form.prep_time_mins) : null,
      cook_time_mins: form.cook_time_mins ? Number(form.cook_time_mins) : null,
      servings: form.servings ? Number(form.servings) : null,
      difficulty: form.difficulty || null,
      status,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      seo_keywords: form.seo_keywords || null,
      category_id: form.category_id || null,
      show_on_homepage: form.show_on_homepage,
      is_featured: form.is_featured,
    }

    let recipeId = editId
    if (!editId) {
      const { data, error: err } = await db.from('recipes').insert(payload).select('id').maybeSingle()
      if (err) { setError(err.message); setSaving(false); return }
      recipeId = data?.id
    } else {
      const { error: err } = await db.from('recipes').update(payload).eq('id', editId)
      if (err) { setError(err.message); setSaving(false); return }
    }

    if (recipeId) {
      await db.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
      const validIngs = ingredients.filter((i) => i.name.trim())
      if (validIngs.length > 0) {
        await db.from('recipe_ingredients').insert(
          validIngs.map((ing, idx) => ({
            recipe_id: recipeId, name: ing.name.trim(),
            quantity: ing.quantity || null, unit: ing.unit || null, sort_order: idx,
          }))
        )
      }
      await db.from('recipe_products').delete().eq('recipe_id', recipeId)
      if (linkedProducts.length > 0) {
        await db.from('recipe_products').insert(
          linkedProducts.map((p, idx) => ({ recipe_id: recipeId, product_id: p.id, sort_order: idx }))
        )
      }
    }
    setSaving(false)
    setView('list')
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this recipe?')) return
    await db.from('recipes').delete().eq('id', id)
    setRecipes((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleToggleStatus(r: Recipe) {
    const next = r.status === 'published' ? 'draft' : 'published'
    await db.from('recipes').update({ status: next }).eq('id', r.id)
    setRecipes((prev) => prev.map((x) => x.id === r.id ? { ...x, status: next } : x))
  }

  const filtered = recipes.filter((r) => tab === 'all' || r.status === tab)
  const draftCount = recipes.filter((r) => r.status === 'draft').length
  const publishedCount = recipes.filter((r) => r.status === 'published').length

  // ─── Analytics view ──────────────────────────────────────────────────────

  if (view === 'analytics') {
    return (
      <AdminLayout>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recipe Analytics</h1>
              <p className="text-sm text-gray-500 mt-0.5">Availability, engagement & conversions</p>
            </div>
            <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>

          {/* Summary cards */}
          {analytics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Views', value: analytics.reduce((s, r) => s + r.views, 0).toLocaleString(), icon: '👁️' },
                { label: 'Basket Clicks', value: analytics.reduce((s, r) => s + r.basket_clicks, 0).toLocaleString(), icon: '🛒' },
                { label: 'Add to Pocket', value: analytics.reduce((s, r) => s + r.add_to_pocket_count, 0).toLocaleString(), icon: '📦' },
                { label: 'Revenue', value: `£${analytics.reduce((s, r) => s + Number(r.revenue_generated), 0).toFixed(2)}`, icon: '💷' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="text-xl font-extrabold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    {['Recipe', 'Status', 'Availability', 'Views', 'Basket Clicks', 'Add to Pocket', 'Revenue', 'Last Viewed'].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {analytics.map((r) => (
                    <tr key={r.recipe_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap max-w-[200px] truncate">{r.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${r.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <AvailBar pct={r.availability_pct} avail={r.available_products} total={r.total_products} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700 text-right">{r.views.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700 text-right">{r.basket_clicks.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-right" style={{ color: '#5FAE9B' }}>{r.add_to_pocket_count.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700 text-right">£{Number(r.revenue_generated).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {r.last_viewed_at ? new Date(r.last_viewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analytics.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">No analytics data yet. Views will appear after recipes are published.</div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // ─── Editor view ──────────────────────────────────────────────────────────

  if (view === 'editor') {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{editId ? 'Edit Recipe' : 'New Recipe'}</h1>
              <p className="text-sm text-gray-500 mt-0.5">Status: <span className={`font-medium ${form.status === 'published' ? 'text-green-600' : 'text-amber-600'}`}>{form.status}</span></p>
            </div>
            <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
            </button>
          </div>

          {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex gap-1 px-6 pt-4 border-b border-gray-100 overflow-x-auto">
              {(['content', 'ingredients', 'products', 'seo'] as const).map((t) => (
                <button key={t} onClick={() => setEditorTab(t)}
                  className={`text-sm font-medium px-4 py-2 capitalize border-b-2 transition-colors whitespace-nowrap ${editorTab === t ? 'border-[#0F2747] text-[#0F2747]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t === 'products' ? `Linked Products (${linkedProducts.length})` : t === 'ingredients' ? `Ingredients (${ingredients.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4">
              {editorTab === 'content' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Title *</label>
                    <input value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: f.slug || toSlug(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]"
                      placeholder="Recipe title" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Slug</label>
                      <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#5FAE9B]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                      <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#5FAE9B]">
                        <option value="">No category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Difficulty</label>
                      <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#5FAE9B]">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-3 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.show_on_homepage} onChange={(e) => setForm((f) => ({ ...f, show_on_homepage: e.target.checked }))} className="rounded" />
                        <span className="text-xs text-gray-700">Show on homepage</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} className="rounded" />
                        <span className="text-xs text-gray-700">Featured recipe</span>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Prep (mins)', field: 'prep_time_mins' as const },
                      { label: 'Cook (mins)', field: 'cook_time_mins' as const },
                      { label: 'Servings', field: 'servings' as const },
                    ].map(({ label, field }) => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
                        <input type="number" min="0" value={form[field]}
                          onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Excerpt</label>
                    <textarea rows={2} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] resize-none"
                      placeholder="Brief description" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Instructions</label>
                    <textarea rows={8} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] resize-y"
                      placeholder="One step per line…" />
                    <p className="text-[10px] text-gray-400 mt-1">Enter each step on a new line — they will display as numbered steps.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Featured Image URL</label>
                    <div className="flex items-center gap-2">
                      <input value={form.featured_image} onChange={(e) => setForm((f) => ({ ...f, featured_image: e.target.value }))}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#5FAE9B]"
                        placeholder="https://…" />
                      {form.featured_image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.featured_image} alt="" className="w-12 h-12 rounded-xl border border-gray-100 object-cover bg-gray-50" />
                      )}
                    </div>
                  </div>
                </>
              )}

              {editorTab === 'ingredients' && (
                <div className="space-y-3">
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input value={ing.quantity} onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                        className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B]" placeholder="Qty" />
                      <input value={ing.unit} onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                        className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B]" placeholder="Unit" />
                      <input value={ing.name} onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B]" placeholder="Ingredient name" />
                      <button onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  <button onClick={addIngredient}
                    className="flex items-center gap-1.5 text-sm font-medium text-[#0F2747] border border-[#0F2747] px-3 py-2 rounded-xl hover:bg-[#0F2747]/5 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Ingredient
                  </button>
                </div>
              )}

              {editorTab === 'products' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
                    Link approved products to this recipe. Availability % is calculated from these links.
                  </div>
                  <div className="relative">
                    <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]"
                      placeholder="Search products to link…" />
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
                  {linkedProducts.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No products linked yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {linkedProducts.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-100" />
                          ) : <div className="w-8 h-8 rounded-lg bg-gray-100" />}
                          <span className="flex-1 text-sm text-gray-800">{p.name}</span>
                          <button onClick={() => removeProduct(p.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {editorTab === 'seo' && (
                <>
                  {[
                    { label: 'SEO Title', field: 'seo_title' as const, max: 70, placeholder: '' },
                    { label: 'Meta Description', field: 'seo_description' as const, max: 160, placeholder: '' },
                    { label: 'Keywords', field: 'seo_keywords' as const, max: 255, placeholder: 'comma separated' },
                  ].map(({ label, field, max, placeholder }) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
                      {max <= 70 ? (
                        <input value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                          maxLength={max}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]"
                          placeholder={placeholder} />
                      ) : (
                        <textarea rows={field === 'seo_description' ? 3 : 2}
                          value={form[field]}
                          onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                          maxLength={max}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] resize-none"
                          placeholder={placeholder} />
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">{form[field].length}/{max}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'draft' | 'published' }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#5FAE9B]">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <div className="flex items-center gap-3">
              <button onClick={() => setView('list')} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
              <button onClick={() => handleSave(false)} disabled={saving}
                className="px-5 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              {form.status !== 'published' && (
                <button onClick={() => handleSave(true)} disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#0F2747' }}>
                  Publish
                </button>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // ─── List view ────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recipe Center</h1>
            <p className="text-sm text-gray-500 mt-0.5">{publishedCount} published · {draftCount} draft</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('analytics')}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </button>
            <button onClick={openCreate} className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '#0F2747' }}>
              + New Recipe
            </button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-100">
          {([
            { key: 'all', label: 'All', count: recipes.length },
            { key: 'published', label: 'Published', count: publishedCount },
            { key: 'draft', label: 'Drafts', count: draftCount },
          ] as const).map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-[#0F2747] text-[#0F2747]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {label}
              {count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-[#0F2747] text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">No recipes yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((r) => {
              const cat = categories.find((c) => c.id === r.category_id)
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {r.featured_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.featured_image} alt={r.title} className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-36 bg-gray-50 flex items-center justify-center">
                      <span className="text-4xl opacity-30">🍽️</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2">{r.title}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {cat && (
                      <p className="text-[10px] text-gray-400 mb-2">{cat.emoji} {cat.name}</p>
                    )}
                    {(r.prep_time_mins || r.cook_time_mins || r.servings || r.difficulty) && (
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-3">
                        {r.prep_time_mins && <span>Prep {r.prep_time_mins}m</span>}
                        {r.cook_time_mins && <span>Cook {r.cook_time_mins}m</span>}
                        {r.servings && <span>Serves {r.servings}</span>}
                        {r.difficulty && <span className="capitalize">{r.difficulty}</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(r)} className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-center">Edit</button>
                      <button onClick={() => handleToggleStatus(r)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${r.status === 'published' ? 'border border-amber-200 text-amber-600 hover:bg-amber-50' : 'border border-green-200 text-green-600 hover:bg-green-50'}`}>
                        {r.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">Del</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
