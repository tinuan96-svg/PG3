import { NextRequest, NextResponse } from 'next/server'
import { syncConnection, syncAllActiveConnections } from '@/lib/supplier-sync'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized: no access token' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { connectionId, triggeredBy = 'manual', syncAll = false } = body as {
      connectionId?: string
      triggeredBy?: 'manual' | 'auto'
      syncAll?: boolean
    }

    if (syncAll) {
      await syncAllActiveConnections(accessToken)
      return NextResponse.json({ success: true, message: 'Auto-sync triggered for all active connections' })
    }

    if (!connectionId) {
      return NextResponse.json({ success: false, error: 'connectionId is required' }, { status: 400 })
    }

    const result = await syncConnection(connectionId, triggeredBy, accessToken)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
