import { createClient } from '@supabase/supabase-js'

export interface FoodType {
  id: string
  name: string
  slug: string
  emoji: string
  description: string
  banner_image: string | null
  bg_color: string
  accent_color: string
  sort_order: number
  is_active: boolean
  show_on_homepage: boolean
  keywords: string[]
  product_count: number
  sample_images: string[]
}

export interface FoodTypeProduct {
  product_id: string
  name: string
  slug: string
  image: string | null
  price: number
  compare_price: number | null
  source: 'ai' | 'manual'
  is_featured: boolean
  is_flash_deal: boolean
}

// ─── Server-safe client ───────────────────────────────────────────────────────

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getFoodTypesWithCounts(): Promise<FoodType[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (getClient() as any).rpc('get_food_types_with_counts')
    if (error) { console.error('[food-types]', error); return [] }
    return (data ?? []).map(normaliseFoodType)
  } catch (e) {
    console.error('[food-types]', e)
    return []
  }
}

export async function getFoodTypeProducts(slug: string, limit = 24, offset = 0): Promise<FoodTypeProduct[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (getClient() as any).rpc('get_food_type_products', {
      p_slug: slug, p_limit: limit, p_offset: offset,
    })
    if (error) { console.error('[food-type-products]', error); return [] }
    return data ?? []
  } catch (e) {
    console.error('[food-type-products]', e)
    return []
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseFoodType(row: any): FoodType {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    emoji: row.emoji,
    description: row.description ?? '',
    banner_image: row.banner_image ?? null,
    bg_color: row.bg_color ?? '#0F2747',
    accent_color: row.accent_color ?? '#5FAE9B',
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active),
    show_on_homepage: Boolean(row.show_on_homepage),
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    product_count: Number(row.product_count ?? 0),
    sample_images: Array.isArray(row.sample_images)
      ? (row.sample_images as (string | null)[]).filter(Boolean) as string[]
      : [],
  }
}
