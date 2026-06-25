'use client'

import { Filters, Category, SupplierConnection } from './types'

type Props = {
  filters: Filters
  onChange: (f: Partial<Filters>) => void
  categories: Category[]
  suppliers: SupplierConnection[]
  totalCount: number
  filteredCount: number
}

export default function FilterBar({ filters, onChange, categories, totalCount, filteredCount }: Props) {
  const hasActive = filters.search || filters.status !== 'all' || filters.stockStatus !== 'all'
    || filters.approvalStatus !== 'all' || filters.brand || filters.categoryId || filters.priceMin || filters.priceMax

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or SKU…"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#5FAE9B] transition-colors"
          />
        </div>

        <select
          value={filters.approvalStatus}
          onChange={(e) => onChange({ approvalStatus: e.target.value as Filters['approvalStatus'] })}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#5FAE9B] bg-white text-gray-700"
        >
          <option value="all">All Approvals</option>
          <option value="approved">Approved</option>
          <option value="draft">Draft</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={filters.stockStatus}
          onChange={(e) => onChange({ stockStatus: e.target.value as Filters['stockStatus'] })}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#5FAE9B] bg-white text-gray-700"
        >
          <option value="all">All Stock</option>
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>

        <input
          type="text"
          placeholder="Filter by brand…"
          value={filters.brand}
          onChange={(e) => onChange({ brand: e.target.value })}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#5FAE9B] w-40"
        />

        <select
          value={filters.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#5FAE9B] bg-white text-gray-700"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">£</span>
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => onChange({ priceMin: e.target.value })}
            className="w-20 text-sm border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:border-[#5FAE9B]"
          />
          <span className="text-xs text-gray-400">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => onChange({ priceMax: e.target.value })}
            className="w-20 text-sm border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:border-[#5FAE9B]"
          />
        </div>

        {hasActive && (
          <button
            onClick={() => onChange({ search: '', status: 'all', stockStatus: 'all', approvalStatus: 'all', brand: '', categoryId: '', supplierId: '', priceMin: '', priceMax: '' })}
            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Showing <span className="font-medium text-gray-600">{filteredCount}</span> of <span className="font-medium text-gray-600">{totalCount}</span> products</span>
      </div>
    </div>
  )
}
