import { NextResponse } from 'next/server'
import { growthEngine } from '@/lib/growth-engine'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    await growthEngine.trackAnalytics({
      event_type: body.event_type,
      product_id: body.product_id,
      bundle_id: body.bundle_id,
      user_id: body.user_id,
      session_id: body.session_id || generateSessionId(),
      revenue_impact: body.revenue_impact,
      metadata: body.metadata,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const summary = await growthEngine.getAnalyticsSummary(days)

    return NextResponse.json({ summary })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
