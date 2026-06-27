import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  generateProductSeoTitle,
  generateProductSeoDescription,
  generateProductSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateProductPageFAQs,
  SITE_URL,
} from '@/lib/seo'
import { ALL_PRODUCTS } from '@/lib/products-data'
import ProductDetailClient, { type ProductDetailProps, type ProductVariant } from '@/components/ProductDetailClient'
import { fetchProductDetail } from '@/lib/api/products'

const PLACEHOLDER =
  'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400'

function resolveUrl(raw: string | null | undefined): string {
  if (!raw) return PLACEHOLDER
  return raw
}

export const dynamicParams = false

export async function generateStaticParams() {
  return [{ slug: 'dummy' }]
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await fetchProductDetail(params.slug)
  const staticProduct = ALL_PRODUCTS.find((p) => p.slug === params.slug)

  const name = product?.name ?? staticProduct?.name
  if (!name) return { title: 'Product Not Found | PocketGrocery' }

  const brand = product?.brand ?? staticProduct?.brand
  const weight = staticProduct?.weight
  const image = product ? resolveUrl(product.image_url ?? product.image) : staticProduct?.images?.[0]
  const canonical = `${SITE_URL}/products/${params.slug}`

  const seoTitle = generateProductSeoTitle({ name, weight })
  const seoDesc = generateProductSeoDescription({ name, weight, brand })

  return {
    title: seoTitle,
    description: seoDesc,
    keywords: `${name}, ${brand || 'Kerala'}, buy ${name} UK, Kerala groceries UK, Indian groceries online, next day delivery`,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'en_GB',
      url: canonical,
      siteName: 'PocketGrocery',
      title: seoTitle,
      description: seoDesc,
      images: image ? [{ url: image, width: 800, height: 800, alt: `${name} - ${brand || 'PocketGrocery'}` }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDesc,
      images: image ? [image] : [],
    },
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await fetchProductDetail(params.slug)
  const staticProduct = ALL_PRODUCTS.find((p) => p.slug === params.slug)

  if (!product && !staticProduct) notFound()

  let props: ProductDetailProps

  if (product) {
    const basePrice = Number(product.original_price ?? product.price ?? 0)
    const salePrice = Number(product.price ?? 0)
    const images = [
      resolveUrl(product.image_url ?? product.image),
      ...(product.gallery_images ?? []).map(resolveUrl),
    ].filter((u, i, a) => a.indexOf(u) === i)

    const category = product.category ?? ''

    const variants: ProductVariant[] = (product.variants ?? []).map((v) => ({
      id: v.id,
      variant_name: v.variant_name,
      price: Number(v.price),
      discounted_price: v.discounted_price != null ? Number(v.discounted_price) : null,
      stock: Number(v.stock),
      unit_value: v.unit_value != null ? Number(v.unit_value) : null,
      unit_type: v.unit_type,
      sort_order: v.sort_order,
      image_url: v.image_url,
    }))

    const relatedStatic = ALL_PRODUCTS.filter(
      (r) => r.category === category && r.slug !== params.slug
    ).slice(0, 4)

    const productId = product.id ?? product.product_id ?? ''
    const faqs = generateProductPageFAQs({
      id: productId,
      name: product.name,
      brand: product.brand ?? '',
      price: basePrice,
      offer_price: salePrice < basePrice ? salePrice : basePrice,
      images,
      category,
      slug: product.slug ?? params.slug,
      weight: '',
      coin_reward: 0,
      trending: product.is_trending,
      bestSeller: product.is_bestseller,
      newArrival: product.is_new_arrival,
      communityFavorite: false,
      rating: undefined,
      reviewCount: 0,
      stock_status: product.in_stock ? 'in_stock' : 'outofstock',
    })

    props = {
      id: productId,
      slug: product.slug ?? params.slug,
      name: product.name,
      brand: product.brand ?? '',
      description: product.description ?? undefined,
      shortDescription: product.short_description ?? undefined,
      ingredients: (product as { ingredients?: string }).ingredients ?? undefined,
      nutritionalInfo: (product as { nutritional_info?: string }).nutritional_info ?? undefined,
      storageInstructions: (product as { storage_instructions?: string }).storage_instructions ?? undefined,
      howToUse: (product as { how_to_use?: string }).how_to_use ?? undefined,
      basePrice,
      baseOfferPrice: salePrice < basePrice ? salePrice : basePrice,
      images,
      category,
      weight: '',
      coinReward: 0,
      trending: Boolean(product.is_trending),
      bestSeller: Boolean(product.is_bestseller),
      newArrival: Boolean(product.is_new_arrival),
      rating: undefined,
      reviewCount: 0,
      inStock: Boolean(product.in_stock) || Boolean(product.allow_backorder),
      allowBackorder: Boolean(product.allow_backorder),
      hasVariants: Boolean(product.has_variants),
      variants,
      relatedProducts: relatedStatic.map((r) => ({
        id: r.id, slug: r.slug, name: r.name, brand: r.brand,
        price: r.price, offerPrice: r.offer_price, images: r.images,
        weight: r.weight, category: r.category,
      })),
      faqs,
    }
  } else {
    const p = staticProduct!
    const price = p.price
    const offerPrice = p.offer_price != null && p.offer_price < p.price ? p.offer_price : p.price
    const relatedStatic = ALL_PRODUCTS.filter(
      (r) => r.category === p.category && r.slug !== p.slug
    ).slice(0, 4)
    const faqs = generateProductPageFAQs(p)

    props = {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      basePrice: price,
      baseOfferPrice: offerPrice,
      images: p.images,
      category: p.category,
      weight: p.weight ?? '',
      coinReward: p.coin_reward,
      trending: p.trending ?? false,
      bestSeller: p.bestSeller ?? false,
      newArrival: p.newArrival ?? false,
      rating: p.rating,
      reviewCount: p.reviewCount ?? 0,
      inStock: p.stock_status !== 'outofstock',
      allowBackorder: false,
      hasVariants: false,
      variants: [],
      relatedProducts: relatedStatic.map((r) => ({
        id: r.id, slug: r.slug, name: r.name, brand: r.brand,
        price: r.price, offerPrice: r.offer_price, images: r.images,
        weight: r.weight, category: r.category,
      })),
      faqs,
    }
  }

  const productSchema = generateProductSchema(
    {
      id: props.id, name: props.name, brand: props.brand,
      price: props.basePrice, offer_price: props.baseOfferPrice,
      images: props.images, category: props.category, slug: props.slug,
      weight: props.weight, coin_reward: props.coinReward,
      trending: props.trending, bestSeller: props.bestSeller,
      newArrival: props.newArrival, communityFavorite: false,
      rating: props.rating, reviewCount: props.reviewCount,
      stock_status: props.inStock ? 'in_stock' : 'outofstock',
    },
    params.slug,
  )
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Products', url: `${SITE_URL}/products` },
    { name: props.category || 'Products', url: `${SITE_URL}/products${props.category ? `?category=${encodeURIComponent(props.category)}` : ''}` },
    { name: props.name, url: `${SITE_URL}/products/${params.slug}` },
  ])
  const faqSchema = generateFAQSchema(props.faqs)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-gray-600 transition-colors">Products</Link>
            {props.category && (
              <>
                <span>/</span>
                <Link
                  href={`/products?category=${encodeURIComponent(props.category)}`}
                  className="hover:text-gray-600 transition-colors"
                >
                  {props.category}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-700 truncate max-w-[200px]">{props.name}</span>
          </nav>

          <ProductDetailClient {...props} />
        </div>
      </div>
    </>
  )
}
