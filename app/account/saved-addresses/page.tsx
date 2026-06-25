'use client'

import { useState, useEffect, useCallback } from 'react'
import AccountLayout from '@/components/AccountLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomerAddress {
  id: string
  customer_id: string
  full_name: string
  phone: string
  address_line_1: string
  address_line_2: string
  city: string
  county: string
  postcode: string
  country: string
  delivery_notes: string
  address_type: 'home' | 'work' | 'other'
  is_default: boolean
  created_at: string
}

type FormState = Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at'>

const EMPTY_FORM: FormState = {
  full_name: '', phone: '', address_line_1: '', address_line_2: '',
  city: '', county: '', postcode: '', country: 'United Kingdom',
  delivery_notes: '', address_type: 'home', is_default: false,
}

const ADDRESS_TYPES = [
  { value: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { value: 'work', label: 'Work', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { value: 'other', label: 'Other', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
]

// ─── Address card ─────────────────────────────────────────────────────────────

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: CustomerAddress
  onEdit: (a: CustomerAddress) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}) {
  const type = ADDRESS_TYPES.find(t => t.value === address.address_type) ?? ADDRESS_TYPES[0]
  return (
    <div
      className={`relative rounded-2xl border-2 p-5 transition-all ${
        address.is_default
          ? 'border-[#5FAE9B] bg-[#EBF4F1]'
          : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      {address.is_default && (
        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#5FAE9B' }}>
          Default
        </span>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none" style={{ backgroundColor: '#EBF4F1' }}>
          <svg className="w-4 h-4" fill="none" stroke="#5FAE9B" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={type.icon} />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{type.label}</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{address.full_name}</p>
        </div>
      </div>

      <div className="text-sm text-gray-600 leading-relaxed ml-12">
        <p>{address.address_line_1}</p>
        {address.address_line_2 && <p>{address.address_line_2}</p>}
        <p>{address.city}{address.county ? `, ${address.county}` : ''}</p>
        <p className="font-medium">{address.postcode.toUpperCase()}</p>
        {address.phone && <p className="text-gray-400 text-xs mt-1">{address.phone}</p>}
        {address.delivery_notes && (
          <p className="text-gray-400 text-xs mt-1 italic">"{address.delivery_notes}"</p>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        {!address.is_default && (
          <button
            onClick={() => onSetDefault(address.id)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Set as default
          </button>
        )}
        <button
          onClick={() => onEdit(address)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: '#5FAE9B', backgroundColor: '#EBF4F1' }}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(address.id)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ─── Address form modal ───────────────────────────────────────────────────────

function AddressModal({
  initial,
  onClose,
  onSave,
}: {
  initial: (CustomerAddress & { id?: string }) | null
  onClose: () => void
  onSave: (form: FormState, id?: string) => Promise<void>
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? { full_name: initial.full_name, phone: initial.phone,
          address_line_1: initial.address_line_1, address_line_2: initial.address_line_2,
          city: initial.city, county: initial.county, postcode: initial.postcode,
          country: initial.country, delivery_notes: initial.delivery_notes,
          address_type: initial.address_type, is_default: initial.is_default }
      : { ...EMPTY_FORM }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Full name is required'); return }
    if (!form.address_line_1.trim()) { setError('Address line 1 is required'); return }
    if (!form.city.trim()) { setError('City is required'); return }
    if (!form.postcode.trim()) { setError('Postcode is required'); return }
    setSaving(true)
    setError('')
    try {
      await onSave(form, initial?.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save address')
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ name, label, placeholder, required = false, type = 'text', colSpan = false }: {
    name: keyof FormState; label: string; placeholder?: string; required?: boolean; type?: string; colSpan?: boolean
  }) => (
    <div className={colSpan ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[name] as string}
        onChange={e => set(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#5FAE9B] transition-colors bg-white"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-bold" style={{ color: '#0F2747' }}>
            {initial?.id ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Address type selector */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Address Type</p>
            <div className="flex gap-2">
              {ADDRESS_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('address_type', t.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    form.address_type === t.value
                      ? 'border-[#5FAE9B] bg-[#EBF4F1] text-[#3a8c7c]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                  </svg>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field name="full_name" label="Full Name" placeholder="Jane Smith" required colSpan={false} />
            <Field name="phone" label="Phone Number" placeholder="+44 7700 000000" type="tel" />
          </div>

          {/* Address */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field name="address_line_1" label="Address Line 1" placeholder="123 High Street" required colSpan />
            <Field name="address_line_2" label="Address Line 2" placeholder="Flat 4, Floor 2" colSpan />
            <Field name="city" label="City / Town" placeholder="London" required />
            <Field name="county" label="County" placeholder="Greater London" />
            <Field name="postcode" label="Postcode" placeholder="E17 5AB" required />
            <Field name="country" label="Country" placeholder="United Kingdom" />
          </div>

          {/* Delivery notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Delivery Instructions (optional)</label>
            <textarea
              value={form.delivery_notes}
              onChange={e => set('delivery_notes', e.target.value)}
              placeholder="Leave at door, ring bell, etc."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#5FAE9B] transition-colors resize-none"
            />
          </div>

          {/* Default toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={e => set('is_default', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-9 h-5 rounded-full transition-colors ${form.is_default ? 'bg-[#5FAE9B]' : 'bg-gray-200'}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_default ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm text-gray-700 font-medium">Set as default delivery address</span>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#0F2747' }}>
              {saving ? 'Saving...' : initial?.id ? 'Save Changes' : 'Add Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavedAddressesPage() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CustomerAddress | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await (supabase as any)
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
    setAddresses((data as CustomerAddress[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  async function handleSave(form: FormState, id?: string) {
    if (!user) return
    if (id) {
      const { error } = await (supabase as any)
        .from('customer_addresses')
        .update({ ...form, postcode: form.postcode.toUpperCase() })
        .eq('id', id)
        .eq('customer_id', user.id)
      if (error) throw new Error(error.message)
      showToast('Address updated')
    } else {
      const { error } = await (supabase as any)
        .from('customer_addresses')
        .insert({ ...form, postcode: form.postcode.toUpperCase(), customer_id: user.id })
      if (error) throw new Error(error.message)
      showToast('Address saved')
    }
    await load()
  }

  async function handleDelete(id: string) {
    if (!user) return
    await (supabase as any)
      .from('customer_addresses')
      .delete()
      .eq('id', id)
      .eq('customer_id', user.id)
    setDeleteId(null)
    showToast('Address deleted')
    await load()
  }

  async function handleSetDefault(id: string) {
    if (!user) return
    await (supabase as any)
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('customer_id', user.id)
    showToast('Default address updated')
    await load()
  }

  function openAdd() { setEditing(null); setShowModal(true) }
  function openEdit(a: CustomerAddress) { setEditing(a); setShowModal(true) }

  const Sk = () => <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />

  return (
    <AccountLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold" style={{ color: '#0F2747' }}>Saved Addresses</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your delivery addresses for faster checkout</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#0F2747' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Address
          </button>
        </div>

        {/* Addresses */}
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <Sk /><Sk />
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EBF4F1' }}>
              <svg className="w-7 h-7" fill="none" stroke="#5FAE9B" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">No saved addresses yet</h3>
            <p className="text-xs text-gray-400 mb-4">Add your delivery address to speed up checkout</p>
            <button
              onClick={openAdd}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0F2747' }}
            >
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map(addr => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={openEdit}
                onDelete={(id) => setDeleteId(id)}
                onSetDefault={handleSetDefault}
              />
            ))}

            {/* Add new tile */}
            <button
              onClick={openAdd}
              className="rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors min-h-[180px]"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-xs font-semibold">Add New Address</span>
            </button>
          </div>
        )}

        {/* Info banner */}
        {addresses.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-blue-100 bg-blue-50">
            <svg className="w-4 h-4 text-blue-400 flex-none mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-700">Your default address is automatically selected at checkout. You can change it anytime during checkout.</p>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <AddressModal
          initial={editing}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Delete this address?</h3>
            <p className="text-xs text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl transition-all"
          style={{ backgroundColor: '#0F2747' }}>
          {toast}
        </div>
      )}
    </AccountLayout>
  )
}
