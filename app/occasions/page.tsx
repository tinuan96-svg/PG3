import { getOccasionsWithCounts } from '@/lib/occasions'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Shop By Occasion | PocketGrocery Kerala Groceries',
  description: 'One-click grocery baskets for every occasion — Onam Sadya, birthday parties, Christmas, Eid, Diwali, family meals and more.',
}

const PLACEHOLDER = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'

export default async function OccasionsPage() {
  const occasions = await getOccasionsWithCounts()

  return (
    <>
      <section className="py-10 md:py-14" style={{ background: 'linear-gradient(135deg, #0A1929 0%, #1a2e4a 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#FB923C' }}>Occasion shopping</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Shop By Occasion</h1>
          <p className="text-white/60 max-w-xl mx-auto text-sm leading-relaxed">
            Build your perfect basket in one click — products curated for every celebration, meal and moment.
          </p>
        </div>
      </section>

      <section className="py-10" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {occasions.map((occ) => {
              const images = occ.sample_images.slice(0, 4)
              return (
                <Link key={occ.id} href={`/occasions/${occ.slug}`} className="group">
                  <div
                    className="relative rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1"
                    style={{ backgroundColor: occ.bg_color, minHeight: 240 }}
                  >
                    {occ.banner_image ? (
                      <div className="absolute inset-0">
                        <Image src={occ.banner_image} alt={occ.name} fill
                          className="object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                          unoptimized sizes="(max-width: 640px) 100vw, 50vw" />
                      </div>
                    ) : images.length > 0 ? (
                      <div className="absolute inset-0 grid grid-cols-2 gap-0.5 opacity-20 group-hover:opacity-30 transition-opacity">
                        {images.map((src, i) => (
                          <div key={i} className="relative overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="relative z-10 p-6 flex flex-col justify-between h-full" style={{ minHeight: 240 }}>
                      <div className="flex items-start justify-between">
                        <span className="text-5xl leading-none">{occ.emoji}</span>
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full"
                          style={{ backgroundColor: `${occ.accent_color}30`, color: occ.accent_color, border: `1px solid ${occ.accent_color}40` }}
                        >
                          {occ.product_count} products
                        </span>
                      </div>

                      <div className="mt-6">
                        <h2 className="text-white font-extrabold text-xl mb-1">{occ.name}</h2>
                        <p className="text-white/60 text-sm mb-4 line-clamp-2">{occ.description}</p>
                        <div
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all group-hover:gap-3"
                          style={{ backgroundColor: occ.accent_color }}
                        >
                          Browse Occasion
                          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
