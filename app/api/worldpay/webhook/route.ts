import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Signature headers Worldpay may send — forward them all to the edge function
const WP_SIG_HEADERS = [
  'x-wp-hmac-signature',
  'x-worldpay-signature',
  'x-wp-signature',
]

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    const forwardHeaders: Record<string, string> = {
      'Content-Type': req.headers.get('content-type') ?? 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }

    for (const h of WP_SIG_HEADERS) {
      const v = req.headers.get(h)
      if (v) forwardHeaders[h] = v
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/worldpay-webhook`, {
      method: 'POST',
      headers: forwardHeaders,
      body: rawBody,
    })

    const data = await res.text()
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('worldpay webhook proxy error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
