'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

type Announcement = {
  id: string
  message: string
  type: string
  bg_color: string | null
  text_color: string | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

const TYPE_OPTIONS = ['info', 'success', 'warning', 'promo']
const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  info:    { bg: '#EFF6FF', text: '#1D4ED8', label: 'Info' },
  success: { bg: '#F0FDF4', text: '#15803D', label: 'Success' },
  warning: { bg: '#FFFBEB', text: '#B45309', label: 'Warning' },
  promo:   { bg: '#0F2747',  text: '#FFFFFF', label: 'Promo' },
}

const EMPTY = {
  message: '',
  type: 'info',
  bg_color: '#EFF6FF',
  text_color: '#1D4ED8',
  is_active: true,
  starts_at: '',
  ends_at: '',
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setAnnouncements(data as Announcement[] ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(EMPTY)
    setEditId(null)
    setError('')
    setModal('create')
  }

  function openEdit(a: Announcement) {
    setForm({
      message: a.message,
      type: a.type,
      bg_color: a.bg_color ?? '#EFF6FF',
      text_color: a.text_color ?? '#1D4ED8',
      is_active: a.is_active,
      starts_at: a.starts_at ? a.starts_at.slice(0, 16) : '',
      ends_at: a.ends_at ? a.ends_at.slice(0, 16) : '',
    })
    setEditId(a.id)
    setError('')
    setModal('edit')
  }

  function setType(t: string) {
    const c = TYPE_COLORS[t]
    setForm((f) => ({ ...f, type: t, bg_color: c?.bg ?? f.bg_color, text_color: c?.text ?? f.text_color }))
  }

  async function handleSave() {
    if (!form.message.trim()) { setError('Message is required'); return }
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    }
    let err
    if (modal === 'create') {
      ;({ error: err } = await supabase.from('announcements').insert(payload))
    } else {
      ;({ error: err } = await supabase.from('announcements').update(payload).eq('id', editId!))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    setModal(null)
    load()
  }

  async function handleToggle(id: string, val: boolean) {
    await supabase.from('announcements').update({ is_active: val }).eq('id', id)
    setAnnouncements((prev) => prev.map((a) => a.id === id ? { ...a, is_active: val } : a))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement?')) return
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }

  function isLive(a: Announcement) {
    if (!a.is_active) return false
    const now = Date.now()
    if (a.starts_at && new Date(a.starts_at).getTime() > now) return false
    if (a.ends_at && new Date(a.ends_at).getTime() < now) return false
    return true
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
            <p className="text-sm text-gray-500 mt-0.5">{announcements.filter(isLive).length} live</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0F2747' }}
          >
            + Add Announcement
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)
          ) : announcements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
              No announcements yet.
            </div>
          ) : announcements.map((a) => {
            const live = isLive(a)
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* preview */}
                    <div
                      className="px-4 py-2.5 rounded-xl text-sm font-medium mb-3 truncate"
                      style={{ backgroundColor: a.bg_color ?? '#EFF6FF', color: a.text_color ?? '#1D4ED8' }}
                    >
                      {a.message}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 font-medium">{TYPE_COLORS[a.type]?.label ?? a.type}</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${live ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {live ? 'Live' : 'Inactive'}
                      </span>
                      {a.starts_at && <span>From {new Date(a.starts_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                      {a.ends_at && <span>Until {new Date(a.ends_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(a.id, !a.is_active)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {a.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => openEdit(a)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Edit</button>
                    <button onClick={() => handleDelete(a.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">Del</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{modal === 'create' ? 'Add Announcement' : 'Edit Announcement'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Message *</label>
                <textarea
                  rows={2}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B] resize-none"
                  placeholder="Free delivery on orders over £40!"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Type</label>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.type === t ? 'border-[#0F2747] ring-2 ring-[#0F2747]/10' : 'border-gray-200'}`}
                      style={form.type === t ? { backgroundColor: TYPE_COLORS[t]?.bg, color: TYPE_COLORS[t]?.text } : {}}
                    >
                      {TYPE_COLORS[t]?.label ?? t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.bg_color ?? '#EFF6FF'} onChange={(e) => setForm((f) => ({ ...f, bg_color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                    <input value={form.bg_color ?? ''} onChange={(e) => setForm((f) => ({ ...f, bg_color: e.target.value }))} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.text_color ?? '#1D4ED8'} onChange={(e) => setForm((f) => ({ ...f, text_color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                    <input value={form.text_color ?? ''} onChange={(e) => setForm((f) => ({ ...f, text_color: e.target.value }))} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none" />
                  </div>
                </div>
              </div>

              {form.message && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Preview</label>
                  <div
                    className="px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: form.bg_color ?? '#EFF6FF', color: form.text_color ?? '#1D4ED8' }}
                  >
                    {form.message}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Start Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">End Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#0F2747' }}
              >
                {saving ? 'Saving...' : modal === 'create' ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
