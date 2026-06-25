import { createClient } from '@supabase/supabase-js'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export interface Occasion {
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

export interface OccasionProduct {
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

function normaliseOccasion(row: Record<string, unknown>): Occasion {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    slug: String(row.slug ?? ''),
    emoji: String(row.emoji ?? ''),
    description: String(row.description ?? ''),
    banner_image: row.banner_image ? String(row.banner_image) : null,
    bg_color: String(row.bg_color ?? '#0F2747'),
    accent_color: String(row.accent_color ?? '#5FAE9B'),
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active),
    show_on_homepage: Boolean(row.show_on_homepage),
    keywords: Array.isArray(row.keywords) ? row.keywords.map(String) : [],
    product_count: Number(row.product_count ?? 0),
    sample_images: Array.isArray(row.sample_images) ? row.sample_images.map(String) : [],
  }
}

export async function getOccasionsWithCounts(homepageOnly = false): Promise<Occasion[]> {
  try {
    const { data, error } = await getClient().rpc('get_occasions_with_counts', {
      p_homepage_only: homepageOnly,
    })
    if (error) { console.error('getOccasionsWithCounts:', error.message); return [] }
    return (data ?? []).map((r: Record<string, unknown>) => normaliseOccasion(r))
  } catch (e) {
    console.error('getOccasionsWithCounts:', e)
    return []
  }
}

export async function getOccasionProducts(
  slug: string,
  limit = 24,
  offset = 0
): Promise<OccasionProduct[]> {
  try {
    const { data, error } = await getClient().rpc('get_occasion_products', {
      p_slug: slug, p_limit: limit, p_offset: offset,
    })
    if (error) { console.error('getOccasionProducts:', error.message); return [] }
    return (data ?? []).map((r: Record<string, unknown>) => ({
      product_id: String(r.product_id ?? ''),
      name: String(r.name ?? ''),
      slug: String(r.slug ?? ''),
      image: r.image ? String(r.image) : null,
      price: Number(r.price ?? 0),
      compare_price: r.compare_price != null ? Number(r.compare_price) : null,
      source: (r.source === 'ai' ? 'ai' : 'manual') as 'ai' | 'manual',
      is_featured: Boolean(r.is_featured),
      is_flash_deal: Boolean(r.is_flash_deal),
    }))
  } catch (e) {
    console.error('getOccasionProducts:', e)
    return []
  }
}

export interface FestivalCampaign {
  id: string
  name: string
  slug: string
  emoji: string
  description: string
  banner_image: string | null
  banner_link: string | null
  bg_color: string
  accent_color: string
  starts_at: string
  ends_at: string
}

export async function getActiveFestivalCampaigns(): Promise<FestivalCampaign[]> {
  try {
    const { data, error } = await getClient().rpc('get_active_festival_campaigns')
    if (error) { console.error('getActiveFestivalCampaigns:', error.message); return [] }
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id ?? ''),
      name: String(r.name ?? ''),
      slug: String(r.slug ?? ''),
      emoji: String(r.emoji ?? ''),
      description: String(r.description ?? ''),
      banner_image: r.banner_image ? String(r.banner_image) : null,
      banner_link: r.banner_link ? String(r.banner_link) : null,
      bg_color: String(r.bg_color ?? '#0F2747'),
      accent_color: String(r.accent_color ?? '#5FAE9B'),
      starts_at: String(r.starts_at ?? ''),
      ends_at: String(r.ends_at ?? ''),
    }))
  } catch (e) {
    console.error('getActiveFestivalCampaigns:', e)
    return []
  }
}
