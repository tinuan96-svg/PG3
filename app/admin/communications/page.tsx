'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type MainTab = 'dashboard' | 'email' | 'sms' | 'whatsapp' | 'templates' | 'campaigns' | 'logs' | 'settings'
type Channel = 'email' | 'sms' | 'whatsapp'

interface LogEntry {
  id: string
  channel: Channel
  message_type: string
  template_name: string | null
  recipient_email: string | null
  recipient_phone: string | null
  subject: string | null
  status: string
  provider: string
  error_message: string | null
  sent_at: string | null
  created_at: string
  order_id: string | null
}

interface Template {
  id: string
  name: string
  channel: Channel
  type: string
  subject: string | null
  body_html: string | null
  body_text: string
  variables: { key: string; description: string }[]
  is_active: boolean
  created_at: string
}

interface Campaign {
  id: string
  name: string
  channel: Channel
  status: string
  audience_type: string
  segment_type: string | null
  scheduled_at: string | null
  sent_at: string | null
  recipient_count: number
  sent_count: number
  failed_count: number
  created_at: string
}

interface Stats {
  email_today: number
  sms_today: number
  whatsapp_today: number
  failed_today: number
  queued: number
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: 'bg-green-100 text-green-700',
    delivered: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    queued: 'bg-yellow-100 text-yellow-700',
    bounced: 'bg-orange-100 text-orange-700',
    draft: 'bg-gray-100 text-gray-600',
    scheduled: 'bg-blue-100 text-blue-700',
    sending: 'bg-yellow-100 text-yellow-700',
    paused: 'bg-orange-100 text-orange-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}

// ─── Channel Badge ────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: Channel }) {
  const map: Record<Channel, string> = {
    email: 'bg-blue-100 text-blue-700',
    sms: 'bg-green-100 text-green-700',
    whatsapp: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[channel]}`}>
      {channel === 'whatsapp' ? 'WhatsApp' : channel.toUpperCase()}
    </span>
  )
}

// ─── Template Modal ───────────────────────────────────────────────────────────

function TemplateModal({
  template,
  onClose,
  onSave,
}: {
  template: Partial<Template> | null
  onClose: () => void
  onSave: (t: Partial<Template>) => Promise<void>
}) {
  const [form, setForm] = useState<Partial<Template>>(
    template ?? { channel: 'email', type: 'transactional', is_active: true, variables: [] },
  )
  const [saving, setSaving] = useState(false)

  function set(key: keyof Template, val: unknown) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-bold text-gray-900">{template?.id ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
              <input
                required
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Channel</label>
              <select
                value={form.channel ?? 'email'}
                onChange={(e) => set('channel', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
              <select
                value={form.type ?? 'transactional'}
                onChange={(e) => set('type', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
              >
                <option value="transactional">Transactional</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={(e) => set('is_active', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          {form.channel === 'email' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject</label>
              <input
                value={form.subject ?? ''}
                onChange={(e) => set('subject', e.target.value)}
                placeholder="Use {{variable}} for dynamic values"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
          )}
          {form.channel === 'email' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">HTML Body</label>
              <textarea
                rows={6}
                value={form.body_html ?? ''}
                onChange={(e) => set('body_html', e.target.value)}
                placeholder="HTML email content with {{variables}}"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-gray-400 resize-none"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {form.channel === 'email' ? 'Plain Text Body' : 'Message Body'}
            </label>
            <textarea
              required
              rows={4}
              value={form.body_text ?? ''}
              onChange={(e) => set('body_text', e.target.value)}
              placeholder="Message content with {{variables}}"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 resize-none"
            />
            <p className="mt-1 text-[11px] text-gray-400">Use {'{{variable_name}}'} for dynamic content</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#0F2747' }}
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Campaign Modal ───────────────────────────────────────────────────────────

function CampaignModal({
  templates,
  onClose,
  onSave,
}: {
  templates: Template[]
  onClose: () => void
  onSave: (c: Partial<Campaign & { subject: string; body_override: string; template_id?: string }>) => Promise<void>
}) {
  const [form, setForm] = useState<Partial<Campaign & { subject: string; body_override: string; template_id?: string }>>({
    name: '',
    channel: 'email',
    status: 'draft',
    audience_type: 'all',
    subject: '',
    body_override: '',
  })
  const [saving, setSaving] = useState(false)

  function set(key: string, val: unknown) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  const channelTemplates = templates.filter((t) => t.channel === form.channel && t.is_active && t.type === 'marketing')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-bold text-gray-900">New Campaign</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Campaign Name</label>
            <input
              required
              value={form.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Summer promotion, weekly newsletter..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Channel</label>
              <select
                value={form.channel ?? 'email'}
                onChange={(e) => set('channel', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Audience</label>
              <select
                value={form.audience_type ?? 'all'}
                onChange={(e) => set('audience_type', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none"
              >
                <option value="all">All Customers</option>
                <option value="segment">Segment</option>
              </select>
            </div>
          </div>
          {form.audience_type === 'segment' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Segment</label>
              <select
                value={form.segment_type ?? ''}
                onChange={(e) => set('segment_type', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none"
              >
                <option value="">Select segment...</option>
                <option value="new_customers">New Customers</option>
                <option value="returning_customers">Returning Customers</option>
                <option value="vip">VIP Customers</option>
                <option value="inactive">Inactive Customers</option>
                <option value="high_spenders">High-Spending Customers</option>
                <option value="recent_purchasers">Recent Purchasers</option>
              </select>
            </div>
          )}
          {channelTemplates.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Template (optional)</label>
              <select
                value={form.template_id ?? ''}
                onChange={(e) => set('template_id', e.target.value || undefined)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none"
              >
                <option value="">No template — enter content below</option>
                {channelTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          {!form.template_id && form.channel === 'email' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject</label>
              <input
                value={form.subject ?? ''}
                onChange={(e) => set('subject', e.target.value)}
                placeholder="Email subject line"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
          )}
          {!form.template_id && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
              <textarea
                rows={4}
                value={form.body_override ?? ''}
                onChange={(e) => set('body_override', e.target.value)}
                placeholder="Campaign message content"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 resize-none"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Schedule (optional)</label>
            <input
              type="datetime-local"
              value={form.scheduled_at ? form.scheduled_at.slice(0, 16) : ''}
              onChange={(e) => set('scheduled_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
            <p className="mt-1 text-[11px] text-gray-400">Leave blank to save as draft</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#0F2747' }}
            >
              {saving ? 'Saving...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Send Test Modal ──────────────────────────────────────────────────────────

function SendTestModal({
  channel,
  templateName,
  onClose,
}: {
  channel: Channel
  templateName: string
  onClose: () => void
}) {
  const [recipient, setRecipient] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function send() {
    if (!recipient) return
    setSending(true)
    setResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ANON_KEY
      const body: Record<string, unknown> = {
        channel,
        message_type: 'transactional',
        template_name: templateName,
        is_admin_alert: true,
        variables: { customer_name: 'Test User', order_number: 'TEST-001', order_total: '9.99' },
      }
      if (channel === 'email') body.to_email = recipient
      else body.to_phone = recipient

      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setResult({ ok: data.success, msg: data.success ? 'Test message sent!' : data.error || 'Failed' })
    } catch (e) {
      setResult({ ok: false, msg: String(e) })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Send Test — {templateName}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {channel === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={channel === 'email' ? 'test@example.com' : '+44...'}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          {result && (
            <p className={`text-sm ${result.ok ? 'text-green-600' : 'text-red-600'}`}>{result.msg}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
              Close
            </button>
            <button
              onClick={send}
              disabled={sending || !recipient}
              className="flex-1 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#0F2747' }}
            >
              {sending ? 'Sending...' : 'Send Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommunicationsPage() {
  const [tab, setTab] = useState<MainTab>('dashboard')
  const [stats, setStats] = useState<Stats>({ email_today: 0, sms_today: 0, whatsapp_today: 0, failed_today: 0, queued: 0 })
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [templateModal, setTemplateModal] = useState<Partial<Template> | null | false>(false)
  const [campaignModal, setCampaignModal] = useState(false)
  const [testModal, setTestModal] = useState<{ channel: Channel; name: string } | null>(null)
  const [logFilter, setLogFilter] = useState<string>('all')
  const [alertSettings, setAlertSettings] = useState({ alert_email: '', alert_phone: '' })
  const [alertSaving, setAlertSaving] = useState(false)
  const [alertMsg, setAlertMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const loadStats = useCallback(async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const [emailRes, smsRes, waRes, failRes, queueRes] = await Promise.all([
      db.from('communication_logs').select('id', { count: 'exact', head: true }).eq('channel', 'email').gte('created_at', todayISO),
      db.from('communication_logs').select('id', { count: 'exact', head: true }).eq('channel', 'sms').gte('created_at', todayISO),
      db.from('communication_logs').select('id', { count: 'exact', head: true }).eq('channel', 'whatsapp').gte('created_at', todayISO),
      db.from('communication_logs').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', todayISO),
      db.from('communication_logs').select('id', { count: 'exact', head: true }).eq('status', 'queued'),
    ])

    setStats({
      email_today: emailRes.count ?? 0,
      sms_today: smsRes.count ?? 0,
      whatsapp_today: waRes.count ?? 0,
      failed_today: failRes.count ?? 0,
      queued: queueRes.count ?? 0,
    })
  }, [db])

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true)
    let query = db.from('communication_logs').select('id, channel, message_type, template_name, recipient_email, recipient_phone, subject, status, provider, error_message, sent_at, created_at, order_id').order('created_at', { ascending: false }).limit(200)
    if (logFilter !== 'all') query = query.eq('channel', logFilter)
    const { data } = await query
    setLogs(data ?? [])
    setLoadingLogs(false)
  }, [db, logFilter])

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true)
    const { data } = await db.from('communication_templates').select('*').order('channel').order('name')
    setTemplates(data ?? [])
    setLoadingTemplates(false)
  }, [db])

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true)
    const { data } = await db.from('communication_campaigns').select('id, name, channel, status, audience_type, segment_type, scheduled_at, sent_at, recipient_count, sent_count, failed_count, created_at').order('created_at', { ascending: false })
    setCampaigns(data ?? [])
    setLoadingCampaigns(false)
  }, [db])

  const loadAlertSettings = useCallback(async () => {
    const { data } = await db.from('admin_alert_settings').select('alert_email, alert_phone').eq('id', '00000000-0000-0000-0000-000000000088').maybeSingle()
    if (data) setAlertSettings({ alert_email: data.alert_email ?? '', alert_phone: data.alert_phone ?? '' })
  }, [db])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { if (tab === 'logs' || tab === 'email' || tab === 'sms' || tab === 'whatsapp') loadLogs() }, [tab, loadLogs])
  useEffect(() => { if (tab === 'templates') loadTemplates() }, [tab, loadTemplates])
  useEffect(() => { if (tab === 'campaigns') loadCampaigns() }, [tab, loadCampaigns])
  useEffect(() => { if (tab === 'settings') loadAlertSettings() }, [tab, loadAlertSettings])

  async function saveTemplate(t: Partial<Template>) {
    if (t.id) {
      await db.from('communication_templates').update({ ...t, updated_at: new Date().toISOString() }).eq('id', t.id)
    } else {
      await db.from('communication_templates').insert({ ...t })
    }
    setTemplateModal(false)
    loadTemplates()
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return
    await db.from('communication_templates').delete().eq('id', id)
    loadTemplates()
  }

  async function saveCampaign(c: Partial<Campaign & { subject: string; body_override: string; template_id?: string }>) {
    await db.from('communication_campaigns').insert({
      name: c.name,
      channel: c.channel,
      template_id: c.template_id ?? null,
      subject: c.subject ?? null,
      body_override: c.body_override ?? null,
      status: c.scheduled_at ? 'scheduled' : 'draft',
      audience_type: c.audience_type,
      segment_type: c.segment_type ?? null,
      scheduled_at: c.scheduled_at ?? null,
    })
    setCampaignModal(false)
    loadCampaigns()
  }

  async function saveAlertSettings(e: React.FormEvent) {
    e.preventDefault()
    setAlertSaving(true)
    setAlertMsg(null)
    const { error } = await db.from('admin_alert_settings').update({ alert_email: alertSettings.alert_email, alert_phone: alertSettings.alert_phone, updated_at: new Date().toISOString() }).eq('id', '00000000-0000-0000-0000-000000000088')
    setAlertMsg(error ? { ok: false, text: 'Failed to save.' } : { ok: true, text: 'Saved.' })
    setAlertSaving(false)
  }

  const filteredLogs = tab === 'email' ? logs.filter((l) => l.channel === 'email')
    : tab === 'sms' ? logs.filter((l) => l.channel === 'sms')
    : tab === 'whatsapp' ? logs.filter((l) => l.channel === 'whatsapp')
    : logs

  const tabs: { id: MainTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'email', label: 'Email' },
    { id: 'sms', label: 'SMS' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'templates', label: 'Templates' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'logs', label: 'All Logs' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-sm text-gray-500 mt-1">Manage email, SMS and WhatsApp messaging via Twilio SendGrid and Twilio Messaging.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              style={tab === t.id ? { backgroundColor: '#0F2747' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Dashboard ──────────────────────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Emails Today" value={stats.email_today} color="bg-blue-100 text-blue-600" icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              <StatCard label="SMS Today" value={stats.sms_today} color="bg-green-100 text-green-600" icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              <StatCard label="WhatsApp Today" value={stats.whatsapp_today} color="bg-emerald-100 text-emerald-600" icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              <StatCard label="Failed Today" value={stats.failed_today} color="bg-red-100 text-red-600" icon="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <StatCard label="Queued" value={stats.queued} color="bg-yellow-100 text-yellow-600" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Communication Channels</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['email', 'sms', 'whatsapp'] as Channel[]).map((ch) => (
                  <div key={ch} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ChannelBadge channel={ch} />
                      <span className="text-xs text-gray-500">
                        {ch === 'email' ? 'via SendGrid' : 'via Twilio'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {ch === 'email' && 'Transactional and marketing emails via Twilio SendGrid.'}
                      {ch === 'sms' && 'Order alerts and promotions via Twilio SMS.'}
                      {ch === 'whatsapp' && 'Rich messages via Twilio WhatsApp Business API.'}
                    </p>
                    <button
                      onClick={() => setTab(ch)}
                      className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View logs →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Channel Logs (email / sms / whatsapp / all logs) ───────────────── */}
        {(tab === 'email' || tab === 'sms' || tab === 'whatsapp' || tab === 'logs') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">
                {tab === 'logs' ? 'All Messages' : `${tab === 'whatsapp' ? 'WhatsApp' : tab.toUpperCase()} Messages`}
              </h2>
              {tab === 'logs' && (
                <div className="flex gap-2">
                  {['all', 'email', 'sms', 'whatsapp'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setLogFilter(f)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${logFilter === f ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                      style={logFilter === f ? { backgroundColor: '#0F2747' } : {}}
                    >
                      {f === 'all' ? 'All' : f === 'whatsapp' ? 'WhatsApp' : f.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {loadingLogs ? (
                <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No messages found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Channel</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Recipient</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Template / Subject</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3"><ChannelBadge channel={log.channel} /></td>
                        <td className="px-4 py-3 text-xs text-gray-700 max-w-[140px] truncate">
                          {log.recipient_email || log.recipient_phone || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 max-w-[200px] truncate">
                          {log.template_name || log.subject || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 capitalize">{log.message_type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <StatusBadge status={log.status} />
                            {log.error_message && (
                              <p className="text-[10px] text-red-400 mt-0.5 max-w-[140px] truncate" title={log.error_message}>{log.error_message}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {log.sent_at ? new Date(log.sent_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : new Date(log.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Templates ──────────────────────────────────────────────────────── */}
        {tab === 'templates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">Message Templates</h2>
              <button
                onClick={() => setTemplateModal({})}
                className="px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90"
                style={{ backgroundColor: '#0F2747' }}
              >
                + New Template
              </button>
            </div>
            {(['email', 'sms', 'whatsapp'] as Channel[]).map((ch) => {
              const chTemplates = templates.filter((t) => t.channel === ch)
              if (chTemplates.length === 0) return null
              return (
                <div key={ch} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                    <ChannelBadge channel={ch} />
                    <span className="text-xs text-gray-500">{chTemplates.length} templates</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Type</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Subject / Preview</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {chTemplates.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 capitalize">{t.type}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[220px] truncate">
                            {t.subject || t.body_text.substring(0, 60)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {t.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setTemplateModal(t)}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setTestModal({ channel: ch, name: t.name })}
                                className="text-xs text-gray-500 hover:underline"
                              >
                                Test
                              </button>
                              <button
                                onClick={() => deleteTemplate(t.id)}
                                className="text-xs text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
            {loadingTemplates && <p className="text-sm text-gray-400 text-center py-4">Loading...</p>}
            {!loadingTemplates && templates.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <p className="text-gray-400 text-sm">No templates yet.</p>
                <button onClick={() => setTemplateModal({})} className="mt-3 text-sm font-semibold text-blue-600 hover:underline">
                  Create your first template
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Campaigns ──────────────────────────────────────────────────────── */}
        {tab === 'campaigns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">Marketing Campaigns</h2>
              <button
                onClick={() => setCampaignModal(true)}
                className="px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90"
                style={{ backgroundColor: '#0F2747' }}
              >
                + New Campaign
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {loadingCampaigns ? (
                <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
              ) : campaigns.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400 text-sm">No campaigns yet.</p>
                  <button onClick={() => setCampaignModal(true)} className="mt-3 text-sm font-semibold text-blue-600 hover:underline">
                    Create your first campaign
                  </button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Channel</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Audience</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Recipients</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Sent / Failed</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                        <td className="px-4 py-3"><ChannelBadge channel={c.channel} /></td>
                        <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                          {c.audience_type === 'segment' ? c.segment_type?.replace(/_/g, ' ') : 'All customers'}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-700">{c.recipient_count.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className="text-green-600">{c.sent_count}</span>
                          {c.failed_count > 0 && <span className="text-red-500 ml-1">/ {c.failed_count}</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleDateString('en-GB')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Settings ───────────────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="space-y-5 max-w-xl">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-800 mb-1">Credentials</h2>
              <p className="text-xs text-gray-500 mb-4">Twilio and SendGrid credentials must be set as Supabase Edge Function secrets. They are never exposed to the frontend.</p>
              <div className="space-y-2">
                {[
                  'TWILIO_ACCOUNT_SID',
                  'TWILIO_AUTH_TOKEN',
                  'TWILIO_PHONE_NUMBER',
                  'TWILIO_WHATSAPP_NUMBER',
                  'SENDGRID_API_KEY',
                  'SENDGRID_FROM_EMAIL',
                  'SENDGRID_FROM_NAME',
                ].map((k) => (
                  <div key={k} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                    <code className="text-xs font-mono text-gray-700">{k}</code>
                    <span className="text-[10px] text-gray-400">Edge Function Secret</span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={saveAlertSettings} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-800">Admin Alert Recipients</h2>
              <p className="text-xs text-gray-500">Receive alerts for payment failures, sync errors, and system issues.</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alert Email</label>
                <input
                  type="email"
                  value={alertSettings.alert_email}
                  onChange={(e) => setAlertSettings((s) => ({ ...s, alert_email: e.target.value }))}
                  placeholder="admin@pocketgrocery.co.uk"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alert Phone (SMS)</label>
                <input
                  type="tel"
                  value={alertSettings.alert_phone}
                  onChange={(e) => setAlertSettings((s) => ({ ...s, alert_phone: e.target.value }))}
                  placeholder="+447..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={alertSaving}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#0F2747' }}
              >
                {alertSaving ? 'Saving...' : 'Save Alert Settings'}
              </button>
              {alertMsg && (
                <p className={`text-sm ${alertMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{alertMsg.text}</p>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Modals */}
      {templateModal !== false && (
        <TemplateModal
          template={templateModal}
          onClose={() => setTemplateModal(false)}
          onSave={saveTemplate}
        />
      )}
      {campaignModal && (
        <CampaignModal
          templates={templates}
          onClose={() => setCampaignModal(false)}
          onSave={saveCampaign}
        />
      )}
      {testModal && (
        <SendTestModal
          channel={testModal.channel}
          templateName={testModal.name}
          onClose={() => setTestModal(null)}
        />
      )}
    </AdminLayout>
  )
}
