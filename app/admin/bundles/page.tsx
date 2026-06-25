'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

interface Bundle {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  product_ids: string[]
  original_price: number
  bundle_price: number
  savings_amount: number
  coin_reward: number
  is_active: boolean
  display_locations: string[]
  created_at: string
}

export default function BundlesManagement() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchBundles = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('product_bundles')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setBundles(data as Bundle[] ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBundles() }, [fetchBundles])

  async function toggleStatus(bundleId: string, current: boolean) {
    await supabase.from('product_bundles').update({ is_active: !current }).eq('id', bundleId)
    fetchBundles()
  }

  async function deleteBundle(bundleId: string) {
    if (!confirm('Delete this bundle? This cannot be undone.')) return
    await supabase.from('product_bundles').delete().eq('id', bundleId)
    fetchBundles()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Bundles</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage bundles to increase order value.</p>
          </div>
          <Link
            href="/admin/bundles/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0F2747' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Bundle
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#5FAE9B', borderTopColor: 'transparent' }} />
          </div>
        ) : bundles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900 mb-1">No bundles yet</h2>
            <p className="text-sm text-gray-500 mb-5">Create your first bundle to start increasing average order value.</p>
            <Link
              href="/admin/bundles/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#0F2747' }}
            >
              Create First Bundle
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h2 className="text-base font-bold text-gray-900">{bundle.name}</h2>
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${bundle.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {bundle.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {bundle.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{bundle.description}</p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                      <Stat label="Original" value={`£${Number(bundle.original_price).toFixed(2)}`} />
                      <Stat label="Bundle price" value={`£${Number(bundle.bundle_price).toFixed(2)}`} highlight />
                      <Stat label="Savings" value={`£${Number(bundle.savings_amount).toFixed(2)}`} />
                      <Stat label="Products" value={String(bundle.product_ids?.length ?? 0)} />
                    </div>

                    {bundle.display_locations?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {bundle.display_locations.map((loc) => (
                          <span key={loc} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                            {loc.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleStatus(bundle.id, bundle.is_active)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {bundle.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <Link
                      href={`/admin/bundles/edit/${bundle.id}`}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl text-center border transition-colors hover:bg-gray-50"
                      style={{ borderColor: '#5FAE9B', color: '#5FAE9B' }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteBundle(bundle.id)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-bold ${highlight ? '' : 'text-gray-900'}`} style={highlight ? { color: '#5FAE9B' } : undefined}>
        {value}
      </p>
    </div>
  )
}
