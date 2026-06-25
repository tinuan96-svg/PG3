'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type HomepageSection = {
  id: string
  section_key: string
  title: string
  is_enabled: boolean
  display_order: number
}

type Banner = {
  id: string
  title: string
  subtitle: string
  cta_text: string
  cta_url: string
  badge_text: string
  badge_color: string
  background_color: string
  image_url: string
  display_order: number
  is_active: boolean
}

type DeliveryRegion = {
  id: string
  name: string
  description: string
  href: string
  display_order: number
  is_active: boolean
}

type Category = {
  id: string
  name: string
  slug: string
  show_on_homepage: boolean
  homepage_order: number
}

type Brand = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  show_on_homepage: boolean
  homepage_order: number
}

type FlashDealProduct = {
  id: string
  name: string
  slug: string
  price: number
  deal_price: number | null
  deal_ends_at: string | null
  is_flash_deal: boolean
  approval_status: string
}

type Recipe = {
  id: string
  title: string
  slug: string
  difficulty: string | null
  show_on_homepage: boolean
  is_featured: boolean
  status: string
}

type Tab = 'sections' | 'banners' | 'categories' | 'flash_deals' | 'brands' | 'recipes' | 'delivery'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'sections',    label: 'Section Order',     icon: 'M4 6h16M4 12h16M4 18h16' },
  { key: 'banners',     label: 'Hero Banners',      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'categories',  label: 'Featured Categories', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { key: 'flash_deals', label: 'Flash Deals',       icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { key: 'brands',      label: 'Popular Brands',    icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { key: 'recipes',     label: 'Recipes Section',   icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { key: 'delivery',    label: 'Delivery Regions',  icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase as any

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-[#5FAE9B]' : 'bg-gray-200'}`}
      role="switch"
      aria-checked={value}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-5' : 'left-1'}`} />
    </button>
  )
}

function SaveToast({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#0F2747] text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
      <svg className="w-4 h-4 text-[#5FAE9B]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Saved
    </div>
  )
}

// ─── Section Order Tab ────────────────────────────────────────────────────────

function SectionsTab() {
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    db()
      .from('homepage_sections')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data }: { data: HomepageSection[] | null }) => {
        setSections(data ?? [])
        setLoading(false)
      })
  }, [])

  async function toggle(id: string, val: boolean) {
    setSaving(id)
    await db().from('homepage_sections').update({ is_enabled: val }).eq('id', id)
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, is_enabled: val } : s))
    setSaving(null)
  }

  async function move(id: string, dir: 'up' | 'down') {
    const idx = sections.findIndex((s) => s.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === sections.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const updated = [...sections]
    const aOrd = updated[idx].display_order
    const bOrd = updated[swapIdx].display_order
    updated[idx] = { ...updated[idx], display_order: bOrd }
    updated[swapIdx] = { ...updated[swapIdx], display_order: aOrd }
    updated.sort((a, b) => a.display_order - b.display_order)
    setSections(updated)
    await Promise.all([
      db().from('homepage_sections').update({ display_order: bOrd }).eq('id', id),
      db().from('homepage_sections').update({ display_order: aOrd }).eq('id', updated[dir === 'up' ? idx : swapIdx].id),
    ])
  }

  const ICONS: Record<string, string> = {
    hero:             'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    flash_deals:      'M13 10V3L4 14h7v7l9-11h-7z',
    trending:         'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    best_sellers:     'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    categories:       'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    brands:           'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    cook_and_shop:    'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    new_arrivals:     'M12 4v16m8-8H4',
    community_favs:   'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    delivery_regions: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
    newsletter:       'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Drag-to-reorder is coming. Use arrows for now to set display order.</p>
      {sections.map((section, idx) => (
        <div
          key={section.id}
          className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 transition-all ${section.is_enabled ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}
        >
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button onClick={() => move(section.id, 'up')} disabled={idx === 0} className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button onClick={() => move(section.id, 'down')} disabled={idx === sections.length - 1} className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: section.is_enabled ? '#EBF4F1' : '#F3F4F6' }}>
            <svg className="w-4 h-4" style={{ color: section.is_enabled ? '#5FAE9B' : '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={ICONS[section.section_key] ?? 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{section.title}</p>
            <p className="text-xs text-gray-400 font-mono">{section.section_key}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${section.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {section.is_enabled ? 'Visible' : 'Hidden'}
            </span>
            <Toggle value={section.is_enabled} onChange={(v) => toggle(section.id, v)} />
            {saving === section.id && (
              <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Banner Tab ───────────────────────────────────────────────────────────────

const EMPTY_BANNER: Omit<Banner, 'id'> = {
  title: '',
  subtitle: '',
  cta_text: 'Shop Now',
  cta_url: '/products',
  badge_text: '',
  badge_color: '#5FAE9B',
  background_color: 'from-[#0F2747] to-[#1a3a6b]',
  image_url: '',
  display_order: 0,
  is_active: true,
}

const BG_PRESETS = [
  { label: 'Navy', value: 'from-[#0F2747] to-[#1a3a6b]' },
  { label: 'Forest', value: 'from-[#1a4a3a] to-[#0d3020]' },
  { label: 'Rust', value: 'from-[#5C2A0D] to-[#3d1a08]' },
  { label: 'Teal', value: 'from-[#1a5a4a] to-[#0d3a2a]' },
  { label: 'Slate', value: 'from-[#1e3a5f] to-[#0f2040]' },
]

function BannersTab() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Banner> | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)

  const load = useCallback(async () => {
    const { data } = await db().from('homepage_banners').select('*').order('display_order', { ascending: true })
    setBanners(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!editing) return
    setSaving(true)
    if (editing.id) {
      await db().from('homepage_banners').update({ ...editing, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      await db().from('homepage_banners').insert({ ...EMPTY_BANNER, ...editing })
    }
    setSaving(false)
    setEditing(null)
    setToast(true)
    setTimeout(() => setToast(false), 2000)
    load()
  }

  async function toggleActive(id: string, val: boolean) {
    await db().from('homepage_banners').update({ is_active: val }).eq('id', id)
    setBanners((prev) => prev.map((b) => b.id === id ? { ...b, is_active: val } : b))
  }

  async function deleteBanner(id: string) {
    if (!confirm('Delete this banner?')) return
    await db().from('homepage_banners').delete().eq('id', id)
    setBanners((prev) => prev.filter((b) => b.id !== id))
  }

  async function move(id: string, dir: 'up' | 'down') {
    const idx = banners.findIndex((b) => b.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === banners.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const updated = [...banners]
    const aOrd = updated[idx].display_order
    const bOrd = updated[swapIdx].display_order
    updated[idx] = { ...updated[idx], display_order: bOrd }
    updated[swapIdx] = { ...updated[swapIdx], display_order: aOrd }
    updated.sort((a, b) => a.display_order - b.display_order)
    setBanners(updated)
    await Promise.all([
      db().from('homepage_banners').update({ display_order: bOrd }).eq('id', id),
      db().from('homepage_banners').update({ display_order: aOrd }).eq('id', updated[dir === 'up' ? idx : swapIdx].id),
    ])
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-4">
      <SaveToast show={toast} />
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({ ...EMPTY_BANNER, display_order: banners.length })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: '#0F2747' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Banner
        </button>
      </div>

      {banners.length === 0 ? (
        <EmptyState label="No banners yet. Add one to display the hero slider." />
      ) : (
        <div className="space-y-3">
          {banners.map((banner, idx) => (
            <div key={banner.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-start transition-all ${!banner.is_active ? 'opacity-50' : ''}`}>
              <div className="flex flex-col gap-1 flex-shrink-0 pt-1">
                <button onClick={() => move(banner.id, 'up')} disabled={idx === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                </button>
                <button onClick={() => move(banner.id, 'down')} disabled={idx === banners.length - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>

              <div
                className={`w-24 h-16 rounded-xl flex-shrink-0 flex items-end p-2 bg-gradient-to-br ${banner.background_color}`}
              >
                {banner.badge_text && (
                  <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: banner.badge_color }}>
                    {banner.badge_text}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{banner.title || '(No title)'}</p>
                {banner.subtitle && <p className="text-xs text-gray-500 truncate mt-0.5">{banner.subtitle}</p>}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">{banner.cta_url}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Toggle value={banner.is_active} onChange={(v) => toggleActive(banner.id, v)} />
                <button
                  onClick={() => setEditing(banner)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteBanner(banner.id)}
                  className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{editing.id ? 'Edit Banner' : 'Add Banner'}</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Title *" value={editing.title ?? ''} onChange={(v) => setEditing((p) => ({ ...p, title: v }))} />
              <Field label="Subtitle" value={editing.subtitle ?? ''} onChange={(v) => setEditing((p) => ({ ...p, subtitle: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="CTA Text" value={editing.cta_text ?? ''} onChange={(v) => setEditing((p) => ({ ...p, cta_text: v }))} />
                <Field label="CTA URL" value={editing.cta_url ?? ''} onChange={(v) => setEditing((p) => ({ ...p, cta_url: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Badge Text" value={editing.badge_text ?? ''} onChange={(v) => setEditing((p) => ({ ...p, badge_text: v }))} />
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Badge Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={editing.badge_color ?? '#5FAE9B'} onChange={(e) => setEditing((p) => ({ ...p, badge_color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                    <span className="text-xs text-gray-400 font-mono">{editing.badge_color}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">Background Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {BG_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setEditing((prev) => ({ ...prev, background_color: p.value }))}
                      className={`h-10 rounded-lg bg-gradient-to-br ${p.value} text-white text-[9px] font-bold flex items-center justify-center border-2 transition-all ${editing.background_color === p.value ? 'border-white shadow-md scale-105' : 'border-transparent'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Image URL (optional)" value={editing.image_url ?? ''} onChange={(v) => setEditing((p) => ({ ...p, image_url: v }))} placeholder="https://..." />
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Active</label>
                <Toggle value={editing.is_active ?? true} onChange={(v) => setEditing((p) => ({ ...p, is_active: v }))} />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving || !editing.title} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: '#0F2747' }}>
                {saving ? 'Saving…' : 'Save Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    db()
      .from('categories')
      .select('id,name,slug,show_on_homepage,homepage_order')
      .eq('is_active', true)
      .order('homepage_order', { ascending: true })
      .then(({ data }: { data: Category[] | null }) => {
        setCategories(data ?? [])
        setLoading(false)
      })
  }, [])

  async function toggleHomepage(id: string, val: boolean) {
    await db().from('categories').update({ show_on_homepage: val }).eq('id', id)
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, show_on_homepage: val } : c))
    setToast(true)
    setTimeout(() => setToast(false), 1500)
  }

  const featured = categories.filter((c) => c.show_on_homepage)

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-4">
      <SaveToast show={toast} />
      <div className="bg-[#5FAE9B]/10 border border-[#5FAE9B]/20 rounded-xl px-4 py-3 text-sm text-[#3d8a77]">
        {featured.length} categories featured on homepage. Toggle to show/hide each category.
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900">{cat.name}</p>
              <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
            </div>
            <Toggle value={cat.show_on_homepage} onChange={(v) => toggleHomepage(cat.id, v)} />
          </div>
        ))}
        {categories.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No categories found.</div>
        )}
      </div>
    </div>
  )
}

// ─── Flash Deals Tab ──────────────────────────────────────────────────────────

function FlashDealsTab() {
  const [products, setProducts] = useState<FlashDealProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDeal, setEditDeal] = useState<{ deal_price: string; deal_ends_at: string }>({ deal_price: '', deal_ends_at: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)

  const load = useCallback(async () => {
    const { data } = await db()
      .from('products')
      .select('id,name,slug,price,deal_price,deal_ends_at,is_flash_deal,approval_status')
      .eq('approval_status', 'approved')
      .order('name', { ascending: true })
      .limit(100)
    setProducts(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleFlashDeal(id: string, val: boolean) {
    await db().from('products').update({ is_flash_deal: val }).eq('id', id)
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_flash_deal: val } : p))
  }

  async function saveDealDetails() {
    if (!editingId) return
    setSaving(true)
    await db().from('products').update({
      deal_price: editDeal.deal_price ? Number(editDeal.deal_price) : null,
      deal_ends_at: editDeal.deal_ends_at || null,
    }).eq('id', editingId)
    setSaving(false)
    setEditingId(null)
    setToast(true)
    setTimeout(() => setToast(false), 1500)
    load()
  }

  const flashDeals = products.filter((p) => p.is_flash_deal)
  const nonFlash = products.filter((p) => !p.is_flash_deal)

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-4">
      <SaveToast show={toast} />
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
        {flashDeals.length} products currently marked as flash deals.
      </div>

      {flashDeals.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Flash Deals</p>
          </div>
          {flashDeals.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{p.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">List: £{Number(p.price).toFixed(2)}</span>
                  {p.deal_price && <span className="text-xs font-semibold text-[#5FAE9B]">Deal: £{Number(p.deal_price).toFixed(2)}</span>}
                  {p.deal_ends_at && <span className="text-xs text-gray-400">Ends: {new Date(p.deal_ends_at).toLocaleDateString('en-GB')}</span>}
                </div>
              </div>
              <button
                onClick={() => { setEditingId(p.id); setEditDeal({ deal_price: String(p.deal_price ?? p.price), deal_ends_at: p.deal_ends_at ? p.deal_ends_at.slice(0, 16) : '' }) }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Set Price
              </button>
              <Toggle value={true} onChange={(v) => toggleFlashDeal(p.id, v)} />
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">All Approved Products — Toggle to Add Flash Deal</p>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
          {nonFlash.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">£{Number(p.price).toFixed(2)}</p>
              </div>
              <Toggle value={false} onChange={(v) => toggleFlashDeal(p.id, v)} />
            </div>
          ))}
          {nonFlash.length === 0 && flashDeals.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No approved products found.</div>
          )}
        </div>
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Set Deal Details</h3>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Deal Price (£)" type="number" value={editDeal.deal_price} onChange={(v) => setEditDeal((p) => ({ ...p, deal_price: v }))} />
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Deal Ends At</label>
                <input
                  type="datetime-local"
                  value={editDeal.deal_ends_at}
                  onChange={(e) => setEditDeal((p) => ({ ...p, deal_ends_at: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B]"
                />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={saveDealDetails} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: '#0F2747' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Brands Tab ───────────────────────────────────────────────────────────────

function BrandsTab() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Brand> | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)

  const load = useCallback(async () => {
    const { data } = await db()
      .from('brands')
      .select('id,name,slug,description,color,show_on_homepage,homepage_order')
      .order('homepage_order', { ascending: true })
      .limit(50)
    setBrands(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleBrand(id: string, val: boolean) {
    await db().from('brands').update({ show_on_homepage: val }).eq('id', id)
    setBrands((prev) => prev.map((b) => b.id === id ? { ...b, show_on_homepage: val } : b))
  }

  async function saveBrand() {
    if (!editing?.id) return
    setSaving(true)
    await db().from('brands').update({
      description: editing.description,
      color: editing.color,
      homepage_order: editing.homepage_order ?? 0,
    }).eq('id', editing.id)
    setSaving(false)
    setEditing(null)
    setToast(true)
    setTimeout(() => setToast(false), 1500)
    load()
  }

  const featured = brands.filter((b) => b.show_on_homepage)

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-4">
      <SaveToast show={toast} />
      <div className="bg-[#5FAE9B]/10 border border-[#5FAE9B]/20 rounded-xl px-4 py-3 text-sm text-[#3d8a77]">
        {featured.length} brands showing on homepage.
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {brands.map((brand) => (
          <div key={brand.id} className="flex items-center gap-4 px-5 py-3.5">
            <div
              className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: brand.color || '#0F2747' }}
            >
              {brand.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900">{brand.name}</p>
              {brand.description && <p className="text-xs text-gray-400 truncate">{brand.description}</p>}
            </div>
            <button
              onClick={() => setEditing(brand)}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              Edit
            </button>
            <Toggle value={brand.show_on_homepage} onChange={(v) => toggleBrand(brand.id, v)} />
          </div>
        ))}
        {brands.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No brands found. Add brands in the Brands module first.</div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Edit Brand — {editing.name}</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Homepage Description" value={editing.description ?? ''} onChange={(v) => setEditing((p) => ({ ...p, description: v }))} />
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Brand Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={editing.color ?? '#0F2747'} onChange={(e) => setEditing((p) => ({ ...p, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                  <span className="text-xs text-gray-400 font-mono">{editing.color}</span>
                </div>
              </div>
              <Field label="Homepage Order" type="number" value={String(editing.homepage_order ?? 0)} onChange={(v) => setEditing((p) => ({ ...p, homepage_order: Number(v) }))} />
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={saveBrand} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: '#0F2747' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Recipes Tab ──────────────────────────────────────────────────────────────

function RecipesTab() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    db()
      .from('recipes')
      .select('id,title,slug,difficulty,show_on_homepage,is_featured,status')
      .order('title', { ascending: true })
      .limit(100)
      .then(({ data }: { data: Recipe[] | null }) => {
        setRecipes(data ?? [])
        setLoading(false)
      })
  }, [])

  async function toggleHomepage(id: string, val: boolean) {
    await db().from('recipes').update({ show_on_homepage: val }).eq('id', id)
    setRecipes((prev) => prev.map((r) => r.id === id ? { ...r, show_on_homepage: val } : r))
    setToast(true)
    setTimeout(() => setToast(false), 1500)
  }

  async function toggleFeatured(id: string, val: boolean) {
    await db().from('recipes').update({ is_featured: val }).eq('id', id)
    setRecipes((prev) => prev.map((r) => r.id === id ? { ...r, is_featured: val } : r))
  }

  const featured = recipes.filter((r) => r.show_on_homepage)

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-4">
      <SaveToast show={toast} />
      <div className="bg-[#5FAE9B]/10 border border-[#5FAE9B]/20 rounded-xl px-4 py-3 text-sm text-[#3d8a77]">
        {featured.length} recipes showing on homepage. Only published recipes appear on the site.
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-gray-900 truncate">{recipe.title}</p>
                {recipe.status !== 'published' && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">{recipe.status}</span>
                )}
              </div>
              {recipe.difficulty && <p className="text-xs text-gray-400">{recipe.difficulty}</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recipe.is_featured}
                  onChange={(e) => toggleFeatured(recipe.id, e.target.checked)}
                  className="rounded"
                />
                Featured
              </label>
              <Toggle value={recipe.show_on_homepage} onChange={(v) => toggleHomepage(recipe.id, v)} />
            </div>
          </div>
        ))}
        {recipes.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No recipes found. Add recipes in the Recipes module first.</div>
        )}
      </div>
    </div>
  )
}

// ─── Delivery Regions Tab ─────────────────────────────────────────────────────

const EMPTY_REGION: Omit<DeliveryRegion, 'id'> = {
  name: '',
  description: '',
  href: '',
  display_order: 0,
  is_active: true,
}

function DeliveryTab() {
  const [regions, setRegions] = useState<DeliveryRegion[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<DeliveryRegion> | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)

  const load = useCallback(async () => {
    const { data } = await db()
      .from('delivery_regions')
      .select('*')
      .order('display_order', { ascending: true })
    setRegions(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!editing) return
    setSaving(true)
    if (editing.id) {
      await db().from('delivery_regions').update({ ...editing }).eq('id', editing.id)
    } else {
      await db().from('delivery_regions').insert({ ...EMPTY_REGION, ...editing })
    }
    setSaving(false)
    setEditing(null)
    setToast(true)
    setTimeout(() => setToast(false), 1500)
    load()
  }

  async function toggleRegion(id: string, val: boolean) {
    await db().from('delivery_regions').update({ is_active: val }).eq('id', id)
    setRegions((prev) => prev.map((r) => r.id === id ? { ...r, is_active: val } : r))
  }

  async function deleteRegion(id: string) {
    if (!confirm('Delete this region?')) return
    await db().from('delivery_regions').delete().eq('id', id)
    setRegions((prev) => prev.filter((r) => r.id !== id))
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-4">
      <SaveToast show={toast} />
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({ ...EMPTY_REGION, display_order: regions.length })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: '#0F2747' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Region
        </button>
      </div>
      {regions.length === 0 ? (
        <EmptyState label="No delivery regions. Add one to display the delivery section." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {regions.map((region) => (
            <div key={region.id} className={`flex items-center gap-4 px-5 py-3.5 ${!region.is_active ? 'opacity-50' : ''}`}>
              <div
                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: '#0F2747' }}
              >
                {region.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900">{region.name}</p>
                {region.description && <p className="text-xs text-gray-400 truncate">{region.description}</p>}
                {region.href && <p className="text-[10px] text-gray-400 font-mono truncate">{region.href}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Toggle value={region.is_active} onChange={(v) => toggleRegion(region.id, v)} />
                <button onClick={() => setEditing(region)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => deleteRegion(region.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{editing.id ? 'Edit Region' : 'Add Region'}</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Region Name *" value={editing.name ?? ''} onChange={(v) => setEditing((p) => ({ ...p, name: v }))} placeholder="e.g. London" />
              <Field label="Description" value={editing.description ?? ''} onChange={(v) => setEditing((p) => ({ ...p, description: v }))} placeholder="e.g. Same region next day delivery" />
              <Field label="URL (for SEO page)" value={editing.href ?? ''} onChange={(v) => setEditing((p) => ({ ...p, href: v }))} placeholder="/kerala-groceries-london" />
              <Field label="Display Order" type="number" value={String(editing.display_order ?? 0)} onChange={(v) => setEditing((p) => ({ ...p, display_order: Number(v) }))} />
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Active</label>
                <Toggle value={editing.is_active ?? true} onChange={(v) => setEditing((p) => ({ ...p, is_active: v }))} />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving || !editing.name} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: '#0F2747' }}>
                {saving ? 'Saving…' : 'Save Region'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-700 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B]"
      />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomepagePage() {
  const [tab, setTab] = useState<Tab>('sections')

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Homepage Control Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Everything here controls what visitors see on the homepage</p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-2xl">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'sections'    && <SectionsTab />}
        {tab === 'banners'     && <BannersTab />}
        {tab === 'categories'  && <CategoriesTab />}
        {tab === 'flash_deals' && <FlashDealsTab />}
        {tab === 'brands'      && <BrandsTab />}
        {tab === 'recipes'     && <RecipesTab />}
        {tab === 'delivery'    && <DeliveryTab />}
      </div>
    </AdminLayout>
  )
}
