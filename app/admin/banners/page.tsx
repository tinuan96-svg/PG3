'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

type Banner = {
  id: string
  title: string | null
  subtitle: string | null
  image: string | null
  mobile_image: string | null
  button_text: string | null
  button_link: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

const EMPTY: Omit<Banner, 'id' | 'created_at'> = {
  title: '',
  subtitle: '',
  image: '',
  mobile_image: '',
  button_text: '',
  button_link: '',
  display_order: 0,
  is_active: true,
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [form, setForm] = useState<Omit<Banner, 'id' | 'created_at'>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('banners').select('*').order('display_order', { ascending: true })
    setBanners(data as Banner[] ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(EMPTY)
    setEditId(null)
    setError('')
    setModal('create')
  }

  function openEdit(b: Banner) {
    setForm({
      title: b.title ?? '',
      subtitle: b.subtitle ?? '',
      image: b.image ?? '',
      mobile_image: b.mobile_image ?? '',
      button_text: b.button_text ?? '',
      button_link: b.button_link ?? '',
      display_order: b.display_order,
      is_active: b.is_active,
    })
    setEditId(b.id)
    setError('')
    setModal('edit')
  }

  async function handleSave() {
    if (!form.image?.trim()) { setError('Image URL is required'); return }
    setSaving(true)
    setError('')
    let err
    if (modal === 'create') {
      ;({ error: err } = await supabase.from('banners').insert(form))
    } else {
      ;({ error: err } = await supabase.from('banners').update(form).eq('id', editId!))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    setModal(null)
    load()
  }

  async function handleToggle(id: string, val: boolean) {
    await supabase.from('banners').update({ is_active: val }).eq('id', id)
    setBanners((prev) => prev.map((b) => b.id === id ? { ...b, is_active: val } : b))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this banner?')) return
    await supabase.from('banners').delete().eq('id', id)
    setBanners((prev) => prev.filter((b) => b.id !== id))
  }

  const Field = ({ label, value, onChange, placeholder = '', mono = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B] ${mono ? 'font-mono' : ''}`}
      />
    </div>
  )

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
            <p className="text-sm text-gray-500 mt-0.5">{banners.length} banner{banners.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0F2747' }}
          >
            + Add Banner
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)
          ) : banners.length === 0 ? (
            <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
              No banners yet. Add your first banner.
            </div>
          ) : banners.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative h-40 bg-gray-100">
                {b.image ? (
                  <img src={b.image} alt={b.title ?? ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                    {b.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 text-gray-600">#{b.display_order}</span>
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-900 text-sm truncate">{b.title || <span className="text-gray-400 italic">No title</span>}</p>
                {b.subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{b.subtitle}</p>}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleToggle(b.id, !b.is_active)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {b.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => openEdit(b)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(b.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{modal === 'create' ? 'Add Banner' : 'Edit Banner'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}

              <Field label="Desktop Image URL *" value={form.image ?? ''} onChange={(v) => setForm((f) => ({ ...f, image: v }))} placeholder="https://..." mono />
              <Field label="Mobile Image URL" value={form.mobile_image ?? ''} onChange={(v) => setForm((f) => ({ ...f, mobile_image: v }))} placeholder="https://... (optional)" mono />

              {form.image && (
                <div className="h-32 rounded-xl overflow-hidden bg-gray-100">
                  <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Title" value={form.title ?? ''} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Banner headline" />
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                  />
                </div>
              </div>
              <Field label="Subtitle" value={form.subtitle ?? ''} onChange={(v) => setForm((f) => ({ ...f, subtitle: v }))} placeholder="Supporting text" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Button Text" value={form.button_text ?? ''} onChange={(v) => setForm((f) => ({ ...f, button_text: v }))} placeholder="Shop Now" />
                <Field label="Button Link" value={form.button_link ?? ''} onChange={(v) => setForm((f) => ({ ...f, button_link: v }))} placeholder="/products" mono />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">Active (show on site)</span>
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
                {saving ? 'Saving...' : modal === 'create' ? 'Add Banner' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
