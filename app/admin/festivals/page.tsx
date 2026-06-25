'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

interface Campaign {
  id: string
  name: string
  slug: string
  emoji: string
  description: string
  banner_image: string | null
  banner_link: string | null
  bg_color: string
  accent_color: string
  is_active: boolean
  auto_activate: boolean
  starts_at: string
  ends_at: string
}

const EMPTY: Partial<Campaign> = {
  name: '', slug: '', emoji: '🎉', description: '',
  bg_color: '#0F2747', accent_color: '#5FAE9B',
  is_active: false, auto_activate: true,
  starts_at: '', ends_at: '',
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function isLive(c: Campaign) {
  const now = Date.now()
  return new Date(c.starts_at).getTime() <= now && new Date(c.ends_at).getTime() >= now
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function FestivalsAdminPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [editing, setEditing] = useState<Partial<Campaign>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await db
      .from('festival_campaigns')
      .select('*')
      .order('starts_at', { ascending: true })
    setCampaigns((data ?? []) as Campaign[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  async function save() {
    if (!editing.name || !editing.starts_at || !editing.ends_at) return
    setSaving(true)
    const payload = {
      name: editing.name,
      slug: editing.slug || slugify(editing.name!),
      emoji: editing.emoji,
      description: editing.description,
      bg_color: editing.bg_color,
      accent_color: editing.accent_color,
      banner_image: editing.banner_image || null,
      banner_link: editing.banner_link || null,
      is_active: editing.is_active,
      auto_activate: editing.auto_activate,
      starts_at: new Date(editing.starts_at!).toISOString(),
      ends_at: new Date(editing.ends_at!).toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (editing.id) {
      await db.from('festival_campaigns').update(payload).eq('id', editing.id)
    } else {
      await db.from('festival_campaigns').insert(payload)
    }
    setSaving(false)
    flash('Saved')
    setView('list')
    load()
  }

  async function toggleActive(c: Campaign) {
    await db.from('festival_campaigns').update({ is_active: !c.is_active }).eq('id', c.id)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this campaign?')) return
    await db.from('festival_campaigns').delete().eq('id', id)
    load()
  }

  const now = new Date()
  const upcomingCount = campaigns.filter((c) => new Date(c.starts_at) > now).length
  const liveCount = campaigns.filter(isLive).length

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {view === 'editor' ? (editing.id ? 'Edit Campaign' : 'New Campaign') : 'Festival Calendar'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Auto-activating banners tied to festival dates</p>
          </div>
          <div className="flex gap-2">
            {view === 'list' ? (
              <button onClick={() => { setEditing({ ...EMPTY }); setView('editor') }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#0F2747' }}>
                + New Campaign
              </button>
            ) : (
              <button onClick={() => setView('list')}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                Back to List
              </button>
            )}
          </div>
        </div>

        {msg && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-200">{msg}</div>
        )}

        {view === 'list' && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Campaigns', value: campaigns.length, color: '#0F2747' },
                { label: 'Currently Live', value: liveCount, color: '#16a34a' },
                { label: 'Upcoming', value: upcomingCount, color: '#2563eb' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
                  <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)
                : campaigns.map((c) => {
                    const live = isLive(c)
                    return (
                      <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                        <div className="text-3xl w-10 text-center flex-shrink-0">{c.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold text-sm text-gray-800">{c.name}</p>
                            {live && <span className="text-[9px] font-bold text-white bg-green-500 px-1.5 py-0.5 rounded-full">LIVE</span>}
                            {c.auto_activate && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">Auto</span>}
                          </div>
                          <p className="text-[11px] text-gray-400">{fmtDate(c.starts_at)} — {fmtDate(c.ends_at)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => toggleActive(c)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors"
                            style={c.is_active
                              ? { backgroundColor: '#dcfce7', color: '#16a34a', borderColor: '#bbf7d0' }
                              : { backgroundColor: '#f3f4f6', color: '#6b7280', borderColor: '#e5e7eb' }}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <button onClick={() => { setEditing({ ...c }); setView('editor') }}
                            className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => remove(c.id)}
                            className="text-xs px-2.5 py-1 rounded-full border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
            </div>
          </>
        )}

        {view === 'editor' && (
          <div className="max-w-2xl space-y-5">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
              <h2 className="font-bold text-gray-800 text-sm">Campaign Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Emoji</label>
                  <input value={editing.emoji ?? ''} onChange={(e) => setEditing((p) => ({ ...p, emoji: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-2xl" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Slug</label>
                  <input value={editing.slug ?? ''} onChange={(e) => setEditing((p) => ({ ...p, slug: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Name</label>
                  <input value={editing.name ?? ''}
                    onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
                  <textarea value={editing.description ?? ''} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
                    rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Banner Image URL (optional)</label>
                  <input value={editing.banner_image ?? ''} onChange={(e) => setEditing((p) => ({ ...p, banner_image: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Banner Link URL (optional)</label>
                  <input value={editing.banner_link ?? ''} onChange={(e) => setEditing((p) => ({ ...p, banner_link: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="/occasions/onam-sadya" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Starts At</label>
                  <input type="datetime-local" value={editing.starts_at?.slice(0,16) ?? ''}
                    onChange={(e) => setEditing((p) => ({ ...p, starts_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Ends At</label>
                  <input type="datetime-local" value={editing.ends_at?.slice(0,16) ?? ''}
                    onChange={(e) => setEditing((p) => ({ ...p, ends_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Background</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={editing.bg_color ?? '#0F2747'}
                      onChange={(e) => setEditing((p) => ({ ...p, bg_color: e.target.value }))}
                      className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                    <input value={editing.bg_color ?? ''} onChange={(e) => setEditing((p) => ({ ...p, bg_color: e.target.value }))}
                      className="flex-1 border border-gray-200 rounded-xl px-2 py-2 text-sm font-mono" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Accent</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={editing.accent_color ?? '#5FAE9B'}
                      onChange={(e) => setEditing((p) => ({ ...p, accent_color: e.target.value }))}
                      className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                    <input value={editing.accent_color ?? ''} onChange={(e) => setEditing((p) => ({ ...p, accent_color: e.target.value }))}
                      className="flex-1 border border-gray-200 rounded-xl px-2 py-2 text-sm font-mono" />
                  </div>
                </div>
                <div className="col-span-2 flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editing.is_active ?? false}
                      onChange={(e) => setEditing((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded" />
                    <span className="text-sm font-medium text-gray-700">Force Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editing.auto_activate ?? true}
                      onChange={(e) => setEditing((p) => ({ ...p, auto_activate: e.target.checked }))} className="w-4 h-4 rounded" />
                    <span className="text-sm font-medium text-gray-700">Auto-activate by dates</span>
                  </label>
                </div>
              </div>
            </div>
            <button onClick={save} disabled={saving || !editing.name}
              className="w-full py-3 rounded-2xl font-bold text-white text-sm disabled:opacity-50"
              style={{ backgroundColor: '#0F2747' }}>
              {saving ? 'Saving...' : editing.id ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
