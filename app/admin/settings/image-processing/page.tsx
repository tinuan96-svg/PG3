'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

type Settings = {
  auto_process_on_upload: boolean
  generate_thumbnail: boolean
  keep_original: boolean
  replace_storefront_image: boolean
  output_quality: number
  shadow_strength: number
  padding_pct: number
  bg_threshold: number
  max_retries: number
  main_size_px: number
  medium_size_px: number
  thumb_size_px: number
  enable_openai_metadata: boolean
  openai_fields: string[]
}

type Job = {
  id: string
  product_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  pipeline_stage: string | null
  processing_engine: string | null
  original_url: string | null
  processed_url: string | null
  medium_url: string | null
  thumbnail_url: string | null
  error_message: string | null
  retry_count: number
  duration_ms: number | null
  created_at: string
}

type Stats = {
  pending: number
  processing: number
  completed: number
  failed: number
  total: number
  avg_duration_ms: number | null
}

const DEFAULTS: Settings = {
  auto_process_on_upload: false,
  generate_thumbnail: true,
  keep_original: true,
  replace_storefront_image: true,
  output_quality: 85,
  shadow_strength: 0.15,
  padding_pct: 10,
  bg_threshold: 30,
  max_retries: 3,
  main_size_px: 1200,
  medium_size_px: 600,
  thumb_size_px: 300,
  enable_openai_metadata: false,
  openai_fields: ['brand', 'weight', 'category', 'seo'],
}

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'
const OPENAI_FIELD_OPTIONS = ['brand', 'weight', 'category', 'seo']

export default function ImageProcessingPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobFilter, setJobFilter] = useState('all')

  const [stats, setStats] = useState<Stats | null>(null)

  const [enqueueing, setEnqueueing] = useState(false)
  const [enqueueLimit, setEnqueueLimit] = useState(100)
  const [enqueueResult, setEnqueueResult] = useState<number | null>(null)

  const [processing, setProcessing] = useState(false)
  const [processBatchSize, setProcessBatchSize] = useState(20)
  const [processResult, setProcessResult] = useState<{ ok: number; fail: number } | null>(null)

  const [retrying, setRetrying] = useState(false)
  const [retryResult, setRetryResult] = useState<number | null>(null)

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    const { data } = await db.rpc('get_image_processing_stats')
    if (data) setStats(data as Stats)
  }, [])

  const loadJobs = useCallback(async () => {
    setJobsLoading(true)
    const { data } = await db
      .from('image_processing_jobs')
      .select('id,product_id,status,pipeline_stage,processing_engine,original_url,processed_url,medium_url,thumbnail_url,error_message,retry_count,duration_ms,created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    setJobs((data ?? []) as Job[])
    setJobsLoading(false)
  }, [])

  useEffect(() => {
    async function load() {
      const { data } = await db
        .from('image_processing_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .maybeSingle()
      if (data) setSettings({ ...DEFAULTS, ...data })
      setLoading(false)
    }
    load()
    loadJobs()
    loadStats()
  }, [loadJobs, loadStats])

  // ── Settings ────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    await db.from('image_processing_settings').upsert(
      { id: SETTINGS_ID, ...settings, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function toggle(key: keyof Settings) {
    setSettings((p) => ({ ...p, [key]: !p[key] }))
  }

  function toggleOpenaiField(field: string) {
    setSettings((p) => ({
      ...p,
      openai_fields: p.openai_fields.includes(field)
        ? p.openai_fields.filter((f) => f !== field)
        : [...p.openai_fields, field],
    }))
  }

  // ── Enqueue pending jobs ─────────────────────────────────────────────────────

  async function handleEnqueue() {
    setEnqueueing(true)
    setEnqueueResult(null)
    const { data } = await db.rpc('enqueue_image_processing_jobs', { p_limit: enqueueLimit })
    setEnqueueResult(typeof data === 'number' ? data : 0)
    setEnqueueing(false)
    loadJobs()
    loadStats()
  }

  // ── Process pending jobs ─────────────────────────────────────────────────────

  async function handleProcess() {
    if (processing) return
    setProcessing(true)
    setProcessResult(null)

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { setProcessing(false); return }

    const { data: pendingJobs } = await db
      .from('image_processing_jobs')
      .select('id, product_id, original_url, product_image_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(processBatchSize)

    if (!pendingJobs || pendingJobs.length === 0) {
      setProcessResult({ ok: 0, fail: 0 })
      setProcessing(false)
      return
    }

    let ok = 0
    let fail = 0

    for (const job of pendingJobs) {
      try {
        const res = await fetch('/api/admin/process-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            job_id: job.id,
            product_id: job.product_id,
            product_image_id: job.product_image_id ?? undefined,
            image_url: job.original_url,
          }),
        })
        const result = await res.json()
        if (result.success) ok++
        else fail++
      } catch {
        fail++
      }
    }

    setProcessResult({ ok, fail })
    setProcessing(false)
    loadJobs()
    loadStats()
  }

  // ── Retry failed ─────────────────────────────────────────────────────────────

  async function handleRetry() {
    setRetrying(true)
    setRetryResult(null)
    const { data } = await db.rpc('retry_failed_image_jobs', { p_max_retries: settings.max_retries })
    setRetryResult(typeof data === 'number' ? data : 0)
    setRetrying(false)
    loadJobs()
    loadStats()
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const filteredJobs = jobFilter === 'all' ? jobs : jobs.filter((j) => j.status === jobFilter)

  const displayStats = stats ?? {
    pending:        jobs.filter((j) => j.status === 'pending').length,
    processing:     jobs.filter((j) => j.status === 'processing').length,
    completed:      jobs.filter((j) => j.status === 'completed').length,
    failed:         jobs.filter((j) => j.status === 'failed').length,
    total:          jobs.length,
    avg_duration_ms: null,
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Image Processing Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sharp-based background removal, centering, and WebP conversion.
            Packaging pixels are never altered.
          </p>
        </div>

        {/* Pipeline explanation */}
        <div className="bg-[#0F2747]/5 border border-[#0F2747]/10 rounded-2xl p-5">
          <p className="text-xs font-bold tracking-widest uppercase text-[#0F2747] mb-3">What the pipeline does</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
            {[
              { icon: '↓', label: 'Download' },
              { icon: '⚗', label: 'Remove BG' },
              { icon: '✂', label: 'Trim edges' },
              { icon: '⊞', label: 'Center + pad' },
              { icon: '◎', label: 'Shadow' },
              { icon: '◈', label: 'Sharpen' },
              { icon: '▣', label: 'WebP ×3' },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-white rounded-xl py-2.5 px-2 border border-gray-100">
                <span className="text-base block">{icon}</span>
                <span className="text-[10px] font-semibold text-gray-500 mt-0.5 block">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Background removal uses corner-sampling flood fill. Only pixels matching the background colour are erased.
            Product labels, text, logos, and nutrition panels are <strong className="text-gray-700">never touched</strong>.
          </p>
        </div>

        {/* Stats KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Pending',    value: displayStats.pending,    color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Processing', value: displayStats.processing,  color: '#D97706', bg: '#FFFBEB' },
            { label: 'Completed',  value: displayStats.completed,   color: '#16A34A', bg: '#F0FDF4' },
            { label: 'Failed',     value: displayStats.failed,      color: '#DC2626', bg: '#FEF2F2' },
            {
              label: 'Avg time',
              value: displayStats.avg_duration_ms
                ? `${(displayStats.avg_duration_ms / 1000).toFixed(1)}s`
                : '—',
              color: '#374151', bg: '#F9FAFB',
            },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl p-4 border border-white" style={{ backgroundColor: k.bg }}>
              <p className="text-2xl font-extrabold" style={{ color: k.color }}>{k.value}</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Queue controls */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Queue Management</h2>
            <p className="text-xs text-gray-500 mt-0.5">Enqueue products, process the queue, and retry failures.</p>
          </div>
          <div className="p-5 grid sm:grid-cols-3 gap-4">

            {/* Enqueue */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">1. Enqueue products</p>
              <p className="text-xs text-gray-500">Adds products with unprocessed images to the pending queue.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1} max={1000}
                  value={enqueueLimit}
                  onChange={(e) => setEnqueueLimit(Number(e.target.value))}
                  className="w-20 border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm text-center focus:outline-none focus:border-[#5FAE9B]"
                />
                <button
                  onClick={handleEnqueue}
                  disabled={enqueueing}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  {enqueueing ? 'Enqueueing…' : 'Enqueue'}
                </button>
              </div>
              {enqueueResult !== null && (
                <p className="text-xs text-green-600 font-medium">{enqueueResult} jobs enqueued</p>
              )}
            </div>

            {/* Process */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">2. Process pending</p>
              <p className="text-xs text-gray-500">Runs the Sharp pipeline on each pending job in sequence.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1} max={200}
                  value={processBatchSize}
                  onChange={(e) => setProcessBatchSize(Number(e.target.value))}
                  className="w-20 border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm text-center focus:outline-none focus:border-[#5FAE9B]"
                />
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
                  style={{ backgroundColor: '#5FAE9B' }}
                >
                  {processing ? 'Processing…' : 'Process'}
                </button>
              </div>
              {processResult && (
                <p className={`text-xs font-medium ${processResult.fail > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {processResult.ok} ok, {processResult.fail} failed
                </p>
              )}
            </div>

            {/* Retry */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">3. Retry failures</p>
              <p className="text-xs text-gray-500">Resets failed jobs back to pending (up to {settings.max_retries} retries each).</p>
              <button
                onClick={handleRetry}
                disabled={retrying || displayStats.failed === 0}
                className="w-full py-2 rounded-xl text-xs font-bold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: '#DC2626' }}
              >
                {retrying ? 'Retrying…' : `Retry ${displayStats.failed} failed`}
              </button>
              {retryResult !== null && (
                <p className="text-xs text-green-600 font-medium">{retryResult} jobs reset</p>
              )}
            </div>
          </div>
        </div>

        {/* Settings */}
        {!loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Pipeline Settings</h2>
            </div>
            <div className="p-5 space-y-5">

              {/* Toggles */}
              <div className="grid sm:grid-cols-2 gap-4">
                {(
                  [
                    ['auto_process_on_upload', 'Auto-process on upload', 'Immediately process images when uploaded to a product'],
                    ['keep_original', 'Keep original URL', 'Preserve the original image URL in original_url column'],
                    ['replace_storefront_image', 'Replace storefront image', 'Set products.image to the processed 1200px version'],
                    ['generate_thumbnail', 'Generate all 3 sizes', 'Always produce 1200px, 600px, and 300px outputs'],
                  ] as [keyof Settings, string, string][]
                ).map(([key, label, desc]) => (
                  <div key={key} className="flex items-start gap-3">
                    <button
                      onClick={() => toggle(key)}
                      className="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors mt-0.5 focus:outline-none"
                      style={{ backgroundColor: settings[key] ? '#5FAE9B' : '#D1D5DB' }}
                      role="switch"
                      aria-checked={Boolean(settings[key])}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${settings[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Numeric sliders */}
              <div className="grid sm:grid-cols-3 gap-4">
                <NumberField label="WebP Quality" min={50} max={100} value={settings.output_quality}
                  onChange={(v) => setSettings((p) => ({ ...p, output_quality: v }))}
                  hint="1–100, default 85" />
                <NumberField label="BG Threshold" min={5} max={80} value={settings.bg_threshold}
                  onChange={(v) => setSettings((p) => ({ ...p, bg_threshold: v }))}
                  hint="Colour match tolerance. Default 30" />
                <NumberField label="Padding %" min={0} max={25} value={settings.padding_pct}
                  onChange={(v) => setSettings((p) => ({ ...p, padding_pct: v }))}
                  hint="Edge padding as % of canvas. Default 10" />
                <NumberField label="Shadow Strength" min={0} max={1} step={0.05} value={settings.shadow_strength}
                  onChange={(v) => setSettings((p) => ({ ...p, shadow_strength: v }))}
                  hint="Drop shadow opacity 0–1. Default 0.15" />
                <NumberField label="Max Retries" min={0} max={10} value={settings.max_retries}
                  onChange={(v) => setSettings((p) => ({ ...p, max_retries: v }))}
                  hint="Max retry attempts per job" />
              </div>

              {/* Output sizes (read-only display) */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold text-gray-600 mr-1">Output sizes:</p>
                {[
                  ['Main', settings.main_size_px],
                  ['Medium', settings.medium_size_px],
                  ['Thumbnail', settings.thumb_size_px],
                ].map(([label, px]) => (
                  <span key={label as string} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                    {label} {px}×{px}px
                  </span>
                ))}
              </div>

              {/* OpenAI metadata (optional) */}
              <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggle('enable_openai_metadata')}
                    className="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors mt-0.5 focus:outline-none"
                    style={{ backgroundColor: settings.enable_openai_metadata ? '#5FAE9B' : '#D1D5DB' }}
                    role="switch"
                    aria-checked={settings.enable_openai_metadata}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${settings.enable_openai_metadata ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-800">OpenAI metadata extraction (optional)</p>
                    <p className="text-xs text-gray-500">
                      Uses GPT-4o-mini Vision to read brand name, weight, category, and SEO text
                      <strong className="text-gray-700"> directly from the packaging</strong>.
                      Image is NOT altered. Requires <code className="text-xs bg-gray-100 px-1 rounded">OPENAI_API_KEY</code> secret in Supabase.
                    </p>
                  </div>
                </div>
                {settings.enable_openai_metadata && (
                  <div className="ml-12">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Extract fields:</p>
                    <div className="flex flex-wrap gap-2">
                      {OPENAI_FIELD_OPTIONS.map((f) => (
                        <button
                          key={f}
                          onClick={() => toggleOpenaiField(f)}
                          className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                            settings.openai_fields.includes(f)
                              ? 'text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          style={settings.openai_fields.includes(f) ? { backgroundColor: '#0F2747' } : {}}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              {saved
                ? <span className="text-sm text-green-600 font-medium">Settings saved</span>
                : <span />
              }
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#0F2747' }}
              >
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Job history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-bold text-gray-900">Job History</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'pending', 'processing', 'completed', 'failed'].map((f) => (
                <button
                  key={f}
                  onClick={() => setJobFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${jobFilter === f ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  style={jobFilter === f ? { backgroundColor: '#0F2747' } : {}}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={() => { loadJobs(); loadStats() }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {jobsLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm text-gray-400">No jobs found.</p>
              <p className="text-xs text-gray-400 mt-1">Enqueue products above to start processing.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Status', 'Stage', 'Engine', 'Retries', 'Images', 'Error', 'Duration', 'Date'].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
                        {job.pipeline_stage ?? '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#EBF4F1] text-[#3C9080]">
                          {job.processing_engine ?? 'sharp'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-center text-gray-500">
                        {job.retry_count ?? 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {job.original_url && (
                            <a href={job.original_url} target="_blank" rel="noreferrer"
                              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
                              src
                            </a>
                          )}
                          {job.processed_url && (
                            <a href={job.processed_url} target="_blank" rel="noreferrer"
                              className="text-xs text-[#5FAE9B] hover:text-[#3d8a77] underline underline-offset-2">
                              1200px
                            </a>
                          )}
                          {job.medium_url && (
                            <a href={job.medium_url} target="_blank" rel="noreferrer"
                              className="text-xs text-[#5FAE9B] hover:text-[#3d8a77] underline underline-offset-2">
                              600px
                            </a>
                          )}
                          {job.thumbnail_url && (
                            <a href={job.thumbnail_url} target="_blank" rel="noreferrer"
                              className="text-xs text-[#5FAE9B] hover:text-[#3d8a77] underline underline-offset-2">
                              300px
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        {job.error_message && (
                          <span className="text-xs text-red-500 truncate block" title={job.error_message}>
                            {job.error_message.slice(0, 60)}{job.error_message.length > 60 ? '…' : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {job.duration_ms != null ? `${(job.duration_ms / 1000).toFixed(1)}s` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(job.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed:  'bg-green-100 text-green-700',
    processing: 'bg-amber-100 text-amber-700',
    pending:    'bg-blue-100 text-blue-700',
    failed:     'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status === 'processing' && (
        <svg className="w-2.5 h-2.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {status}
    </span>
  )
}

function NumberField({
  label, min, max, step = 1, value, onChange, hint,
}: {
  label: string; min: number; max: number; step?: number
  value: number; onChange: (v: number) => void; hint: string
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700 block mb-1">{label}</label>
      <input
        type="number"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B]"
      />
      <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>
    </div>
  )
}
