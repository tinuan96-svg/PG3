'use client'

import { useState, useEffect } from 'react'
import { ProductRow, Category } from './types'

type Props = {
  product: ProductRow | null
  categories: Category[]
  onSave: (id: string, updates: Partial<ProductRow>) => Promise<void>
  onClose: () => void
}

export default function QuickEditPanel({ product, categories, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: '',
    brand: '',
    category_id: '',
    cost_price: '',
    price: '',
    markup_percentage: '',
    stock_qty: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!product) return
    setForm({
      name: product.name,
      brand: product.brand ?? '',
      category_id: product.category_id ?? '',
      cost_price: product.cost_price != null ? String(product.cost_price) : '',
      price: String(product.price),
      markup_percentage: product.markup_percentage != null ? String(product.markup_percentage) : '',
      stock_qty: String(product.stock_qty),
    })
  }, [product])

  function recalcPrice() {
    const cost = parseFloat(form.cost_price)
    const markup = parseFloat(form.markup_percentage)
    if (!isNaN(cost) && !isNaN(markup)) {
      setForm((prev) => ({
        ...prev,
        price: (Math.ceil(cost * (1 + markup / 100) * 100) / 100).toFixed(2),
      }))
    }
  }

  async function handleSave() {
    if (!product) return
    setSaving(true)
    await onSave(product.id, {
      name: form.name,
      brand: form.brand || null,
      category_id: form.category_id || null,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      price: parseFloat(form.price),
      markup_percentage: form.markup_percentage ? parseFloat(form.markup_percentage) : null,
    })
    setSaving(false)
  }

  const visible = !!product

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full z-50 w-[400px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Quick Edit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {product && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Product Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Brand</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                  placeholder="e.g. Eastern Spice Co."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] bg-white"
                >
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pricing</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cost Price (£)</label>
                  <input
                    type="number"
                    value={form.cost_price}
                    onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))}
                    onBlur={recalcPrice}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Markup %</label>
                  <input
                    type="number"
                    value={form.markup_percentage}
                    onChange={(e) => setForm((p) => ({ ...p, markup_percentage: e.target.value }))}
                    onBlur={recalcPrice}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B] bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Store Price (£)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B] bg-white font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Stock Quantity <span className="text-gray-400 font-normal">(CentralHub-managed)</span>
              </label>
              <div className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500">
                {form.stock_qty}
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 text-sm font-bold text-white rounded-xl py-2.5 transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#0F2747' }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}
