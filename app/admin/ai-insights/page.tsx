'use client'

import { useState } from 'react'
import Link from 'next/link'

const salesData = {
  topProducts: [
    { name: 'Nirapara Rose Matta Rice 5kg', sold: 342, revenue: 3073.58, trend: 'up' },
    { name: 'Eastern Sambar Powder 100g', sold: 289, revenue: 546.21, trend: 'up' },
    { name: 'Haldiram Banana Chips 200g', sold: 256, revenue: 509.44, trend: 'stable' },
    { name: 'Kerala Coconut Oil 500ml', sold: 198, revenue: 988.02, trend: 'up' },
    { name: 'Brahmins Fish Curry Masala', sold: 187, revenue: 278.63, trend: 'down' },
  ],
  slowProducts: [
    { name: 'Brahmins Aviyal Curry Mix', sold: 12, revenue: 20.28, daysInStock: 45 },
    { name: 'Eastern Garam Masala 100g', sold: 18, revenue: 39.42, daysInStock: 38 },
    { name: 'Priya Lime Pickle 300g', sold: 23, revenue: 50.37, daysInStock: 32 },
  ],
  categories: [
    { name: 'Rice & Flour', revenue: 8450, orders: 620, margin: 22 },
    { name: 'Spices & Masalas', revenue: 5230, orders: 890, margin: 35 },
    { name: 'Snacks & Sweets', revenue: 3890, orders: 540, margin: 28 },
    { name: 'Pickles & Chutneys', revenue: 2340, orders: 320, margin: 31 },
    { name: 'Oils & Ghee', revenue: 4120, orders: 280, margin: 18 },
  ],
  trendingSearches: [
    { query: 'matta rice', count: 156 },
    { query: 'banana chips', count: 134 },
    { query: 'sambar powder', count: 98 },
    { query: 'coconut oil', count: 87 },
    { query: 'biryani rice', count: 76 },
    { query: 'fish curry masala', count: 65 },
    { query: 'payasam mix', count: 54 },
    { query: 'appam podi', count: 48 },
  ],
  patterns: [
    { pattern: 'Weekend spike in snack orders (Fri-Sun +40%)', type: 'timing' },
    { pattern: 'Rice purchases often paired with coconut oil', type: 'basket' },
    { pattern: 'New customers prefer starter bundles', type: 'behaviour' },
    { pattern: 'Festival seasons drive 3x spice sales', type: 'seasonal' },
  ],
}

export default function AIInsightsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#0F2747' }}>AI Sales Insights</h1>
                <p className="text-sm text-gray-500 mt-0.5">AI-powered performance analysis and trend detection</p>
              </div>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: '£24,030', change: '+12.4%', up: true },
            { label: 'Orders', value: '2,650', change: '+8.2%', up: true },
            { label: 'Avg. Basket', value: '£9.07', change: '+3.1%', up: true },
            { label: 'Return Rate', value: '1.2%', change: '-0.3%', up: false },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: '#0F2747' }}>{stat.value}</p>
              <p className={`text-xs font-medium mt-1 ${stat.up ? 'text-green-600' : 'text-red-500'}`}>
                {stat.change} vs prev. period
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4" style={{ color: '#0F2747' }}>Top Selling Products</h2>
            <div className="space-y-3">
              {salesData.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white" style={{ backgroundColor: i < 3 ? '#5FAE9B' : '#CBD5E1' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sold} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: '#0F2747' }}>£{p.revenue.toFixed(2)}</p>
                    <p className={`text-[10px] font-medium ${p.trend === 'up' ? 'text-green-600' : p.trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                      {p.trend === 'up' ? 'Trending up' : p.trend === 'down' ? 'Declining' : 'Stable'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4" style={{ color: '#0F2747' }}>Category Performance</h2>
            <div className="space-y-4">
              {salesData.categories.map((cat) => {
                const maxRevenue = Math.max(...salesData.categories.map((c) => c.revenue))
                const width = (cat.revenue / maxRevenue) * 100
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                      <span className="text-sm font-semibold" style={{ color: '#0F2747' }}>£{cat.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${width}%`, backgroundColor: '#5FAE9B' }} />
                    </div>
                    <div className="flex gap-4 mt-1 text-[10px] text-gray-400">
                      <span>{cat.orders} orders</span>
                      <span>{cat.margin}% margin</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4" style={{ color: '#0F2747' }}>Trending Searches</h2>
            <div className="space-y-2.5">
              {salesData.trendingSearches.map((s, i) => (
                <div key={s.query} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <span className="flex-1 text-sm text-gray-700">{s.query}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#5FAE9B20', color: '#5FAE9B' }}>
                    {s.count} searches
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4" style={{ color: '#0F2747' }}>Slow Moving Stock</h2>
            <div className="space-y-4">
              {salesData.slowProducts.map((p) => (
                <div key={p.name} className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>Only {p.sold} sold</span>
                    <span>{p.daysInStock}+ days in stock</span>
                  </div>
                  <p className="text-[10px] text-red-600 font-medium mt-1">Consider promotion or price reduction</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4" style={{ color: '#0F2747' }}>Purchase Patterns</h2>
            <div className="space-y-3">
              {salesData.patterns.map((p) => (
                <div key={p.pattern} className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50">
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: p.type === 'timing' ? '#3B82F6' : p.type === 'basket' ? '#5FAE9B' : p.type === 'seasonal' ? '#F59E0B' : '#0F2747' }}
                  />
                  <p className="text-sm text-gray-700">{p.pattern}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
