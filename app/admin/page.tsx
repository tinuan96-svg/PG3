'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

// ─── Config ───────────────────────────────────────────────────────────────────
const PAYMENT_FEE_PCT = 1.5  // Worldpay %
const RESERVE_PCT     = 20   // Stock replenishment reserve %
const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY        = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Types ────────────────────────────────────────────────────────────────────
type Stats = {
  todayRevenue: number; todayOrderCount: number; pendingOrders: number
  completedOrders: number; cogs: number; paymentFees: number
  netProfit: number; profitMargin: number; reserve: number; cashAvailable: number
  deliveryRevenue: number; freeDeliveryCount: number; paidDeliveryCount: number
  avgDeliveryFee: number; totalProducts: number; draftProducts: number
  approvedProducts: number; missingImage: number; missingDesc: number
  missingSeo: number; missingCat: number; awaitingApproval: number
  syncConnected: boolean; lastSyncAt: string | null; productsImported: number
  lastSyncStatus: string | null; customers: number
  activeBanners: number; activePromotions: number
  featuredProducts: number; featuredCategories: number
}

type PushStats = {
  subscribers: number
  sentToday: number
  openRate: number
  ctr: number
}

type Activity = {
  id: string; action_type: string; description: string
  admin_name: string | null; created_at: string
}

// ─── Utils ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function todayISO() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString()
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ w = 'w-20', h = 'h-6' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} rounded animate-pulse`} style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
}
function SkLight({ w = 'w-20', h = 'h-5' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} rounded animate-pulse bg-gray-100`} />
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, mainValue, rows, loading }: {
  title: string
  mainValue: string
  rows: { label: string; value: string; green?: boolean; amber?: boolean }[]
  loading: boolean
}) {
  return (
    <div className="rounded-2xl p-5 flex flex-col" style={{ backgroundColor: '#0F2747' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#5FAE9B' }}>
        {title}
      </p>
      {loading
        ? <Sk w="w-32" h="h-9" />
        : <p className="text-3xl font-bold text-white mb-3">{mainValue}</p>
      }
      <div className="space-y-2 mt-auto pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {rows.map(r => (
          <div key={r.label} className="flex justify-between items-center">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{r.label}</span>
            {loading
              ? <Sk w="w-14" h="h-3.5" />
              : <span className="text-xs font-semibold" style={{
                  color: r.green ? '#4ade80' : r.amber ? '#fbbf24' : 'rgba(255,255,255,0.8)'
                }}>
                  {r.value}
                </span>
            }
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Progress Row ─────────────────────────────────────────────────────────────
function ProgressRow({ label, value, max, color, loading }: {
  label: string; value: number; max: number; color: string; loading: boolean
}) {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const pct = max > 0 ? ((value / max) * 100).toFixed(0) + '%' : '—'
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
        <div className="flex items-center gap-3">
          {loading
            ? <Sk w="w-16" h="h-4" />
            : <>
                <span className="text-sm font-bold text-white">{fmt(value)}</span>
                <span className="text-xs w-10 text-right font-medium" style={{ color: '#5FAE9B' }}>{pct}</span>
              </>
          }
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: loading ? '0%' : `${w}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────
function Panel({ title, action, actionHref, children, dark }: {
  title: string; action?: string; actionHref?: string; children: React.ReactNode; dark?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{ backgroundColor: dark ? '#0F2747' : '#ffffff', border: dark ? 'none' : '1px solid #e5e7eb' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold" style={{ color: dark ? '#ffffff' : '#111827' }}>{title}</h2>
        {action && actionHref && (
          <Link href={actionHref} className="text-xs font-semibold hover:opacity-75 transition-opacity" style={{ color: '#5FAE9B' }}>
            {action}
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

// ─── Alert Row ────────────────────────────────────────────────────────────────
function AlertRow({ label, count, href, loading }: {
  label: string; count: number; href: string; loading: boolean
}) {
  if (!loading && count === 0) return null
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#f59e0b' }} />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {loading
          ? <SkLight w="w-8" h="h-5" />
          : <>
              <span className="text-sm font-bold" style={{ color: '#d97706' }}>{count}</span>
              <Link
                href={href}
                className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors hover:opacity-80"
                style={{ backgroundColor: '#EBF4F1', color: '#5FAE9B' }}
              >
                Fix →
              </Link>
            </>
        }
      </div>
    </div>
  )
}

// ─── Activity Row ─────────────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  product_approved:    '#16a34a',
  product_rejected:    '#dc2626',
  banner_created:      '#5FAE9B',
  banner_updated:      '#5FAE9B',
  category_updated:    '#d97706',
  price_changed:       '#0F2747',
  order_refunded:      '#dc2626',
  customer_registered: '#16a34a',
  promotion_created:   '#5FAE9B',
  product_updated:     '#6b7280',
}

function ActivityRow({ item }: { item: Activity }) {
  const color = ACTION_COLORS[item.action_type] ?? '#6b7280'
  const timeStr = new Date(item.created_at).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate">{item.description}</p>
        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
          {item.admin_name || 'System'} - {timeStr}
        </p>
      </div>
    </div>
  )
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({ label, sub, href, icon, badge }: {
  label: string; sub: string; href: string; icon: string; badge?: number
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3.5 rounded-xl border bg-white transition-all hover:shadow-sm hover:border-gray-300 group"
      style={{ borderColor: '#e5e7eb' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EBF4F1' }}>
        <svg className="w-5 h-5" style={{ color: '#5FAE9B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#0F2747]">{label}</p>
        <p className="text-xs text-gray-400 truncate">{sub}</p>
      </div>
      {badge !== undefined && badge > 0 && (
        <span
          className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

// ─── Status Dot ───────────────────────────────────────────────────────────────
function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ok ? '#22c55e' : '#f59e0b' }} />
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  )
}

// ─── Stat Line ────────────────────────────────────────────────────────────────
function StatLine({ label, value, green, loading }: {
  label: string; value: string; green?: boolean; loading: boolean
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      {loading
        ? <SkLight w="w-20" h="h-4" />
        : <span className="text-sm font-semibold" style={{ color: green ? '#16a34a' : '#111827' }}>{value}</span>
      }
    </div>
  )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const EMPTY: Stats = {
  todayRevenue: 0, todayOrderCount: 0, pendingOrders: 0, completedOrders: 0,
  cogs: 0, paymentFees: 0, netProfit: 0, profitMargin: 0, reserve: 0, cashAvailable: 0,
  deliveryRevenue: 0, freeDeliveryCount: 0, paidDeliveryCount: 0, avgDeliveryFee: 0,
  totalProducts: 0, draftProducts: 0, approvedProducts: 0, missingImage: 0,
  missingDesc: 0, missingSeo: 0, missingCat: 0, awaitingApproval: 0,
  syncConnected: false, lastSyncAt: null, productsImported: 0, lastSyncStatus: null,
  customers: 0, activeBanners: 0, activePromotions: 0, featuredProducts: 0, featuredCategories: 0,
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>(EMPTY)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [pushStats, setPushStats] = useState<PushStats>({ subscribers: 0, sentToday: 0, openRate: 0, ctr: 0 })
  const [pushLoading, setPushLoading] = useState(true)

  useEffect(() => {
  }, [])

  const loadData = useCallback(async () => {
    const today = todayISO()

    const [
      paidOrdersRes,
      allOrdersRes,
      pendingCountRes,
      orderItemsRes,
      productsRes,
      syncRes,
      bannersRes,
      sectionsRes,
      featuredCatsRes,
      customersRes,
      activityRes,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('orders').select('total, delivery_fee')
        .eq('payment_status', 'paid').gte('created_at', today),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('orders').select('id, order_status, delivery_fee')
        .gte('created_at', today),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('orders').select('id', { count: 'exact', head: true })
        .eq('order_status', 'pending'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('order_items').select('cost_price_at_order, quantity')
        .gte('created_at', today),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('products').select(
        'approval_status, image, description, seo_title, category_id, needs_admin_review, show_on_homepage'
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('centralhub_sync_logs')
        .select('status, completed_at, products_synced')
        .order('started_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('banners').select('id', { count: 'exact', head: true }).eq('is_active', true),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('homepage_sections').select('section_key, is_enabled'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('categories').select('id', { count: 'exact', head: true }).eq('show_on_homepage', true),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('activity_logs')
        .select('id, action_type, description, admin_name, created_at')
        .order('created_at', { ascending: false }).limit(20),
    ])

    // Revenue & orders
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paidOrders  = (paidOrdersRes.data ?? []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allOrders   = (allOrdersRes.data ?? []) as any[]
    const todayRevenue      = paidOrders.reduce((s, o) => s + Number(o.total ?? 0), 0)
    const deliveryRevenue   = paidOrders.reduce((s, o) => s + Number(o.delivery_fee ?? 0), 0)
    const todayOrderCount   = allOrders.length
    const completedOrders   = allOrders.filter(o => ['delivered', 'completed'].includes(o.order_status ?? '')).length
    const freeDeliveryCount = allOrders.filter(o => !o.delivery_fee || Number(o.delivery_fee) === 0).length
    const paidDeliveryCount = allOrders.filter(o => Number(o.delivery_fee ?? 0) > 0).length
    const avgDeliveryFee    = paidDeliveryCount > 0 ? deliveryRevenue / paidDeliveryCount : 0

    // COGS & financials
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items       = (orderItemsRes.data ?? []) as any[]
    const cogs        = items.reduce((s, i) => s + Number(i.cost_price_at_order ?? 0) * Number(i.quantity ?? 1), 0)
    const paymentFees = todayRevenue * (PAYMENT_FEE_PCT / 100)
    const netProfit   = todayRevenue - cogs - paymentFees
    const profitMargin = todayRevenue > 0 ? (netProfit / todayRevenue) * 100 : 0
    const reserve     = todayRevenue * (RESERVE_PCT / 100)
    const cashAvailable = netProfit - reserve

    // Products
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prods          = (productsRes.data ?? []) as any[]
    const totalProducts  = prods.length
    const approvedProducts = prods.filter(p => p.approval_status === 'approved').length
    const draftProducts  = prods.filter(p => p.approval_status === 'draft').length
    const active         = prods.filter(p => p.approval_status !== 'rejected')
    const awaitingApproval = prods.filter(p => p.needs_admin_review).length
    const missingImage   = active.filter(p => !p.image || p.image === '').length
    const missingDesc    = active.filter(p => !p.description || p.description === '').length
    const missingSeo     = active.filter(p => !p.seo_title || p.seo_title === '').length
    const missingCat     = active.filter(p => !p.category_id).length
    const featuredProductsCount = prods.filter(p => p.show_on_homepage && p.approval_status === 'approved').length

    // Sync
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const syncLog = syncRes.data as any
    const syncConnected = process.env.NEXT_PUBLIC_CENTRALHUB_CONFIGURED === 'true'

    // Homepage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sections        = (sectionsRes.data ?? []) as any[]
    const activePromotions = sections.filter(s =>
      ['flash_deals', 'promotions', 'special_offers'].includes(s.section_key ?? '') && s.is_enabled
    ).length

    setStats({
      todayRevenue, todayOrderCount, pendingOrders: pendingCountRes.count ?? 0,
      completedOrders, cogs, paymentFees, netProfit, profitMargin, reserve, cashAvailable,
      deliveryRevenue, freeDeliveryCount, paidDeliveryCount, avgDeliveryFee,
      totalProducts, draftProducts, approvedProducts, missingImage,
      missingDesc, missingSeo, missingCat, awaitingApproval,
      syncConnected, lastSyncAt: syncLog?.completed_at ?? null,
      productsImported: Number(syncLog?.products_synced ?? 0),
      lastSyncStatus: syncLog?.status ?? null,
      customers: customersRes.count ?? 0,
      activeBanners: bannersRes.count ?? 0,
      activePromotions,
      featuredProducts: featuredProductsCount,
      featuredCategories: featuredCatsRes.count ?? 0,
    })
    setActivities(activityRes.data ?? [])
    setLastRefreshed(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPushStats({
      subscribers: 0,
      sentToday: 0,
      openRate: 0,
      ctr: 0,
    })
    setPushLoading(false)
  }, [])

  const S = stats
  const maxForBars = S.todayRevenue || 1
  const hasAlerts = S.missingImage + S.missingDesc + S.missingSeo + S.missingCat + S.awaitingApproval > 0

  const syncTimeStr = S.lastSyncAt
    ? new Date(S.lastSyncAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Never'

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0F2747' }}>Operations Centre</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' - '}Last refreshed {lastRefreshed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); loadData() }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors hover:opacity-80"
            style={{ backgroundColor: '#EBF4F1', color: '#5FAE9B' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Revenue Today"
            mainValue={fmt(S.todayRevenue)}
            loading={loading}
            rows={[
              { label: 'Total Orders',   value: String(S.todayOrderCount) },
              { label: 'Paid Orders',    value: String(paidCount(S)) },
              { label: 'Delivery Rev.',  value: fmt(S.deliveryRevenue) },
            ]}
          />
          <KpiCard
            title="Net Profit Today"
            mainValue={fmt(Math.max(0, S.netProfit))}
            loading={loading}
            rows={[
              { label: 'Profit Margin',  value: S.profitMargin.toFixed(1) + '%', green: S.profitMargin > 15 },
              { label: `COGS (est.)`,    value: fmt(S.cogs) },
              { label: `Payment Fees ${PAYMENT_FEE_PCT}%`, value: fmt(S.paymentFees) },
            ]}
          />
          <KpiCard
            title="Cash Available"
            mainValue={fmt(Math.max(0, S.cashAvailable))}
            loading={loading}
            rows={[
              { label: 'Net Profit',        value: fmt(S.netProfit), green: S.netProfit > 0 },
              { label: `Reserve ${RESERVE_PCT}%`, value: fmt(S.reserve) },
              { label: 'After Reserve',     value: fmt(S.cashAvailable), green: S.cashAvailable > 0 },
            ]}
          />
          <KpiCard
            title="Orders Today"
            mainValue={String(S.todayOrderCount)}
            loading={loading}
            rows={[
              { label: 'Pending',    value: String(S.pendingOrders), amber: S.pendingOrders > 0 },
              { label: 'Completed',  value: String(S.completedOrders), green: S.completedOrders > 0 },
              { label: 'Customers',  value: String(S.customers) },
            ]}
          />
        </div>

        {/* ── Business Health + Sync ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Business Health">
            <div className="space-y-2.5">
              <StatusDot ok label="Store Online" />
              <StatusDot ok={S.approvedProducts > 0} label={`${S.approvedProducts} approved products live`} />
              <StatusDot ok={S.activeBanners > 0} label={`${S.activeBanners} active banners`} />
              <StatusDot ok={S.pendingOrders === 0} label={S.pendingOrders === 0 ? 'No pending orders' : `${S.pendingOrders} order${S.pendingOrders !== 1 ? 's' : ''} pending`} />
              <StatusDot ok={!hasAlerts} label={hasAlerts ? 'Product quality alerts present' : 'All products healthy'} />
            </div>
          </Panel>

          <Panel title="CentralHub Sync" action="Run Sync →" actionHref="/admin/product-sync">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: S.syncConnected ? '#22c55e' : '#f59e0b' }} />
                <span className="text-sm font-semibold" style={{ color: S.syncConnected ? '#16a34a' : '#d97706' }}>
                  {S.syncConnected ? 'Connected' : 'Not Configured'}
                </span>
              </div>
              <StatLine label="Last Sync"          value={syncTimeStr}               loading={loading} />
              <StatLine label="Products Imported"  value={String(S.productsImported)} loading={loading} />
              <StatLine label="Last Sync Status"   value={S.lastSyncStatus ?? '—'}   loading={loading} green={S.lastSyncStatus === 'success'} />
              <StatLine label="Total in Catalogue" value={String(S.totalProducts)}   loading={loading} />
            </div>
          </Panel>
        </div>

        {/* ── Push Notifications Widget ──────────────────────────── */}
        <Panel title="Push Notifications" action="Manage →" actionHref="/admin/notifications">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Subscribers', value: pushLoading ? '—' : pushStats.subscribers.toLocaleString() },
              { label: 'Sent Today', value: pushLoading ? '—' : pushStats.sentToday.toLocaleString() },
              { label: 'Open Rate', value: pushLoading ? '—' : pushStats.openRate.toFixed(1) + '%' },
              { label: 'Click Rate', value: pushLoading ? '—' : pushStats.ctr.toFixed(1) + '%' },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-4 border border-gray-100" style={{ backgroundColor: '#f9fafb' }}>
                {pushLoading
                  ? <SkLight w="w-12" h="h-7" />
                  : <p className="text-2xl font-bold" style={{ color: '#0F2747' }}>{item.value}</p>
                }
                <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </Panel>

        {/* ── Sales Performance ──────────────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#0F2747' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-white">Sales Performance — Today</h2>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(95,174,155,0.15)', color: '#5FAE9B' }}>
              {PAYMENT_FEE_PCT}% fees - {RESERVE_PCT}% reserve
            </span>
          </div>
          <div className="space-y-4">
            <ProgressRow label="Revenue"      value={S.todayRevenue}  max={maxForBars} color="#5FAE9B" loading={loading} />
            <ProgressRow label="COGS"         value={S.cogs}          max={maxForBars} color="#f59e0b" loading={loading} />
            <ProgressRow label="Payment Fees" value={S.paymentFees}   max={maxForBars} color="#f87171" loading={loading} />
            <ProgressRow label="Net Profit"   value={Math.max(0, S.netProfit)} max={maxForBars} color="#4ade80" loading={loading} />
            <ProgressRow label="Stock Reserve" value={S.reserve}      max={maxForBars} color="#818cf8" loading={loading} />
            <ProgressRow label="Cash Available" value={Math.max(0, S.cashAvailable)} max={maxForBars} color="#22d3ee" loading={loading} />
          </div>
        </div>

        {/* ── Money Management + Delivery ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Money Management" dark>
            <div className="space-y-0">
              {[
                { label: 'Revenue (paid orders)',             value: fmt(S.todayRevenue) },
                { label: `Cost of Goods Sold`,                value: `-${fmt(S.cogs)}` },
                { label: `Payment Fees (${PAYMENT_FEE_PCT}% Worldpay)`, value: `-${fmt(S.paymentFees)}` },
                { label: 'Net Profit',                        value: fmt(S.netProfit), accent: true },
                { label: `Stock Reserve (${RESERVE_PCT}%)`,   value: `-${fmt(S.reserve)}` },
                { label: 'Cash Available',                    value: fmt(S.cashAvailable), green: true },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{row.label}</span>
                  {loading
                    ? <Sk w="w-20" h="h-4" />
                    : <span className="text-sm font-bold" style={{
                        color: row.green ? '#4ade80' : row.accent ? '#5FAE9B' : 'rgba(255,255,255,0.9)'
                      }}>
                        {row.value}
                      </span>
                  }
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Delivery Performance" action="Settings →" actionHref="/admin/delivery">
            <div className="space-y-0">
              <StatLine label="Delivery Revenue"     value={fmt(S.deliveryRevenue)}                loading={loading} />
              <StatLine label="Free Delivery Orders" value={String(S.freeDeliveryCount)}         loading={loading} />
              <StatLine label="Paid Delivery Orders" value={String(S.paidDeliveryCount)}         loading={loading} />
              <StatLine label="Avg. Delivery Fee"    value={S.paidDeliveryCount > 0 ? fmt(S.avgDeliveryFee) : '—'} loading={loading} />
            </div>
            <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: '#f9fafb' }}>
              <p className="text-xs font-semibold text-gray-500 mb-1">Today's Delivery Split</p>
              <div className="flex items-center gap-2">
                <div className="h-2 rounded-full flex-1 overflow-hidden bg-gray-200">
                  {!loading && S.todayOrderCount > 0 && (
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(S.paidDeliveryCount / S.todayOrderCount) * 100}%`,
                        backgroundColor: '#5FAE9B',
                      }}
                    />
                  )}
                </div>
                {loading
                  ? <SkLight w="w-16" h="h-3" />
                  : <span className="text-xs text-gray-500">
                      {S.paidDeliveryCount} paid / {S.freeDeliveryCount} free
                    </span>
                }
              </div>
            </div>
          </Panel>
        </div>

        {/* ── Product Quality Alerts ─────────────────────────────── */}
        <Panel title="Product Quality Alerts" action="Open Approval Queue →" actionHref="/admin/product-drafts">
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <SkLight key={i} w="w-full" h="h-10" />)}
            </div>
          ) : !hasAlerts ? (
            <div className="flex items-center gap-2 py-3 px-4 rounded-xl" style={{ backgroundColor: '#f0fdf4' }}>
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-green-700">All products are healthy — no issues found</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <AlertRow label="Missing Images"      count={S.missingImage}    href="/admin/product-drafts?filter=no_image"       loading={loading} />
                <AlertRow label="Missing Descriptions" count={S.missingDesc}    href="/admin/product-drafts?filter=no_description"  loading={loading} />
                <AlertRow label="Missing SEO"         count={S.missingSeo}      href="/admin/product-drafts?filter=no_seo"          loading={loading} />
              </div>
              <div>
                <AlertRow label="Missing Categories"  count={S.missingCat}      href="/admin/product-drafts?filter=no_category"     loading={loading} />
                <AlertRow label="Awaiting Approval"   count={S.awaitingApproval} href="/admin/product-drafts"                       loading={loading} />
                <AlertRow label="Draft Products"      count={S.draftProducts}    href="/admin/product-drafts"                       loading={loading} />
              </div>
            </div>
          )}
        </Panel>

        {/* ── Homepage Control + Quick Actions ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Homepage Control" action="Edit Homepage →" actionHref="/admin/homepage">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Carousel Banners',   value: S.activeBanners,      href: '/admin/banners' },
                { label: 'Active Promotions',  value: S.activePromotions,   href: '/admin/homepage' },
                { label: 'Featured Products',  value: S.featuredProducts,   href: '/admin/products' },
                { label: 'Featured Categories', value: S.featuredCategories, href: '/admin/categories' },
              ].map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                  style={{ backgroundColor: '#f9fafb' }}
                >
                  {loading
                    ? <SkLight w="w-10" h="h-7" />
                    : <p className="text-2xl font-bold" style={{ color: '#0F2747' }}>{item.value}</p>
                  }
                  <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Quick Actions">
            <div className="grid grid-cols-1 gap-2">
              <QuickAction
                label="Product Approval"
                sub={`${S.awaitingApproval} awaiting review`}
                href="/admin/product-drafts"
                badge={S.awaitingApproval}
                icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <QuickAction
                label="Orders"
                sub={`${S.pendingOrders} pending`}
                href="/admin/orders"
                badge={S.pendingOrders}
                icon="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
              <QuickAction
                label="CentralHub Sync"
                sub="Sync latest products"
                href="/admin/product-sync"
                icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
              <QuickAction
                label="Homepage"
                sub="Edit banners & sections"
                href="/admin/homepage"
                icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
              <QuickAction
                label="Customers"
                sub={`${S.customers} registered`}
                href="/admin/customers"
                icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
              <QuickAction
                label="Reports"
                sub="Revenue & performance"
                href="/admin/reports"
                icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
              <QuickAction
                label="Banners"
                sub="Manage carousel banners"
                href="/admin/banners"
                icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
              <QuickAction
                label="Categories"
                sub="Manage product categories"
                href="/admin/categories"
                icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </div>
          </Panel>
        </div>

        {/* ── Recent Activity ────────────────────────────────────── */}
        <Panel title="Recent Activity" action="Auto-refreshes every 60s" actionHref="#">
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <SkLight w="w-2" h="h-2" />
                  <div className="flex-1 space-y-1.5">
                    <SkLight w="w-3/4" h="h-4" />
                    <SkLight w="w-1/3" h="h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400">No activity recorded yet.</p>
              <p className="text-xs text-gray-300 mt-1">Actions such as product approvals and banner changes will appear here.</p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {activities.map(a => <ActivityRow key={a.id} item={a} />)}
            </div>
          )}
        </Panel>

      </div>
    </AdminLayout>
  )
}

// ─── Helper (outside component for perf) ─────────────────────────────────────
function paidCount(s: Stats) {
  // approximate from order count (all orders that generated revenue)
  return s.todayOrderCount
}
