'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type Campaign = {
  id: string
  title: string
  body: string
  segment: string
  status: string
  sent_count: number | null
  opened_count: number | null
  clicked_count: number | null
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
}

type Stats = {
  subscribers: number
  sentToday: number
  openRate: number
  ctr: number
}

const SEGMENTS = [
  { value: 'all', label: 'All Subscribers' },
  { value: 'customers', label: 'All Customers' },
  { value: 'order_updates', label: 'Order Update Opt-ins' },
  { value: 'promotions', label: 'Promotion Opt-ins' },
  { value: 'flash_deals', label: 'Flash Deal Opt-ins' },
  { value: 'new_products', label: 'New Product Opt-ins' },
  { value: 'recipes', label: 'Recipe Opt-ins' },
]

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col" style={{ backgroundColor: '#0F2747' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#5FAE9B' }}>{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>}
    </div>
  )
}

async function callEdge(body: Record<string, unknown>, bearerToken?: string) {
  // OneSignal removed
  return { success: false, error: 'OneSignal removed' }
}

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<'send' | 'schedule' | 'history'>('send')
  const [stats, setStats] = useState<Stats>({ subscribers: 0, sentToday: 0, openRate: 0, ctr: 0 })
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)

  // Send Now form
  const [sendForm, setSendForm] = useState({ title: '', body: '', url: '', segment: 'all', imageUrl: '' })
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Schedule form
  const [schedForm, setSchedForm] = useState({ title: '', body: '', url: '', segment: 'all', imageUrl: '', scheduleAt: '' })
  const [scheduling, setScheduling] = useState(false)
  const [schedResult, setSchedResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const data = await callEdge({ action: 'get_stats' })
      if (data) {
        setStats({
          subscribers: data.total_count ?? 0,
          sentToday: data.sent_today ?? 0,
          openRate: data.open_rate ?? 0,
          ctr: data.ctr ?? 0,
        })
      }
    } catch { /* non-fatal */ }
    setStatsLoading(false)
  }, [])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('notification_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      setCampaigns(data ?? [])
    } catch { /* non-fatal */ }
    setHistoryLoading(false)
  }, [])

  useEffect(() => {
    loadStats()
    loadHistory()
  }, [loadStats, loadHistory])

  async function handleSendNow(e: React.FormEvent) {
    e.preventDefault()
    if (!sendForm.title || !sendForm.body) return
    setSending(true)
    setSendResult(null)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      const data = await callEdge({
        action: 'send_campaign',
        title: sendForm.title,
        message: sendForm.body,
        url: sendForm.url || undefined,
        image_url: sendForm.imageUrl || undefined,
        segment: sendForm.segment,
      }, session?.access_token)

      if (data.success || data.id) {
        setSendResult({ ok: true, msg: 'Notification sent successfully.' })
        setSendForm({ title: '', body: '', url: '', segment: 'all', imageUrl: '' })
        loadHistory()
      } else {
        setSendResult({ ok: false, msg: data.error || 'Failed to send notification.' })
      }
    } catch (err) {
      setSendResult({ ok: false, msg: err instanceof Error ? err.message : 'Unexpected error.' })
    }
    setSending(false)
  }

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault()
    if (!schedForm.title || !schedForm.body || !schedForm.scheduleAt) return
    setScheduling(true)
    setSchedResult(null)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      const data = await callEdge({
        action: 'schedule_campaign',
        title: schedForm.title,
        message: schedForm.body,
        url: schedForm.url || undefined,
        image_url: schedForm.imageUrl || undefined,
        segment: schedForm.segment,
        scheduled_at: schedForm.scheduleAt,
      }, session?.access_token)

      if (data.success || data.id) {
        setSchedResult({ ok: true, msg: 'Notification scheduled successfully.' })
        setSchedForm({ title: '', body: '', url: '', segment: 'all', imageUrl: '', scheduleAt: '' })
        loadHistory()
      } else {
        setSchedResult({ ok: false, msg: data.error || 'Failed to schedule notification.' })
      }
    } catch (err) {
      setSchedResult({ ok: false, msg: err instanceof Error ? err.message : 'Unexpected error.' })
    }
    setScheduling(false)
  }

  const statusColor: Record<string, string> = {
    sent: '#16a34a',
    scheduled: '#d97706',
    draft: '#6b7280',
    failed: '#dc2626',
    sending: '#5FAE9B',
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F2747' }}>Push Notifications</h1>
          <p className="text-xs mt-0.5 text-gray-400">Send and manage push notifications to your customers.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Subscribers"
            value={statsLoading ? '—' : stats.subscribers.toLocaleString()}
            sub="web + mobile"
          />
          <StatCard
            label="Sent Today"
            value={statsLoading ? '—' : stats.sentToday.toLocaleString()}
            sub="notifications"
          />
          <StatCard
            label="Open Rate"
            value={statsLoading ? '—' : stats.openRate.toFixed(1) + '%'}
            sub="last 30 days"
          />
          <StatCard
            label="Click Rate"
            value={statsLoading ? '—' : stats.ctr.toFixed(1) + '%'}
            sub="last 30 days"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {([
              { key: 'send', label: 'Send Now' },
              { key: 'schedule', label: 'Schedule' },
              { key: 'history', label: 'Campaign History' },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  tab === t.key
                    ? 'border-[#0F2747] text-[#0F2747]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Send Now */}
          {tab === 'send' && (
            <form onSubmit={handleSendNow} className="p-6 space-y-4 max-w-2xl">
              <h2 className="text-sm font-bold text-gray-800">Send Push Notification</h2>

              {sendResult && (
                <div className={`text-sm rounded-xl px-4 py-3 border ${sendResult.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {sendResult.msg}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notification Title *</label>
                  <input
                    value={sendForm.title}
                    onChange={e => setSendForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Flash Deal: 20% off Kerala Rice"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message *</label>
                  <textarea
                    value={sendForm.body}
                    onChange={e => setSendForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Shop today and save on premium Kerala groceries. Limited time offer."
                    required
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target Segment</label>
                  <select
                    value={sendForm.segment}
                    onChange={e => setSendForm(f => ({ ...f, segment: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
                  >
                    {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Deep Link URL (optional)</label>
                  <input
                    value={sendForm.url}
                    onChange={e => setSendForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="/products?category=rice"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Image URL (optional)</label>
                  <input
                    value={sendForm.imageUrl}
                    onChange={e => setSendForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ backgroundColor: '#0F2747' }}
              >
                {sending ? 'Sending...' : 'Send Notification'}
              </button>
            </form>
          )}

          {/* Schedule */}
          {tab === 'schedule' && (
            <form onSubmit={handleSchedule} className="p-6 space-y-4 max-w-2xl">
              <h2 className="text-sm font-bold text-gray-800">Schedule Push Notification</h2>

              {schedResult && (
                <div className={`text-sm rounded-xl px-4 py-3 border ${schedResult.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {schedResult.msg}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notification Title *</label>
                  <input
                    value={schedForm.title}
                    onChange={e => setSchedForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Weekend Special: Free delivery over £25"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message *</label>
                  <textarea
                    value={schedForm.body}
                    onChange={e => setSchedForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Stock up on your favourite Kerala ingredients this weekend."
                    required
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target Segment</label>
                  <select
                    value={schedForm.segment}
                    onChange={e => setSchedForm(f => ({ ...f, segment: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
                  >
                    {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Schedule Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={schedForm.scheduleAt}
                    onChange={e => setSchedForm(f => ({ ...f, scheduleAt: e.target.value }))}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Deep Link URL (optional)</label>
                  <input
                    value={schedForm.url}
                    onChange={e => setSchedForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="/products"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Image URL (optional)</label>
                  <input
                    value={schedForm.imageUrl}
                    onChange={e => setSchedForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={scheduling}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ backgroundColor: '#0F2747' }}
              >
                {scheduling ? 'Scheduling...' : 'Schedule Notification'}
              </button>
            </form>
          )}

          {/* History */}
          {tab === 'history' && (
            <div className="p-6">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Campaign History</h2>
              {historyLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-400">No campaigns sent yet.</p>
                  <p className="text-xs text-gray-300 mt-1">Send your first notification to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500">Title</th>
                        <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500">Segment</th>
                        <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500">Status</th>
                        <th className="text-right py-2 pr-4 text-xs font-semibold text-gray-500">Sent</th>
                        <th className="text-right py-2 pr-4 text-xs font-semibold text-gray-500">Opened</th>
                        <th className="text-right py-2 text-xs font-semibold text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map(c => (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-gray-800 truncate max-w-[200px]">{c.title}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.body}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-xs font-medium text-gray-600 capitalize">{c.segment ?? 'all'}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                              style={{
                                backgroundColor: (statusColor[c.status ?? ''] ?? '#6b7280') + '20',
                                color: statusColor[c.status ?? ''] ?? '#6b7280',
                              }}
                            >
                              {c.status ?? 'draft'}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right text-gray-700">{c.sent_count ?? '—'}</td>
                          <td className="py-3 pr-4 text-right text-gray-700">
                            {c.sent_count && c.opened_count
                              ? ((c.opened_count / c.sent_count) * 100).toFixed(0) + '%'
                              : '—'
                            }
                          </td>
                          <td className="py-3 text-right text-xs text-gray-400">
                            {c.sent_at
                              ? new Date(c.sent_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                              : c.scheduled_at
                              ? new Date(c.scheduled_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' (sched)'
                              : new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
