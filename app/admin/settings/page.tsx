'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

type Setting = { key: string; value: string; label: string; desc: string }

const SETTING_DEFS = [
  { key: 'site_name', label: 'Site Name', desc: 'The name of your store' },
  { key: 'free_delivery_threshold', label: 'Free Delivery Threshold (£)', desc: 'Minimum order amount for free delivery' },
  { key: 'delivery_charge', label: 'Standard Delivery Charge (£)', desc: 'Charge for orders below the free delivery threshold' },
  { key: 'coins_per_pound', label: 'Coins per £1 Spent', desc: 'How many Pocket Coins customers earn per £1' },
  { key: 'referral_coins', label: 'Referral Reward (coins)', desc: 'Coins awarded to referrer on successful referral' },
  { key: 'referee_coins', label: 'Referee Reward (coins)', desc: 'Coins awarded to the referred friend' },
  { key: 'daily_login_coins', label: 'Daily Login Bonus (coins)', desc: 'Coins awarded for daily login' },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('settings')
      .select('key, value')
      .then(({ data }) => {
        const map: Record<string, string> = {}
        ;(data ?? []).forEach((row: { key: string; value: string }) => {
          map[row.key] = row.value
        })
        setSettings(map)
        setLoading(false)
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = Object.keys(settings).map(key => ({
      key,
      value: settings[key],
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('settings')
      .upsert(payload, { onConflict: 'key' })

    if (error) {
      console.error('Error saving settings:', error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Configure store settings and rewards</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-5">
                {SETTING_DEFS.map((def) => (
                  <div key={def.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{def.label}</label>
                    <p className="text-xs text-gray-400 mb-2">{def.desc}</p>
                    <input
                      type="text"
                      value={settings[def.key] ?? ''}
                      onChange={(e) => setSettings((prev) => ({ ...prev, [def.key]: e.target.value }))}
                      className="w-full max-w-sm px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#5FAE9B] focus:ring-1 focus:ring-[#5FAE9B] transition-colors"
                    />
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: saved ? '#5FAE9B' : '#0F2747' }}
                >
                  {saving ? 'Saving…' : saved ? 'Saved!' : 'Save settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
