'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'
import FilterBar from '@/components/admin/products/FilterBar'
import ProductTable from '@/components/admin/products/ProductTable'
import BulkToolbar from '@/components/admin/products/BulkToolbar'
import QuickEditPanel from '@/components/admin/products/QuickEditPanel'
import FullEditModal from '@/components/admin/products/FullEditModal'
import {
  ProductRow, Filters, SortField, SortDir, BulkAction,
  Category, SupplierConnection, Variation, ITEMS_PER_PAGE
} from '@/components/admin/products/types'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const [filters, setFilters] = useState<Filters>({
    search: '', status: 'all', stockStatus: 'all', approvalStatus: 'all',
    brand: '', categoryId: '', supplierId: '',
    priceMin: '', priceMax: '',
  })
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [publishing, setPublishing] = useState<Record<string, boolean>>({})

  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers] = useState<SupplierConnection[]>([])

  const [quickEditProduct, setQuickEditProduct] = useState<ProductRow | null>(null)
  const [fullEditProduct, setFullEditProduct] = useState<ProductRow | null>(null)
  const [fullEditVariations, setFullEditVariations] = useState<Variation[]>([])

  useEffect(() => {
    async function loadMeta() {
      const { data: c } = await supabase.from('categories').select('id, name').order('name')
      setCategories(c ?? [])
    }
    loadMeta()
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)

    const rpcResult = await supabase.rpc('get_admin_products', {
      p_sort_field: sortField,
      p_sort_dir: sortDir,
      p_limit: ITEMS_PER_PAGE,
      p_offset: page * ITEMS_PER_PAGE,
      p_search: filters.search || null,
      p_status: filters.status === 'all' ? null : filters.status,
      p_stock_status: filters.stockStatus === 'all' ? null : filters.stockStatus,
      p_approval_status: filters.approvalStatus === 'all' ? null : filters.approvalStatus,
      p_brand: filters.brand || null,
      p_category_id: filters.categoryId || null,
      p_price_min: filters.priceMin ? parseFloat(filters.priceMin) : null,
      p_price_max: filters.priceMax ? parseFloat(filters.priceMax) : null,
    })
    const { data: rpcData, error } = rpcResult

    if (error) {
      console.error('Admin products RPC error:', error)
      setProducts([])
      setTotalCount(0)
      setLoading(false)
      return
    }

    const rows = (rpcData ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      brand: (r.brand as string) ?? null,
    })) as ProductRow[]

    const count = rpcData && rpcData.length > 0 ? Number((rpcData[0].total_count as number) ?? 0) : 0
    setProducts(rows)
    setTotalCount(count)
    setLoading(false)
  }, [page, filters, sortField, sortDir])

  useEffect(() => { loadProducts() }, [loadProducts])

  useEffect(() => {
    setPage(0)
    setSelected(new Set())
  }, [filters, sortField, sortDir])

  function handleFilterChange(f: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...f }))
  }

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function toggleSelectAll() {
    if (products.every((p) => selected.has(p.id))) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map((p) => p.id)))
    }
  }

  async function handlePublish(id: string) {
    setPublishing((p) => ({ ...p, [id]: true }))
    await supabase.from('products').update({ approval_status: 'approved', visibility_status: 'visible' }).eq('id', id)
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, approval_status: 'approved', visibility_status: 'visible' } : p))
    setPublishing((p) => ({ ...p, [id]: false }))
  }

  async function handleUnpublish(id: string) {
    setPublishing((p) => ({ ...p, [id]: true }))
    await supabase.from('products').update({ approval_status: 'draft', visibility_status: 'hidden' }).eq('id', id)
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, approval_status: 'draft', visibility_status: 'hidden' } : p))
    setPublishing((p) => ({ ...p, [id]: false }))
  }

  async function handleBulkAction(action: BulkAction, payload?: unknown) {
    const ids = Array.from(selected)
    if (ids.length === 0) return

    if (action === 'publish') {
      await supabase.from('products').update({ approval_status: 'approved', visibility_status: 'visible' }).in('id', ids)
      setProducts((prev) => prev.map((p) => ids.includes(p.id) ? { ...p, approval_status: 'approved', visibility_status: 'visible' } : p))
    } else if (action === 'draft') {
      await supabase.from('products').update({ approval_status: 'draft', visibility_status: 'hidden' }).in('id', ids)
      setProducts((prev) => prev.map((p) => ids.includes(p.id) ? { ...p, approval_status: 'draft', visibility_status: 'hidden' } : p))
    } else if (action === 'delete') {
      // Soft-delete by moving to rejected + hidden (schema has no is_deleted column)
      await supabase.from('products').update({ approval_status: 'rejected', visibility_status: 'hidden' }).in('id', ids)
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)))
      setTotalCount((c) => c - ids.length)
    } else if (action === 'markup') {
      // markup recalculation handled on individual products
      await loadProducts()
    } else if (action === 'assign_category') {
      await supabase.from('products').update({ category_id: payload as string }).in('id', ids)
      await loadProducts()
    }

    setSelected(new Set())
  }

  async function handleQuickSave(id: string, updates: Partial<ProductRow>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, created_at, category_name, total_count, ...cleanUpdates } = updates as any
    await supabase.from('products').update(cleanUpdates).eq('id', id)
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p))
    setQuickEditProduct(null)
  }

  async function openFullEdit(product: ProductRow) {
    setFullEditProduct(product)
    const { data } = await supabase
      .from('product_variations')
      .select('*')
      .eq('product_id', product.id)
      .order('variation_label')
    setFullEditVariations((data as Variation[]) ?? [])
  }

  async function handleFullSave(id: string, updates: Partial<ProductRow>, variations?: Variation[]) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, created_at, category_name, total_count, ...cleanUpdates } = updates as any
    await supabase.from('products').update(cleanUpdates).eq('id', id)

    if (variations) {
      const existingIds = fullEditVariations.map((v) => v.id).filter((vid) => !vid.startsWith('new-'))
      const newVariations = variations.filter((v) => v.id.startsWith('new-'))
      const updatedVariations = variations.filter((v) => !v.id.startsWith('new-'))
      const deletedIds = existingIds.filter((vid) => !updatedVariations.find((v) => v.id === vid))

      if (deletedIds.length > 0) await supabase.from('product_variations').delete().in('id', deletedIds)
      for (const v of updatedVariations) {
        await supabase.from('product_variations').update({
          variation_label: v.variation_label,
          weight: v.weight,
          price: v.price,
          stock_quantity: v.stock_quantity,
        }).eq('id', v.id)
      }
      for (const v of newVariations) {
        await supabase.from('product_variations').insert({
          product_id: id,
          variation_label: v.variation_label,
          weight: v.weight,
          price: v.price,
          stock_quantity: v.stock_quantity,
        })
      }
    }

    await loadProducts()
    setFullEditProduct(null)
  }

  const activeCount = products.filter((p) => p.approval_status === 'approved').length
  const inactiveCount = products.filter((p) => p.approval_status !== 'approved').length
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Product Control Center</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {totalCount.toLocaleString()} products &middot; {activeCount} active this page &middot; {inactiveCount} inactive this page
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/product-import"
              className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Import CSV
            </Link>
            <Link
              href="/admin/supplier-feed"
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0F2747' }}
            >
              Supplier Feed
            </Link>
          </div>
        </div>

        {selected.size > 0 && (
          <BulkToolbar
            count={selected.size}
            categories={categories}
            onAction={handleBulkAction}
            onClear={() => setSelected(new Set())}
          />
        )}

        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          categories={categories}
          suppliers={suppliers}
          totalCount={totalCount}
          filteredCount={products.length}
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center">
              <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm text-gray-500 font-medium">No products found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or import products from a supplier feed.</p>
            </div>
          ) : (
            <ProductTable
              products={products}
              selected={selected}
              onToggle={toggleSelect}
              onToggleAll={toggleSelectAll}
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              onQuickEdit={setQuickEditProduct}
              onFullEdit={openFullEdit}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              publishing={publishing}
            />
          )}

          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Page {page + 1} of {totalPages} &middot; {totalCount.toLocaleString()} total products
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(0)} disabled={page === 0}
                  className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
                    let p: number
                    if (totalPages <= 7) p = i
                    else if (page < 4) p = i
                    else if (page > totalPages - 5) p = totalPages - 7 + i
                    else p = page - 3 + i
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors ${page === p ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                        style={page === p ? { backgroundColor: '#0F2747' } : undefined}>
                        {p + 1}
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
                  className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <QuickEditPanel
        product={quickEditProduct}
        categories={categories}
        onSave={handleQuickSave}
        onClose={() => setQuickEditProduct(null)}
      />

      {fullEditProduct && (
        <FullEditModal
          product={fullEditProduct}
          categories={categories}
          variations={fullEditVariations}
          onSave={handleFullSave}
          onClose={() => setFullEditProduct(null)}
        />
      )}
    </AdminLayout>
  )
}
