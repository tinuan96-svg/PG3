'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

type Brand = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  website: string | null
  is_active: boolean
  featured: boolean
  sort_order: number
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  centralhub_id: string | null
  synced_at: string | null
  product_count?: number
}

type FormState = {
  name: string
  slug: string
  description: string
  logo_url: string
  banner_url: string
  website: string
  is_active: boolean
  featured: boolean
  sort_order: number
  seo_title: string
  seo_description: string
  seo_keywords: string
}

const EMPTY: FormState = {
  name: '',
  slug: '',
  description: '',
  logo_url: '',
  banner_url: '',
  website: '',
  is_active: true,
  featured: false,
  sort_order: 0,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'general' | 'seo'>('general')

  async function load() {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('brands')
      .select('*')
      .order('name', { ascending: true })
    setBrands(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(EMPTY)
    setEditId(null)
    setError('')
    setActiveTab('general')
    setModal('create')
  }

  function openEdit(b: Brand) {
    setForm({
      name: b.name,
      slug: b.slug,
      description: b.description ?? '',
      logo_url: b.logo_url ?? '',
      banner_url: b.banner_url ?? '',
      website: b.website ?? '',
      is_active: b.is_active,
      featured: b.featured,
      sort_order: b.sort_order,
      seo_title: b.seo_title ?? '',
      seo_description: b.seo_description ?? '',
      seo_keywords: b.seo_keywords ?? '',
    })
    setEditId(b.id)
    setError('')
    setActiveTab('general')
    setModal('edit')
  }

  function handleNameChange(v: string) {
    setForm((f) => ({
      ...f,
      name: v,
      slug: f.slug || toSlug(v),
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Brand name is required'); return }
    if (!form.slug.trim()) { setError('Slug is required'); return }
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description || null,
      logo_url: form.logo_url || null,
      banner_url: form.banner_url || null,
      website: form.website || null,
      is_active: form.is_active,
      featured: form.featured,
      sort_order: form.sort_order,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      seo_keywords: form.seo_keywords || null,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    let err
    if (modal === 'create') {
      ;({ error: err } = await db.from('brands').insert(payload))
    } else {
      ;({ error: err } = await db.from('brands').update(payload).eq('id', editId!))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    setModal(null)
    load()
  }

  async function handleToggle(id: string, field: 'is_active' | 'featured', val: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('brands').update({ [field]: val }).eq('id', id)
    setBrands((prev) => prev.map((b) => b.id === id ? { ...b, [field]: val } : b))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this brand? This cannot be undone.')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('brands').delete().eq('id', id)
    setBrands((prev) => prev.filter((b) => b.id !== id))
  }

  async function syncFromCentralHub() {
    setSyncing(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-supplier-products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ sync_type: 'brands_only' }),
        }
      )
      if (!res.ok) throw new Error(`Sync failed: ${res.status}`)
      await load()
    } catch (e) {
      setError(String(e))
    } finally {
      setSyncing(false)
    }
  }

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = brands.filter((b) => b.is_active).length
  const featuredCount = brands.filter((b) => b.featured).length

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {brands.length} brands &middot; {activeCount} active &middot; {featuredCount} featured
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={syncFromCentralHub}
              disabled={syncing}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync from CentralHub'}
            </button>
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0F2747' }}
            >
              + Add Brand
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search brands…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xs px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#5FAE9B] transition-colors"
            />
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              {search ? 'No brands match your search.' : 'No brands yet. Add one or sync from CentralHub.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-medium">Brand</th>
                    <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Slug</th>
                    <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Source</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Featured</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {b.logo_url ? (
                            <img
                              src={b.logo_url}
                              alt={b.name}
                              className="w-8 h-8 rounded-lg object-contain border border-gray-100 bg-gray-50"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                              {b.name[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{b.name}</p>
                            {b.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{b.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 hidden md:table-cell">{b.slug}</td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        {b.centralhub_id ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">CentralHub</span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Manual</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleToggle(b.id, 'is_active', !b.is_active)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${b.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {b.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleToggle(b.id, 'featured', !b.featured)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${b.featured ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        >
                          {b.featured ? 'Featured' : 'No'}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => openEdit(b)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Edit</button>
                          {!b.centralhub_id && (
                            <button onClick={() => handleDelete(b.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">Del</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{modal === 'create' ? 'Add Brand' : 'Edit Brand'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex gap-1 px-6 pt-4 border-b border-gray-100">
              {(['general', 'seo'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`text-sm font-medium px-4 py-2 capitalize border-b-2 transition-colors ${activeTab === t ? 'border-[#0F2747] text-[#0F2747]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  {t === 'general' ? 'General' : 'SEO'}
                </button>
              ))}
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}

              {activeTab === 'general' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Brand Name *</label>
                      <input
                        value={form.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                        placeholder="e.g. Nirapara"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Slug *</label>
                      <input
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                        placeholder="nirapara"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B] resize-none"
                      placeholder="Short brand description"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Logo URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          value={form.logo_url}
                          onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                          placeholder="https://..."
                        />
                        {form.logo_url && (
                          <img src={form.logo_url} alt="" className="w-10 h-10 rounded-lg border border-gray-100 object-contain bg-gray-50" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Banner URL</label>
                      <input
                        value={form.banner_url}
                        onChange={(e) => setForm((f) => ({ ...f, banner_url: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Website</label>
                      <input
                        value={form.website}
                        onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                        placeholder="https://brand.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Sort Order</label>
                      <input
                        type="number"
                        value={form.sort_order}
                        onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="rounded" />
                      <span className="text-sm text-gray-700">Featured</span>
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'seo' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">SEO Title</label>
                    <input
                      value={form.seo_title}
                      onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                      maxLength={70}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                      placeholder="Brand name – Buy online UK"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">{form.seo_title.length}/70</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Meta Description</label>
                    <textarea
                      rows={3}
                      value={form.seo_description}
                      onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
                      maxLength={160}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B] resize-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">{form.seo_description.length}/160</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Keywords</label>
                    <input
                      value={form.seo_keywords}
                      onChange={(e) => setForm((f) => ({ ...f, seo_keywords: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                      placeholder="comma separated keywords"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#0F2747' }}
              >
                {saving ? 'Saving…' : modal === 'create' ? 'Add Brand' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
