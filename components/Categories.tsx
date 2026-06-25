import Link from 'next/link'
import { CATEGORIES } from '@/lib/products-data'

const CATEGORY_IMAGES: Record<string, string> = {
  'rice':          'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg',
  'dals':          'https://images.pexels.com/photos/5765/food-healthy-vegetables-herbs.jpg',
  'flours':        'https://images.pexels.com/photos/5904056/pexels-photo-5904056.jpeg',
  'spices':        'https://images.pexels.com/photos/4198943/pexels-photo-4198943.jpeg',
  'masalas':       'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg',
  'oils':          'https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg',
  'pickles':       'https://images.pexels.com/photos/6605408/pexels-photo-6605408.jpeg',
  'essentials':    'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg',
  'snacks':        'https://images.pexels.com/photos/4197439/pexels-photo-4197439.jpeg',
  'sweets':        'https://images.pexels.com/photos/5848575/pexels-photo-5848575.jpeg',
  'tea-coffee':    'https://images.pexels.com/photos/4198370/pexels-photo-4198370.jpeg',
  'fryums':        'https://images.pexels.com/photos/4110253/pexels-photo-4110253.jpeg',
  'instant-foods': 'https://images.pexels.com/photos/4110252/pexels-photo-4110252.jpeg',
  'vegetables':    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
  'fruits':        'https://images.pexels.com/photos/4110254/pexels-photo-4110254.jpeg',
  'household':     'https://images.pexels.com/photos/4198371/pexels-photo-4198371.jpeg',
  'personal-care': 'https://images.pexels.com/photos/4198943/pexels-photo-4198943.jpeg',
}

const FEATURED_SLUGS = ['rice', 'spices', 'masalas', 'pickles', 'snacks', 'oils']

export default function Categories() {
  const featured = CATEGORIES.filter((c) => FEATURED_SLUGS.includes(c.slug))

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600">
            Browse our wide selection of authentic Kerala groceries
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {featured.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
              className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <div className="relative h-32 bg-gray-100 flex items-center justify-center">
                {CATEGORY_IMAGES[category.slug] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${CATEGORY_IMAGES[category.slug]}?auto=compress&cs=tinysrgb&w=400`}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-4xl">{category.icon}</span>
                )}
              </div>
              <div className="p-4 text-center">
                <h3 className="font-semibold text-gray-900 group-hover:text-[#0F2747] transition-colors">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
