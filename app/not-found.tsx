import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div
            className="w-24 h-24 rounded-3xl mx-auto mb-8 flex items-center justify-center"
            style={{ backgroundColor: '#0F2747' }}
          >
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <p className="text-6xl font-black mb-4" style={{ color: '#0F2747' }}>404</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
          <p className="text-gray-500 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/"
              className="inline-block text-white font-semibold px-8 py-3 rounded-xl transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0F2747' }}
            >
              Back to Home
            </Link>
            <Link
              href="/products"
              className="inline-block font-semibold px-8 py-3 rounded-xl border-2 transition-colors hover:bg-gray-50"
              style={{ color: '#0F2747', borderColor: '#0F2747' }}
            >
              Shop Products
            </Link>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-500 font-medium mb-4">Popular categories</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: 'Spices', href: '/kerala-spices-uk' },
                { label: 'Rice', href: '/kerala-rice-uk' },
                { label: 'Snacks', href: '/kerala-snacks-online-uk' },
                { label: 'Groceries', href: '/kerala-groceries-uk' },
                { label: 'All Products', href: '/products' },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm px-4 py-2 bg-white border border-gray-200 rounded-full text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-200">
        <Link href="/" className="font-semibold" style={{ color: '#0F2747' }}>PocketGrocery</Link>
        {' '}&mdash;{' '}
        <Link href="/contact" className="hover:underline">Contact Us</Link>
        {' '}&middot;{' '}
        <Link href="/legal/shipping-policy" className="hover:underline">Delivery Info</Link>
      </footer>
    </div>
  )
}
