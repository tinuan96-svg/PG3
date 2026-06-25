import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import BundleCard from '@/components/BundleCard'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Bundle Deals | PocketGrocery',
  description: 'Shop our curated bundle deals and save on your favourite Indian and South Asian groceries. Exclusive savings on popular combinations.',
}

async function getBundles() {
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

    if (error) {
      // PGRST205 means the table is missing from schema cache (often because it doesn't exist yet)
      if (error.code === 'PGRST205') {
        console.warn('[bundles] table product_bundles not found, skipping bundles fetch')
        return []
      }
      console.error('[bundles] fetch error:', error)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('[bundles] unexpected error:', err)
    return []
  }
}

export default async function BundlesPage() {
  const bundles = await getBundles()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="py-12 px-4" style={{ background: 'linear-gradient(135deg, #0F2747 0%, #1a3a6b 100%)' }}>
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-4" style={{ backgroundColor: 'rgba(95,174,155,0.2)', color: '#5FAE9B' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Exclusive Bundle Deals
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Save More, Buy Together
            </h1>
            <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: '#A8D5C8' }}>
              Handpicked bundles of your favourite groceries at unbeatable prices. Every bundle is curated to complement your cooking.
            </p>
          </div>
        </section>

        {/* Bundles grid */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          {bundles.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h2 className="text-xl font-bold text-gray-700 mb-2">No bundles available right now</h2>
              <p className="text-gray-500">Check back soon — new deals are added regularly.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900">{bundles.length} Bundle{bundles.length !== 1 ? 's' : ''} Available</h2>
                <span className="text-sm text-gray-500">Sorted by latest</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundles.map((bundle) => (
                  <BundleCard key={bundle.id} bundle={bundle} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
