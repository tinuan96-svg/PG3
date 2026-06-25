import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import BundleCard from './BundleCard'

async function getActiveBundles() {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data, error } = await supabase
      .from('product_bundles')
      .select('id, name, slug, description, image_url, original_price, bundle_price, savings_amount, coin_reward')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4)

    if (error) {
      if (error.code !== 'PGRST205') {
        console.error('[bundles] fetch error:', error)
      }
      return []
    }
    return data ?? []
  } catch (err) {
    return []
  }
}

export default async function BundlesSection() {
  const bundles = await getActiveBundles()
  if (bundles.length === 0) return null

  return (
    <section className="py-12 px-4" style={{ backgroundColor: '#F8FBFA' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5FAE9B' }}>Save More</p>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#0F2747' }}>Bundle Deals</h2>
            <p className="text-sm text-gray-500 mt-1">Curated combinations at unbeatable prices</p>
          </div>
          <Link
            href="/bundles"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: '#5FAE9B' }}
          >
            View all bundles
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/bundles"
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: '#5FAE9B' }}
          >
            View all bundles
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
