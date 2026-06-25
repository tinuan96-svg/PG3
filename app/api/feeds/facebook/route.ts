import { NextResponse } from 'next/server'
import { ALL_PRODUCTS } from '@/lib/products-data'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'
export const revalidate = 3600

export async function GET() {
  const items = ALL_PRODUCTS.map((product) => {
    const price = product.offer_price || product.price
    const image = product.images[0] || ''
    const availability = product.stock_status === 'outofstock' ? 'out of stock' : 'in stock'
    const condition = 'new'

    return {
      id: product.id,
      title: `${product.name} ${product.weight || ''}`.trim(),
      description: `Authentic Kerala ${product.category.toLowerCase()}. ${product.name} by ${product.brand}. Buy online with next day UK delivery.`,
      availability,
      condition,
      price: `${price.toFixed(2)} GBP`,
      link: `${SITE_URL}/products/${product.slug}`,
      image_link: image,
      brand: product.brand,
      google_product_category: 'Food, Beverages & Tobacco',
      product_type: `Kerala Groceries > ${product.category}`,
      custom_label_0: product.category,
      custom_label_1: product.brand,
      custom_label_2: product.trending ? 'trending' : product.bestSeller ? 'bestseller' : product.newArrival ? 'new' : 'regular',
      sale_price: product.offer_price && product.offer_price < product.price
        ? `${product.offer_price.toFixed(2)} GBP`
        : undefined,
    }
  })

  return NextResponse.json(
    { data: items, total: items.length, generated_at: new Date().toISOString() },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'X-Robots-Tag': 'noindex',
      },
    }
  )
}
