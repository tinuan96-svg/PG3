'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

type Customer = {
  id: string
  full_name: string | null
  email: string | null
  role: string
  created_at: string
  total_spent?: number
  order_count?: number
}

type CustomerNote = {
  id: string
  note: string
  created_at: string
}

type CustomerOrder = {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-teal-100 text-teal-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([])
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const load = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    let query = db
      .from('user_profiles')
      .select('id, full_name, email, role, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (search.trim()) {
      query = db
        .from('user_profiles')
        .select('id, full_name, email, role, created_at')
        .eq('role', 'customer')
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    }

    const { data } = await query
    setCustomers((data ?? []) as Customer[])
    setLoading(false)
  }, [search, page])

  useEffect(() => {
    setPage(0)
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  async function openDetail(c: Customer) {
    setSelectedCustomer(c)
    setLoadingDetail(true)
    setCustomerOrders([])
    setCustomerNotes([])
    setNewNote('')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const [{ data: ordersData }, { data: notesData }] = await Promise.all([
      db.from('orders')
        .select('id, order_number, status, total_amount, created_at')
        .eq('user_id', c.id)
        .order('created_at', { ascending: false })
        .limit(20),
      db.from('customer_notes')
        .select('id, note, created_at')
        .eq('customer_id', c.id)
        .order('created_at', { ascending: false }),
    ])

    const orders = (ordersData ?? []) as CustomerOrder[]
    const totalSpent = orders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0)

    setSelectedCustomer((prev) => prev ? {
      ...prev,
      total_spent: totalSpent,
      order_count: orders.length,
    } : prev)
    setCustomerOrders(orders)
    setCustomerNotes((notesData ?? []) as CustomerNote[])
    setLoadingDetail(false)
  }

  async function addNote() {
    if (!newNote.trim() || !selectedCustomer) return
    setSavingNote(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('customer_notes').insert({
      customer_id: selectedCustomer.id,
      note: newNote.trim(),
    }).select('id, note, created_at').maybeSingle()
    setSavingNote(false)
    if (!error && data) {
      setCustomerNotes((prev) => [data as CustomerNote, ...prev])
      setNewNote('')
    }
  }

  async function deleteNote(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('customer_notes').delete().eq('id', id)
    setCustomerNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const displayName = (c: Customer) => c.full_name || c.email || 'Unknown'
  const initials = (c: Customer) => {
    const name = c.full_name || c.email || '?'
    return name[0].toUpperCase()
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} customers shown</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xs px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#5FAE9B] transition-colors"
            />
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : customers.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              {search ? 'No customers match your search.' : 'No customers found.'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-5 py-3 font-medium">Customer</th>
                      <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Email</th>
                      <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Joined</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openDetail(c)}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: '#5FAE9B' }}
                            >
                              {initials(c)}
                            </div>
                            <span className="font-medium text-gray-900">{displayName(c)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">{c.email}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">
                          {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetail(c) }}
                            className="text-xs text-[#0F2747] font-medium hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {customers.length === PAGE_SIZE && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="text-sm font-medium text-gray-600 disabled:opacity-30">Previous</button>
                  <span className="text-sm text-gray-500">Page {page + 1}</span>
                  <button onClick={() => setPage((p) => p + 1)} className="text-sm font-medium text-gray-600">Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: '#5FAE9B' }}
                >
                  {initials(selectedCustomer)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{displayName(selectedCustomer)}</h2>
                  {selectedCustomer.email && <p className="text-xs text-gray-500">{selectedCustomer.email}</p>}
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {loadingDetail ? (
                <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Orders</p>
                      <p className="text-xl font-bold text-gray-900">{selectedCustomer.order_count ?? 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Total Spent</p>
                      <p className="text-xl font-bold text-gray-900">£{(selectedCustomer.total_spent ?? 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Joined</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {new Date(selectedCustomer.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Recent Orders</p>
                    {customerOrders.length === 0 ? (
                      <p className="text-sm text-gray-400">No orders placed yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {customerOrders.map((o) => (
                          <div key={o.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-gray-800">#{o.order_number}</p>
                              <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-500'}`}>{o.status}</span>
                              <span className="text-sm font-bold text-gray-900">£{Number(o.total_amount).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Internal Notes</p>
                    <div className="flex gap-2 mb-3">
                      <input
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote() } }}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B]"
                        placeholder="Add a note about this customer…"
                      />
                      <button
                        onClick={addNote}
                        disabled={savingNote || !newNote.trim()}
                        className="px-3 py-2 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
                        style={{ backgroundColor: '#0F2747' }}
                      >
                        Add
                      </button>
                    </div>
                    {customerNotes.length === 0 ? (
                      <p className="text-sm text-gray-400">No notes yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {customerNotes.map((n) => (
                          <div key={n.id} className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                            <p className="flex-1 text-sm text-gray-700">{n.note}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                              <button onClick={() => deleteNote(n.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
