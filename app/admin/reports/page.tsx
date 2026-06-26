'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

type Range = 'today' | '7d' | '30d' | '90d' | 'custom'

type ReportData = {
  revenue: number
  orders: number
  avgOrder: number
  customers: number
  pendingOrders: number
  processingOrders: number
  completedOrders: number
}

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'Custom', value: 'custom' },
]

function getDateRange(range: Range, customStart: string, customEnd: string): { from: Date; to: Date } {
  const now = new Date()
  const to = new Date(now)
  let from: Date

  switch (range) {
    case 'today':
      from = new Date(now); from.setHours(0, 0, 0, 0); break
    case '7d':
      from = new Date(now); from.setDate(from.getDate() - 7); break
    case '30d':
      from = new Date(now); from.setDate(from.getDate() - 30); break
    case '90d':
      from = new Date(now); from.setDate(from.getDate() - 90); break
    case 'custom':
      from = customStart ? new Date(customStart) : new Date(now.setDate(now.getDate() - 30))
      to.setTime(customEnd ? new Date(customEnd).getTime() : Date.now())
      break
  }

  return { from: from!, to }
}

export default function ReportsPage() {
  const [range, setRange] = useState<Range>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState<{ id: string; created_at: string; total: number | null; order_status: string; user_id: string }[]>([])

  async function loadData() {
    setLoading(true)
    const { from, to } = getDateRange(range, customStart, customEnd)
    const fromISO = from.toISOString()
    const toISO = to.toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const [ordersRes, recentRes] = await Promise.all([
      db.from('orders').select('id,total,order_status,user_id,created_at').gte('created_at', fromISO).lte('created_at', toISO),
      db.from('orders').select('id,created_at,total,order_status,user_id').order('created_at', { ascending: false }).limit(10),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders: any[] = ordersRes.data ?? []
    const revenue = orders.reduce((s: number, o: { total?: number | null }) => s + (o.total ?? 0), 0)
    const uniqueCustomers = new Set(orders.map((o: { user_id: string }) => o.user_id)).size
    const completed = orders.filter((o) => o.order_status === 'completed' || o.order_status === 'delivered').length
    const pending = orders.filter((o) => o.order_status === 'pending').length
    const processing = orders.filter((o) => o.order_status === 'processing').length

    setData({
      revenue,
      orders: orders.length,
      avgOrder: orders.length ? revenue / orders.length : 0,
      customers: uniqueCustomers,
      pendingOrders: pending,
      processingOrders: processing,
      completedOrders: completed,
    })
    setRecentOrders(recentRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [range, customStart, customEnd])

  const fmt = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Revenue and order performance</p>
        </div>

        {/* Range selector */}
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                range === opt.value
                  ? 'text-white border-transparent'
                  : 'text-gray-600 border-gray-200 hover:border-gray-300 bg-white'
              }`}
              style={range === opt.value ? { backgroundColor: '#0F2747' } : {}}
            >
              {opt.label}
            </button>
          ))}

          {range === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
              />
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: data ? fmt(data.revenue) : '—', color: '#5FAE9B', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
            { label: 'Total Orders', value: data ? String(data.orders) : '—', color: '#0F2747', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
            { label: 'Average Order', value: data ? fmt(data.avgOrder) : '—', color: '#16a34a', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { label: 'Unique Customers', value: data ? String(data.customers) : '—', color: '#d97706', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                  <svg className="w-4 h-4" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
              {loading ? (
                <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Order status breakdown */}
        {data && !loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Order Status Breakdown</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Pending', value: data.pendingOrders, color: '#d97706', bg: '#FFFBEB' },
                { label: 'Processing', value: data.processingOrders, color: '#2563EB', bg: '#EFF6FF' },
                { label: 'Completed', value: data.completedOrders, color: '#16a34a', bg: '#F0FDF4' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="rounded-xl px-4 py-3.5 text-center" style={{ backgroundColor: bg }}>
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs font-medium text-gray-600 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {data.orders > 0 && (
              <div className="mt-4">
                <div className="flex rounded-full overflow-hidden h-2.5">
                  {data.pendingOrders > 0 && (
                    <div style={{ width: `${(data.pendingOrders / data.orders) * 100}%`, backgroundColor: '#FCD34D' }} />
                  )}
                  {data.processingOrders > 0 && (
                    <div style={{ width: `${(data.processingOrders / data.orders) * 100}%`, backgroundColor: '#60A5FA' }} />
                  )}
                  {data.completedOrders > 0 && (
                    <div style={{ width: `${(data.completedOrders / data.orders) * 100}%`, backgroundColor: '#4ADE80' }} />
                  )}
                  {(data.orders - data.pendingOrders - data.processingOrders - data.completedOrders) > 0 && (
                    <div className="flex-1 bg-gray-200" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Recent Orders</h2>
            <a href="/admin/orders" className="text-xs font-semibold hover:opacity-75 transition-opacity" style={{ color: '#5FAE9B' }}>
              View all →
            </a>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading orders...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No orders found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 text-xs">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                      {new Date(o.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(o.total ?? 0)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[o.order_status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {o.order_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
