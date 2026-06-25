import Link from 'next/link'
import Image from 'next/image'

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: '#0F2747', minHeight: '400px' }}>
      <div className="absolute inset-0 opacity-20">
        <Image
          src="https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg"
          alt="Kerala groceries background"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: 'rgba(95,174,155,0.2)', color: '#5FAE9B', border: '1px solid #5FAE9B' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Next Day Delivery Across UK
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
              Authentic Kerala<br />
              <span style={{ color: '#5FAE9B' }}>Groceries Online</span>
            </h1>
            <p className="text-gray-300 text-lg mb-6 max-w-md">
              Shop 1000+ genuine Kerala products. Nirapara, Eastern, Double Horse, Brahmins and more.
              Delivered next day across the UK.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#5FAE9B' }}
              >
                Shop Now
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/kerala-groceries-uk"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-colors"
              >
                Kerala Specialties
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">1000+</p>
                <p className="text-xs text-gray-400">Products</p>
              </div>
              <div className="w-px h-8 bg-gray-600" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">£40+</p>
                <p className="text-xs text-gray-400">Free Delivery</p>
              </div>
              <div className="w-px h-8 bg-gray-600" />
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: '#5FAE9B' }}>Next Day</p>
                <p className="text-xs text-gray-400">Delivery</p>
              </div>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-3">
            {[
              { label: 'Spices & Masala', href: '/categories/spices', img: 'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg' },
              { label: 'Rice & Grains', href: '/categories/rice', img: 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg' },
              { label: 'Snacks & Sweets', href: '/categories/snacks', img: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg' },
              { label: 'Oil & Ghee', href: '/categories/oil', img: 'https://images.pexels.com/photos/725998/pexels-photo-725998.jpeg' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative rounded-xl overflow-hidden group"
                style={{ height: '140px' }}
              >
                <Image
                  src={item.img}
                  alt={`${item.label} - Kerala groceries UK`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
                <p className="absolute bottom-2 left-2 text-white text-xs font-semibold">{item.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
