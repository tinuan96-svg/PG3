'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

const SETTINGS_ID = '00000000-0000-0000-0000-000000000088'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

type NotifSettings = {
  admin_email: string
  admin_whatsapp: string
  push_enabled: boolean
  email_enabled: boolean
  whatsapp_enabled: boolean
}

type NotifLog = {
  id: string
  order_id: string
  type: string
  recipient: string
  status: string
  error_message: string | null
  sent_at: string
}

const DEFAULT: NotifSettings = {
  admin_email: '',
  admin_whatsapp: '',
  push_enabled: true,
  email_enabled: true,
  whatsapp_enabled: false,
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none`}
      style={{ backgroundColor: checked ? '#5FAE9B' : '#e5e7eb' }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
}

const STATUS_STYLES: Record<string, string> = {
  sent:    'bg-green-100 text-green-700',
  failed:  'bg-red-100 text-red-700',
  skipped: 'bg-gray-100 text-gray-500',
}

const TYPE_LABELS: Record<string, string> = {
  push:      'Push',
  email:     'Email',
  whatsapp:  'WhatsApp',
}

export default function AdminNotificationSettingsPage() {
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [logs, setLogs] = useState<NotifLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    const { data } = await db
      .from('admin_notification_settings')
      .select('admin_email, admin_whatsapp, push_enabled, email_enabled, whatsapp_enabled')
      .eq('id', SETTINGS_ID)
      .maybeSingle()

    if (data) {
      setSettings({
        admin_email: data.admin_email ?? '',
        admin_whatsapp: data.admin_whatsapp ?? '',
        push_enabled: data.push_enabled ?? true,
        email_enabled: data.email_enabled ?? true,
        whatsapp_enabled: data.whatsapp_enabled ?? false,
      })
    }
    setLoading(false)
  }, [])

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    const { data } = await db
      .from('admin_notifications')
      .select('id, order_id, type, recipient, status, error_message, sent_at')
      .order('sent_at', { ascending: false })
      .limit(50)
    setLogs(data ?? [])
    setLogsLoading(false)
  }, [])

  useEffect(() => {
    loadSettings()
    loadLogs()
  }, [loadSettings, loadLogs])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')

    const { error } = await db
      .from('admin_notification_settings')
      .update({
        admin_email: settings.admin_email,
        admin_whatsapp: settings.admin_whatsapp,
        push_enabled: settings.push_enabled,
        email_enabled: settings.email_enabled,
        whatsapp_enabled: settings.whatsapp_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', SETTINGS_ID)

    if (error) {
      setSaveError('Failed to save settings. Please try again.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  function set(key: keyof NotifSettings, val: string | boolean) {
    setSettings(s => ({ ...s, [key]: val }))
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F2747' }}>Admin Notification Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure how you are alerted when a customer places and pays for an order.
            Notifications are only sent after payment is confirmed by Worldpay.
          </p>
        </div>

        {/* Settings form */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Alert Configuration</h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {saveError}
                </div>
              )}

              {/* Contact details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Contact Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Email Address</label>
                  <p className="text-xs text-gray-400 mb-2">Receives HTML order alert emails when a new paid order arrives.</p>
                  <input
                    type="email"
                    value={settings.admin_email}
                    onChange={e => set('admin_email', e.target.value)}
                    placeholder="admin@pocketgrocery.com"
                    className="w-full max-w-sm px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5FAE9B] focus:ring-1 focus:ring-[#5FAE9B] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin WhatsApp Number</label>
                  <p className="text-xs text-gray-400 mb-2">Include country code, e.g. +447700900000. Requires Twilio WhatsApp to be configured.</p>
                  <input
                    type="tel"
                    value={settings.admin_whatsapp}
                    onChange={e => set('admin_whatsapp', e.target.value)}
                    placeholder="+447700900000"
                    className="w-full max-w-sm px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#5FAE9B] focus:ring-1 focus:ring-[#5FAE9B] transition-colors"
                  />
                </div>
              </div>

              {/* Channel toggles */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Notification Channels</h3>

                {([
                  {
                    key: 'push_enabled' as const,
                    label: 'Push Notifications',
                    desc: 'OneSignal push to all admin-tagged users when an order is paid.',
                    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
                    color: '#5FAE9B',
                    bg: '#EBF4F1',
                  },
                  {
                    key: 'email_enabled' as const,
                    label: 'Email Notifications',
                    desc: 'Sends a detailed HTML email with order summary, items, and delivery info.',
                    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                    color: '#3b82f6',
                    bg: '#eff6ff',
                  },
                  {
                    key: 'whatsapp_enabled' as const,
                    label: 'WhatsApp Notifications',
                    desc: 'Sends a brief WhatsApp message via Twilio to the admin WhatsApp number above.',
                    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                    color: '#16a34a',
                    bg: '#f0fdf4',
                  },
                ] as const).map(ch => (
                  <div key={ch.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ch.bg }}>
                        <svg className="w-5 h-5" style={{ color: ch.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ch.icon} />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{ch.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{ch.desc}</p>
                      </div>
                    </div>
                    <Toggle checked={settings[ch.key]} onChange={v => set(ch.key, v)} />
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: saved ? '#5FAE9B' : '#0F2747' }}
                >
                  {saving ? 'Saving…' : saved ? 'Saved!' : 'Save settings'}
                </button>
                <p className="text-xs text-gray-400">
                  Notifications only fire after Worldpay confirms payment.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Notification log */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">Notification Log</h2>
            <button
              onClick={loadLogs}
              className="text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#5FAE9B' }}
            >
              Refresh
            </button>
          </div>

          {logsLoading ? (
            <div className="p-6 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-400">No notifications sent yet.</p>
              <p className="text-xs text-gray-300 mt-1">Logs appear here after a paid order triggers admin alerts.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">Recipient</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">Error</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400">Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {TYPE_LABELS[log.type] ?? log.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700 text-xs font-mono truncate max-w-[180px]">
                        {log.recipient}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[log.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-red-500 truncate max-w-[200px]">
                        {log.error_message ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-gray-400 whitespace-nowrap">
                        {new Date(log.sent_at).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">When are admin notifications triggered?</p>
          <ul className="text-xs text-amber-600 space-y-1 list-disc ml-4">
            <li>Only after Worldpay confirms payment (AUTHORISED / SETTLED webhook event).</li>
            <li>Pending, failed, and abandoned orders never trigger admin alerts.</li>
            <li>Duplicate notifications are prevented — one of each type per order.</li>
            <li>Push requires OneSignal REST API Key configured as a Supabase Edge Function secret.</li>
            <li>Email requires SendGrid API Key and a verified sender address.</li>
            <li>WhatsApp requires Twilio credentials and an approved WhatsApp sender number.</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
