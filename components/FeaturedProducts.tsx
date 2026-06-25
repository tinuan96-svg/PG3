import Link from 'next/link'
import Image from 'next/image'

export default function FeaturedProducts() {
  const products = [
    {
      id: '1',
      name: 'Eastern Cardamom',
      slug: 'eastern-cardamom',
      price: 12.99,
      offerPrice: 9.99,
      image: 'https://images.pexels.com/photos/5946637/pexels-photo-5946637.jpeg',
      coins: 15,
    },
    {
      id: '2',
      name: 'Nirapara Basmati Rice 5kg',
      slug: 'nirapara-basmati-rice',
      price: 18.99,
      offerPrice: null,
      image: 'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg',
      coins: 20,
    },
    {
      id: '3',
      name: 'Double Horse Coconut Oil',
      slug: 'double-horse-coconut-oil',
      price: 15.99,
      offerPrice: 12.99,
      image: 'https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg',
      coins: 18,
    },
    {
      id: '4',
      name: 'Kitchen Treasures Garam Masala',
      slug: 'kitchen-treasures-garam-masala',
      price: 4.99,
      offerPrice: null,
      image: 'https://images.pexels.com/photos/4198943/pexels-photo-4198943.jpeg',
      coins: 8,
    },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600">
              Popular Kerala groceries loved by our customers
            </p>
          </div>
          <Link
            href="/products"
            className="hidden md:block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <div className="relative h-48 bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.offerPrice && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    SAVE £{(product.price - product.offerPrice).toFixed(2)}
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                  <span>{product.coins}</span>
                  <span className="text-xs">coins</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center space-x-2">
                  {product.offerPrice ? (
                    <>
                      <span className="text-xl font-bold text-primary-600">
                        £{product.offerPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        £{product.price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-gray-900">
                      £{product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">In Stock</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/products"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
