import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import FeaturedProducts from '@/components/FeaturedProducts'

export const metadata: Metadata = {
  title: 'Kerala Groceries UK | Authentic Indian Groceries Online with Next Day Delivery',
  description: 'Buy authentic Kerala groceries online in UK. Fast next day delivery on premium spices, rice, pickles, and snacks. Order before 4 PM for delivery tomorrow. Free delivery over £40.',
  keywords: 'Kerala groceries UK, buy Kerala groceries online UK, Indian groceries UK, Kerala spices UK delivery, Kerala food UK',
}

export default function KeralaGroceriesUKPage() {
  return (
    <div className="bg-white">
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Kerala Groceries UK - Your Source for Authentic Indian Products
          </h1>
          <p className="text-xl text-primary-50 mb-8 leading-relaxed max-w-3xl">
            Welcome to PocketGrocery, the UK's premier online destination for authentic Kerala groceries.
            We bring you the finest selection of traditional Kerala spices, rice, pickles, snacks, and more,
            delivered directly to your door with our fast next day delivery service.
          </p>
          <Link
            href="/products"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-all"
          >
            Shop Kerala Groceries
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Why Choose PocketGrocery for Kerala Groceries in the UK?
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                At PocketGrocery, we understand the importance of authentic Kerala ingredients for your traditional
                recipes. That's why we source only the finest quality products from trusted Kerala brands including
                Eastern, Nirapara, Double Horse, Brahmins, and Kitchen Treasures.
              </p>
              <p>
                Whether you're looking for aromatic Kerala spices, premium basmati rice, traditional pickles,
                or your favorite Kerala snacks, we have everything you need to bring the authentic taste of Kerala
                to your UK kitchen.
              </p>
            </div>
          </div>
          <div className="relative h-80 rounded-xl overflow-hidden">
            <Image
              src="https://images.pexels.com/photos/4198943/pexels-photo-4198943.jpeg"
              alt="Kerala Spices"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Popular Kerala Grocery Categories
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Kerala Spices</h3>
              <p className="text-gray-600 mb-4">
                Premium quality cardamom, pepper, turmeric, coriander, and traditional spice blends
              </p>
              <Link href="/categories/kerala-spices" className="text-primary-600 font-semibold">
                Shop Spices →
              </Link>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Rice & Flours</h3>
              <p className="text-gray-600 mb-4">
                Basmati rice, sona masoori, Kerala rice, rice flour, and wheat flour varieties
              </p>
              <Link href="/categories/rice" className="text-primary-600 font-semibold">
                Shop Rice →
              </Link>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pickles & Snacks</h3>
              <p className="text-gray-600 mb-4">
                Authentic mango pickle, lime pickle, banana chips, and traditional Kerala snacks
              </p>
              <Link href="/categories/pickles" className="text-primary-600 font-semibold">
                Shop Pickles →
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Fast Next Day Delivery Across the UK
          </h2>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Order Before 4 PM for Next Day Delivery
                </h3>
                <p className="text-gray-600 mb-4">
                  We understand that when you're cooking authentic Kerala recipes, you need your ingredients fast.
                  That's why we offer guaranteed next day delivery when you order before 4 PM.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Free Delivery Over £40
                </h3>
                <p className="text-gray-600 mb-4">
                  Enjoy FREE next day delivery on all orders over £40. Orders under £40 have a small £4.99
                  delivery charge. We deliver across the UK including London, Manchester, Birmingham, and beyond.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Earn Pocket Coins on Every Purchase
          </h2>
          <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-8">
            <p className="text-gray-700 mb-4 leading-relaxed">
              Shop smarter with our Pocket Coin rewards program. Every time you buy Kerala groceries from
              PocketGrocery, you earn Pocket Coins that you can use as discount on your next order.
              1 Pocket Coin = £0.01 discount. The more you shop, the more you save!
            </p>
            <Link href="/wallet" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
              Learn More About Pocket Coins
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Featured Kerala Products
          </h2>
          <FeaturedProducts />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Frequently Asked Questions About Kerala Groceries UK
        </h2>
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Where can I buy Kerala groceries in the UK?
            </h3>
            <p className="text-gray-600">
              You can buy authentic Kerala groceries online at PocketGrocery.com with fast next day delivery
              across the UK. We offer the widest selection of Kerala products from trusted brands.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Do you deliver Kerala groceries to all UK cities?
            </h3>
            <p className="text-gray-600">
              Yes! We deliver Kerala groceries across the entire UK including London, Manchester, Birmingham,
              Leeds, Glasgow, Edinburgh, and all other cities with our next day delivery service.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              What Kerala brands do you stock?
            </h3>
            <p className="text-gray-600">
              We stock all major Kerala brands including Eastern, Nirapara, Double Horse, Brahmins, and
              Kitchen Treasures, ensuring you get authentic Kerala products every time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
