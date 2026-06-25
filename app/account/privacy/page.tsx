'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AccountLayout from '@/components/AccountLayout'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface ConsentState {
  analytics: boolean
  personalisation: boolean
  third_party_sharing: boolean
  data_export_requested: boolean
}

const DEFAULT: ConsentState = {
  analytics: true,
  personalisation: true,
  third_party_sharing: false,
  data_export_requested: false,
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? '' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={checked ? { backgroundColor: '#5FAE9B' } : {}}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function SectionRow({
  title,
  description,
  checked,
  onChange,
  locked,
  lockedReason,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  locked?: boolean
  lockedReason?: string
}) {
  return (
    <div className="flex items-start justify-between py-5">
      <div className="flex-1 mr-4">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {locked ? <span className="text-amber-600 font-medium">{lockedReason} </span> : null}
          {description}
        </p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={locked} />
    </div>
  )
}

export default function PrivacySettingsPage() {
  const { user } = useAuth()
  const [consent, setConsent] = useState<ConsentState>(DEFAULT)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exportRequested, setExportRequested] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: prof } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!prof) { setLoading(false); return }
    setProfileId(prof.id)

    const { data } = await supabase
      .from('data_privacy_logs' as any)
      .select('event_type, metadata')
      .eq('user_profile_id', prof.id)
      .order('created_at', { ascending: false })

    const events = (data as any as { event_type: string; metadata: Record<string, any> }[]) ?? []

    const latestConsent: Partial<ConsentState> = {}
    const seen = new Set<string>()
    for (const ev of events) {
      if (ev.event_type === 'consent_update' && !seen.has('consent')) {
        seen.add('consent')
        const m = ev.metadata ?? {}
        latestConsent.analytics = Boolean(m.analytics)
        latestConsent.personalisation = Boolean(m.personalisation)
        latestConsent.third_party_sharing = Boolean(m.third_party_sharing)
      }
      if (ev.event_type === 'data_export_request' && !seen.has('export')) {
        seen.add('export')
        latestConsent.data_export_requested = true
      }
    }

    setConsent({ ...DEFAULT, ...latestConsent })
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  function set(key: keyof ConsentState, val: boolean) {
    setConsent((c) => ({ ...c, [key]: val }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profileId) return
    setError('')
    setSaving(true)

    const { error: err } = await supabase.from('data_privacy_logs' as any).insert({
      user_profile_id: profileId,
      event_type: 'consent_update',
      metadata: {
        analytics: consent.analytics,
        personalisation: consent.personalisation,
        third_party_sharing: consent.third_party_sharing,
      },
    })

    if (err) {
      setError('Failed to save privacy settings. Please try again.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  async function handleExportRequest() {
    if (!profileId || exportRequested) return
    const { error: err } = await supabase.from('data_privacy_logs' as any).insert({
      user_profile_id: profileId,
      event_type: 'data_export_request',
      metadata: { requested_at: new Date().toISOString() },
    })
    if (!err) {
      setExportRequested(true)
      setConsent((c) => ({ ...c, data_export_requested: true }))
    }
  }

  if (loading) {
    return (
      <AccountLayout>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">Loading privacy settings...</p>
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-lg font-bold text-gray-900">Privacy Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Control how PocketGrocery uses your data. These settings apply to optional data processing only.
            </p>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-1">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="divide-y divide-gray-50">
              <SectionRow
                title="Essential cookies & data processing"
                description="Required for the service to function — order processing, authentication, security, and fraud prevention. Cannot be disabled."
                checked={true}
                onChange={() => {}}
                locked
                lockedReason="Required for the service to function. Cannot be disabled under GDPR Article 6(1)(b) and (f)."
              />
              <SectionRow
                title="Analytics & usage data"
                description="Helps us understand how the app is used so we can improve it. Data is anonymised and never sold."
                checked={consent.analytics}
                onChange={(v) => set('analytics', v)}
              />
              <SectionRow
                title="Personalisation"
                description="Allows us to show you relevant products, recipes, and recommendations based on your shopping history."
                checked={consent.personalisation}
                onChange={(v) => set('personalisation', v)}
              />
              <SectionRow
                title="Third-party sharing for marketing"
                description="Share anonymised purchase trends with advertising partners to show you relevant ads on other platforms."
                checked={consent.third_party_sharing}
                onChange={(v) => set('third_party_sharing', v)}
              />
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-6 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: saved ? '#5FAE9B' : '#0F2747' }}
              >
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save preferences'}
              </button>
              <p className="text-xs text-gray-400">Changes take effect immediately.</p>
            </div>
          </form>
        </div>

        {/* GDPR Rights */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Your GDPR Rights</h2>
            <p className="text-xs text-gray-500 mt-0.5">Under UK GDPR, you have the following rights regarding your personal data.</p>
          </div>

          <div className="p-6 space-y-4">

            {/* Right to access / data portability */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EBF4F1' }}>
                <svg className="w-4 h-4" fill="none" stroke="#5FAE9B" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">Right to Data Portability</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">Request a copy of all personal data we hold about you in a machine-readable format. We will deliver it to your email within 30 days.</p>
                {consent.data_export_requested || exportRequested ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-xl font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Export requested — we will email your data within 30 days
                  </div>
                ) : (
                  <button
                    onClick={handleExportRequest}
                    className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Request Data Export
                  </button>
                )}
              </div>
            </div>

            {/* Right to erasure */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">Right to Erasure (Right to be Forgotten)</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">Request permanent deletion of your account and all associated personal data. A 30-day grace period applies.</p>
                <Link
                  href="/account/delete"
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors inline-block"
                >
                  Go to Delete Account
                </Link>
              </div>
            </div>

            {/* Right to rectification */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EFF6FF' }}>
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">Right to Rectification</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">Update or correct your personal information at any time via your profile settings.</p>
                <Link
                  href="/account/profile"
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors inline-block"
                >
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Right to object */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">Right to Object</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">Object to processing of your data for direct marketing purposes by disabling marketing consent above, or contact our Data Protection Officer.</p>
                <Link
                  href="/contact"
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors inline-block"
                >
                  Contact DPO
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Legal links */}
        <div className="bg-gray-50 rounded-2xl p-4 flex flex-wrap gap-3">
          <p className="text-xs text-gray-500 w-full mb-1">Relevant policies:</p>
          {[
            { label: 'Privacy Policy', href: '/legal/privacy-policy' },
            { label: 'Cookie Policy', href: '/legal/cookie-policy' },
            { label: 'Terms & Conditions', href: '/legal/terms-conditions' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="text-xs font-semibold text-gray-600 underline hover:text-gray-900 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

      </div>
    </AccountLayout>
  )
}
