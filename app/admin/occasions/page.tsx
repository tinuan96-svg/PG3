'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

interface Occasion {
  id: string
  name: string
  slug: string
  emoji: string
  description: string
  banner_image: string | null
  bg_color: string
  accent_color: string
  is_active: boolean
  show_on_homepage: boolean
  sort_order: number
  product_count: number
  keywords: string[]
  starts_at: string | null
  ends_at: string | null
}

const EMPTY: Partial<Occasion> = {
  name: '', slug: '', emoji: '🎉', description: '',
  bg_color: '#1B4332', accent_color: '#52B788',
  is_active: false, show_on_homepage: false, sort_order: 0,
  keywords: [], starts_at: null, ends_at: null,
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function OccasionsAdminPage() {
  const [occasions, setOccasions] = useState<Occasion[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [editing, setEditing] = useState<Partial<Occasion>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await db
      .from('occasions')
      .select('*')
      .order('sort_order', { ascending: true })
    setOccasions((data ?? []) as Occasion[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  function openNew() {
    setEditing({ ...EMPTY })
    setView('editor')
  }

  function openEdit(occ: Occasion) {
    setEditing({ ...occ })
    setView('editor')
  }

  async function save() {
    if (!editing.name) return
    setSaving(true)
    const payload = {
      name: editing.name,
      slug: editing.slug || slugify(editing.name!),
      emoji: editing.emoji,
      description: editing.description,
      bg_color: editing.bg_color,
      accent_color: editing.accent_color,
      is_active: editing.is_active,
      show_on_homepage: editing.show_on_homepage,
      sort_order: editing.sort_order,
      keywords: typeof editing.keywords === 'string'
        ? (editing.keywords as string).split(',').map((k: string) => k.trim()).filter(Boolean)
        : editing.keywords,
      starts_at: editing.starts_at || null,
      ends_at: editing.ends_at || null,
      updated_at: new Date().toISOString(),
    }
    if (editing.id) {
      await db.from('occasions').update(payload).eq('id', editing.id)
    } else {
      await db.from('occasions').insert(payload)
    }
    setSaving(false)
    flash('Saved')
    setView('list')
    load()
  }

  async function toggleActive(occ: Occasion) {
    await db.from('occasions').update({ is_active: !occ.is_active }).eq('id', occ.id)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this occasion?')) return
    await db.from('occasions').delete().eq('id', id)
    load()
  }

  async function classifyAll() {
    setClassifying(true)
    const { data, error } = await db.rpc('classify_products_for_occasions')
    setClassifying(false)
    if (error) { flash('Error: ' + error.message); return }
    flash(`AI classified ${data} product-occasion links`)
    load()
  }

  const kw = Array.isArray(editing.keywords) ? editing.keywords.join(', ') : (editing.keywords ?? '')

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {view === 'editor' ? (editing.id ? 'Edit Occasion' : 'New Occasion') : 'Occasion Center'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {view === 'list' ? 'Manage themed shopping occasions with one-click baskets' : 'Configure occasion details and keywords'}
            </p>
          </div>
          <div className="flex gap-2">
            {view === 'list' ? (
              <>
                <button
                  onClick={classifyAll}
                  disabled={classifying}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#5FAE9B] text-[#5FAE9B] hover:bg-[#5FAE9B]/10 transition-colors disabled:opacity-50"
                >
                  {classifying ? 'Classifying...' : 'AI Classify All'}
                </button>
                <button
                  onClick={openNew}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  + New Occasion
                </button>
              </>
            ) : (
              <button
                onClick={() => setView('list')}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back to List
              </button>
            )}
          </div>
        </div>

        {msg && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-200">
            {msg}
          </div>
        )}

        {/* ─── LIST ──────────────────────────────────────────────────────────── */}
        {view === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
                ))
              : occasions.map((occ) => (
                  <div
                    key={occ.id}
                    className="relative rounded-2xl p-4 text-white overflow-hidden"
                    style={{ backgroundColor: occ.bg_color }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{occ.emoji}</span>
                        <div>
                          <p className="font-bold text-sm leading-tight">{occ.name}</p>
                          <p className="text-white/60 text-[11px]">{occ.product_count} products</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => toggleActive(occ)}
                          className="text-[10px] font-bold px-2 py-1 rounded-full border border-white/30 backdrop-blur-sm transition-colors"
                          style={{
                            backgroundColor: occ.is_active ? `${occ.accent_color}40` : 'transparent',
                            color: occ.is_active ? occ.accent_color : 'white',
                          }}
                        >
                          {occ.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                    <p className="text-white/60 text-[11px] mt-2 line-clamp-2">{occ.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => openEdit(occ)}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 transition-colors text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(occ.id)}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-red-400/30 hover:bg-red-400/20 transition-colors text-red-300"
                      >
                        Delete
                      </button>
                      {occ.show_on_homepage && (
                        <span className="text-[10px] text-white/50 ml-auto">Homepage</span>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        )}

        {/* ─── EDITOR ────────────────────────────────────────────────────────── */}
        {view === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Form */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h2 className="font-bold text-gray-800 mb-4 text-sm">Basic Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Emoji</label>
                    <input
                      value={editing.emoji ?? ''}
                      onChange={(e) => setEditing((p) => ({ ...p, emoji: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-2xl"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={editing.sort_order ?? 0}
                      onChange={(e) => setEditing((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Name</label>
                    <input
                      value={editing.name ?? ''}
                      onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                      placeholder="e.g. Onam Sadya"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Slug</label>
                    <input
                      value={editing.slug ?? ''}
                      onChange={(e) => setEditing((p) => ({ ...p, slug: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono"
                      placeholder="onam-sadya"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
                    <textarea
                      value={editing.description ?? ''}
                      onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
                      rows={2}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
                      placeholder="Short occasion description..."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">AI Keywords (comma-separated)</label>
                    <textarea
                      value={kw}
                      onChange={(e) => setEditing((p) => ({ ...p, keywords: e.target.value as unknown as string[] }))}
                      rows={2}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none font-mono"
                      placeholder="onam, sadya, payasam, rice..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h2 className="font-bold text-gray-800 mb-4 text-sm">Colours & Scheduling</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Background</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={editing.bg_color ?? '#1B4332'}
                        onChange={(e) => setEditing((p) => ({ ...p, bg_color: e.target.value }))}
                        className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                      <input value={editing.bg_color ?? ''} onChange={(e) => setEditing((p) => ({ ...p, bg_color: e.target.value }))}
                        className="flex-1 border border-gray-200 rounded-xl px-2 py-2 text-sm font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Accent</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={editing.accent_color ?? '#52B788'}
                        onChange={(e) => setEditing((p) => ({ ...p, accent_color: e.target.value }))}
                        className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                      <input value={editing.accent_color ?? ''} onChange={(e) => setEditing((p) => ({ ...p, accent_color: e.target.value }))}
                        className="flex-1 border border-gray-200 rounded-xl px-2 py-2 text-sm font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Starts At (optional)</label>
                    <input type="datetime-local" value={editing.starts_at?.slice(0, 16) ?? ''}
                      onChange={(e) => setEditing((p) => ({ ...p, starts_at: e.target.value || null }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Ends At (optional)</label>
                    <input type="datetime-local" value={editing.ends_at?.slice(0, 16) ?? ''}
                      onChange={(e) => setEditing((p) => ({ ...p, ends_at: e.target.value || null }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div className="col-span-2 flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={editing.is_active ?? false}
                        onChange={(e) => setEditing((p) => ({ ...p, is_active: e.target.checked }))}
                        className="w-4 h-4 rounded" />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={editing.show_on_homepage ?? false}
                        onChange={(e) => setEditing((p) => ({ ...p, show_on_homepage: e.target.checked }))}
                        className="w-4 h-4 rounded" />
                      <span className="text-sm font-medium text-gray-700">Show on Homepage</span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={save}
                disabled={saving || !editing.name}
                className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-50"
                style={{ backgroundColor: '#0F2747' }}
              >
                {saving ? 'Saving...' : editing.id ? 'Update Occasion' : 'Create Occasion'}
              </button>
            </div>

            {/* Preview */}
            <div className="lg:col-span-1">
              <p className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">Live Preview</p>
              <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: editing.bg_color ?? '#1B4332', minHeight: 200 }}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-5xl">{editing.emoji || '🎉'}</span>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-white/20"
                    style={{ color: editing.accent_color }}>
                    0 items
                  </span>
                </div>
                <h3 className="font-extrabold text-lg mb-1">{editing.name || 'Occasion Name'}</h3>
                <p className="text-white/60 text-xs mb-4 line-clamp-3">{editing.description || 'Occasion description...'}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: editing.accent_color ?? '#52B788' }}>
                  Shop Now →
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
