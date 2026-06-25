import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const SETTINGS_ID = '00000000-0000-0000-0000-000000000099'

export async function GET() {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data } = await supabase
      .from('worldpay_settings')
      .select('apple_pay_domain_verification')
      .eq('id', SETTINGS_ID)
      .maybeSingle()

    if (!data?.apple_pay_domain_verification) {
      return new Response('Not found', { status: 404 })
    }

    return new Response(data.apple_pay_domain_verification, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('[apple-pay-verification] error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
