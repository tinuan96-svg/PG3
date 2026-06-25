'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

type VariantGroup = {
  base_name: string
  variants: VariantProduct[]
  total_stock: number
}

type VariantProduct = {
  id: string
  name: string
  slug: string
  sku: string | null
  barcode: string | null
  price: number
  stock_qty: number
  weight_grams: number | null
  approval_status: string
  category_id: string | null
  image: string | null
}

function extractBaseName(name: string): string {
  return name
    .replace(/\b\d+\s*(g|kg|ml|l|oz|lbs?|lb)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export default function VariantAuditPage() {
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([])
  const [singletons, setSingletons] = useState<VariantProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [view, setView] = useState<'groups' | 'duplicates'>('groups')

  async function load() {
    setLoading(true)
    setError('')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: err } = await (supabase as any)
        .from('products')
        .select('id, name, slug, sku, barcode, price, stock_qty, weight_grams, approval_status, category_id, image')
        .order('name')

      if (err) throw new Error(err.message)

      const products = (data ?? []) as VariantProduct[]
      const groups = new Map<string, VariantProduct[]>()

      for (const p of products) {
        const base = extractBaseName(p.name)
        if (!groups.has(base)) groups.set(base, [])
        groups.get(base)!.push(p)
      }

      const multiGroups: VariantGroup[] = []
      const singles: VariantProduct[] = []

      for (const [base_name, variants] of groups.entries()) {
        if (variants.length > 1) {
          multiGroups.push({
            base_name,
            variants,
            total_stock: variants.reduce((s, v) => s + (v.stock_qty ?? 0), 0),
          })
        } else {
          singles.push(variants[0])
        }
      }

      multiGroups.sort((a, b) => b.variants.length - a.variants.length)
      setVariantGroups(multiGroups)
      setSingletons(singles)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function toggleGroup(name: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const STATUS_COLORS: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    draft: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700',
  }

  const totalVariantProducts = variantGroups.reduce((s, g) => s + g.variants.length, 0)

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Variant Audit</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Detect products that appear to be size/weight variants of the same base product.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
            {error} <button onClick={load} className="ml-2 underline font-semibold">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Variant Groups', value: loading ? '…' : variantGroups.length, color: 'bg-blue-50 text-blue-700' },
            { label: 'Products in Groups', value: loading ? '…' : totalVariantProducts, color: 'bg-teal-50 text-teal-700' },
            { label: 'Standalone Products', value: loading ? '…' : singletons.length, color: 'bg-gray-50 text-gray-700' },
            { label: 'Total Products', value: loading ? '…' : totalVariantProducts + singletons.length, color: 'bg-green-50 text-green-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-2xl border border-gray-100 px-5 py-4 ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs mt-0.5 opacity-75">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 border-b border-gray-100">
          {([
            { key: 'groups', label: `Variant Groups (${variantGroups.length})` },
            { key: 'duplicates', label: 'About This Tool' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${view === key ? 'border-[#0F2747] text-[#0F2747]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'groups' && (
          loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : variantGroups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
              No variant groups detected. All products appear to be unique.
            </div>
          ) : (
            <div className="space-y-3">
              {variantGroups.map((group) => {
                const isExpanded = expandedGroups.has(group.base_name)
                return (
                  <div key={group.base_name} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleGroup(group.base_name)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 capitalize truncate">{group.base_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {group.variants.length} variants &middot; {group.total_stock} total stock
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{group.variants.length}</span>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-50 text-xs text-gray-400 uppercase tracking-wide bg-gray-50">
                                <th className="text-left px-4 py-2 font-medium">Product</th>
                                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">SKU</th>
                                <th className="text-left px-4 py-2 font-medium">Weight</th>
                                <th className="text-left px-4 py-2 font-medium">Price</th>
                                <th className="text-left px-4 py-2 font-medium">Stock</th>
                                <th className="text-left px-4 py-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {group.variants.map((v) => (
                                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      {v.image ? (
                                        <img src={v.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
                                      )}
                                      <span className="font-medium text-gray-800 truncate max-w-[200px]">{v.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs text-gray-400 hidden sm:table-cell">{v.sku ?? '—'}</td>
                                  <td className="px-4 py-3 text-gray-600">{v.weight_grams ? `${v.weight_grams}g` : '—'}</td>
                                  <td className="px-4 py-3 font-semibold text-gray-900">£{Number(v.price).toFixed(2)}</td>
                                  <td className="px-4 py-3">
                                    <span className={`text-xs font-medium ${v.stock_qty > 0 ? 'text-green-700' : 'text-red-600'}`}>
                                      {v.stock_qty}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[v.approval_status] ?? 'bg-gray-100 text-gray-500'}`}>
                                      {v.approval_status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {view === 'duplicates' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900">How Variant Detection Works</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p>The variant audit groups products that share the same base name after stripping weight/size units (g, kg, ml, l, oz, lbs).</p>
              <p>For example, &ldquo;Nirapara Rice 1kg&rdquo;, &ldquo;Nirapara Rice 5kg&rdquo;, and &ldquo;Nirapara Rice 25kg&rdquo; would appear as a group under &ldquo;nirapara rice&rdquo;.</p>
              <p>Groups with multiple products are shown in the Variant Groups tab. Review each group to confirm they are genuine variants — some groupings may be coincidental.</p>
              <p className="font-medium text-gray-700">This tool is read-only. No changes are made automatically. Use the Product Approval or Products pages to make updates.</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
