import { NextResponse } from 'next/server'
import { ALL_PRODUCTS } from '@/lib/products-data'
import { SITE_URL, COMPANY } from '@/lib/seo'

export const dynamic = 'force-static'
export const revalidate = 3600

export async function GET() {
  const feedLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '<channel>',
    `<title>${COMPANY.tradingAs} - Kerala Groceries UK</title>`,
    `<link>${SITE_URL}</link>`,
    '<description>Authentic Kerala groceries delivered next day across the UK</description>',
  ]

  for (const product of ALL_PRODUCTS) {
    const price = product.offer_price || product.price
    const image = product.images[0] || ''
    const availability = product.stock_status === 'outofstock' ? 'out of stock' : 'in stock'
    const condition = 'new'
    const gtin = ''
    const mpn = product.slug
    const brand = product.brand
    const shipping = 'GB:::4.99 GBP'
    const shippingFree = 'GB:::0.00 GBP'

    const productUrl = `${SITE_URL}/products/${product.slug}`
    const title = `${product.name} ${product.weight || ''}`.trim()
    const description = `Buy ${product.name} online in the UK. Authentic Kerala ${product.category.toLowerCase()} from ${brand}. Next day delivery available.`

    feedLines.push(
      '<item>',
      `<g:id><![CDATA[${product.id}]]></g:id>`,
      `<g:title><![CDATA[${title}]]></g:title>`,
      `<g:description><![CDATA[${description}]]></g:description>`,
      `<g:link><![CDATA[${productUrl}]]></g:link>`,
      `<g:image_link><![CDATA[${image}]]></g:image_link>`,
      `<g:availability>${availability}</g:availability>`,
      `<g:price>${price.toFixed(2)} GBP</g:price>`,
      ...(product.offer_price && product.offer_price < product.price
        ? [`<g:sale_price>${product.offer_price.toFixed(2)} GBP</g:sale_price>`]
        : []),
      `<g:condition>${condition}</g:condition>`,
      `<g:brand><![CDATA[${brand}]]></g:brand>`,
      `<g:mpn><![CDATA[${mpn}]]></g:mpn>`,
      `<g:product_type><![CDATA[Kerala Groceries > ${product.category}]]></g:product_type>`,
      `<g:google_product_category>Food, Beverages &amp; Tobacco</g:google_product_category>`,
      `<g:shipping>${product.price >= 35 ? shippingFree : shipping}</g:shipping>`,
      `<g:identifier_exists>no</g:identifier_exists>`,
      `<g:custom_label_0><![CDATA[${product.category}]]></g:custom_label_0>`,
      `<g:custom_label_1><![CDATA[${brand}]]></g:custom_label_1>`,
      ...(product.weight ? [`<g:weight>${product.weight}</g:weight>`] : []),
      '</item>'
    )
  }

  feedLines.push('</channel>', '</rss>')

  const xml = feedLines.join('\n')

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'noindex',
    },
  })
}
