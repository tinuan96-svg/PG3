'use client'

import { useState } from 'react'
import Link from 'next/link'

const pricingData = [
  { product: 'Nirapara Rose Matta Rice 5kg', ourPrice: 8.99, competitors: [{ name: 'Store A', price: 9.49 }, { name: 'Store B', price: 9.99 }, { name: 'Store C', price: 8.79 }], avgMarket: 9.42, position: 'below' as const, suggested: 9.29 },
  { product: 'Eastern Sambar Powder 100g', ourPrice: 1.89, competitors: [{ name: 'Store A', price: 2.19 }, { name: 'Store B', price: 1.99 }, { name: 'Store C', price: 2.29 }], avgMarket: 2.16, position: 'below' as const, suggested: 2.09 },
  { product: 'Haldiram Banana Chips 200g', ourPrice: 1.99, competitors: [{ name: 'Store A', price: 1.79 }, { name: 'Store B', price: 1.89 }, { name: 'Store C', price: 2.19 }], avgMarket: 1.96, position: 'at' as const, suggested: 1.99 },
  { product: 'Kerala Coconut Oil 500ml', ourPrice: 4.99, competitors: [{ name: 'Store A', price: 5.49 }, { name: 'Store B', price: 5.99 }, { name: 'Store C', price: 4.49 }], avgMarket: 5.32, position: 'below' as const, suggested: 5.19 },
  { product: 'Double Horse Jeerakasala Rice 2kg', ourPrice: 6.99, competitors: [{ name: 'Store A', price: 7.49 }, { name: 'Store B', price: 6.99 }, { name: 'Store C', price: 7.29 }], avgMarket: 7.26, position: 'below' as const, suggested: 7.19 },
  { product: 'Brahmins Fish Curry Masala', ourPrice: 1.49, competitors: [{ name: 'Store A', price: 1.79 }, { name: 'Store B', price: 1.69 }, { name: 'Store C', price: 1.59 }], avgMarket: 1.69, position: 'below' as const, suggested: 1.59 },
  { product: 'Melam Kashmiri Chilli Powder 400g', ourPrice: 3.49, competitors: [{ name: 'Store A', price: 3.29 }, { name: 'Store B', price: 3.49 }, { name: 'Store C', price: 3.69 }], avgMarket: 3.49, position: 'at' as const, suggested: 3.49 },
  { product: 'Jayanti Pure Ghee 500ml', ourPrice: 6.49, competitors: [{ name: 'Store A', price: 6.99 }, { name: 'Store B', price: 7.49 }, { name: 'Store C', price: 5.99 }], avgMarket: 6.82, position: 'below' as const, suggested: 6.79 },
  { product: 'Milma Cardamom Tea 250g', ourPrice: 3.99, competitors: [{ name: 'Store A', price: 3.49 }, { name: 'Store B', price: 3.29 }, { name: 'Store C', price: 3.69 }], avgMarket: 3.49, position: 'above' as const, suggested: 3.59 },
]

export default function AIPricingPage() {
  const [filter, setFilter] = useState<'all' | 'below' | 'at' | 'above'>('all')

  const filtered = filter === 'all' ? pricingData : pricingData.filter((p) => p.position === filter)
  const belowCount = pricingData.filter((p) => p.position === 'below').length
  const atCount = pricingData.filter((p) => p.position === 'at').length
  const aboveCount = pricingData.filter((p) => p.position === 'above').length
  const potentialRevenue = pricingData.reduce((sum, p) => sum + Math.max(0, p.suggested - p.ourPrice), 0)

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
              <h1 className="text-2xl font-bold" style={{ color: '#0F2747' }}>AI Price Intelligence</h1>
              <p className="text-sm text-gray-500 mt-0.5">Competitor price monitoring and pricing recommendations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Products Tracked</p>
            <p className="text-2xl font-bold" style={{ color: '#0F2747' }}>{pricingData.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Below Market</p>
            <p className="text-2xl font-bold text-green-600">{belowCount}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Opportunity to increase</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">At Market</p>
            <p className="text-2xl font-bold text-gray-600">{atCount}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Potential Extra Revenue</p>
            <p className="text-2xl font-bold" style={{ color: '#5FAE9B' }}>£{potentialRevenue.toFixed(2)}/unit</p>
          </div>
        </div>

        <div className="flex gap-2">
          {(['all', 'below', 'at', 'above'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              style={filter === f ? { backgroundColor: '#0F2747' } : undefined}
            >
              {f === 'all' ? 'All' : f === 'below' ? 'Below Market' : f === 'at' ? 'At Market' : 'Above Market'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Product</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Our Price</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Avg. Market</th>
                  <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Position</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Competitors</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3">AI Suggested</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.product} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800">{item.product}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-semibold" style={{ color: '#0F2747' }}>£{item.ourPrice.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm text-gray-600">£{item.avgMarket.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.position === 'below' ? 'bg-green-50 text-green-700' : item.position === 'above' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.position === 'below' ? 'Below' : item.position === 'above' ? 'Above' : 'At Market'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-col gap-0.5">
                        {item.competitors.map((c) => (
                          <span key={c.name} className="text-[10px] text-gray-400">{c.name}: £{c.price.toFixed(2)}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold" style={{ color: item.suggested > item.ourPrice ? '#5FAE9B' : '#0F2747' }}>
                        £{item.suggested.toFixed(2)}
                      </span>
                      {item.suggested > item.ourPrice && (
                        <p className="text-[10px] text-green-600 mt-0.5">+£{(item.suggested - item.ourPrice).toFixed(2)}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
