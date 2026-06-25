'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/sync-supplier-products`

type SyncResult = {
  success: boolean
  logId: string | null
  productsFetched: number
  productsInserted: number
  productsUpdated: number
  productsFailed: number
  errors: string[]
  debugLogs?: string[]
}

type Connection = {
  id: string
  name: string
  api_url: string
  consumer_key: string
  consumer_secret: string
  markup_percentage: number
  is_active: boolean
  last_synced_at: string | null
}

type SyncLog = {
  id: string
  connection_id: string | null
  connection_name: string | null
  triggered_by: string
  started_at: string
  completed_at: string | null
  products_fetched: number
  products_inserted: number
  products_updated: number
  products_failed: number
  error_messages: string[] | null
  debug_logs: string[] | null
}

type SyncingState = Record<string, boolean>

const EMPTY_FORM = { name: '', api_url: '', consumer_key: '', consumer_secret: '', markup_percentage: 15, is_active: true }

export default function SupplierFeedPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<SyncingState>({})
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({})
  const [expandedDebug, setExpandedDebug] = useState<string | null>(null)
  const autoSyncRef = useRef<NodeJS.Timeout | null>(null)

  const loadData = useCallback(async () => {
    const [connRes, logRes] = await Promise.all([
      supabase.from('supplier_connections').select('*').order('created_at', { ascending: false }),
      supabase.from('supplier_sync_logs').select('*').order('started_at', { ascending: false }).limit(30),
    ])
    setConnections((connRes.data as Connection[]) ?? [])
    setLogs((logRes.data as SyncLog[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function callEdgeFunction(payload: Record<string, unknown>): Promise<SyncResult> {
    const res = await fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    return data as SyncResult
  }

  async function handleSync(connectionId: string) {
    setSyncing((prev) => ({ ...prev, [connectionId]: true }))
    setSyncResults((prev) => { const next = { ...prev }; delete next[connectionId]; return next })
    try {
      const data = await callEdgeFunction({ connectionId, triggeredBy: 'manual' })
      setSyncResults((prev) => ({ ...prev, [connectionId]: data }))
      await loadData()
    } catch (err) {
      setSyncResults((prev) => ({
        ...prev,
        [connectionId]: { success: false, logId: null, productsFetched: 0, productsInserted: 0, productsUpdated: 0, productsFailed: 0, errors: [String(err)] },
      }))
    } finally {
      setSyncing((prev) => ({ ...prev, [connectionId]: false }))
    }
  }

  function openAdd() { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }

  function openEdit(conn: Connection) {
    setForm({ name: conn.name, api_url: conn.api_url, consumer_key: conn.consumer_key, consumer_secret: conn.consumer_secret, markup_percentage: conn.markup_percentage, is_active: conn.is_active })
    setEditingId(conn.id)
    setShowForm(true)
  }

  async function handleSaveConnection(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editingId) {
      await supabase.from('supplier_connections').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editingId)
    } else {
      await supabase.from('supplier_connections').insert(form)
    }
    setSaving(false)
    setShowForm(false)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this supplier connection?')) return
    await supabase.from('supplier_connections').delete().eq('id', id)
    loadData()
  }

  const totalInserted = logs.reduce((s, l) => s + l.products_inserted, 0)
  const totalUpdated = logs.reduce((s, l) => s + l.products_updated, 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Supplier Feed Engine</h1>
            <p className="text-sm text-gray-500">Connect WooCommerce stores and automatically import products as drafts</p>
          </div>
          <button
            onClick={openAdd}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0F2747' }}
          >
            + Add Supplier
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Connections', value: connections.filter((c) => c.is_active).length, color: '#5FAE9B' },
            { label: 'Products Imported', value: totalInserted, color: '#0F2747' },
            { label: 'Products Updated', value: totalUpdated, color: '#2563EB' },
            { label: 'Total Syncs', value: logs.length, color: '#6B7280' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Scheduled Auto-Sync</h2>
              <p className="text-sm text-gray-500">
                Server-side pg_cron job runs every 60 seconds via edge function
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Running
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-gray-900">Supplier Connections</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : connections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 mb-3">No supplier connections yet</p>
              <button onClick={openAdd} className="text-sm font-semibold text-[#5FAE9B] hover:underline">Add your first supplier</button>
            </div>
          ) : (
            connections.map((conn) => (
              <div key={conn.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{conn.name || 'Unnamed Connection'}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${conn.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {conn.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conn.api_url}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Markup: +{conn.markup_percentage}%</span>
                      {conn.last_synced_at && (
                        <span>Last sync: {new Date(conn.last_synced_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => openEdit(conn)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleSync(conn.id)}
                      disabled={syncing[conn.id]}
                      className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5"
                      style={{ backgroundColor: '#0F2747' }}
                    >
                      {syncing[conn.id] ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Syncing…
                        </>
                      ) : 'Sync Now'}
                    </button>
                    <button
                      onClick={() => handleDelete(conn.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {syncResults[conn.id] && (
                  <div className={`mt-3 pt-3 border-t border-gray-100 ${syncResults[conn.id].errors.length > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    <div className="flex flex-wrap gap-3 text-xs font-medium mb-1">
                      <span className="text-gray-600">Fetched: {syncResults[conn.id].productsFetched}</span>
                      <span className="text-green-700">Added: {syncResults[conn.id].productsInserted}</span>
                      <span className="text-blue-700">Updated: {syncResults[conn.id].productsUpdated}</span>
                      {(syncResults[conn.id].productsFailed ?? 0) > 0 && (
                        <span className="text-red-700">Failed: {syncResults[conn.id].productsFailed}</span>
                      )}
                    </div>
                    {syncResults[conn.id].errors.length > 0 && (
                      <div className="mt-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2 max-h-32 overflow-y-auto">
                        {syncResults[conn.id].errors.map((e, i) => (
                          <p key={i} className="text-[10px] text-red-600 font-mono leading-relaxed">{e}</p>
                        ))}
                      </div>
                    )}
                    {syncResults[conn.id].errors.length === 0 && syncResults[conn.id].productsInserted === 0 && syncResults[conn.id].productsUpdated === 0 && (
                      <p className="text-xs text-gray-400">No products found on this WooCommerce store.</p>
                    )}
                    {syncResults[conn.id].debugLogs && syncResults[conn.id].debugLogs!.length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedDebug(expandedDebug === conn.id ? null : conn.id)}
                          className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                        >
                          <svg className={`w-3 h-3 transition-transform ${expandedDebug === conn.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {expandedDebug === conn.id ? 'Hide' : 'Show'} debug logs ({syncResults[conn.id].debugLogs!.length} lines)
                        </button>
                        {expandedDebug === conn.id && (
                          <div className="mt-1.5 bg-gray-900 rounded-lg px-3 py-2.5 max-h-48 overflow-y-auto">
                            {syncResults[conn.id].debugLogs!.map((line, i) => (
                              <p key={i} className="text-[10px] text-green-400 font-mono leading-relaxed whitespace-pre">{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">Normalization Engine</h2>
          <p className="text-sm text-gray-500 mb-4">Every imported product is automatically cleaned before being saved as a draft.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Brand Extraction', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', before: 'Nirapara Matta Rice 5kg', after: 'Matta Rice 5kg', note: 'Brand: Nirapara' },
              { label: 'Weight Normalisation', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3', before: '5 KG / 500 G / 0.5kg', after: '5kg / 500g / 500g', note: 'Consistent unit format' },
              { label: 'Filler Word Removal', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', before: 'Premium Authentic Matta Rice', after: 'Matta Rice', note: 'Removes marketing words' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                    <svg className="w-3.5 h-3.5" style={{ color: '#5FAE9B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-700">{item.label}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-semibold text-red-400 mt-0.5 w-10 flex-shrink-0">Before</span>
                    <span className="text-xs text-gray-500 font-mono bg-red-50 px-2 py-0.5 rounded">{item.before}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-semibold mt-0.5 w-10 flex-shrink-0" style={{ color: '#5FAE9B' }}>After</span>
                    <span className="text-xs text-gray-800 font-mono font-semibold bg-green-50 px-2 py-0.5 rounded">{item.after}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-gray-900">Sync History</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-400">No sync logs yet.</p>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                      <th className="text-left px-5 py-3 font-medium">Started</th>
                      <th className="text-left px-5 py-3 font-medium">Connection</th>
                      <th className="text-left px-5 py-3 font-medium">Trigger</th>
                      <th className="text-right px-5 py-3 font-medium">Fetched</th>
                      <th className="text-right px-5 py-3 font-medium">Added</th>
                      <th className="text-right px-5 py-3 font-medium">Updated</th>
                      <th className="text-right px-5 py-3 font-medium">Failed</th>
                      <th className="text-left px-5 py-3 font-medium">Status</th>
                      <th className="text-left px-5 py-3 font-medium">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap text-xs">
                          {new Date(log.started_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-gray-700 text-xs max-w-[140px] truncate">
                          {log.connection_name ?? '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${log.triggered_by === 'manual' ? 'bg-blue-100 text-blue-700' : log.triggered_by === 'scheduled' ? 'bg-gray-100 text-gray-600' : 'bg-teal-100 text-teal-700'}`}>
                            {log.triggered_by}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-700 text-xs">{log.products_fetched}</td>
                        <td className="px-5 py-3 text-right text-green-600 font-medium text-xs">{log.products_inserted}</td>
                        <td className="px-5 py-3 text-right text-blue-600 text-xs">{log.products_updated}</td>
                        <td className="px-5 py-3 text-right text-red-500 text-xs">{log.products_failed}</td>
                        <td className="px-5 py-3">
                          {log.completed_at ? (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${(log.error_messages?.length ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {(log.error_messages?.length ?? 0) > 0 ? 'With errors' : 'Done'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Running</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-red-500 max-w-[200px]">
                          {log.error_messages && log.error_messages.length > 0 ? (
                            <span className="truncate block" title={log.error_messages.join('\n')}>
                              {log.error_messages[0]}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editingId ? 'Edit Supplier' : 'Add Supplier Connection'}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Connect a WooCommerce store to import products</p>
            </div>
            <form onSubmit={handleSaveConnection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Main WooCommerce Store" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#5FAE9B] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supplier API URL</label>
                <input type="url" required value={form.api_url} onChange={(e) => setForm((f) => ({ ...f, api_url: e.target.value }))} placeholder="https://yourstore.com" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#5FAE9B] transition-colors" />
                <p className="text-[10px] text-gray-400 mt-1">Products fetched from /wp-json/wc/v3/products</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Consumer Key</label>
                <input type="text" required value={form.consumer_key} onChange={(e) => setForm((f) => ({ ...f, consumer_key: e.target.value }))} placeholder="ck_xxxxxxxxxxxxxx" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#5FAE9B] transition-colors font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Consumer Secret</label>
                <input type="password" required value={form.consumer_secret} onChange={(e) => setForm((f) => ({ ...f, consumer_secret: e.target.value }))} placeholder="cs_xxxxxxxxxxxxxx" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#5FAE9B] transition-colors font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price Markup Percentage</label>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.5" min="-50" max="200" value={form.markup_percentage} onChange={(e) => setForm((f) => ({ ...f, markup_percentage: parseFloat(e.target.value) }))} className="w-28 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#5FAE9B] transition-colors" />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded" />
                <label htmlFor="is_active" className="text-sm text-gray-700">Enable auto-sync for this connection</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: '#0F2747' }}>
                  {saving ? 'Saving…' : editingId ? 'Update Connection' : 'Add Connection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
