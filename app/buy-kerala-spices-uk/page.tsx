import { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingBag, Star, ShieldCheck, Truck, ChevronRight } from 'lucide-react'
import FeaturedProducts from '@/components/FeaturedProducts'

export const metadata: Metadata = {
  title: 'Buy Kerala Spices UK - Authentic Malabar Spices Online | PocketGrocery',
  description: 'Buy premium Kerala spices online in the UK. Authentic cardamom, black pepper, turmeric, and traditional Malabar spice blends. Fast next-day delivery nationwide.',
  keywords: ['buy kerala spices uk', 'malabar spices online uk', 'authentic indian spices uk', 'kerala curry powder uk', 'cardamom pepper turmeric uk'],
}

export default function BuyKeralaSpicesUKPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="text-white py-20" style={{ backgroundColor: '#0F2747' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold mb-6 border border-white/20">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              100% Authentic Malabar Source
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Premium Kerala Spices <br /> Delivered Across the UK
            </h1>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              Experience the true aroma of Kerala with our hand-picked selection of authentic spices. From the hills of Idukki to your kitchen in the UK.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products?category=spices-masalas" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90" style={{ backgroundColor: '#5FAE9B' }}>
                <ShoppingBag className="h-5 w-5" />
                Shop Spices
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {[
            { icon: ShieldCheck, title: 'Authentic Quality', desc: 'No fillers, no artificial colors. Just pure, potent spices sourced directly from Kerala manufacturers.' },
            { icon: Truck, title: 'Next Day Delivery', desc: 'Order before 4 PM and receive your spices the very next day, fresh and ready for your next curry.' },
            { icon: Star, title: 'Traditional Blends', desc: 'Authentic Meat Masala, Fish Masala, and Sambar Powder made to traditional Kerala recipes.' }
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 p-8 rounded-3xl space-y-4 border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <item.icon className="w-6 h-6" style={{ color: '#5FAE9B' }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-12">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-extrabold text-gray-900">Popular Kerala Spices</h2>
            <Link href="/products?category=spices-masalas" className="text-[#5FAE9B] font-bold hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <FeaturedProducts />
        </div>

        <div className="mt-32 grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#5FAE9B]/10 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-6 prose prose-slate max-w-none">
              <h2 className="text-4xl font-extrabold text-gray-900 !mt-0">The Malabar Spice Heritage</h2>
              <p className="text-gray-600 leading-relaxed">
                Malabar has been the spice capital of the world for centuries. At PocketGrocery, we take pride in maintaining this heritage by bringing authentic Kerala spices to the UK community.
              </p>
              <div className="space-y-4 not-prose">
                {[
                  'Wayand Black Pepper - Bold and pungent',
                  'Idukki Green Cardamom - Hand-picked and aromatic',
                  'Alleppey Turmeric - High curcumin content',
                  'Authentic Kerala Garam Masala - Roasted & ground'
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-800 font-medium">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5FAE9B' }} />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Spices 1" className="rounded-2xl w-full h-48 object-cover shadow-md" />
            <img src="https://images.pexels.com/photos/4198943/pexels-photo-4198943.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Spices 2" className="rounded-2xl w-full h-48 object-cover shadow-md mt-8" />
            <img src="https://images.pexels.com/photos/4198370/pexels-photo-4198370.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Spices 3" className="rounded-2xl w-full h-48 object-cover shadow-md" />
            <img src="https://images.pexels.com/photos/674483/pexels-photo-674483.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Spices 4" className="rounded-2xl w-full h-48 object-cover shadow-md mt-8" />
          </div>
        </div>

        <div className="mt-32 bg-[#0F2747] rounded-[40px] p-8 md:p-16 text-center text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5FAE9B]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 relative z-10">Fresh Spices for Your Next Meal</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto relative z-10">
            Don't settle for supermarket alternatives. Get the real deal delivered to your door tomorrow.
          </p>
          <Link href="/products?category=spices-masalas" className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl font-bold text-xl transition-all hover:scale-105 shadow-xl relative z-10" style={{ backgroundColor: '#5FAE9B' }}>
            Start Shopping
            <ChevronRight className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </div>
  )
}
