'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type PricingRule = {
  id: string
  rule_type: 'global' | 'category' | 'product'
  target_id: string | null
  label: string | null
  markup_pct: number
  is_active: boolean
  priority: number
  created_at: string
}

type Category = { id: string; name: string }

type AnalyticsStats = {
  total_products: number
  avg_cost_price: number
  avg_selling_price: number
  avg_markup_pct: number
  total_cost_value: number
  total_selling_value: number
  total_expected_profit: number
}

type ProfitProduct = {
  id: string
  name: string
  cost_price: number
  selling_price: number
  profit_amount: number
  markup_pct: number
}

type ProfitReportRow = {
  category_name: string
  product_count: number
  total_cost: number
  total_revenue: number
  total_profit: number
  avg_markup_pct: number
  avg_margin_pct: number
}

type Tab = 'overview' | 'rules' | 'bulk' | 'report'

const RULE_TYPES = [
  { value: 'global', label: 'Global', desc: 'Applies to all products' },
  { value: 'category', label: 'Category', desc: 'Applies to one category' },
  { value: 'product', label: 'Product', desc: 'Applies to one product' },
]

const EMPTY_RULE: Omit<PricingRule, 'id' | 'created_at'> = {
  rule_type: 'global',
  target_id: null,
  label: null,
  markup_pct: 3,
  is_active: true,
  priority: 1,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number, decimals = 2) {
  return v.toFixed(decimals)
}

function fmtCurrency(v: number) {
  return `£${fmt(v)}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [tab, setTab] = useState<Tab>('overview')

  // Overview
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [topProducts, setTopProducts] = useState<ProfitProduct[]>([])
  const [bottomProducts, setBottomProducts] = useState<ProfitProduct[]>([])
  const [globalMarkup, setGlobalMarkup] = useState<number>(3)
  const [markupInput, setMarkupInput] = useState<number>(3)
  const [applyingGlobal, setApplyingGlobal] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)

  // Rules
  const [rules, setRules] = useState<PricingRule[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [ruleModal, setRuleModal] = useState<'create' | 'edit' | null>(null)
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE)
  const [editRuleId, setEditRuleId] = useState<string | null>(null)
  const [ruleSaving, setRuleSaving] = useState(false)
  const [ruleError, setRuleError] = useState('')

  // Bulk
  const [bulkAction, setBulkAction] = useState<'set' | 'increase' | 'decrease'>('set')
  const [bulkMarkup, setBulkMarkup] = useState<number>(3)
  const [bulkScope, setBulkScope] = useState<'all' | 'category'>('all')
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('')
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkDone, setBulkDone] = useState<string | null>(null)
  const [bulkError, setBulkError] = useState('')

  // Report
  const [reportRows, setReportRows] = useState<ProfitReportRow[]>([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportCategoryId, setReportCategoryId] = useState<string>('')

  const db = supabase as unknown as Record<string, (...args: unknown[]) => unknown>

  // ─── Load overview ────────────────────────────────────────────────────────

  const loadOverview = useCallback(async () => {
    setStatsLoading(true)
    const [analyticsRes, topRes, bottomRes, markupRes] = await Promise.all([
      (db.rpc as Function)('get_pricing_analytics'),
      (db.rpc as Function)('get_top_profit_products', { p_limit: 5 }),
      (db.rpc as Function)('get_bottom_profit_products', { p_limit: 5 }),
      (db.rpc as Function)('get_global_markup'),
    ])
    setStats(analyticsRes.data as AnalyticsStats ?? null)
    setTopProducts((topRes.data as ProfitProduct[]) ?? [])
    setBottomProducts((bottomRes.data as ProfitProduct[]) ?? [])
    const gm = typeof markupRes.data === 'number' ? markupRes.data : 3
    setGlobalMarkup(gm)
    setMarkupInput(gm)
    setStatsLoading(false)
  }, [])

  // ─── Load rules ───────────────────────────────────────────────────────────

  const loadRules = useCallback(async () => {
    setRulesLoading(true)
    const [rulesRes, catsRes] = await Promise.all([
      supabase.from('pricing_rules' as never).select('*').order('priority', { ascending: true }),
      supabase.from('categories').select('id,name').order('name'),
    ])
    setRules((rulesRes.data as PricingRule[]) ?? [])
    setCategories((catsRes.data as Category[]) ?? [])
    setRulesLoading(false)
  }, [])

  useEffect(() => {
    loadOverview()
    loadRules()
  }, [loadOverview, loadRules])

  // ─── Global markup ────────────────────────────────────────────────────────

  async function saveGlobalMarkup() {
    setApplyingGlobal(true)
    // Update the global pricing rule
    await supabase.from('pricing_rules' as never).update({ markup_pct: markupInput } as never).eq('rule_type' as never, 'global' as never)
    // Recalculate all products
    await (db.rpc as Function)('recalculate_all_pricing', { p_global_markup: markupInput })
    setGlobalMarkup(markupInput)
    setApplyingGlobal(false)
    loadOverview()
  }

  // ─── Rule CRUD ────────────────────────────────────────────────────────────

  function openCreateRule() {
    setRuleForm({ ...EMPTY_RULE, markup_pct: globalMarkup })
    setEditRuleId(null)
    setRuleError('')
    setRuleModal('create')
  }

  function openEditRule(r: PricingRule) {
    setRuleForm({
      rule_type: r.rule_type,
      target_id: r.target_id,
      label: r.label,
      markup_pct: r.markup_pct,
      is_active: r.is_active,
      priority: r.priority,
    })
    setEditRuleId(r.id)
    setRuleError('')
    setRuleModal('edit')
  }

  async function handleSaveRule() {
    if (ruleForm.rule_type !== 'global' && !ruleForm.target_id) {
      setRuleError('Select a target for this rule type')
      return
    }
    setRuleSaving(true)
    setRuleError('')
    const payload = { ...ruleForm }
    let err: { message: string } | null = null
    if (ruleModal === 'create') {
      const res = await supabase.from('pricing_rules' as never).insert(payload as never)
      err = res.error
    } else {
      const res = await supabase.from('pricing_rules' as never).update(payload as never).eq('id' as never, editRuleId! as never)
      err = res.error
    }
    setRuleSaving(false)
    if (err) { setRuleError(err.message); return }
    setRuleModal(null)
    loadRules()
  }

  async function toggleRule(id: string, val: boolean) {
    await supabase.from('pricing_rules' as never).update({ is_active: val } as never).eq('id' as never, id as never)
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, is_active: val } : r))
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this pricing rule?')) return
    await supabase.from('pricing_rules' as never).delete().eq('id' as never, id as never)
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  // ─── Bulk pricing ─────────────────────────────────────────────────────────

  async function runBulkPricing() {
    setBulkRunning(true)
    setBulkDone(null)
    setBulkError('')

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any).from('products').select('id, markup_percentage, cost_price')
      if (bulkScope === 'category' && bulkCategoryId) {
        query = query.eq('category_id', bulkCategoryId)
      }
      const { data: products, error: qErr } = await query
      if (qErr) throw new Error(qErr.message)

      let count = 0
      for (const p of (products ?? [])) {
        const prod = p as { id: string; markup_percentage: number; cost_price: number }
        let newMarkup = bulkMarkup
        if (bulkAction === 'increase') newMarkup = (prod.markup_percentage ?? globalMarkup) + bulkMarkup
        if (bulkAction === 'decrease') newMarkup = Math.max(0, (prod.markup_percentage ?? globalMarkup) - bulkMarkup)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('products').update({ markup_percentage: newMarkup }).eq('id', prod.id)
        await (db.rpc as Function)('recalculate_product_pricing', { p_product_id: prod.id, p_global_markup: globalMarkup })
        count++
      }

      setBulkDone(`Updated pricing for ${count} products.`)
      loadOverview()
    } catch (e) {
      setBulkError(String(e))
    }
    setBulkRunning(false)
  }

  // ─── Profit report ────────────────────────────────────────────────────────

  async function loadReport() {
    setReportLoading(true)
    const { data } = await (db.rpc as Function)('get_profit_report', {
      p_category_id: reportCategoryId || null,
      p_date_from: null,
      p_date_to: null,
    })
    setReportRows((data as ProfitReportRow[]) ?? [])
    setReportLoading(false)
  }

  useEffect(() => {
    if (tab === 'report') loadReport()
  }, [tab])

  // ─── Render ───────────────────────────────────────────────────────────────

  const tabCls = (t: Tab) =>
    `px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-[#0F2747] text-white' : 'text-gray-600 hover:bg-gray-100'}`

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage markup on CentralHub cost prices</p>
          </div>
          <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            Global markup: <span className="font-bold text-gray-900">{globalMarkup}%</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          <button className={tabCls('overview')} onClick={() => setTab('overview')}>Overview</button>
          <button className={tabCls('rules')} onClick={() => setTab('rules')}>Pricing Rules</button>
          <button className={tabCls('bulk')} onClick={() => setTab('bulk')}>Bulk Pricing</button>
          <button className={tabCls('report')} onClick={() => setTab('report')}>Profit Report</button>
        </div>

        {/* ── Overview tab ───────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-5">

            {/* Global markup control */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Global Markup Rate</h2>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={1}
                  value={markupInput}
                  onChange={(e) => setMarkupInput(Number(e.target.value))}
                  className="flex-1 accent-[#0F2747]"
                />
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-24">
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={markupInput}
                    onChange={(e) => setMarkupInput(Number(e.target.value))}
                    className="flex-1 px-3 py-2 text-sm text-center focus:outline-none"
                  />
                  <span className="pr-2 text-sm text-gray-500">%</span>
                </div>
                <button
                  onClick={saveGlobalMarkup}
                  disabled={applyingGlobal || markupInput === globalMarkup}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  {applyingGlobal ? 'Applying...' : 'Apply to All'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Cost £1.00 → Sell <strong>£{(1 * (1 + markupInput / 100)).toFixed(2)}</strong> &nbsp;|&nbsp;
                Cost £5.00 → Sell <strong>£{(5 * (1 + markupInput / 100)).toFixed(2)}</strong> &nbsp;|&nbsp;
                Cost £10.00 → Sell <strong>£{(10 * (1 + markupInput / 100)).toFixed(2)}</strong>
              </p>
            </div>

            {/* Analytics stats */}
            {statsLoading ? (
              <div className="text-center text-sm text-gray-400 py-8">Loading analytics...</div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Products', value: String(stats.total_products), sub: 'with pricing data' },
                  { label: 'Avg Cost Price', value: fmtCurrency(stats.avg_cost_price), sub: 'per product' },
                  { label: 'Avg Selling Price', value: fmtCurrency(stats.avg_selling_price), sub: 'per product' },
                  { label: 'Avg Markup', value: `${fmt(stats.avg_markup_pct, 1)}%`, sub: 'across all products' },
                  { label: 'Total Cost Value', value: fmtCurrency(stats.total_cost_value), sub: 'inventory at cost' },
                  { label: 'Total Sell Value', value: fmtCurrency(stats.total_selling_value), sub: 'inventory at retail' },
                  { label: 'Expected Profit', value: fmtCurrency(stats.total_expected_profit), sub: 'if all sold' },
                  { label: 'Profit Margin', value: stats.total_selling_value > 0 ? `${fmt((stats.total_expected_profit / stats.total_selling_value) * 100, 1)}%` : '—', sub: 'revenue margin' },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-gray-400 py-4">No pricing analytics available.</div>
            )}

            {/* Top / bottom products */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Top 5 Profit Products</h3>
                {topProducts.length === 0 ? (
                  <p className="text-sm text-gray-400">No data</p>
                ) : (
                  <div className="space-y-2">
                    {topProducts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate max-w-[160px]">{p.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-gray-400 text-xs">{fmtCurrency(p.cost_price)} cost</span>
                          <span className="font-semibold text-green-700">{fmtCurrency(p.profit_amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Bottom 5 Profit Products</h3>
                {bottomProducts.length === 0 ? (
                  <p className="text-sm text-gray-400">No data</p>
                ) : (
                  <div className="space-y-2">
                    {bottomProducts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate max-w-[160px]">{p.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-gray-400 text-xs">{fmtCurrency(p.cost_price)} cost</span>
                          <span className="font-semibold text-amber-700">{fmtCurrency(p.profit_amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── Rules tab ──────────────────────────────────────────────────── */}
        {tab === 'rules' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Rules are applied: Product &gt; Category &gt; Global</p>
              <button
                onClick={openCreateRule}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#0F2747' }}
              >
                + Add Rule
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {rulesLoading ? (
                <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
              ) : rules.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No pricing rules configured.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Label / Target</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Markup</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Priority</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Active</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rules.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            r.rule_type === 'global' ? 'bg-blue-100 text-blue-700' :
                            r.rule_type === 'category' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {r.rule_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{r.label ?? r.target_id ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{r.markup_pct}%</td>
                        <td className="px-4 py-3 text-right text-gray-500">{r.priority}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleRule(r.id, !r.is_active)}
                            className={`w-9 h-5 rounded-full transition-colors relative ${r.is_active ? 'bg-green-500' : 'bg-gray-200'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${r.is_active ? 'left-4' : 'left-0.5'}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditRule(r)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Edit</button>
                            {r.rule_type !== 'global' && (
                              <button onClick={() => deleteRule(r.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Bulk Pricing tab ───────────────────────────────────────────── */}
        {tab === 'bulk' && (
          <div className="space-y-4 max-w-2xl">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
              <h2 className="text-sm font-bold text-gray-900">Bulk Markup Tool</h2>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['set', 'increase', 'decrease'] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setBulkAction(a)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${bulkAction === a ? 'border-[#0F2747] bg-[#0F2747]/5 text-[#0F2747]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {bulkAction === 'set' && 'Sets markup to exactly this value on all matching products.'}
                  {bulkAction === 'increase' && 'Adds this % to each product\'s current markup.'}
                  {bulkAction === 'decrease' && 'Subtracts this % from each product\'s current markup (min 0).'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Markup Percentage</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={1}
                    value={bulkMarkup}
                    onChange={(e) => setBulkMarkup(Number(e.target.value))}
                    className="flex-1 accent-[#0F2747]"
                  />
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-24">
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      value={bulkMarkup}
                      onChange={(e) => setBulkMarkup(Number(e.target.value))}
                      className="flex-1 px-3 py-2 text-sm text-center focus:outline-none"
                    />
                    <span className="pr-2 text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Apply To</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBulkScope('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${bulkScope === 'all' ? 'border-[#0F2747] bg-[#0F2747]/5 text-[#0F2747]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    All Products
                  </button>
                  <button
                    onClick={() => setBulkScope('category')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${bulkScope === 'category' ? 'border-[#0F2747] bg-[#0F2747]/5 text-[#0F2747]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    Category
                  </button>
                </div>
                {bulkScope === 'category' && (
                  <select
                    value={bulkCategoryId}
                    onChange={(e) => setBulkCategoryId(e.target.value)}
                    className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              {bulkError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{bulkError}</p>}
              {bulkDone && <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2">{bulkDone}</p>}

              <button
                onClick={runBulkPricing}
                disabled={bulkRunning || (bulkScope === 'category' && !bulkCategoryId)}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: '#0F2747' }}
              >
                {bulkRunning ? 'Applying...' : `Apply ${bulkAction === 'set' ? '' : bulkAction + ' by '}${bulkMarkup}% to ${bulkScope === 'all' ? 'All Products' : 'Category'}`}
              </button>
            </div>
          </div>
        )}

        {/* ── Profit Report tab ──────────────────────────────────────────── */}
        {tab === 'report' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <select
                value={reportCategoryId}
                onChange={(e) => setReportCategoryId(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
              >
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                onClick={loadReport}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#0F2747' }}
              >
                Run Report
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {reportLoading ? (
                <div className="p-8 text-center text-sm text-gray-400">Running report...</div>
              ) : reportRows.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No data. Click Run Report.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Products</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total Revenue</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Profit</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Avg Markup</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reportRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.category_name ?? 'Uncategorised'}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.product_count}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{fmtCurrency(row.total_cost)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{fmtCurrency(row.total_revenue)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">{fmtCurrency(row.total_profit)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{fmt(row.avg_markup_pct, 1)}%</td>
                        <td className="px-4 py-3 text-right text-gray-600">{fmt(row.avg_margin_pct, 1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{reportRows.reduce((s, r) => s + r.product_count, 0)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{fmtCurrency(reportRows.reduce((s, r) => s + r.total_cost, 0))}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{fmtCurrency(reportRows.reduce((s, r) => s + r.total_revenue, 0))}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{fmtCurrency(reportRows.reduce((s, r) => s + r.total_profit, 0))}</td>
                      <td className="px-4 py-3 text-right text-gray-500">—</td>
                      <td className="px-4 py-3 text-right text-gray-500">—</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Rule modal ─────────────────────────────────────────────────────── */}
      {ruleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{ruleModal === 'create' ? 'Add Pricing Rule' : 'Edit Pricing Rule'}</h2>
              <button onClick={() => setRuleModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {ruleError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{ruleError}</p>}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Rule Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {RULE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setRuleForm((f) => ({ ...f, rule_type: t.value as PricingRule['rule_type'], target_id: null, label: null }))}
                      className={`px-3 py-2.5 rounded-xl text-left border transition-all ${ruleForm.rule_type === t.value ? 'border-[#0F2747] bg-[#0F2747]/5' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {ruleForm.rule_type === 'category' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                  <select
                    value={ruleForm.target_id ?? ''}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.id === e.target.value)
                      setRuleForm((f) => ({ ...f, target_id: e.target.value, label: cat?.name ?? null }))
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {ruleForm.rule_type === 'product' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Product ID</label>
                  <input
                    value={ruleForm.target_id ?? ''}
                    onChange={(e) => setRuleForm((f) => ({ ...f, target_id: e.target.value, label: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                    placeholder="Product UUID"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Label (optional)</label>
                <input
                  value={ruleForm.label ?? ''}
                  onChange={(e) => setRuleForm((f) => ({ ...f, label: e.target.value || null }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                  placeholder="e.g. Standard global markup"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Markup Percentage</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={1}
                    value={ruleForm.markup_pct}
                    onChange={(e) => setRuleForm((f) => ({ ...f, markup_pct: Number(e.target.value) }))}
                    className="flex-1 accent-[#0F2747]"
                  />
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-24">
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      value={ruleForm.markup_pct}
                      onChange={(e) => setRuleForm((f) => ({ ...f, markup_pct: Number(e.target.value) }))}
                      className="flex-1 px-3 py-2 text-sm text-center focus:outline-none"
                    />
                    <span className="pr-2 text-sm text-gray-500">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Cost £1.00 → Sell £{(1 * (1 + ruleForm.markup_pct / 100)).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Priority (lower = higher priority)</label>
                <input
                  type="number"
                  min={1}
                  value={ruleForm.priority}
                  onChange={(e) => setRuleForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ruleForm.is_active} onChange={(e) => setRuleForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setRuleModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
              <button
                onClick={handleSaveRule}
                disabled={ruleSaving}
                className="px-5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#0F2747' }}
              >
                {ruleSaving ? 'Saving...' : ruleModal === 'create' ? 'Add Rule' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
