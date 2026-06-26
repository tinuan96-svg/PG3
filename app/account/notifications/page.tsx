'use client'

import { useState, useEffect, useCallback } from 'react'
import AccountLayout from '@/components/AccountLayout'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface Prefs {
  id?: string
  email_transactional: boolean
  email_marketing: boolean
  sms_transactional: boolean
  sms_marketing: boolean
  whatsapp_transactional: boolean
  whatsapp_marketing: boolean
  push_order_updates: boolean
  push_promotions: boolean
  push_flash_deals: boolean
  push_new_products: boolean
  push_recipes: boolean
}

const DEFAULT_PREFS: Prefs = {
  email_transactional: true,
  email_marketing: false,
  sms_transactional: true,
  sms_marketing: false,
  whatsapp_transactional: false,
  whatsapp_marketing: false,
  push_order_updates: true,
  push_promotions: false,
  push_flash_deals: false,
  push_new_products: false,
  push_recipes: false,
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

function PrefRow({
  label,
  description,
  checked,
  onChange,
  locked,
  lockedReason,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  locked?: boolean
  lockedReason?: string
}) {
  return (
    <div className="flex items-start justify-between py-4">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{locked ? lockedReason : description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={locked} />
    </div>
  )
}

export default function NotificationPreferencesPage() {
  const { user, profile } = useAuth()
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
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
      .from('communication_preferences')
      .select('*')
      .eq('user_profile_id', prof.id)
      .maybeSingle()

    if (data) {
      setPrefs({
        id: data.id,
        email_transactional: data.email_transactional,
        email_marketing: data.email_marketing,
        sms_transactional: data.sms_transactional,
        sms_marketing: data.sms_marketing,
        whatsapp_transactional: data.whatsapp_transactional,
        whatsapp_marketing: data.whatsapp_marketing,
        push_order_updates: data.push_order_updates ?? true,
        push_promotions: data.push_promotions ?? false,
        push_flash_deals: data.push_flash_deals ?? false,
        push_new_products: data.push_new_products ?? false,
        push_recipes: data.push_recipes ?? false,
      })
    }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  function set(key: keyof Prefs, val: boolean) {
    setPrefs((p) => ({ ...p, [key]: val }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profileId) return
    setError('')
    setSaving(true)

    const payload = {
      user_profile_id: profileId,
      email_transactional: prefs.email_transactional,
      email_marketing: prefs.email_marketing,
      sms_transactional: prefs.sms_transactional,
      sms_marketing: prefs.sms_marketing,
      whatsapp_transactional: prefs.whatsapp_transactional,
      whatsapp_marketing: prefs.whatsapp_marketing,
      push_order_updates: prefs.push_order_updates,
      push_promotions: prefs.push_promotions,
      push_flash_deals: prefs.push_flash_deals,
      push_new_products: prefs.push_new_products,
      push_recipes: prefs.push_recipes,
      updated_at: new Date().toISOString(),
    }

    let err
    if (prefs.id) {
      // Don't include user_profile_id in update as it's likely fixed/non-updatable
      const { user_profile_id, ...updatePayload } = payload
      const res = await supabase.from('communication_preferences').update(updatePayload).eq('id', prefs.id)
      err = res.error
    } else {
      const res = await supabase.from('communication_preferences').insert(payload).select('id').maybeSingle()
      const newId = res.data?.id
      if (newId) setPrefs((p) => ({ ...p, id: newId }))
      err = res.error
    }

    if (err) {
      setError('Failed to save preferences. Please try again.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)

      const channels = ['email', 'sms', 'whatsapp'] as const
      for (const ch of channels) {
        const key = `${ch}_marketing` as keyof Prefs
        await supabase.from('consent_records').insert({
          user_profile_id: profileId,
          channel: ch,
          consent_type: 'marketing',
          granted: prefs[key] as boolean,
          source: 'account',
        })
      }
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <AccountLayout>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">Loading preferences...</p>
        </div>
      </AccountLayout>
    )
  }

  const hasPhone = Boolean(profile?.phone)

  return (
    <AccountLayout>
      <div className="space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
            <p className="text-sm text-gray-500 mt-0.5">Choose how you would like to hear from PocketGrocery.</p>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-1">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-800">Email</h3>
              </div>
              <div className="divide-y divide-gray-50 ml-9">
                <PrefRow
                  label="Order & Account notifications"
                  description="Order confirmations, delivery updates, account alerts. Always sent."
                  checked={prefs.email_transactional}
                  onChange={(v) => set('email_transactional', v)}
                  locked
                  lockedReason="Required — these are essential service communications."
                />
                <PrefRow
                  label="Marketing & promotions"
                  description="Special offers, new products, seasonal campaigns via email."
                  checked={prefs.email_marketing}
                  onChange={(v) => set('email_marketing', v)}
                />
              </div>
            </div>

            <div className="pt-2" />

            {/* SMS */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-800">SMS</h3>
                {!hasPhone && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Add a phone number in Profile Settings to enable SMS
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-50 ml-9">
                <PrefRow
                  label="Order & delivery updates via SMS"
                  description="Text messages for order confirmations and delivery notifications."
                  checked={prefs.sms_transactional}
                  onChange={(v) => set('sms_transactional', v)}
                  locked={!hasPhone}
                  lockedReason="Add a phone number in Profile Settings to enable SMS."
                />
                <PrefRow
                  label="Marketing & promotions via SMS"
                  description="Promotional offers and deals sent by text message."
                  checked={prefs.sms_marketing}
                  onChange={(v) => set('sms_marketing', v)}
                  locked={!hasPhone}
                  lockedReason="Add a phone number in Profile Settings to enable SMS."
                />
              </div>
            </div>

            <div className="pt-2" />

            {/* WhatsApp */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-800">WhatsApp</h3>
                {!hasPhone && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Add a phone number in Profile Settings to enable
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-50 ml-9">
                <PrefRow
                  label="Order & delivery updates via WhatsApp"
                  description="Rich WhatsApp messages with order details and tracking."
                  checked={prefs.whatsapp_transactional}
                  onChange={(v) => set('whatsapp_transactional', v)}
                  locked={!hasPhone}
                  lockedReason="Add a phone number in Profile Settings to enable WhatsApp."
                />
                <PrefRow
                  label="Marketing & promotions via WhatsApp"
                  description="Exclusive deals and product highlights on WhatsApp."
                  checked={prefs.whatsapp_marketing}
                  onChange={(v) => set('whatsapp_marketing', v)}
                  locked={!hasPhone}
                  lockedReason="Add a phone number in Profile Settings to enable WhatsApp."
                />
              </div>
            </div>

            <div className="pt-2" />

            <div className="pt-4 border-t border-gray-100 mt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-6 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: saved ? '#5FAE9B' : '#0F2747' }}
              >
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save preferences'}
              </button>
              <p className="text-xs text-gray-400">
                Your preferences are saved securely. You can change them at any time.
              </p>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-700 mb-1">How we use your preferences</p>
          <ul className="text-xs text-blue-600 space-y-1 list-disc ml-4">
            <li>Transactional messages (order updates, delivery alerts) are sent regardless of marketing opt-ins.</li>
            <li>Marketing messages are only sent if you have explicitly opted in.</li>
            <li>You can unsubscribe from any channel at any time from this page.</li>
            <li>We never sell your contact details to third parties.</li>
          </ul>
        </div>
      </div>
    </AccountLayout>
  )
}
