'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Brand = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  color: string | null
  homepage_order: number
  show_on_homepage: boolean
}

export default function BrandsSection() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('brands')
      .select('id,name,slug,description,logo_url,color,homepage_order,show_on_homepage')
      .eq('show_on_homepage', true)
      .order('homepage_order', { ascending: true })
      .limit(12)
      .then(({ data }: { data: Brand[] | null }) => {
        setBrands(data ?? [])
        setLoaded(true)
      })
  }, [])

  if (loaded && brands.length === 0) return null
  if (!loaded) return null

  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#0F2747' }}>
            Popular Brands
          </h2>
          <Link href="/brands" className="text-sm font-medium hover:opacity-75 transition-opacity" style={{ color: '#5FAE9B' }}>
            All Brands &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {brands.map((brand) => {
            const initials = brand.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
            const color = brand.color || '#0F2747'

            return (
              <Link
                key={brand.id}
                href={`/products?brand=${encodeURIComponent(brand.slug ?? brand.name)}`}
                className="bg-white rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 group border border-gray-100 flex flex-col items-center"
              >
                {brand.logo_url ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-2.5 group-hover:scale-105 transition-transform shadow-sm bg-gray-50 flex items-center justify-center">
                    <Image
                      src={brand.logo_url}
                      alt={brand.name}
                      width={56}
                      height={56}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2.5 text-white font-bold text-base group-hover:scale-105 transition-transform shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                )}
                <p className="text-sm font-semibold leading-tight" style={{ color: '#0F2747' }}>{brand.name}</p>
                {brand.description && (
                  <p className="text-[11px] text-gray-400 mt-1 leading-tight hidden sm:block line-clamp-2">{brand.description}</p>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
