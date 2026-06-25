import { NextRequest, NextResponse } from 'next/server'
import { WooCommerceSync } from '@/lib/woocommerce'

export async function POST(req: NextRequest) {
  try {
    const { url, consumerKey, consumerSecret } = await req.json()

    if (!url || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { success: false, error: 'Missing required credentials' },
        { status: 400 }
      )
    }

    const testUrl = `${url}/wp-json/wc/v3/products?per_page=1`
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

    const response = await fetch(testUrl, {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Connection failed: ${response.statusText}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: 'Connection successful' })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
