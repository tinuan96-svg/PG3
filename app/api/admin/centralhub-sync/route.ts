import { NextRequest, NextResponse } from 'next/server'
import { syncCentralProducts, syncSingleProduct, getSyncLogs } from '@/lib/sync/product-sync'
import { testCentralHubConnection } from '@/lib/sync/centralhub-client'

function getAccessToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization') ?? ''
  return auth.startsWith('Bearer ') ? auth.slice(7) : null
}

// GET /api/admin/centralhub-sync?action=logs&limit=50
// GET /api/admin/centralhub-sync?action=test
export async function GET(req: NextRequest) {
  const accessToken = getAccessToken(req)
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const action = req.nextUrl.searchParams.get('action') ?? 'logs'
  const limit  = parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10)

  try {
    if (action === 'test') {
      const result = await testCentralHubConnection()
      return NextResponse.json(result)
    }

    const logs = await getSyncLogs(limit, accessToken)
    return NextResponse.json({ logs })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/admin/centralhub-sync
// body: { action: 'sync_all' | 'sync_one', productId?: string, updatedSince?: string, force?: boolean }
export async function POST(req: NextRequest) {
  const accessToken = getAccessToken(req)
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({})) as { action?: string; productId?: string }
    const { action = 'sync_all', productId } = body

    if (action === 'sync_one') {
      if (!productId) {
        return NextResponse.json({ error: 'productId is required for sync_one' }, { status: 400 })
      }
      const result = await syncSingleProduct(productId, {
        triggeredBy: 'manual',
        accessToken,
      })
      return NextResponse.json(result)
    }

    // sync_all
    const result = await syncCentralProducts({
      triggeredBy: 'manual',
      accessToken,
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
