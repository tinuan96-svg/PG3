import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Strip /rest/v1 suffix if included — edge function path is appended separately
const CENTRALHUB_URL = (
  process.env.CENTRALHUB_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  ''
).replace(/\/$/, '').replace(/\/rest\/v1$/, '')

const CENTRALHUB_KEY =
  process.env.CENTRALHUB_API_KEY ||
  process.env.CENTRALHUB_ANON_KEY ||
  ''

const SITE_KEY =
  process.env.CENTRALHUB_SITE_KEY ||
  process.env.CENTRALHUB_API_KEY ||
  ''

const TIMEOUT_MS = 20_000

function unauthorised(msg: string) {
  return NextResponse.json({ error: msg }, { status: 401 })
}

async function verifyAdminSession(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return false

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  return profile?.role === 'admin'
}

export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdminSession(req.headers.get('authorization'))
  if (!isAdmin) return unauthorised('Admin access required')

  if (!CENTRALHUB_URL) {
    return NextResponse.json(
      { error: 'CENTRALHUB_API_URL is not configured' },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(req.url)
  const limit = searchParams.get('limit') || '200'
  const page = searchParams.get('page') || '1'

  const endpoint = `${CENTRALHUB_URL}/functions/v1/products-export-api?limit=${limit}&page=${page}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const upstream = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        apikey: CENTRALHUB_KEY,
        Authorization: `Bearer ${CENTRALHUB_KEY}`,
        'x-site-key': SITE_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const text = await upstream.text()

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}: ${text.slice(0, 300)}` },
        { status: upstream.status },
      )
    }

    const data = text ? JSON.parse(text) : { products: [] }
    return NextResponse.json(data)
  } catch (err) {
    const msg = (err as Error).name === 'AbortError'
      ? 'Request to CentralHub timed out'
      : String(err)
    return NextResponse.json({ error: msg }, { status: 502 })
  } finally {
    clearTimeout(timer)
  }
}
