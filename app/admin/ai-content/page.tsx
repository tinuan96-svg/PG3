'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

interface QueueStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  last_updated: string | null
}

interface QueueJob {
  id: string
  product_id: string
  action: string
  status: string
  retry_count: number
  error_message: string | null
  batch_id: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  products?: { name: string; slug: string } | null
}

const DEFAULT_STATS: QueueStats = { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, last_updated: null }

const ACTION_LABELS: Record<string, string> = {
  short_description: 'Short Desc',
  full_description: 'Full Desc',
  seo: 'SEO',
  everything: 'Everything',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
}

export default function AIContentPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'seo'>('queue')
  const [stats, setStats] = useState<QueueStats>(DEFAULT_STATS)
  const [jobs, setJobs] = useState<QueueJob[]>([])
  const [loading, setLoading] = useState(true)
  const [enqueuing, setEnqueuing] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('everything')
  const [productSearch, setProductSearch] = useState('')
  const [matchedProducts, setMatchedProducts] = useState<{ id: string; name: string }[]>([])
  const [selectedAction, setSelectedAction] = useState<string>('everything')

  const loadStats = useCallback(async () => {
    const { data } = await db.rpc('get_ai_content_queue_stats')
    if (data?.[0]) {
      const r = data[0]
      setStats({
        total: Number(r.total),
        pending: Number(r.pending),
        processing: Number(r.processing),
        completed: Number(r.completed),
        failed: Number(r.failed),
        last_updated: r.last_updated,
      })
    }
  }, [])

  const loadJobs = useCallback(async () => {
    let query = db
      .from('ai_content_queue')
      .select('*, products(name, slug)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)

    const { data, error } = await query
    if (!error) setJobs(data ?? [])
  }, [statusFilter])

  const load = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadStats(), loadJobs()])
    setLoading(false)
  }, [loadStats, loadJobs])

  useEffect(() => { load() }, [load])

  async function searchProducts(q: string) {
    if (!q.trim()) { setMatchedProducts([]); return }
    const { data } = await db
      .from('products')
      .select('id, name')
      .ilike('name', `%${q}%`)
      .limit(10)
    setMatchedProducts(data ?? [])
  }

  async function enqueueSelected() {
    if (!matchedProducts.length) return
    setEnqueuing(true)
    const ids = matchedProducts.map((p) => p.id)
    await db.rpc('enqueue_ai_content_jobs', { p_product_ids: ids, p_action: actionFilter })
    setEnqueuing(false)
    setMatchedProducts([])
    setProductSearch('')
    load()
  }

  async function enqueueAll() {
    setEnqueuing(true)
    const { data: prods } = await db.from('products').select('id').limit(500)
    if (prods?.length) {
      const ids = prods.map((p: { id: string }) => p.id)
      await db.rpc('enqueue_ai_content_jobs', { p_product_ids: ids, p_action: selectedAction })
    }
    setEnqueuing(false)
    load()
  }

  async function retryFailed() {
    setRetrying(true)
    await db.rpc('retry_failed_ai_jobs')
    setRetrying(false)
    load()
  }

  const seoKeywords = [
    { keyword: 'kerala rice uk', volume: 2400, difficulty: 'Low', page: '/kerala-rice-uk' },
    { keyword: 'kerala snacks online uk', volume: 1900, difficulty: 'Low', page: '/kerala-snacks-online-uk' },
    { keyword: 'kerala spices uk delivery', volume: 1200, difficulty: 'Low', page: '/kerala-spices-uk' },
    { keyword: 'indian grocery delivery uk', volume: 4800, difficulty: 'High', page: null },
    { keyword: 'south indian groceries online', volume: 2100, difficulty: 'Medium', page: null },
    { keyword: 'kerala groceries birmingham', volume: 880, difficulty: 'Low', page: '/kerala-groceries-birmingham' },
    { keyword: 'kerala groceries london', volume: 1400, difficulty: 'Medium', page: '/kerala-groceries-london' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Content</h1>
          <p className="text-sm text-gray-500 mt-1">Queue and manage AI-generated product content and SEO data.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {(['queue', 'seo'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab ? 'border-current' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              style={activeTab === tab ? { color: '#0F2747', borderColor: '#0F2747' } : undefined}
            >
              {tab === 'queue' ? 'Content Queue' : 'SEO Keywords'}
            </button>
          ))}
        </div>

        {activeTab === 'queue' && (
          <div className="space-y-5">
            {/* Stats KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Total', value: stats.total, color: '#0F2747' },
                { label: 'Pending', value: stats.pending, color: '#D97706' },
                { label: 'Processing', value: stats.processing, color: '#2563EB' },
                { label: 'Completed', value: stats.completed, color: '#059669' },
                { label: 'Failed', value: stats.failed, color: '#DC2626' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-800">Enqueue Jobs</h2>

              {/* Search + enqueue specific products */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Search products to enqueue</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search product name..."
                    value={productSearch}
                    onChange={(e) => { setProductSearch(e.target.value); searchProducts(e.target.value) }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': '#5FAE9B' } as React.CSSProperties}
                  />
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    {Object.entries(ACTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <button
                    onClick={enqueueSelected}
                    disabled={enqueuing || matchedProducts.length === 0}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#5FAE9B' }}
                  >
                    {enqueuing ? 'Enqueuing…' : `Enqueue ${matchedProducts.length}`}
                  </button>
                </div>
                {matchedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {matchedProducts.map((p) => (
                      <span key={p.id} className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-700">{p.name}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Enqueue all */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  {Object.entries(ACTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button
                  onClick={enqueueAll}
                  disabled={enqueuing}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  {enqueuing ? 'Enqueuing…' : 'Enqueue All Products'}
                </button>
                {stats.failed > 0 && (
                  <button
                    onClick={retryFailed}
                    disabled={retrying}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90 bg-red-500"
                  >
                    {retrying ? 'Retrying…' : `Retry ${stats.failed} Failed`}
                  </button>
                )}
              </div>
            </div>

            {/* Job history */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">Job History</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                  <button
                    onClick={load}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    title="Refresh"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-10 text-center">
                  <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#5FAE9B', borderTopColor: 'transparent' }} />
                </div>
              ) : jobs.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-400">No jobs found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-50">
                        <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Product</th>
                        <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Action</th>
                        <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                        <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Retries</th>
                        <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-800 max-w-xs truncate">
                            {(job.products as { name: string } | null)?.name ?? job.product_id.slice(0, 8) + '…'}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{ACTION_LABELS[job.action] ?? job.action}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-gray-500">{job.retry_count}</td>
                          <td className="px-5 py-3 text-right text-xs text-gray-400">
                            {new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <p className="text-xs text-gray-500">Keywords Tracked</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#0F2747' }}>{seoKeywords.length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <p className="text-xs text-gray-500">Pages Generated</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#5FAE9B' }}>{seoKeywords.filter((k) => k.page).length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <p className="text-xs text-gray-500">Total Search Volume</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#0F2747' }}>{seoKeywords.reduce((s, k) => s + k.volume, 0).toLocaleString()}/mo</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Keyword</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Volume</th>
                    <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Difficulty</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3">Landing Page</th>
                  </tr>
                </thead>
                <tbody>
                  {seoKeywords.map((k) => (
                    <tr key={k.keyword} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{k.keyword}</td>
                      <td className="px-4 py-4 text-right text-sm text-gray-600">{k.volume.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${k.difficulty === 'Low' ? 'bg-green-50 text-green-700' : k.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                          {k.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {k.page ? (
                          <span className="text-xs font-medium" style={{ color: '#5FAE9B' }}>{k.page}</span>
                        ) : (
                          <span className="text-xs text-gray-400">Not created</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
