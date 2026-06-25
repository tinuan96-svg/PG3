import { NextResponse } from 'next/server'
import { growthEngine } from '@/lib/growth-engine'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const type = searchParams.get('type') || 'frequently_bought'

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    let products

    switch (type) {
      case 'frequently_bought':
        products = await growthEngine.getFrequentlyBoughtTogether(productId)
        break
      case 'you_may_like':
        products = await growthEngine.getSmartRecommendations(productId)
        break
      case 'upsell':
        products = await growthEngine.getCrossSellProducts(productId, 3)
        break
      default:
        products = await growthEngine.getCrossSellProducts(productId)
    }

    return NextResponse.json({ products })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
