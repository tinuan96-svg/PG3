import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'About Us | PocketGrocery',
  description: 'Learn about PocketGrocery — your trusted source for authentic Kerala groceries delivered across the UK by Matha Grocers Ltd.',
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#0F2747] mb-4">About PocketGrocery</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Bringing the authentic taste of Kerala to every corner of the United Kingdom.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#0F2747] mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              PocketGrocery was born from a simple idea: every family in the UK deserves easy access to
              authentic Kerala groceries — the spices, rice, pickles, and pantry staples that make a house
              feel like home.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              We are operated by <strong className="text-[#0F2747]">Matha Grocers Ltd</strong>, a UK-registered
              company dedicated to sourcing the finest quality Kerala and South Indian grocery products and
              delivering them directly to your door.
            </p>
            <p className="text-gray-600 leading-relaxed">
              From premium Matta rice to hand-picked spices and traditional pickles, every product in our
              range has been carefully selected to meet the high standards expected by the South Indian
              community in the UK.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                <svg className="w-6 h-6" fill="none" stroke="#5FAE9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0F2747] mb-2">Authentic Products</h3>
              <p className="text-sm text-gray-500">Genuine Kerala brands sourced directly from trusted suppliers.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                <svg className="w-6 h-6" fill="none" stroke="#5FAE9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0F2747] mb-2">Next Day Delivery</h3>
              <p className="text-sm text-gray-500">Order before 4 PM for next day delivery across the UK.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                <svg className="w-6 h-6" fill="none" stroke="#5FAE9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0F2747] mb-2">Community First</h3>
              <p className="text-sm text-gray-500">Built by and for the South Indian community in the UK.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#0F2747] mb-4">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-[#0F2747] mb-1">Registered Company</p>
                <p>Matha Grocers Ltd</p>
                <p>Company No: 17063885</p>
              </div>
              <div>
                <p className="font-semibold text-[#0F2747] mb-1">Registered Address</p>
                <p>52 Oldfields Road, Sutton</p>
                <p>United Kingdom, SM1 2NU</p>
              </div>
              <div>
                <p className="font-semibold text-[#0F2747] mb-1">Email</p>
                <a href="mailto:info@pocketgrocery.com" className="hover:underline" style={{ color: '#5FAE9B' }}>info@pocketgrocery.com</a>
              </div>
              <div>
                <p className="font-semibold text-[#0F2747] mb-1">Phone</p>
                <a href="tel:079826003" className="hover:underline" style={{ color: '#5FAE9B' }}>079826003</a>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/products"
              className="inline-block text-white font-semibold px-8 py-3 rounded-xl transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0F2747' }}
            >
              Shop Now
            </Link>
            <Link
              href="/contact"
              className="inline-block ml-4 text-[#0F2747] font-semibold px-8 py-3 rounded-xl border-2 transition-colors hover:bg-gray-50"
              style={{ borderColor: '#0F2747' }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
