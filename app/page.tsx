import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import MobileHomepage from '@/components/MobileHomepage'
import HeroSection from '@/components/HeroSection'
import DeliveryCountdown from '@/components/DeliveryCountdown'
import FlashDealsSection from '@/components/FlashDealsSection'
import ProductCarousel from '@/components/ProductCarousel'
import BrandsSection from '@/components/BrandsSection'
import BundlesSection from '@/components/BundlesSection'
import CookToday from '@/components/CookToday'
import ShopByFoodType from '@/components/ShopByFoodType'
import ShopByOccasion from '@/components/ShopByOccasion'
import FestivalBanner from '@/components/FestivalBanner'
import HomepageFAQ from '@/components/HomepageFAQ'
import Newsletter from '@/components/Newsletter'
import PopularCategoriesSection from '@/components/PopularCategoriesSection'
import RecentlyViewedSection from '@/components/RecentlyViewedSection'
import {
  getTrendingProductsDB,
  getBestSellersDB,
  getNewArrivalsDB,
  getCommunityFavoritesDB,
} from '@/lib/db-products'

export const metadata: Metadata = {
  title: 'PocketGrocery - Kerala Groceries Online UK | Next Day Delivery',
  description:
    'Buy authentic Kerala groceries online with next day delivery across the UK. Premium spices, rice, pickles, snacks and more from top brands. Earn Pocket Coins on every purchase.',
  keywords:
    'Kerala groceries UK, Indian groceries online, Kerala spices, buy Kerala groceries, next day delivery, Nirapara, Eastern, Double Horse',
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PocketGrocery',
  legalName: 'Matha Grocers Ltd',
  url: 'https://pocketgrocery.com',
  description: 'Authentic Kerala groceries delivered next day across the UK',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '52 Oldfields Road',
    addressLocality: 'Sutton',
    postalCode: 'SM1 2NU',
    addressCountry: 'GB',
  },
  sameAs: [],
}

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PocketGrocery',
  url: 'https://pocketgrocery.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://pocketgrocery.com/products?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

type HomepageSection = {
  section_key: string
  title: string
  is_enabled: boolean
  display_order: number
}

async function getSections(): Promise<HomepageSection[]> {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('homepage_sections')
      .select('section_key,title,is_enabled,display_order')
      .order('display_order', { ascending: true })
    return (data ?? []) as HomepageSection[]
  } catch {
    return []
  }
}

export default async function Home() {
  const [sections, trending, bestSellers, newArrivals, communityFavs] = await Promise.all([
    getSections(),
    getTrendingProductsDB(16),
    getBestSellersDB(16),
    getNewArrivalsDB(16),
    getCommunityFavoritesDB(10),
  ])

  const heroFeatured = trending.slice(0, 6)
  const heroBestSellers = bestSellers.slice(0, 6)

  const enabled = new Set(
    sections.filter((s) => s.is_enabled).map((s) => s.section_key)
  )
  const anyDefined = sections.length > 0

  function isVisible(key: string) {
    return !anyDefined || enabled.has(key)
  }

  const sectionOrder = anyDefined
    ? sections.map((s) => s.section_key)
    : ['hero', 'flash_deals', 'categories', 'trending', 'best_sellers', 'bundles', 'recently_viewed', 'brands', 'cook_and_shop', 'new_arrivals', 'community_favs', 'delivery_regions', 'occasions', 'newsletter']

  const sectionElements: Record<string, React.ReactNode> = {
    hero: isVisible('hero') ? (
      <>
        <HeroSection featuredProducts={heroFeatured} bestSellers={heroBestSellers} />
        <DeliveryCountdown />
      </>
    ) : null,

    featured_products: isVisible('featured_products') && trending.length > 0 ? (
      <ProductCarousel title="Featured Products" subtitle="Hand-picked for quality" products={trending.slice(0, 8)} viewAllHref="/products?filter=featured" />
    ) : null,

    categories: isVisible('categories') ? <PopularCategoriesSection /> : null,

    flash_deals: isVisible('flash_deals') ? <FlashDealsSection /> : null,

    trending: isVisible('trending') && trending.length > 0 ? (
      <ProductCarousel title="Trending This Week" subtitle="What Kerala families are buying most" products={trending} viewAllHref="/products?filter=trending" badge="HOT" />
    ) : null,

    best_sellers: isVisible('best_sellers') && bestSellers.length > 0 ? (
      <ProductCarousel title="Best Sellers" subtitle="Tried, trusted and loved by our customers" products={bestSellers} viewAllHref="/products?filter=bestsellers" />
    ) : null,

    brands: isVisible('brands') ? <BrandsSection /> : null,

    cook_and_shop: isVisible('cook_and_shop') ? <CookToday compact /> : null,

    new_arrivals: isVisible('new_arrivals') && newArrivals.length > 0 ? (
      <ProductCarousel title="New Arrivals" subtitle="Fresh stock just landed" products={newArrivals} viewAllHref="/products?filter=new" badge="NEW" />
    ) : null,

    community_favs: isVisible('community_favs') && communityFavs.length > 0 ? (
      <ProductCarousel title="Community Favourites" subtitle="Highest rated by PocketGrocery customers" products={communityFavs} viewAllHref="/products?filter=community" />
    ) : null,

    bundles: isVisible('bundles') ? <BundlesSection /> : null,

    delivery_regions: isVisible('delivery_regions') ? <ShopByFoodType /> : null,

    occasions: isVisible('occasions') ? <ShopByOccasion /> : null,

    newsletter: isVisible('newsletter') ? (
      <>
        <HomepageFAQ />
        <Newsletter />
      </>
    ) : null,

    recently_viewed: isVisible('recently_viewed') ? <RecentlyViewedSection /> : null,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />

      {/* Mobile homepage — shown only on small screens */}
      <div className="md:hidden">
        <MobileHomepage
          bestSellers={bestSellers}
          newArrivals={newArrivals}
          trending={trending}
        />
      </div>

      {/* Desktop homepage — shown only on md+ screens */}
      <div className="hidden md:block">
        {sectionOrder.map((key) => {
          const el = sectionElements[key]
          if (!el) return null
          return <div key={key}>{el}</div>
        })}
      </div>
    </>
  )
}
