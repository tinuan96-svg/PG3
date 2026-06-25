import { NextResponse } from 'next/server'
import { wooCommerceSync } from '@/lib/woocommerce'

export async function POST() {
  try {
    const result = await wooCommerceSync.syncProducts('manual')

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
