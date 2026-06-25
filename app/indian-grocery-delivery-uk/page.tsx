import { Metadata } from 'next'
import Link from 'next/link'
import { Truck, Clock, MapPin, Package, ShoppingCart, ChevronRight } from 'lucide-react'
import FeaturedProducts from '@/components/FeaturedProducts'

export const metadata: Metadata = {
  title: 'Indian Grocery Delivery UK - Fast Nationwide Shipping | PocketGrocery',
  description: 'Fast Indian grocery delivery across the UK. Order authentic Kerala and Indian products online with next-day delivery. Free shipping over £40 to all UK addresses.',
  keywords: ['indian grocery delivery uk', 'indian food delivery', 'online indian groceries', 'indian grocery home delivery', 'buy indian groceries online uk'],
}

export default function IndianGroceryDeliveryUKPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="text-white py-20" style={{ backgroundColor: '#0F2747' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Indian Grocery Delivery Across the UK
            </h1>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              Fast, reliable delivery of authentic Indian and Kerala groceries to your doorstep. Next-day delivery available nationwide with free shipping on orders over £40.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90" style={{ backgroundColor: '#5FAE9B' }}>
                <ShoppingCart className="h-5 w-5" />
                Shop Now
              </Link>
              <Link href="/categories" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all">
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Strip */}
      <div className="bg-gray-50 border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Next Day Delivery</h3>
              <p className="text-sm text-gray-500">Order before 4 PM</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                <Truck className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">Free Over £40</h3>
              <p className="text-sm text-gray-500">Nationwide shipping</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                <MapPin className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900">UK-Wide Coverage</h3>
              <p className="text-sm text-gray-500">Every postcode covered</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
                <Package className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900">Secure Packaging</h3>
              <p className="text-sm text-gray-500">Arrives fresh & safe</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">How Our Indian Grocery Delivery Works</h2>
            <div className="space-y-8">
              {[
                { step: 1, title: 'Browse & Select', desc: 'Choose from our extensive range of 500+ authentic Indian and Kerala groceries online.' },
                { step: 2, title: 'Secure Checkout', desc: 'Complete your order with our secure payment system (Card, Apple Pay, Google Pay).' },
                { step: 3, title: 'Fast Delivery', desc: 'Receive your fresh groceries at your doorstep the very next day.' }
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ backgroundColor: '#0F2747' }}>
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-100 rounded-3xl h-[400px] overflow-hidden relative shadow-inner">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src="https://images.pexels.com/photos/6169668/pexels-photo-6169668.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Grocery Delivery" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">Featured Essentials</h2>
        <FeaturedProducts />

        <div className="mt-24 space-y-16">
          <section className="bg-gray-50 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">UK-Wide Coverage</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { region: 'England', cities: 'London, Manchester, Birmingham, Leeds, Liverpool, Bristol, Newcastle, Sheffield' },
                { region: 'Scotland', cities: 'Edinburgh, Glasgow, Aberdeen, Dundee, Inverness, Perth, Stirling' },
                { region: 'Wales', cities: 'Cardiff, Swansea, Newport, Wrexham, Bangor, St Davids' },
                { region: 'Northern Ireland', cities: 'Belfast, Derry, Lisburn, Newry, Armagh, Omagh' }
              ].map((r) => (
                <div key={r.region} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: '#5FAE9B' }} />
                    {r.region}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{r.cities}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="prose prose-slate max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose PocketGrocery for Indian Grocery Home Delivery?</h2>
            <div className="grid md:grid-cols-2 gap-12 not-prose">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Authentic Kerala Specialties</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  We specialize in authentic Kerala products that are hard to find in local supermarkets. From Matta rice to freshly ground Malabar spices, we bring the true taste of home to your kitchen in the UK.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Next-Day Reliability</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Order by 4 PM and get your groceries the next day. Our logistics network is optimized for speed and reliability, ensuring your meal planning is never interrupted.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-20 text-center">
          <Link href="/products" className="inline-flex items-center gap-2 text-lg font-bold hover:underline" style={{ color: '#0F2747' }}>
            Browse our full catalog
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
