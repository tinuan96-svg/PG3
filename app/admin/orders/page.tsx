'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type Order = {
  id: string
  order_number: string
  order_status: string
  total: number
  created_at: string
  shipping_name: string
  shipping_email: string
  shipping_phone: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_postcode: string | null
  payment_status: string
  payment_method: string | null
  notes: string | null
}

type OrderItem = {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

type PaymentTransaction = {
  id: string
  transaction_id: string
  payment_method: string
  amount: number
  currency: string
  status: string
  authorization_code: string | null
  card_last_four: string | null
  card_scheme: string | null
  created_at: string
}

const STATUSES = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  paid:       'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-teal-100 text-teal-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}

const NEXT_STATUS: Record<string, string> = {
  pending:    'processing',
  processing: 'shipped',
  shipped:    'delivered',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [paymentTxn, setPaymentTxn] = useState<PaymentTransaction | null>(null)
  const [refundModal, setRefundModal] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [refundMsg, setRefundMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const load = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = supabase
      .from('orders')
      .select('id, order_number, order_status, total, created_at, shipping_name, shipping_email, shipping_phone, shipping_address, shipping_city, shipping_postcode, payment_status, payment_method, notes')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (filter !== 'all') query = query.eq('order_status', filter)
    if (search.trim()) {
      query = query.or(`order_number.ilike.%${search}%,shipping_name.ilike.%${search}%,shipping_email.ilike.%${search}%`)
    }

    const { data } = await query
    setOrders((data ?? []) as Order[])
    setLoading(false)
  }, [filter, search, page])

  useEffect(() => {
    setPage(0)
  }, [filter, search])

  useEffect(() => {
    load()
  }, [load])

  async function openDetail(order: Order) {
    setSelectedOrder(order)
    setPaymentTxn(null)
    setRefundModal(false)
    setRefundMsg(null)
    setLoadingItems(true)

    const [itemsRes, txnRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('order_items')
        .select('id, product_name, quantity, unit_price, total_price')
        .eq('order_id', order.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('payment_transactions')
        .select('id, transaction_id, payment_method, amount, currency, status, authorization_code, card_last_four, card_scheme, created_at')
        .eq('order_id', order.id)
        .maybeSingle(),
    ])

    setOrderItems((itemsRes.data ?? []) as OrderItem[])
    setPaymentTxn(txnRes.data ?? null)
    setLoadingItems(false)
  }

  async function handleRefund() {
    if (!selectedOrder || !paymentTxn) return
    const pence = Math.round(parseFloat(refundAmount) * 100)
    if (!pence || pence <= 0) { setRefundMsg({ ok: false, text: 'Enter a valid refund amount.' }); return }
    const maxPence = paymentTxn.amount
    if (pence > maxPence) { setRefundMsg({ ok: false, text: `Cannot exceed original payment of £${(maxPence / 100).toFixed(2)}.` }); return }

    setIssuing(true)
    setRefundMsg(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ANON_KEY
      const res = await fetch(`${SUPABASE_URL}/functions/v1/worldpay-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action: 'refund',
          orderId: selectedOrder.id,
          transactionId: paymentTxn.transaction_id,
          amountPence: pence,
          reason: refundReason || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setRefundMsg({ ok: true, text: `Refund of £${parseFloat(refundAmount).toFixed(2)} issued successfully.` })
        setPaymentTxn((prev) => prev ? { ...prev, status: data.status } : prev)
        setRefundAmount('')
        setRefundReason('')
      } else {
        setRefundMsg({ ok: false, text: data.error || 'Refund failed.' })
      }
    } catch {
      setRefundMsg({ ok: false, text: 'Could not process refund. Please try again.' })
    } finally {
      setIssuing(false)
    }
  }

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingStatus(true)
    try {
      const { error } = await supabase.from('orders').update({ order_status: newStatus as any }).eq('id', orderId)
      if (error) throw error

      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, order_status: newStatus } : o))
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, order_status: newStatus } : prev)

      // Trigger notifications for status changes
      if (selectedOrder) {
        const templateMap: Record<string, string> = {
          shipped: 'Order Shipped',
          delivered: 'Order Delivered',
          cancelled: 'Order Cancelled',
        }

        const templateName = templateMap[newStatus]
        if (templateName) {
          const { data: { session } } = await supabase.auth.getSession()
          const token = session?.access_token || ANON_KEY

          const vars = {
            customer_name: selectedOrder.shipping_name || 'Customer',
            order_number: selectedOrder.order_number,
            estimated_delivery: 'tomorrow', // Placeholder
          }

          // Send SMS
          if (selectedOrder.shipping_phone) {
            fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                channel: 'sms',
                template_name: templateName,
                to_phone: selectedOrder.shipping_phone,
                variables: vars,
                order_id: orderId,
              }),
            }).catch(() => {/* non-fatal */})
          }

          // Send Email
          if (selectedOrder.shipping_email) {
            fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                channel: 'email',
                template_name: templateName,
                to_email: selectedOrder.shipping_email,
                variables: vars,
                order_id: orderId,
              }),
            }).catch(() => {/* non-fatal */})
          }
        }
      }
    } catch (err) {
      console.error('Failed to update order status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  function exportCSV() {
    const rows = [
      ['Order #', 'Name', 'Email', 'Status', 'Total', 'Date'],
      ...orders.map((o) => [
        o.order_number,
        o.shipping_name,
        o.shipping_email,
        o.status,
        `£${Number(o.total).toFixed(2)}`,
        new Date(o.created_at).toLocaleDateString('en-GB'),
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total ?? 0), 0)

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {orders.length} orders shown &middot; £{totalRevenue.toFixed(2)} total
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Export CSV
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search order, name, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#5FAE9B] transition-colors"
          />
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize transition-colors ${filter === s ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={filter === s ? { backgroundColor: '#0F2747' } : {}}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-medium">Order</th>
                    <th className="text-left px-5 py-3 font-medium">Customer</th>
                    <th className="text-left px-5 py-3 font-medium">Total</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Date</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openDetail(o)}>
                      <td className="px-5 py-3 font-semibold text-gray-900">#{o.order_number}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{o.shipping_name}</p>
                        <p className="text-xs text-gray-400">{o.shipping_email}</p>
                      </td>
                      <td className="px-5 py-3 font-bold text-gray-900">£{Number(o.total).toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[o.order_status] || 'bg-gray-100 text-gray-600'}`}>
                          {o.order_status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">
                        {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetail(o) }}
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
          )}

          {orders.length === PAGE_SIZE && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-sm font-medium text-gray-600 disabled:opacity-30 hover:text-gray-900"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Order #{selectedOrder.order_number}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(selectedOrder.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Customer</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedOrder.shipping_name}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.shipping_email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Delivery Address</p>
                  <p className="text-sm text-gray-700">{selectedOrder.shipping_address}</p>
                  <p className="text-xs text-gray-500">{[selectedOrder.shipping_city, selectedOrder.shipping_postcode].filter(Boolean).join(', ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Total</p>
                  <p className="text-lg font-bold text-gray-900">£{Number(selectedOrder.total).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Payment</p>
                  <p className="text-sm font-semibold text-gray-700 capitalize">{selectedOrder.payment_status}</p>
                  {selectedOrder.payment_method && <p className="text-xs text-gray-400">{selectedOrder.payment_method}</p>}
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Order Status</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize inline-block mt-0.5 ${STATUS_COLORS[selectedOrder.order_status] || 'bg-gray-100 text-gray-600'}`}>
                    {selectedOrder.order_status}
                  </span>
                </div>
              </div>

              {/* Payment Transaction Panel */}
              {paymentTxn && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Card Payment</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      paymentTxn.status === 'paid' ? 'bg-green-100 text-green-700' :
                      paymentTxn.status === 'refunded' ? 'bg-gray-200 text-gray-600' :
                      paymentTxn.status === 'partially_refunded' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>{paymentTxn.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {paymentTxn.card_scheme && (
                      <div>
                        <span className="text-gray-400">Scheme: </span>
                        <span className="font-medium text-gray-700">{paymentTxn.card_scheme}</span>
                      </div>
                    )}
                    {paymentTxn.card_last_four && (
                      <div>
                        <span className="text-gray-400">Card: </span>
                        <span className="font-medium text-gray-700 font-mono">•••• {paymentTxn.card_last_four}</span>
                      </div>
                    )}
                    {paymentTxn.authorization_code && (
                      <div>
                        <span className="text-gray-400">Auth code: </span>
                        <span className="font-medium text-gray-700 font-mono">{paymentTxn.authorization_code}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Amount: </span>
                      <span className="font-medium text-gray-700">£{(paymentTxn.amount / 100).toFixed(2)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Txn ID: </span>
                      <span className="font-mono text-gray-600 text-[10px] break-all">{paymentTxn.transaction_id}</span>
                    </div>
                  </div>
                  {!refundModal && paymentTxn.status !== 'refunded' && (
                    <button
                      onClick={() => { setRefundModal(true); setRefundMsg(null) }}
                      className="mt-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                    >
                      Issue Refund
                    </button>
                  )}
                  {refundModal && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                      <p className="text-xs font-semibold text-gray-600">Issue Refund</p>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">£</span>
                          <input
                            type="number"
                            min="0.01"
                            max={paymentTxn.amount / 100}
                            step="0.01"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            placeholder={`Max £${(paymentTxn.amount / 100).toFixed(2)}`}
                            className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-gray-400"
                          />
                        </div>
                        <button
                          onClick={() => setRefundAmount((paymentTxn.amount / 100).toFixed(2))}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          Full
                        </button>
                      </div>
                      <input
                        type="text"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-gray-400"
                      />
                      {refundMsg && (
                        <p className={`text-xs ${refundMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{refundMsg.text}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleRefund}
                          disabled={issuing}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          {issuing ? 'Processing…' : 'Confirm Refund'}
                        </button>
                        <button
                          onClick={() => { setRefundModal(false); setRefundMsg(null) }}
                          className="px-3 py-1.5 rounded-lg text-xs text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedOrder.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-amber-700 mb-0.5">Order Notes</p>
                  <p className="text-sm text-amber-800">{selectedOrder.notes}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Order Items</p>
                {loadingItems ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : orderItems.length === 0 ? (
                  <p className="text-sm text-gray-400">No items found.</p>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.product_name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity} &times; £{Number(item.unit_price).toFixed(2)}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">£{Number(item.total_price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {NEXT_STATUS[selectedOrder.status] && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => updateStatus(selectedOrder.id, NEXT_STATUS[selectedOrder.order_status])}
                    disabled={updatingStatus}
                    className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#5FAE9B' }}
                  >
                    {updatingStatus ? 'Updating…' : `Mark as ${NEXT_STATUS[selectedOrder.order_status]}`}
                  </button>
                  {selectedOrder.order_status !== 'cancelled' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                      disabled={updatingStatus}
                      className="px-4 py-2.5 text-sm font-medium text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
