import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getStorePageData } from '@/lib/stores'
import StoreProductGrid from '@/components/StoreProductGrid'

interface Props {
  params: { slug: string }
}

export const dynamicParams = false

export async function generateStaticParams() {
  return [{ slug: 'dummy' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getStorePageData(params.slug, { pageSize: 0 })
  if (!data) return { title: 'Store Not Found' }
  return {
    title: `${data.header.name} | Authentic Kerala Groceries UK`,
    description: `Shop ${data.header.name} — authentic Kerala groceries delivered across the UK. Browse rice, spices, pickles, snacks and more.`,
  }
}

export default async function StorePage({ params }: Props) {
  // Single RPC call: header + categories + first page of products
  const data = await getStorePageData(params.slug, { sort: 'popular', pageSize: 20 })

  if (!data) notFound()

  const { header, categories, products, total_count } = data
  const currency = header.default_currency ?? 'GBP'
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'
  const headerColor =
    header.color === 'green'
      ? '#16a34a'
      : header.color === 'blue'
      ? '#2563eb'
      : '#0f766e'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ backgroundColor: headerColor }}
            >
              {header.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{header.name}</h1>
              <p className="text-gray-500 text-sm mt-1">
                Authentic Kerala groceries &mdash; delivered across the UK
              </p>
              {header.show_stock_levels && (
                <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Live stock levels
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid with Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StoreProductGrid
          storeSlug={params.slug}
          categories={categories}
          initialProducts={products}
          initialTotal={total_count}
          currencySymbol={currencySymbol}
          maxDisplayStock={header.max_display_stock ?? 5}
          showStockLevels={header.show_stock_levels ?? true}
        />
      </div>
    </div>
  )
}
