// Store data layer — API-based, no direct Supabase dependency.
// When NEXT_PUBLIC_API_BASE_URL points at Supabase, calls PostgREST directly.
// When pointed at CentralHub, calls /api/store-page.
import { apiFetch, isSupabaseBackend, readCache, writeCache } from './api/client'
import { applyCustomizations, isProductHidden } from './api/customizations'
import { fetchProducts, fetchCategories, type ApiProduct } from './api/products'

export interface StoreHeader {
  store_id: string
  name: string
  slug: string
  domain: string | null
  color: string | null
  visibility: boolean
  max_display_stock: number
  timezone: string | null
  default_currency: string | null
  tax_inclusive: boolean | null
  show_stock_levels: boolean | null
  show_price_per_unit: boolean | null
  title_format: string | null
  decimal_places: number | null
}

export interface StoreCategory {
  main_category_id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
  product_count: number
}

export interface StoreProductCard {
  product_id: string
  slug: string
  name: string
  description: string | null
  image_url: string | null
  gallery_images: string[] | null
  price: number
  original_price: number | null
  discount_percentage: number
  stock: number
  in_stock: boolean
  allow_backorder: boolean
  has_variants: boolean
  category_id: string | null
  main_category_id: string | null
  is_bestseller: boolean
  is_deal: boolean
  is_new_arrival: boolean
  is_trending: boolean
  sales_last_30_days: number | null
  velocity_score: number | null
  brand: string | null
  weight: string | null
}

export type SortOption = 'popular' | 'newest' | 'price_asc' | 'price_desc'

export interface ProductsFilter {
  categoryId?: string | null
  search?: string | null
  minPrice?: number | null
  maxPrice?: number | null
  inStockOnly?: boolean
  sort?: SortOption
  page?: number
  pageSize?: number
}

export interface StorePageData {
  header: StoreHeader
  categories: StoreCategory[]
  products: StoreProductCard[]
  total_count: number
  hasMore: boolean
  page: number
  pageSize: number
}

const PLACEHOLDER_IMAGE =
  'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400'

const CACHE_TTL = 5 * 60 * 1000

const FALLBACK_HEADER: StoreHeader = {
  store_id: 'pocket-grocery',
  name: 'PocketGrocery',
  slug: 'pocket-grocery',
  domain: null,
  color: 'green',
  visibility: true,
  max_display_stock: 5,
  timezone: 'Europe/London',
  default_currency: 'GBP',
  tax_inclusive: true,
  show_stock_levels: true,
  show_price_per_unit: false,
  title_format: null,
  decimal_places: 2,
}

function apiProductToCard(p: ApiProduct): StoreProductCard {
  const withCustom = applyCustomizations(p)
  return {
    product_id: withCustom.id ?? withCustom.product_id ?? '',
    slug: withCustom.slug ?? '',
    name: withCustom.name ?? '',
    description: withCustom.description ?? null,
    image_url: withCustom.image_url ?? withCustom.image ?? PLACEHOLDER_IMAGE,
    gallery_images: withCustom.gallery_images ?? null,
    price: Number(withCustom.price ?? 0),
    original_price: withCustom.original_price != null ? Number(withCustom.original_price) : null,
    discount_percentage: Number(withCustom.discount_percentage ?? 0),
    stock: Number(withCustom.stock ?? 0),
    in_stock: Boolean(withCustom.in_stock),
    allow_backorder: Boolean(withCustom.allow_backorder),
    has_variants: Boolean(withCustom.has_variants),
    category_id: withCustom.category_id ?? null,
    main_category_id: withCustom.category_id ?? null,
    is_bestseller: Boolean(withCustom.is_bestseller),
    is_deal: Boolean(withCustom.is_deal),
    is_new_arrival: Boolean(withCustom.is_new_arrival),
    is_trending: Boolean(withCustom.is_trending),
    sales_last_30_days: withCustom.sales_last_30_days ?? null,
    velocity_score: withCustom.velocity_score ?? null,
    brand: withCustom.brand ?? null,
    weight: withCustom.weight ?? null,
  }
}

// Builds StorePageData by composing fetchProducts + fetchCategories when
// pointing at Supabase PostgREST (which has no /api/store-page endpoint).
async function getStorePageDataFromPostgREST(
  _slug: string,
  filters: ProductsFilter,
): Promise<StorePageData> {
  const {
    categoryId = null,
    search = null,
    inStockOnly = false,
    sort = 'popular',
    page = 1,
    pageSize = 20,
  } = filters

  const offset = (page - 1) * pageSize

  const [productsResult, apiCategories] = await Promise.all([
    fetchProducts({
      search,
      category_id: categoryId,
      in_stock_only: inStockOnly,
      sort,
      limit: pageSize,
      offset,
    }),
    fetchCategories(_slug),
  ])

  const products = productsResult.products
    .filter((p) => !isProductHidden(p.id ?? p.product_id ?? ''))
    .map(apiProductToCard)

  const categories: StoreCategory[] = apiCategories.map((c) => ({
    main_category_id: c.main_category_id ?? c.store_category_id,
    name: c.store_category_name,
    slug: c.store_category_slug,
    description: null,
    sort_order: 0,
    is_active: true,
    product_count: 0,
  }))

  return {
    header: FALLBACK_HEADER,
    categories,
    products,
    total_count: productsResult.total_count,
    hasMore: productsResult.hasMore,
    page,
    pageSize,
  }
}

export async function getStorePageData(
  slug: string,
  filters: ProductsFilter = {},
): Promise<StorePageData | null> {
  const { page = 1, pageSize = 20 } = filters
  const offset = (page - 1) * pageSize

  const filterKey = JSON.stringify({ ...filters, page, pageSize })
  const cKey = `store_page_${slug}_${filterKey}`
  const cached = readCache<StorePageData>(cKey)
  if (cached) return cached

  try {
    // When pointing at Supabase, compose from individual PostgREST calls
    if (isSupabaseBackend()) {
      const result = await getStorePageDataFromPostgREST(slug, filters)
      writeCache(cKey, result, CACHE_TTL)
      return result
    }

    // CentralHub: single /api/store-page call
    const params = new URLSearchParams({ store_slug: slug, sort: filters.sort ?? 'popular', limit: String(pageSize), offset: String(offset) })
    if (filters.search) params.set('search', filters.search)
    if (filters.categoryId) params.set('category_id', filters.categoryId)
    if (filters.inStockOnly) params.set('in_stock_only', 'true')

    const data = await apiFetch<{
      header?: StoreHeader
      categories?: StoreCategory[]
      products?: ApiProduct[]
      total_count?: number
    }>(`/api/store-page?${params}`)

    if (!data) return null

    const totalCount = Number(data.total_count ?? 0)
    const products = (data.products ?? [])
      .filter((p) => !isProductHidden(p.id ?? p.product_id ?? ''))
      .map(apiProductToCard)

    const result: StorePageData = {
      header: data.header ?? FALLBACK_HEADER,
      categories: data.categories ?? [],
      products,
      total_count: totalCount,
      hasMore: offset + pageSize < totalCount,
      page,
      pageSize,
    }

    writeCache(cKey, result, CACHE_TTL)
    return result
  } catch (err) {
    console.error('[getStorePageData]', err)
    const stale = readCache<StorePageData>(cKey)
    if (stale) return stale
    return null
  }
}

export async function getStoreProducts(
  slug: string,
  filters: ProductsFilter = {},
): Promise<{ products: StoreProductCard[]; total_count: number; hasMore: boolean }> {
  const result = await getStorePageData(slug, filters)
  if (!result) return { products: [], total_count: 0, hasMore: false }
  return { products: result.products, total_count: result.total_count, hasMore: result.hasMore }
}
