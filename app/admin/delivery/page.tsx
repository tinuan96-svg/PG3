'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

type DeliverySetting = {
  id: string
  method_name: string
  description: string | null
  base_fee: number
  free_threshold: number | null
  estimated_days: string | null
  is_enabled: boolean
  sort_order: number
}

const EMPTY: Omit<DeliverySetting, 'id'> = {
  method_name: '',
  description: '',
  base_fee: 0,
  free_threshold: null,
  estimated_days: '',
  is_enabled: true,
  sort_order: 0,
}

export default function DeliveryPage() {
  const [methods, setMethods] = useState<DeliverySetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('delivery_settings')
      .select('*')
      .order('sort_order', { ascending: true })
    setMethods(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(EMPTY)
    setEditId(null)
    setError('')
    setModal('create')
  }

  function openEdit(m: DeliverySetting) {
    setForm({
      method_name: m.method_name,
      description: m.description ?? '',
      base_fee: m.base_fee,
      free_threshold: m.free_threshold,
      estimated_days: m.estimated_days ?? '',
      is_enabled: m.is_enabled,
      sort_order: m.sort_order,
    })
    setEditId(m.id)
    setError('')
    setModal('edit')
  }

  async function handleSave() {
    if (!form.method_name.trim()) { setError('Method name is required'); return }
    setSaving(true)
    setError('')
    const payload = { ...form, free_threshold: form.free_threshold || null }
    let err
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    if (modal === 'create') {
      ;({ error: err } = await db.from('delivery_settings').insert(payload))
    } else {
      ;({ error: err } = await db.from('delivery_settings').update(payload).eq('id', editId!))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    setModal(null)
    load()
  }

  async function handleToggle(id: string, val: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('delivery_settings').update({ is_enabled: val }).eq('id', id)
    setMethods((prev) => prev.map((m) => m.id === id ? { ...m, is_enabled: val } : m))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this delivery method?')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('delivery_settings').delete().eq('id', id)
    setMethods((prev) => prev.filter((m) => m.id !== id))
  }

  const fmt = (n: number) => `£${n.toFixed(2)}`

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">{methods.filter((m) => m.is_enabled).length} active method{methods.filter((m) => m.is_enabled).length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0F2747' }}
          >
            + Add Method
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)
          ) : methods.length === 0 ? (
            <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
              No delivery methods configured.
            </div>
          ) : methods.map((m) => (
            <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${m.is_enabled ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{m.method_name}</p>
                  {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {m.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Base Fee</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{fmt(m.base_fee)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Free Over</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{m.free_threshold ? fmt(m.free_threshold) : '—'}</p>
                </div>
              </div>

              {m.estimated_days && (
                <p className="text-xs text-gray-500 mb-3">
                  <span className="font-medium">Est. delivery:</span> {m.estimated_days}
                </p>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(m.id, !m.is_enabled)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {m.is_enabled ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => openEdit(m)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Edit</button>
                <button onClick={() => handleDelete(m.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">Del</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{modal === 'create' ? 'Add Delivery Method' : 'Edit Delivery Method'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Method Name *</label>
                <input
                  value={form.method_name}
                  onChange={(e) => setForm((f) => ({ ...f, method_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                  placeholder="Standard Delivery"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                <input
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                  placeholder="Delivered within 3-5 working days"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Base Fee (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.base_fee}
                    onChange={(e) => setForm((f) => ({ ...f, base_fee: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Free Over (£, optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.free_threshold ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, free_threshold: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                    placeholder="e.g. 40"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Estimated Days</label>
                  <input
                    value={form.estimated_days ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, estimated_days: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                    placeholder="3-5 working days"
                  />
                </div>
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm((f) => ({ ...f, is_enabled: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">Enabled</span>
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
                {saving ? 'Saving...' : modal === 'create' ? 'Add Method' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
