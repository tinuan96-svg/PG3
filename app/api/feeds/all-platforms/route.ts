import { NextResponse } from 'next/server'
import { ALL_PRODUCTS } from '@/lib/products-data'
import { SITE_URL, COMPANY } from '@/lib/seo'

export const dynamic = 'force-static'
export const revalidate = 3600

function buildProductFeedItem(product: (typeof ALL_PRODUCTS)[0], platform: string) {
  const price = product.offer_price || product.price
  const image = product.images[0] || ''
  const inStock = product.stock_status !== 'outofstock'
  const title = `${product.name} ${product.weight || ''}`.trim()
  const description = `Authentic Kerala ${product.category.toLowerCase()} by ${product.brand}. Buy online UK with next day delivery from PocketGrocery.`
  const url = `${SITE_URL}/products/${product.slug}`

  const base = {
    id: `pg-${product.id}`,
    title,
    description,
    price: `${price.toFixed(2)} GBP`,
    link: url,
    image_link: image,
    brand: product.brand,
    availability: inStock ? 'in stock' : 'out of stock',
    condition: 'new',
    category: product.category,
    currency: 'GBP',
    shipping: price >= 35 ? 'Free' : '£4.99',
    retailer_id: product.id,
  }

  if (platform === 'pinterest') {
    return {
      ...base,
      pinterest_product_type: product.category,
      link: `${url}?utm_source=pinterest&utm_medium=social`,
    }
  }

  if (platform === 'tiktok') {
    return {
      ...base,
      sku_id: product.slug,
      seller_name: COMPANY.tradingAs,
      product_category: `Food > ${product.category}`,
      link: `${url}?utm_source=tiktok&utm_medium=social`,
    }
  }

  if (platform === 'instagram') {
    return {
      ...base,
      retailer_product_group_id: product.category.replace(/\s+/g, '_').toLowerCase(),
      link: `${url}?utm_source=instagram&utm_medium=social`,
    }
  }

  return base
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') || 'all'
  const limit = parseInt(searchParams.get('limit') || '200', 10)
  const validPlatforms = ['pinterest', 'tiktok', 'instagram', 'all']
  const targetPlatform = validPlatforms.includes(platform) ? platform : 'all'

  const products = ALL_PRODUCTS.slice(0, limit)
  const platforms = targetPlatform === 'all'
    ? ['pinterest', 'tiktok', 'instagram']
    : [targetPlatform]

  const feeds: Record<string, ReturnType<typeof buildProductFeedItem>[]> = {}
  for (const p of platforms) {
    feeds[p] = products.map((product) => buildProductFeedItem(product, p))
  }

  return NextResponse.json(
    {
      store: COMPANY.tradingAs,
      currency: 'GBP',
      total_products: products.length,
      generated_at: new Date().toISOString(),
      feeds,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'X-Robots-Tag': 'noindex',
      },
    }
  )
}
