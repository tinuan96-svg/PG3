import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('product_bundles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ bundles: data })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('product_bundles')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description,
        image_url: body.image_url,
        product_ids: body.product_ids,
        original_price: body.original_price,
        bundle_price: body.bundle_price,
        coin_reward: body.coin_reward,
        is_active: body.is_active ?? true,
        display_locations: body.display_locations || ['homepage'],
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ bundle: data })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
