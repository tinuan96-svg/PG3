'use client'

import { ProductRow, SortField, SortDir } from './types'

type Props = {
  products: ProductRow[]
  selected: Set<string>
  onToggle: (id: string) => void
  onToggleAll: () => void
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
  onQuickEdit: (p: ProductRow) => void
  onFullEdit: (p: ProductRow) => void
  onPublish: (id: string) => void
  onUnpublish: (id: string) => void
  publishing: Record<string, boolean>
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 inline-flex flex-col gap-px ${active ? 'opacity-100' : 'opacity-30'}`}>
      <svg className={`w-2.5 h-2.5 ${active && dir === 'asc' ? 'text-[#0F2747]' : 'text-gray-400'}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M5 0L10 6H0L5 0Z" />
      </svg>
      <svg className={`w-2.5 h-2.5 ${active && dir === 'desc' ? 'text-[#0F2747]' : 'text-gray-400'}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M5 6L0 0H10L5 6Z" />
      </svg>
    </span>
  )
}

function Th({ label, field, sortField, sortDir, onSort }: { label: string; field: SortField; sortField: SortField; sortDir: SortDir; onSort: (f: SortField) => void }) {
  return (
    <th
      className="text-left px-4 py-3 font-medium whitespace-nowrap cursor-pointer select-none hover:text-gray-700 transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        <SortIcon active={sortField === field} dir={sortDir} />
      </span>
    </th>
  )
}

const approvalBadgeClass = (status: string) => {
  if (status === 'approved') return 'bg-[#EBF4F1] text-[#3C9080] border-[#C5E2DA]'
  if (status === 'rejected') return 'bg-red-50 text-red-600 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

export default function ProductTable({
  products, selected, onToggle, onToggleAll,
  sortField, sortDir, onSort,
  onQuickEdit, onFullEdit, onPublish, onUnpublish, publishing,
}: Props) {
  const allSelected = products.length > 0 && products.every((p) => selected.has(p.id))
  const someSelected = products.some((p) => selected.has(p.id)) && !allSelected

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[1000px]">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
            <th className="px-4 py-3 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected }}
                onChange={onToggleAll}
                className="w-4 h-4 rounded border-gray-300 accent-[#0F2747] cursor-pointer"
              />
            </th>
            <th className="px-4 py-3 w-14 font-medium text-left">Image</th>
            <Th label="Product" field="name" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Brand</th>
            <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Category</th>
            <Th label="Price" field="price" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Cost</th>
            <Th label="Stock" field="stock_qty" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <Th label="Status" field="approval_status" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <Th label="Added" field="created_at" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <th className="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((p) => {
            const isSelected = selected.has(p.id)
            const isApproved = p.approval_status === 'approved'
            const inStock = p.stock_qty > 0

            return (
              <tr
                key={p.id}
                className={`transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(p.id)}
                    className="w-4 h-4 rounded border-gray-300 accent-[#0F2747] cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {p.image ? (
                      <img src={p.image} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[220px]">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-gray-900 truncate leading-tight">{p.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono truncate">{p.sku || p.slug}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {p.brand || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {p.category_name || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-semibold text-gray-900">£{Number(p.price).toFixed(2)}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                  {p.cost_price != null ? (
                    <span>£{Number(p.cost_price).toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-700">{p.stock_qty}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border inline-block w-fit ${inStock ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {inStock ? 'in stock' : 'out of stock'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border w-fit inline-block ${approvalBadgeClass(p.approval_status)}`}>
                    {p.approval_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                  {new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onQuickEdit(p)}
                      title="Quick edit"
                      className="p-1.5 text-gray-400 hover:text-[#0F2747] hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onFullEdit(p)}
                      title="Full edit"
                      className="p-1.5 text-gray-400 hover:text-[#0F2747] hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                      </svg>
                    </button>
                    {!isApproved ? (
                      <button
                        onClick={() => onPublish(p.id)}
                        disabled={publishing[p.id]}
                        className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: '#5FAE9B' }}
                      >
                        {publishing[p.id] ? '…' : 'Publish'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onUnpublish(p.id)}
                        disabled={publishing[p.id]}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        {publishing[p.id] ? '…' : 'Unpublish'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
