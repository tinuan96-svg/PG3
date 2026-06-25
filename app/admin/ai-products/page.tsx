'use client'

import { useState } from 'react'
import Link from 'next/link'

const classifications = [
  { id: '1', product: 'Nirapara Chemba Puttu Podi 1kg', suggestedCategory: 'Rice & Flour', suggestedBrand: 'Nirapara', tags: ['puttu', 'breakfast', 'kerala'], confidence: 0.95, status: 'approved' },
  { id: '2', product: 'Eastern Sambar Powder 100g', suggestedCategory: 'Spices & Masalas', suggestedBrand: 'Eastern', tags: ['sambar', 'spice', 'south indian'], confidence: 0.98, status: 'approved' },
  { id: '3', product: 'Unknown Product XYZ', suggestedCategory: 'Snacks & Sweets', suggestedBrand: 'Unknown', tags: ['snack'], confidence: 0.42, status: 'pending' },
  { id: '4', product: 'New Arrival Spice Mix 200g', suggestedCategory: 'Spices & Masalas', suggestedBrand: 'Kitchen Treasures', tags: ['spice', 'mix', 'masala'], confidence: 0.78, status: 'pending' },
  { id: '5', product: 'Imported Rice Brand 5kg', suggestedCategory: 'Rice & Flour', suggestedBrand: 'Imported', tags: ['rice', 'basmati'], confidence: 0.85, status: 'pending' },
  { id: '6', product: 'Kerala Special Mixture 300g', suggestedCategory: 'Snacks & Sweets', suggestedBrand: 'Eastern', tags: ['mixture', 'snack', 'namkeen'], confidence: 0.91, status: 'approved' },
]

const inventoryAlerts = [
  { product: 'Nirapara Rose Matta Rice 5kg', currentStock: 12, avgDailySales: 4.2, daysLeft: 3, confidence: 0.92 },
  { product: 'Eastern Sambar Powder 100g', currentStock: 25, avgDailySales: 3.8, daysLeft: 7, confidence: 0.88 },
  { product: 'Haldiram Banana Chips 200g', currentStock: 8, avgDailySales: 3.1, daysLeft: 3, confidence: 0.90 },
  { product: 'Kerala Coconut Oil 500ml', currentStock: 45, avgDailySales: 2.5, daysLeft: 18, confidence: 0.85 },
  { product: 'Brahmins Fish Curry Masala', currentStock: 62, avgDailySales: 2.1, daysLeft: 30, confidence: 0.82 },
  { product: 'Melam Kashmiri Chilli Powder', currentStock: 15, avgDailySales: 1.8, daysLeft: 8, confidence: 0.87 },
]

export default function AIProductsPage() {
  const [tab, setTab] = useState<'classification' | 'inventory'>('classification')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all')

  const filteredClassifications = statusFilter === 'all'
    ? classifications
    : classifications.filter((c) => c.status === statusFilter)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#0F2747' }}>AI Product Management</h1>
              <p className="text-sm text-gray-500 mt-0.5">Product classification, inventory predictions, and category management</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex gap-2 border-b border-gray-200 pb-0">
          {(['classification', 'inventory'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t ? 'border-current' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              style={tab === t ? { color: '#0F2747' } : undefined}
            >
              {t === 'classification' ? 'Product Classification' : 'Inventory Predictions'}
            </button>
          ))}
        </div>

        {tab === 'classification' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <p className="text-xs text-gray-500">Total Classified</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#0F2747' }}>{classifications.length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <p className="text-xs text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">{classifications.filter((c) => c.status === 'pending').length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <p className="text-xs text-gray-500">Avg. Confidence</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#5FAE9B' }}>
                  {(classifications.reduce((s, c) => s + c.confidence, 0) / classifications.length * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {(['all', 'pending', 'approved'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === f ? 'text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                  style={statusFilter === f ? { backgroundColor: '#0F2747' } : undefined}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredClassifications.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.product}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600">
                          Category: {item.suggestedCategory}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600">
                          Brand: {item.suggestedBrand}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#5FAE9B' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: item.confidence > 0.8 ? '#5FAE9B' : item.confidence > 0.5 ? '#E5A100' : '#E55C5C' }}>
                        {(item.confidence * 100).toFixed(0)}%
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full mt-1 inline-block ${item.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'inventory' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-red-100">
                <p className="text-xs text-gray-500">Critical (less than 5 days)</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{inventoryAlerts.filter((i) => i.daysLeft <= 5).length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-yellow-100">
                <p className="text-xs text-gray-500">Warning (5-14 days)</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">{inventoryAlerts.filter((i) => i.daysLeft > 5 && i.daysLeft <= 14).length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-green-100">
                <p className="text-xs text-gray-500">Healthy (14+ days)</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{inventoryAlerts.filter((i) => i.daysLeft > 14).length}</p>
              </div>
            </div>

            <div className="space-y-3">
              {inventoryAlerts
                .sort((a, b) => a.daysLeft - b.daysLeft)
                .map((item) => {
                  const urgency = item.daysLeft <= 5 ? 'critical' : item.daysLeft <= 14 ? 'warning' : 'healthy'
                  return (
                    <div
                      key={item.product}
                      className={`bg-white rounded-xl border p-5 ${urgency === 'critical' ? 'border-red-200' : urgency === 'warning' ? 'border-yellow-200' : 'border-gray-100'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{item.product}</h3>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>Stock: {item.currentStock} units</span>
                            <span>Avg. daily sales: {item.avgDailySales}</span>
                            <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${urgency === 'critical' ? 'text-red-600' : urgency === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                            {item.daysLeft} days
                          </p>
                          <p className="text-[10px] text-gray-400">until stockout</p>
                          {urgency === 'critical' && (
                            <span className="text-[10px] font-semibold text-red-600 mt-1 block">REORDER NOW</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (item.daysLeft / 30) * 100)}%`,
                            backgroundColor: urgency === 'critical' ? '#EF4444' : urgency === 'warning' ? '#F59E0B' : '#5FAE9B',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
