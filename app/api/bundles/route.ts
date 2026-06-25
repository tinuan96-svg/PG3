import { NextResponse } from 'next/server'
import { growthEngine } from '@/lib/growth-engine'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') || undefined

    const bundles = await growthEngine.getActiveBundles(location)

    return NextResponse.json({ bundles })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
