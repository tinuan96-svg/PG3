'use client'

import { useState, useEffect } from 'react'
import { ProductRow, Category, Variation } from './types'
import ProductImagesManager from '@/components/admin/products/ProductImagesManager'

type Props = {
  product: ProductRow | null
  categories: Category[]
  variations: Variation[]
  onSave: (id: string, updates: Partial<ProductRow>, variations?: Variation[]) => Promise<void>
  onClose: () => void
}

type Tab = 'general' | 'media' | 'pricing' | 'inventory' | 'seo' | 'variations'

// Badge shown on fields that CentralHub owns — they sync automatically and
// cannot be edited here to avoid being overwritten on next sync.
function CHBadge() {
  return (
    <span
      title="Managed by CentralHub — updates automatically on sync"
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ml-2"
      style={{ backgroundColor: '#EBF5FF', color: '#1D6FA4' }}
    >
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      CentralHub
    </span>
  )
}

function ReadonlyField({ label, value, badge = false }: { label: string; value: string | number | null | undefined; badge?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{badge && <CHBadge />}
      </label>
      <div className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500 select-all">
        {value ?? <span className="italic text-gray-300">—</span>}
      </div>
    </div>
  )
}

type FormState = {
  name: string
  short_description: string
  description: string
  ingredients: string
  nutritional_info: string
  storage_instructions: string
  how_to_use: string
  slug: string
  brand: string
  category_id: string
  cost_price: string
  selling_price: string
  markup_percentage: string
  profit_amount: string
  price: string
  seo_title: string
  seo_description: string
  gallery: string[]
}

export default function FullEditModal({ product, categories, variations: initVariations, onSave, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('general')
  const [saving, setSaving] = useState(false)
  const [variations, setVariations] = useState<Variation[]>([])

  const [form, setForm] = useState<FormState>({
    name: '',
    short_description: '',
    description: '',
    ingredients: '',
    nutritional_info: '',
    storage_instructions: '',
    how_to_use: '',
    slug: '',
    brand: '',
    category_id: '',
    cost_price: '',
    selling_price: '',
    markup_percentage: '',
    profit_amount: '',
    price: '',
    seo_title: '',
    seo_description: '',
    gallery: [],
  })

  useEffect(() => {
    if (!product) return
    const gallery = Array.isArray(product.gallery) ? product.gallery : []
    setForm({
      name: product.name,
      short_description: product.short_description ?? '',
      description: product.description ?? '',
      ingredients: product.ingredients ?? '',
      nutritional_info: product.nutritional_info ?? '',
      storage_instructions: product.storage_instructions ?? '',
      how_to_use: product.how_to_use ?? '',
      slug: product.slug,
      brand: product.brand ?? '',
      category_id: product.category_id ?? '',
      cost_price: product.cost_price != null ? String(product.cost_price) : '',
      selling_price: product.selling_price != null ? String(product.selling_price) : '',
      markup_percentage: product.markup_percentage != null ? String(product.markup_percentage) : '',
      profit_amount: product.profit_amount != null ? String(product.profit_amount) : '',
      price: String(product.price),
      seo_title: product.seo_title ?? '',
      seo_description: product.seo_description ?? '',
      gallery,
    })
    setVariations(initVariations)
    setTab('general')
  }, [product, initVariations])

  function recalcPrice() {
    const cost = parseFloat(form.cost_price)
    const markup = parseFloat(form.markup_percentage)
    if (!isNaN(cost) && !isNaN(markup)) {
      const sell = Math.round(cost * (1 + markup / 100) * 100) / 100
      const profit = Math.round((sell - cost) * 100) / 100
      setForm((p) => ({ ...p, selling_price: sell.toFixed(2), profit_amount: profit.toFixed(2) }))
    }
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }

  function addVariation() {
    if (!product) return
    setVariations((prev) => [...prev, { id: `new-${Date.now()}`, product_id: product.id, variation_label: '', weight: null, price: 0, stock_quantity: 0 }])
  }

  function removeVariation(idx: number) {
    setVariations((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateVariation(idx: number, key: keyof Variation, value: string | number | null) {
    setVariations((prev) => prev.map((v, i) => i === idx ? { ...v, [key]: value } : v))
  }

  const isCentralHubProduct = !!product?.source_product_id

  async function handleSave() {
    if (!product) return
    setSaving(true)
    // Only save PocketGrocery-owned fields. CentralHub-owned fields (name, price,
    // stock, sku, weight, barcode) are never written here — they sync automatically.
    const updates: Partial<ProductRow> = {
      short_description: form.short_description || null,
      description: form.description || null,
      ingredients: form.ingredients || null,
      nutritional_info: form.nutritional_info || null,
      storage_instructions: form.storage_instructions || null,
      how_to_use: form.how_to_use || null,
      slug: form.slug,
      brand: form.brand || null,
      category_id: form.category_id || null,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      markup_percentage: form.markup_percentage ? parseFloat(form.markup_percentage) : null,
      selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
      profit_amount: form.profit_amount ? parseFloat(form.profit_amount) : null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
    }
    // Only allow editing price / name for non-CentralHub products
    if (!isCentralHubProduct) {
      updates.name = form.name
      updates.price = parseFloat(form.price)
    }
    await onSave(product.id, updates, variations)
    setSaving(false)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'media', label: 'Media' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'seo', label: 'SEO' },
    { id: 'variations', label: 'Variations' },
  ]

  const seoPreviewTitle = form.seo_title || form.name
  const seoPreviewDesc = form.seo_description || form.short_description || form.description || ''
  const seoPreviewUrl = `pocketgrocery.co.uk/products/${form.slug}`

  if (!product) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-gray-900">Edit Product</h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{product.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-1 px-6 pt-3 border-b border-gray-100 flex-shrink-0 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`text-xs font-medium px-3 py-2 rounded-t-lg whitespace-nowrap transition-colors ${tab === t.id ? 'text-[#0F2747] border-b-2 border-[#0F2747]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* GENERAL */}
            {tab === 'general' && (
              <div className="space-y-4">
                {isCentralHubProduct && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ backgroundColor: '#EBF5FF', color: '#1D6FA4' }}>
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Fields marked <strong>CentralHub</strong> sync automatically and cannot be edited here. Focus on descriptions, categories, images and SEO.</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Product Name{isCentralHubProduct && <CHBadge />}
                  </label>
                  {isCentralHubProduct ? (
                    <div className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500">{form.name}</div>
                  ) : (
                    <input
                      value={form.name}
                      onChange={(e) => { const n = e.target.value; setForm((p) => ({ ...p, name: n, slug: generateSlug(n) })) }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Short Description</label>
                  <input
                    value={form.short_description}
                    onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))}
                    placeholder="Brief one-line summary shown in product listings"
                    maxLength={200}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{form.short_description.length}/200</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={6}
                    placeholder="Detailed product description shown on the product page"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Ingredients</label>
                  <textarea
                    value={form.ingredients}
                    onChange={(e) => setForm((p) => ({ ...p, ingredients: e.target.value }))}
                    rows={3}
                    placeholder="List of ingredients (optional)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Nutritional Information</label>
                  <textarea
                    value={form.nutritional_info}
                    onChange={(e) => setForm((p) => ({ ...p, nutritional_info: e.target.value }))}
                    rows={4}
                    placeholder="Nutritional values per 100g (optional)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Storage Instructions</label>
                  <textarea
                    value={form.storage_instructions}
                    onChange={(e) => setForm((p) => ({ ...p, storage_instructions: e.target.value }))}
                    rows={2}
                    placeholder="e.g. Store in a cool, dry place away from direct sunlight"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">How To Use</label>
                  <textarea
                    value={form.how_to_use}
                    onChange={(e) => setForm((p) => ({ ...p, how_to_use: e.target.value }))}
                    rows={3}
                    placeholder="Cooking directions or usage instructions (optional)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">URL Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Brand{isCentralHubProduct && <CHBadge />}
                    </label>
                    {isCentralHubProduct ? (
                      <div className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500">
                        {form.brand || <span className="italic text-gray-300">—</span>}
                      </div>
                    ) : (
                      <input
                        value={form.brand}
                        onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                        placeholder="e.g. Eastern Spice Co."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]"
                      />
                    )}
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
              </div>
            )}

            {/* MEDIA */}
            {tab === 'media' && (
              <ProductImagesManager productId={product.id} productName={product.name} />
            )}

            {/* PRICING */}
            {tab === 'pricing' && (
              <div className="space-y-5">
                {/* CentralHub cost price — readonly for CH products */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cost & Markup</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Cost Price (£){isCentralHubProduct && <CHBadge />}
                      </label>
                      {isCentralHubProduct ? (
                        <div className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500 select-all">
                          {form.cost_price ? `£${parseFloat(form.cost_price).toFixed(2)}` : <span className="italic text-gray-300">—</span>}
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={form.cost_price}
                          onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))}
                          onBlur={recalcPrice}
                          placeholder="0.00"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Markup % <span className="font-normal text-gray-400">(leave blank = use global rule)</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.markup_percentage}
                        onChange={(e) => setForm((p) => ({ ...p, markup_percentage: e.target.value }))}
                        onBlur={recalcPrice}
                        placeholder="e.g. 15"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]"
                      />
                    </div>
                  </div>
                </div>

                {/* Computed / overridden selling price */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Selling Price</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Selling Price (£){isCentralHubProduct && <CHBadge />}
                      </label>
                      {isCentralHubProduct ? (
                        <div className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 select-all">
                          {form.selling_price ? `£${parseFloat(form.selling_price).toFixed(2)}` : <span className="italic font-normal text-gray-300">Auto-calculated</span>}
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={form.selling_price}
                          onChange={(e) => setForm((p) => ({ ...p, selling_price: e.target.value }))}
                          placeholder="Auto-calculated"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#5FAE9B]"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Profit summary */}
                {form.cost_price && form.selling_price && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <p className="text-xs text-emerald-700 font-medium">
                      Profit: <strong>£{(parseFloat(form.selling_price) - parseFloat(form.cost_price)).toFixed(2)}</strong>
                      {form.markup_percentage ? ` at ${form.markup_percentage}% markup` : ''}
                      {' '}— Margin: <strong>{parseFloat(form.selling_price) > 0 ? (((parseFloat(form.selling_price) - parseFloat(form.cost_price)) / parseFloat(form.selling_price)) * 100).toFixed(1) : '0'}%</strong>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* INVENTORY */}
            {tab === 'inventory' && (
              <div className="space-y-5">
                <ReadonlyField label="Stock Quantity" value={product?.stock_qty ?? 0} badge={isCentralHubProduct} />
                {isCentralHubProduct && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ backgroundColor: '#EBF5FF', color: '#1D6FA4' }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Stock and status are controlled by CentralHub (currently: <strong className="ml-1">{product?.centralhub_status ?? 'unknown'}</strong>).
                  </div>
                )}
              </div>
            )}

            {/* SEO */}
            {tab === 'seo' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">SEO Title</label>
                  <input
                    value={form.seo_title}
                    onChange={(e) => setForm((p) => ({ ...p, seo_title: e.target.value }))}
                    maxLength={70}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{form.seo_title.length}/70 characters</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Meta Description</label>
                  <textarea
                    value={form.seo_description}
                    onChange={(e) => setForm((p) => ({ ...p, seo_description: e.target.value }))}
                    maxLength={160}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{form.seo_description.length}/160 characters</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">URL Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] font-mono"
                  />
                </div>
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Google Preview</p>
                  <p className="text-[#1a0dab] text-sm font-medium truncate hover:underline cursor-pointer">{seoPreviewTitle || '(no title)'}</p>
                  <p className="text-[#006621] text-xs truncate mt-0.5">{seoPreviewUrl}</p>
                  <p className="text-[#545454] text-xs mt-1 line-clamp-2">{seoPreviewDesc || '(no description)'}</p>
                </div>
              </div>
            )}

            {/* VARIATIONS */}
            {tab === 'variations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{variations.length} variation{variations.length !== 1 ? 's' : ''}</p>
                  <button
                    onClick={addVariation}
                    className="text-xs font-medium text-[#0F2747] border border-[#0F2747] px-3 py-1.5 rounded-lg hover:bg-[#0F2747] hover:text-white transition-colors"
                  >
                    + Add Variation
                  </button>
                </div>
                {variations.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-sm text-gray-400">No variations. Add one for products with multiple sizes or options.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {variations.map((v, idx) => (
                      <div key={v.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-gray-500">Variation {idx + 1}</span>
                          <button onClick={() => removeVariation(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="text-[10px] text-gray-400 block mb-1">Label (e.g. 5kg)</label>
                            <input
                              value={v.variation_label}
                              onChange={(e) => updateVariation(idx, 'variation_label', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Price (£)</label>
                            <input
                              type="number"
                              value={v.price}
                              onChange={(e) => updateVariation(idx, 'price', parseFloat(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Stock</label>
                            <input
                              type="number"
                              value={v.stock_quantity}
                              onChange={(e) => updateVariation(idx, 'stock_quantity', parseInt(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
            <button onClick={onClose} className="flex-1 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors">
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
      </div>

    </>
  )
}
