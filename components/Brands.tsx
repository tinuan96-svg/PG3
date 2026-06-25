import Link from 'next/link'

export default function Brands() {
  const brands = [
    { name: 'Eastern' },
    { name: 'Nirapara' },
    { name: 'Double Horse' },
    { name: 'Brahmins' },
    { name: 'Kitchen Treasures' },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Popular Kerala Brands
          </h2>
          <p className="text-lg text-gray-600">
            Trusted brands for authentic Kerala groceries
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={`/products?brand=${encodeURIComponent(brand.name)}`}
              className="bg-gray-50 border-2 border-gray-200 rounded-xl p-8 text-center hover:border-primary-600 hover:bg-primary-50 transition-all transform hover:-translate-y-1"
            >
              <h3 className="text-lg font-bold text-gray-900">{brand.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
