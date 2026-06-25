'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

type Range = 'today' | '7d' | '30d' | '90d'

function getRange(r: Range): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  if (r === 'today') from.setHours(0, 0, 0, 0)
  else if (r === '7d') from.setDate(from.getDate() - 7)
  else if (r === '30d') from.setDate(from.getDate() - 30)
  else from.setDate(from.getDate() - 90)
  return { from: from.toISOString(), to: to.toISOString() }
}

interface AnalyticsData {
  total_orders: number
  total_revenue: number
  avg_order_value: number
  top_searches: Array<{ query: string; search_count: number; avg_results: number }> | null
  zero_result_searches: Array<{ query: string; search_count: number }> | null
}

interface TopProduct { id: string; name: string; slug: string; price: number }
interface TopCategory { id: string; name: string }

export default function RevenueAnalyticsPage() {
  const [range, setRange] = useState<Range>('30d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topCategories, setTopCategories] = useState<TopCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { from, to } = getRange(range)

      // Revenue analytics
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: ana } = await (supabase as any).rpc('get_revenue_analytics', {
        p_from: from, p_to: to,
      })
      setData(ana as AnalyticsData ?? null)

      // Top products by search
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, slug, price')
        .eq('approval_status', 'approved')
        .eq('visibility_status', 'visible')
        .order('show_on_homepage', { ascending: false })
        .limit(10)
      setTopProducts((prods ?? []) as TopProduct[])

      // Top categories
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')
        .limit(10)
      setTopCategories((cats ?? []) as TopCategory[])

      setLoading(false)
    }
    load()
  }, [range])

  const fmt = (n: number) => `£${Number(n).toFixed(2)}`

  const RANGES: { key: Range; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
  ]

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">Sales, search behaviour and top-performing products</p>
          </div>
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={range === r.key ? { backgroundColor: '#0F2747', color: '#fff' } : { color: '#6b7280' }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: loading ? '—' : String(data?.total_orders ?? 0), color: '#0F2747' },
            { label: 'Total Revenue', value: loading ? '—' : fmt(data?.total_revenue ?? 0), color: '#16a34a' },
            { label: 'Avg Order Value', value: loading ? '—' : fmt(data?.avg_order_value ?? 0), color: '#2563eb' },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-1">{k.label}</p>
              <p className="text-3xl font-extrabold" style={{ color: k.color }}>
                {loading ? <span className="inline-block w-20 h-8 bg-gray-100 animate-pulse rounded-lg" /> : k.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top searches */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4 text-sm">Top Searches</h2>
            {loading ? (
              <div className="space-y-2">{Array.from({length: 5}).map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : !data?.top_searches?.length ? (
              <p className="text-gray-400 text-sm text-center py-6">No search data yet</p>
            ) : (
              <div className="space-y-2">
                {data.top_searches.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-700 font-medium truncate">{s.query}</span>
                    <span className="text-xs text-gray-400">{s.search_count}x</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{s.avg_results} results</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zero result searches */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-sm">Zero-Result Searches</h2>
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-bold">Gaps to fill</span>
            </div>
            {loading ? (
              <div className="space-y-2">{Array.from({length: 5}).map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : !data?.zero_result_searches?.length ? (
              <p className="text-gray-400 text-sm text-center py-6">No zero-result searches — great!</p>
            ) : (
              <div className="space-y-2">
                {data.zero_result_searches.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-700 font-medium truncate">{s.query}</span>
                    <span className="text-xs text-amber-600 font-bold">{s.search_count}x</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-500">0 results</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top products */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4 text-sm">Featured Products</h2>
            <div className="space-y-2">
              {topProducts.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-1">
                  <span className="flex-1 text-sm text-gray-700 truncate">{p.name}</span>
                  <span className="text-xs font-bold text-gray-800">£{Number(p.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top categories */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4 text-sm">Product Categories</h2>
            <div className="space-y-2">
              {topCategories.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-[#5FAE9B] flex-shrink-0" />
                  <span className="text-sm text-gray-700">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
