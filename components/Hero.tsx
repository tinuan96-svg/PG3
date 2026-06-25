import Link from 'next/link'
import Image from 'next/image'

export default function Hero() {
  return (
    <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Authentic Kerala Groceries Delivered Fast
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-50 leading-relaxed">
              Order before 4 PM for next day delivery across the UK. Premium spices, rice, snacks and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 text-center shadow-lg"
              >
                Shop Now
              </Link>
              <Link
                href="/wallet"
                className="bg-primary-800 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-900 transition-all transform hover:scale-105 text-center border-2 border-white"
              >
                Earn Pocket Coins
              </Link>
            </div>
          </div>

          <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg"
              alt="Kerala Groceries and Spices"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
    </div>
  )
}
