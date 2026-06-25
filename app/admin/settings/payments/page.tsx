'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const SETTINGS_ID = '00000000-0000-0000-0000-000000000099'

type Tab = 'core' | 'applepay' | 'googlepay'

interface WpSettings {
  service_key: string
  entity_id: string
  client_key: string
  webhook_secret: string
  apple_pay_merchant_id: string
  apple_pay_domain_verification: string
  google_pay_merchant_id: string
  google_pay_merchant_name: string
  last_transaction_at: string | null
  last_webhook_at: string | null
}

function MaskedInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  help,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  help?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-gray-400 transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {help && <p className="mt-1 text-[11px] text-gray-400">{help}</p>}
    </div>
  )
}

export default function WorldpaySettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('core')
  const [settings, setSettings] = useState<WpSettings>({
    service_key: '',
    entity_id: '',
    client_key: '',
    webhook_secret: '',
    apple_pay_merchant_id: '',
    apple_pay_domain_verification: '',
    google_pay_merchant_id: '',
    google_pay_merchant_name: '',
    last_transaction_at: null,
    last_webhook_at: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('worldpay_settings')
      .select('service_key, entity_id, client_key, webhook_secret, apple_pay_merchant_id, apple_pay_domain_verification, google_pay_merchant_id, google_pay_merchant_name, last_transaction_at, last_webhook_at')
      .eq('id', SETTINGS_ID)
      .maybeSingle()
    if (data) {
      setSettings({
        service_key: data.service_key ?? '',
        entity_id: data.entity_id ?? '',
        client_key: data.client_key ?? '',
        webhook_secret: data.webhook_secret ?? '',
        apple_pay_merchant_id: data.apple_pay_merchant_id ?? '',
        apple_pay_domain_verification: data.apple_pay_domain_verification ?? '',
        google_pay_merchant_id: data.google_pay_merchant_id ?? '',
        google_pay_merchant_name: data.google_pay_merchant_name ?? '',
        last_transaction_at: data.last_transaction_at,
        last_webhook_at: data.last_webhook_at,
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setSettings((s) => ({ ...s, [name]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('worldpay_settings')
        .update({
          service_key: settings.service_key,
          entity_id: settings.entity_id,
          client_key: settings.client_key,
          webhook_secret: settings.webhook_secret,
          apple_pay_merchant_id: settings.apple_pay_merchant_id,
          apple_pay_domain_verification: settings.apple_pay_domain_verification,
          google_pay_merchant_id: settings.google_pay_merchant_id,
          google_pay_merchant_name: settings.google_pay_merchant_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', SETTINGS_ID)
      if (error) throw error
      setSaveMsg({ ok: true, text: 'Settings saved successfully.' })
    } catch {
      setSaveMsg({ ok: false, text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    if (!settings.service_key || !settings.entity_id) {
      setTestResult({ ok: false, message: 'Please save credentials before testing.' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ANON_KEY

      const res = await fetch(`${SUPABASE_URL}/functions/v1/worldpay-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'test_connection' }),
      })
      const data = await res.json()

      if (data.configured) {
        setTestResult({ ok: true, message: 'Credentials verified. Worldpay Access API is reachable.' })
      } else {
        setTestResult({ ok: false, message: data.error || 'Connection test failed.' })
      }
    } catch {
      setTestResult({ ok: false, message: 'Could not reach the payment service. Check your network.' })
    } finally {
      setTesting(false)
    }
  }

  const webhookUrl = `${SUPABASE_URL}/functions/v1/worldpay-webhook`

  const tabs: { id: Tab; label: string }[] = [
    { id: 'core', label: 'Core API' },
    { id: 'applepay', label: 'Apple Pay' },
    { id: 'googlepay', label: 'Google Pay' },
  ]

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Worldpay Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Production credentials for Worldpay Access API. Card data is never stored on PocketGrocery servers.
          </p>
        </div>

        {/* Status strip */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Last Transaction</p>
            <p className="text-sm text-gray-800">
              {loading ? '—' : settings.last_transaction_at
                ? new Date(settings.last_transaction_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                : 'No transactions yet'}
            </p>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Last Webhook</p>
            <p className="text-sm text-gray-800">
              {loading ? '—' : settings.last_webhook_at
                ? new Date(settings.last_webhook_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                : 'No webhooks received'}
            </p>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Status</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${settings.service_key ? 'bg-green-500' : 'bg-gray-300'}`} />
              <p className="text-sm text-gray-800">{settings.service_key ? 'Configured' : 'Not configured'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setActiveTab(t.id); setSaveMsg(null); setTestResult(null) }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="space-y-5">

          {/* ── Core API tab ─────────────────────────────────────────────────────── */}
          {activeTab === 'core' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-bold text-gray-800">API Credentials</h2>

                <MaskedInput
                  label="Service Key (Secret Key)"
                  name="service_key"
                  value={settings.service_key}
                  onChange={handleChange}
                  placeholder="T_S_PROD_..."
                  help="Found in Worldpay Dashboard → Settings → API Keys. Never share this key."
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Entity ID (Merchant Entity)</label>
                  <input
                    type="text"
                    name="entity_id"
                    value={settings.entity_id}
                    onChange={handleChange}
                    placeholder="default"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-gray-400 transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">Your Worldpay merchant entity identifier.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Client Key (Public)</label>
                  <input
                    type="text"
                    name="client_key"
                    value={settings.client_key}
                    onChange={handleChange}
                    placeholder="T_C_PROD_..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-gray-400 transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">Public key used by the Access Checkout v2 SDK in the browser. Safe to expose.</p>
                </div>

                <MaskedInput
                  label="Webhook Secret (HMAC Key)"
                  name="webhook_secret"
                  value={settings.webhook_secret}
                  onChange={handleChange}
                  placeholder="whsec_..."
                  help="Used to verify webhook signatures from Worldpay. Set the same value in your Worldpay Dashboard webhook settings."
                />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
                <h2 className="text-sm font-bold text-gray-800">Webhook Configuration</h2>
                <p className="text-xs text-gray-500">
                  Add this URL in your Worldpay Dashboard under Notifications / Webhooks. Worldpay will POST payment events here.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-mono text-gray-700 break-all">
                    {webhookUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(webhookUrl)}
                    className="text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Events to subscribe to:</p>
                  <ul className="list-disc ml-4 space-y-0.5 text-gray-400">
                    <li>AUTHORISED / SENT_FOR_SETTLEMENT</li>
                    <li>REFUSED / ERROR / CANCELLED / EXPIRED</li>
                    <li>REFUNDED / REFUND_COMPLETE</li>
                    <li>CHARGEBACK</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* ── Apple Pay tab ─────────────────────────────────────────────────────── */}
          {activeTab === 'applepay' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-800">Apple Pay</h2>
                    <p className="text-xs text-gray-500">Displayed automatically on Safari / Apple devices.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Apple Pay Merchant ID</label>
                  <input
                    type="text"
                    name="apple_pay_merchant_id"
                    value={settings.apple_pay_merchant_id}
                    onChange={handleChange}
                    placeholder="merchant.com.yoursite.pay"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-gray-400 transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Register at developer.apple.com → Certificates, Identifiers &amp; Profiles → Merchant IDs. Must match the ID configured in Worldpay.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-bold text-gray-800">Domain Verification File</h2>
                <p className="text-xs text-gray-500">
                  Apple requires a domain verification file to be served at{' '}
                  <code className="bg-gray-100 px-1 rounded text-gray-700">/.well-known/apple-developer-merchantid-domain-association</code>.
                  Paste the file contents here — it will be served automatically.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Verification File Contents</label>
                  <textarea
                    name="apple_pay_domain_verification"
                    value={settings.apple_pay_domain_verification}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Paste the contents of the apple-developer-merchantid-domain-association file here..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-gray-400 transition-colors resize-none"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Download from Apple Developer Portal → Merchant IDs → your merchant → Download Domain Association File.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-xs font-semibold text-blue-700 mb-1">Setup Checklist</p>
                <ul className="text-xs text-blue-600 space-y-1 list-disc ml-4">
                  <li>Create a Merchant ID in Apple Developer Portal</li>
                  <li>Enable Apple Pay capability for your Merchant ID</li>
                  <li>Register your domain in Apple Developer Portal</li>
                  <li>Paste the domain association file contents above</li>
                  <li>Configure the same Merchant ID in your Worldpay Dashboard</li>
                </ul>
              </div>
            </>
          )}

          {/* ── Google Pay tab ─────────────────────────────────────────────────────── */}
          {activeTab === 'googlepay' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-800">Google Pay</h2>
                    <p className="text-xs text-gray-500">Displayed automatically on Chrome / Android devices.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Google Pay Merchant ID</label>
                  <input
                    type="text"
                    name="google_pay_merchant_id"
                    value={settings.google_pay_merchant_id}
                    onChange={handleChange}
                    placeholder="BCR2DN..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-gray-400 transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    From Google Pay &amp; Wallet Console → Business profile. Required for production payments.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Merchant Display Name</label>
                  <input
                    type="text"
                    name="google_pay_merchant_name"
                    value={settings.google_pay_merchant_name}
                    onChange={handleChange}
                    placeholder="PocketGrocery"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Shown to customers on the Google Pay payment sheet.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-xs font-semibold text-blue-700 mb-1">Setup Checklist</p>
                <ul className="text-xs text-blue-600 space-y-1 list-disc ml-4">
                  <li>Create a business profile at pay.google.com/business/console</li>
                  <li>Get your Merchant ID from the console</li>
                  <li>Ensure Worldpay is configured as your payment processor gateway</li>
                  <li>Request production access once testing is complete</li>
                </ul>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#0F2747' }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            {activeTab === 'core' && (
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            )}
          </div>

          {saveMsg && (
            <div className={`p-3 rounded-xl text-sm ${saveMsg.ok ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-600'}`}>
              {saveMsg.text}
            </div>
          )}

          {testResult && (
            <div className={`p-3 rounded-xl text-sm ${testResult.ok ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-600'}`}>
              {testResult.message}
            </div>
          )}
        </form>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <div className="flex items-start gap-3">
            <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1">Security Notice</p>
              <p className="text-xs text-amber-600">
                The Service Key and Webhook Secret are sensitive credentials stored encrypted in your database.
                Only admin users can view or modify these settings.
                Card numbers and CVVs are never processed by PocketGrocery servers — they are tokenized by Worldpay&apos;s Access Checkout SDK directly in the browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
