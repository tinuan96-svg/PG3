'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface SyncResult {
  success: boolean
  logId: string | null
  productsFetched: number
  productsInserted: number
  productsUpdated: number
  productsSkipped: number
  productsFailed: number
  errors: string[]
  durationMs: number
}

interface SyncLog {
  id: string
  triggered_by: string
  status: string | null
  started_at: string
  completed_at: string | null
  products_fetched: number | null
  products_inserted: number | null
  products_updated: number | null
  products_skipped: number | null
  products_failed: number | null
  error_messages: string[] | null
}

interface ConnectionStatus {
  ok: boolean
  message: string
  productCount?: number
}

interface HealthMetrics {
  awaitingApproval: number
  missingImages: number
  missingDescriptions: number
  syncErrors: number
  lastSyncAt: string | null
  lastSyncTriggeredBy: string | null
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function StatusBadge({ status, failed }: { status: string | null; failed: number | null }) {
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Running
      </span>
    )
  }
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Success
      </span>
    )
  }
  if (status === 'partial' || (failed && failed > 0)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Partial
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Failed
    </span>
  )
}

function HealthCard({
  label, value, sub, color, icon,
}: {
  label: string
  value: string | number
  sub?: string
  color: 'green' | 'amber' | 'red' | 'blue' | 'gray'
  icon: React.ReactNode
}) {
  const colors = {
    green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700', icon: 'bg-green-100 text-green-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-600' },
    red:   { bg: 'bg-red-50',   border: 'border-red-100',   text: 'text-red-700',   icon: 'bg-red-100 text-red-600' },
    blue:  { bg: 'bg-blue-50',  border: 'border-blue-100',  text: 'text-blue-700',  icon: 'bg-blue-100 text-blue-600' },
    gray:  { bg: 'bg-gray-50',  border: 'border-gray-100',  text: 'text-gray-700',  icon: 'bg-gray-100 text-gray-500' },
  }
  const c = colors[color]
  return (
    <div className={`rounded-2xl border p-4 ${c.bg} ${c.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
          {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function ProductSyncPage() {
  useAuth()

  const [token, setToken] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? '')
    })
  }, [])

  const [connection, setConnection] = useState<ConnectionStatus | null>(null)
  const [connectionLoading, setConnectionLoading] = useState(false)

  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<SyncResult | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  const [singleProductId, setSingleProductId] = useState('')
  const [syncingOne, setSyncingOne] = useState(false)
  const [singleResult, setSingleResult] = useState<SyncResult | null>(null)

  const [logs, setLogs] = useState<SyncLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const [updatedSince, setUpdatedSince] = useState('')
  const [forceSync, setForceSync] = useState(false)

  const [health, setHealth] = useState<HealthMetrics | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true)
    try {
      const [awaitingRes, missingImgRes, missingDescRes, lastSyncRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('products').select('id', { count: 'exact', head: true }).eq('approval_status', 'draft'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('products').select('id', { count: 'exact', head: true }).eq('approval_status', 'draft').or('image.is.null,image.eq.'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('products').select('id', { count: 'exact', head: true }).eq('approval_status', 'draft').or('description.is.null,description.eq.'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('centralhub_sync_logs').select('started_at,triggered_by,products_failed').order('started_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      const lastLog = lastSyncRes.data as { started_at: string; triggered_by: string; products_failed: number | null } | null
      const syncErrors = lastLog?.products_failed ?? 0

      setHealth({
        awaitingApproval: awaitingRes.count ?? 0,
        missingImages: missingImgRes.count ?? 0,
        missingDescriptions: missingDescRes.count ?? 0,
        syncErrors,
        lastSyncAt: lastLog?.started_at ?? null,
        lastSyncTriggeredBy: lastLog?.triggered_by ?? null,
      })
    } catch {
      // silently fail — health widgets are non-critical
    } finally {
      setHealthLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  const testConnection = useCallback(async () => {
    setConnectionLoading(true)
    setConnection(null)
    try {
      const res = await fetch('/api/admin/centralhub-sync?action=test', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setConnection(data)
    } catch (err) {
      setConnection({ ok: false, message: String(err) })
    } finally {
      setConnectionLoading(false)
    }
  }, [token])

  const fetchLogs = useCallback(async () => {
    if (!token) return
    setLogsLoading(true)
    try {
      const res = await fetch('/api/admin/centralhub-sync?action=logs&limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setLogs(Array.isArray(data.logs) ? data.logs : [])
    } catch {
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) fetchLogs()
  }, [token, fetchLogs])

  async function syncAll() {
    setSyncing(true)
    setSyncError(null)
    setLastResult(null)
    try {
      const res = await fetch('/api/admin/centralhub-sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_all',
          updatedSince: updatedSince || undefined,
          force: forceSync,
        }),
      })
      const data: SyncResult = await res.json()
      if (!res.ok) {
        setSyncError((data as { error?: string }).error ?? 'Sync failed')
      } else {
        setLastResult(data)
        fetchLogs()
        fetchHealth()
      }
    } catch (err) {
      setSyncError(String(err))
    } finally {
      setSyncing(false)
    }
  }

  async function syncOne() {
    if (!singleProductId.trim()) return
    setSyncingOne(true)
    setSingleResult(null)
    try {
      const res = await fetch('/api/admin/centralhub-sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'sync_one', productId: singleProductId.trim() }),
      })
      const data: SyncResult = await res.json()
      setSingleResult(data)
      if (data.success) { fetchLogs(); fetchHealth() }
    } catch (err) {
      setSingleResult({
        success: false, logId: null, productsFetched: 0,
        productsInserted: 0, productsUpdated: 0, productsSkipped: 0,
        productsFailed: 1, errors: [String(err)], durationMs: 0,
      })
    } finally {
      setSyncingOne(false)
    }
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/product-sync-trigger`

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F2747' }}>CentralHub Sync</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sync products from CentralHub. CentralHub owns inventory; PocketGrocery owns content.
            </p>
          </div>
          <button
            onClick={() => { fetchHealth(); fetchLogs() }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Health Dashboard */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Sync Health</h2>
          {healthLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 p-4 bg-gray-50 animate-pulse h-20" />
              ))}
            </div>
          ) : health && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <HealthCard
                label="Awaiting Approval"
                value={health.awaitingApproval}
                sub="draft products"
                color={health.awaitingApproval > 0 ? 'amber' : 'green'}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <HealthCard
                label="Missing Images"
                value={health.missingImages}
                sub="draft products"
                color={health.missingImages > 0 ? 'amber' : 'green'}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
              <HealthCard
                label="Missing Descriptions"
                value={health.missingDescriptions}
                sub="draft products"
                color={health.missingDescriptions > 0 ? 'amber' : 'green'}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                }
              />
              <HealthCard
                label="Last Sync Errors"
                value={health.syncErrors}
                sub="in last run"
                color={health.syncErrors > 0 ? 'red' : 'green'}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <HealthCard
                label="Last Sync"
                value={health.lastSyncAt ? formatRelative(health.lastSyncAt) : 'Never'}
                sub={health.lastSyncTriggeredBy ? `via ${health.lastSyncTriggeredBy}` : undefined}
                color={health.lastSyncAt ? 'blue' : 'gray'}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>
          )}
        </div>

        {/* Connection test */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">CentralHub Connection</h2>
            <button
              onClick={testConnection}
              disabled={connectionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              {connectionLoading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              Test Connection
            </button>
          </div>

          {connection ? (
            <div className={`flex items-start gap-3 p-3 rounded-xl ${connection.ok ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${connection.ok ? 'bg-green-500' : 'bg-red-500'}`}>
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {connection.ok
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  }
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${connection.ok ? 'text-green-800' : 'text-red-800'}`}>
                  {connection.message}
                </p>
                {connection.productCount !== undefined && (
                  <p className="text-xs text-green-600 mt-0.5">
                    {connection.productCount} published product{connection.productCount !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Click "Test Connection" to verify CentralHub is reachable.</p>
          )}
        </div>

        {/* Webhook Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Webhook Endpoint</h2>
          <p className="text-xs text-gray-500 mb-3">
            Configure CentralHub to POST product updates to this URL for near real-time sync.
            Secure it with the <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">x-sync-secret</code> header.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 break-all select-all">
              {webhookUrl}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(webhookUrl)}
              className="flex-shrink-0 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
            >
              Copy
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-gray-500">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              JWT verification disabled (uses x-sync-secret)
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Payload: {'{ event, product }' } or {'{ event, products[] }'}
            </div>
          </div>
        </div>

        {/* Sync All */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Manual Sync — All Products</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Only sync products updated after
              </label>
              <input
                type="datetime-local"
                value={updatedSince}
                onChange={(e) => setUpdatedSince(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
              <p className="text-[11px] text-gray-400 mt-1">Leave blank to sync all published products.</p>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setForceSync((v) => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${forceSync ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${forceSync ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">Force re-sync (ignore updatedSince)</span>
              </label>
            </div>
          </div>

          <button
            onClick={syncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: syncing ? '#6b7280' : '#0F2747' }}
          >
            {syncing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync All Products
              </>
            )}
          </button>

          {syncError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm font-medium text-red-700">Sync failed</p>
              <p className="text-xs text-red-600 mt-0.5">{syncError}</p>
            </div>
          )}

          {lastResult && (
            <div className={`mt-4 p-4 rounded-xl border ${lastResult.success ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">Sync Complete</p>
                <span className="text-xs text-gray-500">{formatDuration(lastResult.durationMs)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Fetched', value: lastResult.productsFetched, color: 'text-blue-700' },
                  { label: 'Inserted', value: lastResult.productsInserted, color: 'text-green-700' },
                  { label: 'Updated', value: lastResult.productsUpdated, color: 'text-amber-700' },
                  { label: 'Skipped', value: lastResult.productsSkipped, color: 'text-gray-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white rounded-lg p-2.5 text-center">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {lastResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-red-700 mb-1">{lastResult.errors.length} error{lastResult.errors.length !== 1 ? 's' : ''}</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {lastResult.errors.slice(0, 10).map((e, i) => (
                      <p key={i} className="text-[11px] text-red-600 font-mono bg-red-50 px-2 py-1 rounded">{e}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sync Single Product */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Sync Single Product</h2>
          <p className="text-xs text-gray-500 mb-3">Enter the CentralHub product UUID to sync one specific product.</p>

          <div className="flex gap-2">
            <input
              type="text"
              value={singleProductId}
              onChange={(e) => setSingleProductId(e.target.value)}
              placeholder="CentralHub product UUID"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 font-mono"
            />
            <button
              onClick={syncOne}
              disabled={syncingOne || !singleProductId.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: '#5FAE9B' }}
            >
              {syncingOne ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Sync
            </button>
          </div>

          {singleResult && (
            <div className={`mt-3 p-3 rounded-xl border ${singleResult.success ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-sm font-medium text-gray-800">
                {singleResult.success
                  ? singleResult.productsInserted > 0 ? 'Product inserted.' : 'Product updated.'
                  : 'Sync failed.'}
              </p>
              {singleResult.errors.length > 0 && (
                <p className="text-xs text-red-600 mt-1">{singleResult.errors[0]}</p>
              )}
            </div>
          )}
        </div>

        {/* Sync Logs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Sync History</h2>
            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {logsLoading ? (
            <div className="flex items-center justify-center py-10">
              <svg className="w-6 h-6 animate-spin text-gray-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No sync runs yet. Trigger a sync above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 py-2 pr-4">Started</th>
                    <th className="text-left text-xs font-semibold text-gray-400 py-2 pr-4">Triggered by</th>
                    <th className="text-right text-xs font-semibold text-gray-400 py-2 pr-4">Fetched</th>
                    <th className="text-right text-xs font-semibold text-gray-400 py-2 pr-4">Inserted</th>
                    <th className="text-right text-xs font-semibold text-gray-400 py-2 pr-4">Updated</th>
                    <th className="text-right text-xs font-semibold text-gray-400 py-2 pr-4">Skipped</th>
                    <th className="text-left text-xs font-semibold text-gray-400 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-4 text-gray-600 text-xs whitespace-nowrap">
                        {formatDate(log.started_at)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                          {log.triggered_by}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right text-gray-700 font-medium">{log.products_fetched ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-right text-green-600 font-medium">{log.products_inserted ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-right text-amber-600 font-medium">{log.products_updated ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-right text-gray-400">{log.products_skipped ?? '—'}</td>
                      <td className="py-2.5">
                        <StatusBadge status={log.status} failed={log.products_failed} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Field ownership info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-800">Field Ownership Rules</p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-1">CentralHub owns (synced every run)</p>
                  <p className="text-xs text-blue-600 leading-relaxed">name &bull; price &bull; stock &bull; sku &bull; weight &bull; barcode &bull; is_active</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-1">PocketGrocery owns (never overwritten)</p>
                  <p className="text-xs text-blue-600 leading-relaxed">images &bull; description &bull; category &bull; slug &bull; SEO &bull; tags &bull; approval_status</p>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                New products arrive as <strong>draft</strong> and are hidden from the storefront until approved by an admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

