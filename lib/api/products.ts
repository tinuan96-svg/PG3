// Product API service.
//
// Queries the PocketGrocery Supabase `products` table directly via PostgREST.
// Column names match the clean schema created in 20260527083020.
//
// Public storefront: only products with approval_status='approved' AND
// visibility_status='visible' are returned (enforced by both the query and RLS).

import { apiFetch, isSupabaseBackend, readCache, writeCache, ApiError } from './client'
import { applyCustomizations } from './customizations'
import type { Product } from '../products-data'

export const PLACEHOLDER_IMAGE =
  'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400'

const PRODUCT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// ─── Raw DB row shape (matches new clean schema) ──────────────────────────────

interface DbProduct {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  ingredients: string | null
  nutritional_info: string | null
  storage_instructions: string | null
  how_to_use: string | null
  image: string | null
  gallery: string[] | null
  category_id: string | null
  sku: string | null
  tags: string[] | null
  price: number
  compare_price: number | null
  featured: boolean
  approval_status: string
  visibility_status: string
  created_at: string
  updated_at: string
  processed_image_url: string | null
  thumbnail_url: string | null
  brand: string | null
  weight_grams: number | null
  unit: string | null
  is_flash_deal?: boolean
  show_on_homepage?: boolean
  // embedded join
  categories?: { id: string; name: string; slug: string } | null
}

// ─── Public shape used by the rest of the app ─────────────────────────────────

export interface ApiProduct {
  id: string
  product_id?: string
  name: string
  slug: string
  brand?: string
  brand_slug?: string
  price: number
  original_price?: number
  image?: string
  image_url?: string
  category?: string
  category_id?: string
  weight?: string
  coin_reward?: number
  stock?: number
  in_stock?: boolean
  allow_backorder?: boolean
  has_variants?: boolean
  is_bestseller?: boolean
  is_deal?: boolean
  is_new_arrival?: boolean
  is_trending?: boolean
  featured?: boolean
  description?: string
  short_description?: string
  ingredients?: string
  nutritional_info?: string
  storage_instructions?: string
  how_to_use?: string
  gallery_images?: string[]
  discount_percentage?: number
  sales_last_30_days?: number | null
  velocity_score?: number | null
  variants?: ApiProductVariant[]
  sku?: string
  tags?: string[]
}

export interface ApiProductVariant {
  id: string
  variant_name: string
  price: number
  discounted_price: number | null
  stock: number
  unit_value: number | null
  unit_type: string | null
  sort_order: number
  image_url: string | null
}

export interface ApiCategory {
  store_category_id: string
  store_category_name: string
  store_category_slug: string
  main_category_id: string | null
  main_category_name: string | null
  category_id: string | null
}

export interface ApiBrand {
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  product_count: number
}

export interface ProductsQuery {
  store_slug?: string
  search?: string | null
  category_id?: string | null
  brand_slug?: string | null
  brand_name?: string | null
  sort?: string
  limit?: number
  offset?: number
  in_stock_only?: boolean
  featured_only?: boolean
  deals_only?: boolean
  bestsellers_only?: boolean
  new_arrivals_only?: boolean
}

export interface ProductsResult {
  products: ApiProduct[]
  total_count: number
  hasMore: boolean
}

// ─── Image resolver ───────────────────────────────────────────────────────────

export function resolveImage(p: ApiProduct | { image_url?: string | null; image?: string | null }): string {
  return (p.image_url ?? (p as ApiProduct).image) || PLACEHOLDER_IMAGE
}

// ─── Pack size formatter ──────────────────────────────────────────────────────

// Builds a human-readable weight/size string from raw DB fields.
// Priority: weight_grams + unit → weight string → empty.
export function formatPackSize(weightGrams: number | null | undefined, unit: string | null | undefined, weightStr: string | null | undefined): string {
  if (weightGrams && weightGrams > 0) {
    const u = unit?.trim().toLowerCase()
    if (u === 'kg' || u === 'l') {
      // Show as larger unit if it divides cleanly
      const val = weightGrams / 1000
      return val % 1 === 0 ? `${val}${u === 'l' ? 'L' : 'kg'}` : `${val.toFixed(2).replace(/\.?0+$/, '')}${u === 'l' ? 'L' : 'kg'}`
    }
    if (u === 'ml') return `${weightGrams}ml`
    if (u === 'pcs' || u === 'pieces') return `${weightGrams}pcs`
    if (u === 'g' || !u) {
      if (weightGrams >= 1000) {
        const kg = weightGrams / 1000
        return kg % 1 === 0 ? `${kg}kg` : `${kg.toFixed(2).replace(/\.?0+$/, '')}kg`
      }
      return `${weightGrams}g`
    }
    return `${weightGrams}${unit}`
  }
  return weightStr?.trim() ?? ''
}

// ─── PostgREST path builders (new schema) ────────────────────────────────────

// Only select columns that actually exist in the new schema.
const PRODUCT_SELECT =
  'id,name,slug,short_description,description,ingredients,nutritional_info,storage_instructions,how_to_use,image,gallery,price,compare_price,featured,category_id,sku,tags,approval_status,visibility_status,created_at,processed_image_url,thumbnail_url,brand,weight_grams,unit,is_flash_deal,show_on_homepage,categories(id,name,slug)'

function postgrestProductsPath(query: ProductsQuery): string {
  const params = new URLSearchParams()
  params.set('select', PRODUCT_SELECT)
  // RLS already enforces these two, but we add them for explicitness and
  // so PostgREST can use the composite index.
  params.set('approval_status', 'eq.approved')
  params.set('visibility_status', 'eq.visible')

  if (query.search) {
    params.set('name', `ilike.*${query.search}*`)
  }
  if (query.category_id) {
    params.set('category_id', `eq.${query.category_id}`)
  }
  if (query.featured_only) {
    params.set('featured', 'eq.true')
  }
  if (query.deals_only) {
    params.set('is_flash_deal', 'eq.true')
  }
  if (query.bestsellers_only) {
    // Fallback since is_bestseller column is missing
    params.set('featured', 'eq.true')
  }
  if (query.new_arrivals_only) {
    // Fallback since is_new_arrival column is missing, sort handles it
  }

  const sortMap: Record<string, string> = {
    popular:    'featured.desc,created_at.desc',
    newest:     'created_at.desc',
    price_asc:  'price.asc',
    price_desc: 'price.desc',
  }
  params.set('order', sortMap[query.sort ?? 'popular'] ?? 'featured.desc,created_at.desc')
  params.set('limit', String(query.limit ?? 24))
  params.set('offset', String(query.offset ?? 0))

  return `/rest/v1/products?${params}`
}

function postgrestCategoriesPath(): string {
  return '/rest/v1/categories?select=id,name,slug&is_active=eq.true&order=sort_order.asc,name.asc'
}

function postgrestProductDetailPath(slug: string): string {
  const params = new URLSearchParams()
  params.set('select', PRODUCT_SELECT)
  params.set('slug', `eq.${slug}`)
  params.set('approval_status', 'eq.approved')
  params.set('visibility_status', 'eq.visible')
  params.set('limit', '1')
  return `/rest/v1/products?${params}`
}

// ─── Generic CentralHub path builder (future) ─────────────────────────────────

function centralHubProductsPath(query: ProductsQuery): string {
  const params = new URLSearchParams()
  if (query.store_slug)  params.set('store_slug', query.store_slug)
  if (query.search)      params.set('search', query.search)
  if (query.category_id) params.set('category_id', query.category_id)
  if (query.brand_slug)  params.set('brand_slug', query.brand_slug)
  if (query.brand_name)  params.set('brand_name', query.brand_name)
  if (query.sort)        params.set('sort', query.sort)
  if (query.limit  != null) params.set('limit',  String(query.limit))
  if (query.offset != null) params.set('offset', String(query.offset))
  if (query.in_stock_only) params.set('in_stock_only', 'true')
  return `/api/products?${params}`
}

// ─── DB row → ApiProduct normalizer ───────────────────────────────────────────

function dbRowToApiProduct(row: DbProduct): ApiProduct {
  const mainImage = row.processed_image_url || row.image || PLACEHOLDER_IMAGE
  const galleryImages = Array.isArray(row.gallery)
    ? (row.gallery as unknown[]).filter((g): g is string => typeof g === 'string' && Boolean(g))
    : []

  const price = Number(row.price ?? 0)
  const comparePrice = Number(row.compare_price ?? 0)
  const isDeal = comparePrice > price && price > 0
  const discountPct = isDeal ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0

  return {
    id: row.id,
    name: row.name ?? 'Unnamed Product',
    slug: row.slug ?? '',
    brand: row.brand ?? '',
    price,
    original_price: isDeal ? comparePrice : undefined,
    image_url: mainImage,
    image: mainImage,
    gallery_images: galleryImages.length > 0 ? galleryImages : undefined,
    category: row.categories?.name ?? 'Uncategorized',
    category_id: row.category_id ?? undefined,
    weight: formatPackSize(row.weight_grams, row.unit, null),
    coin_reward: 0,
    stock: 999,    // new schema has no stock column; treat all approved products as in stock
    in_stock: true,
    allow_backorder: false,
    has_variants: false,
    is_bestseller: row.featured ?? false,
    is_deal: row.is_flash_deal || isDeal,
    is_new_arrival: true, // assume new if in DB for now
    is_trending: row.featured ?? false,
    featured: row.featured ?? false,
    description: row.description ?? undefined,
    short_description: row.short_description ?? undefined,
    ingredients: row.ingredients ?? undefined,
    nutritional_info: row.nutritional_info ?? undefined,
    storage_instructions: row.storage_instructions ?? undefined,
    how_to_use: row.how_to_use ?? undefined,
    discount_percentage: discountPct,
    sku: row.sku ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    variants: [],
  }
}

// ─── ApiProduct → legacy Product shape (for homepage carousels) ───────────────

export function toProduct(p: ApiProduct): Product {
  const price = Number(p.price ?? 0)
  const mrp = p.original_price != null && Number(p.original_price) > price
    ? Number(p.original_price)
    : price

  const mainImage = resolveImage(p)
  const extra = (p.gallery_images ?? []).filter(Boolean)
  const images = [mainImage, ...extra].filter((u, i, a) => a.indexOf(u) === i)

  const stockStatus: 'in_stock' | 'outofstock' = p.in_stock !== false ? 'in_stock' : 'outofstock'

  return {
    id:                p.id ?? p.product_id ?? '',
    name:              p.name ?? 'Unnamed Product',
    brand:             p.brand ?? '',
    price:             mrp,
    offer_price:       price < mrp ? price : mrp,
    images,
    category:          p.category ?? 'Uncategorized',
    slug:              p.slug ?? '',
    weight:            p.weight ?? '',
    coin_reward:       Number(p.coin_reward ?? 0),
    trending:          Boolean(p.is_trending),
    bestSeller:        Boolean(p.is_bestseller),
    newArrival:        Boolean(p.is_new_arrival),
    communityFavorite: false,
    rating:            4.5,
    reviewCount:       0,
    stock_status:      stockStatus,
  }
}

// ─── Core fetch functions ─────────────────────────────────────────────────────

export async function fetchProducts(query: ProductsQuery = {}): Promise<ProductsResult> {
  const path = isSupabaseBackend()
    ? postgrestProductsPath(query)
    : centralHubProductsPath(query)

  const qs = path.split('?')[1] ?? ''
  const cKey = `products_${qs}`
  const cached = readCache<ProductsResult>(cKey)
  if (cached) return cached

  try {
    const raw = await apiFetch<DbProduct[] | ApiProduct[] | { products: ApiProduct[]; total_count: number }>(path)

    let products: ApiProduct[]
    let total_count: number

    if (Array.isArray(raw)) {
      if (isSupabaseBackend()) {
        products = (raw as DbProduct[]).map(dbRowToApiProduct)
      } else {
        products = (raw as ApiProduct[]).map((p) => ({
          ...p,
          name:      p.name     ?? 'Unnamed Product',
          image_url: p.image_url ?? p.image ?? PLACEHOLDER_IMAGE,
          category:  p.category ?? 'Uncategorized',
          price:     Number(p.price ?? 0),
        }))
      }
      total_count = products.length
    } else {
      const payload = raw as { products: ApiProduct[]; total_count: number }
      products = (payload.products ?? []).map((p) => ({
        ...p,
        name:      p.name     ?? 'Unnamed Product',
        image_url: p.image_url ?? p.image ?? PLACEHOLDER_IMAGE,
        category:  p.category ?? 'Uncategorized',
        price:     Number(p.price ?? 0),
      }))
      total_count = payload.total_count ?? products.length
    }

    const limit  = query.limit ?? products.length
    const offset = query.offset ?? 0
    const withCustom = products.map(applyCustomizations)

    const result: ProductsResult = {
      products: withCustom,
      total_count,
      hasMore: offset + limit < total_count,
    }

    writeCache(cKey, result, PRODUCT_CACHE_TTL)
    return result
  } catch (err) {
    console.error('[products] fetch error:', err)
    const stale = readCache<ProductsResult>(cKey)
    if (stale) return stale
    return { products: [], total_count: 0, hasMore: false }
  }
}

export async function fetchProductDetail(
  slug: string,
  _storeSlug = 'pocket-grocery',
): Promise<ApiProduct | null> {
  const path = isSupabaseBackend()
    ? postgrestProductDetailPath(slug)
    : `/api/products/${slug}`

  const cKey = `product_detail_${slug}`
  const cached = readCache<ApiProduct>(cKey)
  if (cached) return cached

  try {
    if (isSupabaseBackend()) {
      const rows = await apiFetch<DbProduct[]>(path)
      if (!rows || rows.length === 0) return null
      const base = dbRowToApiProduct(rows[0])

      // Fetch ordered gallery from product_images table
      const productImagesPath = `/rest/v1/product_images?product_id=eq.${rows[0].id}&order=sort_order.asc,created_at.asc&select=url,processed_url,is_primary`
      try {
        const imgRows = await apiFetch<{ url: string; processed_url: string | null; is_primary: boolean }[]>(
          productImagesPath,
        )
        if (imgRows && imgRows.length > 0) {
          // Build gallery: primary first, then rest in sort_order
          const primaryRows = imgRows.filter((r) => r.is_primary)
          const nonPrimary  = imgRows.filter((r) => !r.is_primary)
          const ordered     = [...primaryRows, ...nonPrimary]
          const galleryUrls = ordered
            .map((r) => r.processed_url ?? r.url)
            .filter(Boolean)
          // Merge: put product_images gallery urls first, then any from products.gallery
          const existingGallery = base.gallery_images ?? []
          const merged = [...new Set([...galleryUrls, ...existingGallery])]
          base.gallery_images = merged
          // Ensure main image matches the primary product_images row
          if (galleryUrls[0]) base.image_url = base.image = galleryUrls[0]
        }
      } catch {
        // Non-fatal: product_images may not exist yet for older products
      }

      const withCustom = applyCustomizations(base)
      writeCache(cKey, withCustom, PRODUCT_CACHE_TTL)
      return withCustom
    }

    const data = await apiFetch<ApiProduct>(path)
    if (!data?.id && !data?.product_id) return null
    const normalized: ApiProduct = {
      ...data,
      name:      data.name     ?? 'Unnamed Product',
      image_url: data.image_url ?? data.image ?? PLACEHOLDER_IMAGE,
      category:  data.category ?? 'Uncategorized',
      price:     Number(data.price ?? 0),
    }
    const withCustom = applyCustomizations(normalized)
    writeCache(cKey, withCustom, PRODUCT_CACHE_TTL)
    return withCustom
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    console.error('[product detail] fetch error:', err)
    return readCache<ApiProduct>(cKey)
  }
}

export async function fetchCategories(_storeSlug: string): Promise<ApiCategory[]> {
  const path = isSupabaseBackend()
    ? postgrestCategoriesPath()
    : `/api/categories?store_slug=${_storeSlug}`

  const cKey = `categories_${_storeSlug}`
  const cached = readCache<ApiCategory[]>(cKey)
  if (cached) return cached

  try {
    if (isSupabaseBackend()) {
      const rows = await apiFetch<{ id: string; name: string; slug: string }[]>(path)
      const cats: ApiCategory[] = (rows ?? []).map((r) => ({
        store_category_id:   r.id,
        store_category_name: r.name,
        store_category_slug: r.slug,
        main_category_id:    r.id,
        main_category_name:  r.name,
        category_id:         r.id,
      }))
      writeCache(cKey, cats, PRODUCT_CACHE_TTL)
      return cats
    }

    const data = await apiFetch<ApiCategory[]>(path)
    writeCache(cKey, data ?? [], PRODUCT_CACHE_TTL)
    return data ?? []
  } catch (err) {
    console.error('[categories] fetch error:', err)
    return readCache<ApiCategory[]>(cKey) ?? []
  }
}

// Fetches brands dynamically from approved products via the get_brands_with_counts RPC.
// Falls back to an empty array on any error so the page degrades gracefully.
export async function fetchBrands(_storeSlug: string): Promise<ApiBrand[]> {
  const cKey = 'brands_with_counts'
  const cached = readCache<ApiBrand[]>(cKey)
  if (cached) return cached

  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_brands_with_counts`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      console.error('[fetchBrands] RPC error', res.status, await res.text())
      return []
    }

    const rows = await res.json() as Array<{
      name: string
      slug: string
      description: string | null
      logo_url: string | null
      product_count: number
    }>

    const brands: ApiBrand[] = (rows ?? []).map((r) => ({
      name:          r.name,
      slug:          r.slug,
      description:   r.description,
      logo_url:      r.logo_url,
      product_count: Number(r.product_count ?? 0),
    }))

    writeCache(cKey, brands, PRODUCT_CACHE_TTL)
    return brands
  } catch (err) {
    console.error('[fetchBrands] error:', err)
    return []
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export async function getTrendingProductsAPI(limit = 12): Promise<Product[]> {
  const { products } = await fetchProducts({ sort: 'popular', limit })
  return products.map(toProduct)
}

export async function getBestSellersAPI(limit = 12): Promise<Product[]> {
  const { products } = await fetchProducts({ bestsellers_only: true, sort: 'popular', limit })
  return products.map(toProduct)
}

export async function getNewArrivalsAPI(limit = 12): Promise<Product[]> {
  const { products } = await fetchProducts({ new_arrivals_only: true, sort: 'newest', limit })
  return products.map(toProduct)
}

export async function getCommunityFavoritesAPI(limit = 10): Promise<Product[]> {
  const { products } = await fetchProducts({ sort: 'popular', limit })
  return products.map(toProduct)
}

export async function getFlashDealsAPI(limit = 10): Promise<Product[]> {
  const { products } = await fetchProducts({ deals_only: true, sort: 'price_asc', limit })
  return products.map(toProduct)
}

export async function getProductsByCategoryAPI(
  mainCategoryId: string,
  limit = 10,
): Promise<Product[]> {
  const { products } = await fetchProducts({ sort: 'popular', category_id: mainCategoryId, limit })
  return products.map(toProduct)
}
