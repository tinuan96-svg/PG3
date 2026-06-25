import Link from 'next/link'
import Image from 'next/image'

const PURPOSES = [
  {
    title: 'Kerala Breakfast',
    description: 'Puttu, Appam, Idiyappam & more',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
    href: '/products?purpose=breakfast',
    count: 24,
    accent: '#0F2747',
  },
  {
    title: 'Fish & Seafood',
    description: 'Masalas, coconut & curry bases',
    image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=400',
    href: '/products?purpose=fish-curry',
    count: 18,
    accent: '#5FAE9B',
  },
  {
    title: 'Rice & Biryani',
    description: 'Premium rice, spices & ghee',
    image: 'https://images.pexels.com/photos/4110252/pexels-photo-4110252.jpeg?auto=compress&cs=tinysrgb&w=400',
    href: '/products?purpose=rice-biryani',
    count: 21,
    accent: '#e5a100',
  },
  {
    title: 'Tea Time Snacks',
    description: 'Chips, murukku, mixture & halwa',
    image: 'https://images.pexels.com/photos/5848575/pexels-photo-5848575.jpeg?auto=compress&cs=tinysrgb&w=400',
    href: '/products?purpose=snacks',
    count: 32,
    accent: '#e55c5c',
  },
  {
    title: 'Sadya Feast',
    description: 'Complete sadya essentials',
    image: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400',
    href: '/products?purpose=sadya',
    count: 28,
    accent: '#7c5cbf',
  },
  {
    title: 'Sweet Treats',
    description: 'Halwa, payasam & traditional sweets',
    image: 'https://images.pexels.com/photos/4110257/pexels-photo-4110257.jpeg?auto=compress&cs=tinysrgb&w=400',
    href: '/products?purpose=sweets',
    count: 15,
    accent: '#c45921',
  },
]

export default function CookingPurposeSection() {
  return (
    <section className="py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#0F2747' }}>
              What Are You Cooking Today?
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Shop by cooking occasion — everything you need, all in one place</p>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold hover:opacity-75 transition-opacity"
            style={{ color: '#5FAE9B' }}
          >
            Browse All
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PURPOSES.map((purpose) => (
            <Link
              key={purpose.title}
              href={purpose.href}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] block"
            >
              <Image
                src={purpose.image}
                alt={purpose.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-3">
                <span
                  className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white mb-1.5"
                  style={{ backgroundColor: purpose.accent }}
                >
                  {purpose.count} products
                </span>
                <p className="text-white font-bold text-sm leading-tight">{purpose.title}</p>
                <p className="text-white/70 text-[10px] mt-0.5 line-clamp-1">{purpose.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
