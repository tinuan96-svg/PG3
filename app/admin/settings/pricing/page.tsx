'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

type Connection = {
  id: string
  name: string
  api_url: string
  markup_percentage: number
}

export default function PricingSettingsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [markups, setMarkups] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [globalMarkup, setGlobalMarkup] = useState('15')
  const [applyingGlobal, setApplyingGlobal] = useState(false)

  useEffect(() => {
    supabase
      .from('supplier_connections')
      .select('id, name, api_url, markup_percentage')
      .order('created_at')
      .then(({ data }) => {
        const conns = (data as Connection[]) ?? []
        setConnections(conns)
        const m: Record<string, string> = {}
        conns.forEach((c) => { m[c.id] = String(c.markup_percentage) })
        setMarkups(m)
        setLoading(false)
      })
  }, [])

  async function handleSaveMarkup(id: string) {
    const pct = parseFloat(markups[id])
    if (isNaN(pct)) return
    setSaving((s) => ({ ...s, [id]: true }))
    await supabase
      .from('supplier_connections')
      .update({ markup_percentage: pct, updated_at: new Date().toISOString() })
      .eq('id', id)
    setSaving((s) => ({ ...s, [id]: false }))
    setSaved((s) => ({ ...s, [id]: true }))
    setTimeout(() => setSaved((s) => ({ ...s, [id]: false })), 2500)
    setConnections((cs) => cs.map((c) => c.id === id ? { ...c, markup_percentage: pct } : c))
  }

  async function handleApplyGlobal(e: React.FormEvent) {
    e.preventDefault()
    const pct = parseFloat(globalMarkup)
    if (isNaN(pct)) return
    setApplyingGlobal(true)
    for (const conn of connections) {
      await supabase
        .from('supplier_connections')
        .update({ markup_percentage: pct, updated_at: new Date().toISOString() })
        .eq('id', conn.id)
    }
    setMarkups((m) => {
      const next = { ...m }
      connections.forEach((c) => { next[c.id] = String(pct) })
      return next
    })
    setConnections((cs) => cs.map((c) => ({ ...c, markup_percentage: pct })))
    setApplyingGlobal(false)
  }

  function calcStorePrice(supplierPrice: number, markup: number): string {
    return (supplierPrice * (1 + markup / 100)).toFixed(2)
  }

  const EXAMPLES = [
    { label: 'Matta Rice 5kg', supplier: 8.99 },
    { label: 'Sambar Powder 100g', supplier: 1.49 },
    { label: 'Coconut Oil 500ml', supplier: 4.50 },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pricing Settings</h1>
          <p className="text-sm text-gray-500">
            Control supplier price markups. Final Price = Supplier Price × (1 + Markup / 100)
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-1">Apply Global Markup</h2>
          <p className="text-sm text-gray-500 mb-4">Set the same markup percentage across all supplier connections at once.</p>
          <form onSubmit={handleApplyGlobal} className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <input
                type="number"
                step="0.5"
                min="-50"
                max="200"
                value={globalMarkup}
                onChange={(e) => setGlobalMarkup(e.target.value)}
                className="w-20 text-sm font-semibold text-gray-900 focus:outline-none"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
            <button
              type="submit"
              disabled={applyingGlobal || connections.length === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#0F2747' }}
            >
              {applyingGlobal ? 'Applying…' : `Apply to All (${connections.length} connections)`}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Preview with {globalMarkup}% Markup</h3>
            <div className="grid grid-cols-3 gap-3">
              {EXAMPLES.map((ex) => {
                const markup = parseFloat(globalMarkup) || 0
                const store = parseFloat(calcStorePrice(ex.supplier, markup))
                return (
                  <div key={ex.label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2">{ex.label}</p>
                    <p className="text-xs text-gray-400">Supplier: £{ex.supplier.toFixed(2)}</p>
                    <p className="text-sm font-bold mt-1" style={{ color: '#0F2747' }}>Store: £{store.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      +£{(store - ex.supplier).toFixed(2)} margin
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-gray-900">Per-Connection Pricing</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : connections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-sm text-gray-400">No supplier connections yet. Add one in the Supplier Feed page.</p>
            </div>
          ) : (
            connections.map((conn) => {
              const pct = parseFloat(markups[conn.id] || '0')
              return (
                <div key={conn.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{conn.name}</h3>
                      <p className="text-xs text-gray-400 truncate max-w-xs">{conn.api_url}</p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: pct >= 0 ? '#5FAE9B' : '#EF4444' }}>
                      {pct >= 0 ? '+' : ''}{conn.markup_percentage}% current
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                      <input
                        type="number"
                        step="0.5"
                        min="-50"
                        max="200"
                        value={markups[conn.id] ?? ''}
                        onChange={(e) => setMarkups((m) => ({ ...m, [conn.id]: e.target.value }))}
                        className="w-20 text-sm font-semibold text-gray-900 focus:outline-none"
                      />
                      <span className="text-sm text-gray-400">%</span>
                    </div>
                    <button
                      onClick={() => handleSaveMarkup(conn.id)}
                      disabled={saving[conn.id]}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: saved[conn.id] ? '#5FAE9B' : '#0F2747' }}
                    >
                      {saving[conn.id] ? 'Saving…' : saved[conn.id] ? 'Saved!' : 'Update'}
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {EXAMPLES.map((ex) => (
                      <div key={ex.label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] text-gray-400">{ex.label}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Supplier: £{ex.supplier.toFixed(2)}</p>
                        <p className="text-xs font-bold mt-0.5" style={{ color: '#0F2747' }}>
                          Store: £{calcStorePrice(ex.supplier, pct)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
