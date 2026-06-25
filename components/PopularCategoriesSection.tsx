'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getStoreCategories, type StoreCategory } from '@/lib/categories'

const CATEGORY_ICONS: Record<string, string> = {
  'Rice':                   '🍚',
  'Flour & Grains':         '🌾',
  'Spices':                 '🌶️',
  'Curry Masalas':          '🫕',
  'Snacks & Sweets':        '🍪',
  'Pickles & Preserves':    '🫙',
  'Oils & Fats':            '🫒',
  'Pulses & Beans':         '🫘',
  'Ready to Eat':           '🍛',
  'Tea & Coffee':           '☕',
  'Fryums':                 '🥨',
  'Condiments':             '🥫',
  'Desserts':               '🍮',
  'Household & Cleaning':   '🧹',
  'Health & Personal Care': '💊',
}

const CATEGORY_BG: Record<string, string> = {
  'Rice':                   'bg-amber-50 hover:bg-amber-100',
  'Flour & Grains':         'bg-yellow-50 hover:bg-yellow-100',
  'Spices':                 'bg-red-50 hover:bg-red-100',
  'Curry Masalas':          'bg-orange-50 hover:bg-orange-100',
  'Snacks & Sweets':        'bg-pink-50 hover:bg-pink-100',
  'Pickles & Preserves':    'bg-lime-50 hover:bg-lime-100',
  'Oils & Fats':            'bg-yellow-50 hover:bg-yellow-100',
  'Pulses & Beans':         'bg-green-50 hover:bg-green-100',
  'Ready to Eat':           'bg-orange-50 hover:bg-orange-100',
  'Tea & Coffee':           'bg-brown-50 hover:bg-stone-100',
  'Fryums':                 'bg-amber-50 hover:bg-amber-100',
  'Condiments':             'bg-red-50 hover:bg-red-100',
  'Desserts':               'bg-pink-50 hover:bg-pink-100',
  'Household & Cleaning':   'bg-blue-50 hover:bg-blue-100',
  'Health & Personal Care': 'bg-teal-50 hover:bg-teal-100',
}

function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? '🛒'
}

function getCategoryBg(name: string): string {
  return CATEGORY_BG[name] ?? 'bg-gray-50 hover:bg-gray-100'
}

export default function PopularCategoriesSection() {
  const [categories, setCategories] = useState<StoreCategory[]>([])

  useEffect(() => {
    getStoreCategories('pocket-grocery').then(setCategories)
  }, [])

  if (categories.length === 0) return null

  return (
    <section className="py-5 md:py-6" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold" style={{ color: '#0F2747' }}>Shop by Category</h2>
            <p className="text-xs text-gray-500 mt-0.5">Browse our full range of authentic Kerala groceries</p>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold hover:opacity-75 transition-opacity"
            style={{ color: '#5FAE9B' }}
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {categories.map((cat) => (
            <Link
              key={cat.store_category_id}
              href={`/products?category=${encodeURIComponent(cat.store_category_slug)}`}
              className={`group flex flex-col items-center gap-2 rounded-2xl p-3 transition-all duration-200 border border-transparent hover:border-gray-200 hover:shadow-sm ${getCategoryBg(cat.store_category_name)}`}
            >
              <span className="text-2xl leading-none">{getCategoryIcon(cat.store_category_name)}</span>
              <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight group-hover:text-[#0F2747] transition-colors">
                {cat.store_category_name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
