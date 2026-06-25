import Link from 'next/link'
import { CATEGORIES } from '@/lib/products-data'

const CATEGORY_COLORS: Record<string, string> = {
  'rice':          '#FFF8E8',
  'dals':          '#FFF8F0',
  'flours':        '#F0F8FF',
  'spices':        '#FFF0F0',
  'masalas':       '#FFF5E8',
  'oils':          '#FFFFF0',
  'pickles':       '#F0FFF4',
  'essentials':    '#F8F8F8',
  'snacks':        '#FFF5E0',
  'sweets':        '#FFF0F8',
  'tea-coffee':    '#F5F0FF',
  'fryums':        '#FFFAF0',
  'instant-foods': '#F0FFFF',
  'vegetables':    '#F0FFF0',
  'fruits':        '#FFF8F0',
  'household':     '#F0F4FF',
  'personal-care': '#FFF0F5',
}

export default function CategoryGrid() {
  return (
    <section className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#0F2747' }}>
            Shop by Category
          </h2>
          <Link href="/products" className="text-sm font-medium hover:opacity-75 transition-opacity" style={{ color: '#5FAE9B' }}>
            View All &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${encodeURIComponent(cat.slug)}`}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:shadow-md transition-all duration-200 group"
              style={{ backgroundColor: CATEGORY_COLORS[cat.slug] ?? '#F8F8F8' }}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
              <span className="text-xs font-medium text-center leading-tight" style={{ color: '#0F2747' }}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
