'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface QueueStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
}

interface Props {
  accessToken: string | null
  batchId: string | null
  isRunning: boolean
  onRunningChange: (v: boolean) => void
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export default function AIContentQueue({ accessToken, batchId, isRunning, onRunningChange }: Props) {
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const workerRef = useRef<boolean>(false)

  const fetchStats = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcErr } = await (supabase as any).rpc(
        'get_ai_content_queue_stats',
        { p_batch_id: batchId ?? null },
      )
      if (rpcErr) throw rpcErr
      if (data && data.length > 0) {
        const row = data[0]
        setStats({
          total:      Number(row.total      ?? 0),
          pending:    Number(row.pending     ?? 0),
          processing: Number(row.processing  ?? 0),
          completed:  Number(row.completed   ?? 0),
          failed:     Number(row.failed      ?? 0),
        })
      }
      setError(null)
    } catch (err) {
      setError(String(err))
    }
  }, [batchId])

  const triggerWorker = useCallback(async () => {
    if (!accessToken || workerRef.current) return
    workerRef.current = true
    onRunningChange(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-content-worker`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(batchId ? { batch_id: batchId } : {}),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      if ((json.remaining ?? 0) > 0) {
        workerRef.current = false
        setTimeout(() => triggerWorker(), 500)
        return
      }
    } catch (err) {
      setError(String(err))
    }
    workerRef.current = false
    onRunningChange(false)
    fetchStats()
  }, [accessToken, batchId, onRunningChange, fetchStats])

  // Poll stats while running
  useEffect(() => {
    if (isRunning) {
      fetchStats()
      pollRef.current = setInterval(fetchStats, 3000)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
      fetchStats()
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [isRunning, fetchStats])

  const handleRetry = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('retry_failed_ai_jobs', { p_batch_id: batchId ?? null })
      await fetchStats()
      triggerWorker()
    } catch (err) {
      setError(String(err))
    }
  }

  if (!stats || stats.total === 0) return null

  const pct = stats.total > 0
    ? Math.round(((stats.completed + stats.failed) / stats.total) * 100)
    : 0

  const allDone = stats.pending === 0 && stats.processing === 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isRunning && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          <span className="text-sm font-semibold text-gray-800">AI Content Generation</span>
          {isRunning && <span className="text-xs text-emerald-600 font-medium">Running...</span>}
          {allDone && stats.total > 0 && !isRunning && <span className="text-xs text-gray-400">Complete</span>}
        </div>
        <span className="text-xs text-gray-500">{pct}%</span>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: stats.failed > 0 && allDone ? '#ef4444' : '#5FAE9B',
          }}
        />
      </div>

      <div className="flex items-center gap-4 text-xs">
        <Chip label="Total"      value={stats.total}      color="text-gray-600" />
        {stats.pending    > 0 && <Chip label="Pending"    value={stats.pending}    color="text-amber-600" />}
        {stats.processing > 0 && <Chip label="Processing" value={stats.processing} color="text-blue-600" />}
        {stats.completed  > 0 && <Chip label="Done"       value={stats.completed}  color="text-emerald-600" />}
        {stats.failed     > 0 && <Chip label="Failed"     value={stats.failed}     color="text-red-600" />}

        {stats.failed > 0 && allDone && (
          <button
            onClick={handleRetry}
            className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 underline underline-offset-2"
          >
            Retry {stats.failed} failed
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-500 truncate" title={error}>{error}</p>}
    </div>
  )
}

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`font-semibold ${color}`}>{value}</span>
      <span className="text-gray-400">{label}</span>
    </span>
  )
}
