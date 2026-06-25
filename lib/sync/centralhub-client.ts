// CentralHub API Client
//
// Fetches product data from CentralHub via PostgREST.
// CENTRALHUB_API_URL must be the base Supabase URL (with or without /rest/v1 suffix).
// CENTRALHUB_API_KEY is the Supabase publishable key (sb_publishable_...).
//
// Field ownership:
//   CentralHub owns: id, name, price (= cost_price), stock, brand (text),
//                    weight, gtin, unit, product_type, warehouse_location, slug
//   PocketGrocery owns: image, description, category, seo_*, featured, tags,
//                       selling_price, approval_status, visibility_status
//
// CentralHub schema (actual columns — columns NOT listed here must NOT be
// added to PRODUCT_SELECT or PostgREST returns 400):
//   id, name, price, stock, product_type, brand, warehouse_location,
//   weight, gtin, unit, centralhub_product_id, slug

const TIMEOUT_MS = 15_000
const MAX_RETRIES = 3

const PRODUCT_SELECT = [
  'id',
  'name',
  'price',
  'stock',
  'product_type',
  'brand',
  'warehouse_location',
  'weight',
  'gtin',
  'unit',
  'slug',
].join(',')

function getCentralHubConfig() {
  const raw = (
    process.env.CENTRALHUB_API_URL ||
    process.env.NEXT_PUBLIC_CENTRALHUB_API_URL ||
    ''
  ).replace(/\/$/, '').replace(/\/rest\/v1$/, '')

  const key =
    process.env.CENTRALHUB_API_KEY ||
    process.env.CENTRALHUB_ANON_KEY ||
    process.env.NEXT_PUBLIC_CENTRALHUB_ANON_KEY ||
    ''

  return { url: raw, key }
}

// ─── PostgREST fetcher ────────────────────────────────────────────────────────

async function postgrestFetch<T>(path: string, attempt = 0): Promise<T> {
  const { url, key } = getCentralHubConfig()
  if (!url || !key) {
    throw new Error('CentralHub not configured: set CENTRALHUB_API_URL and CENTRALHUB_API_KEY')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${url}/rest/v1${path}`, {
      signal: controller.signal,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`CentralHub ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 300)}` : ''}`)
    }

    const text = await res.text()
    if (!text) return [] as unknown as T
    return JSON.parse(text) as T
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error(`CentralHub request timed out after ${TIMEOUT_MS}ms`)
    }
    if (
      attempt < MAX_RETRIES - 1 &&
      !(err instanceof Error && /^CentralHub 4/.test(err.message))
    ) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
      return postgrestFetch<T>(path, attempt + 1)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// ─── CentralHub product shape ─────────────────────────────────────────────────

export interface CentralHubProduct {
  id: string
  name: string
  price: number
  stock: number
  product_type?: string | null
  brand?: string | null
  warehouse_location?: string | null
  weight?: number | null
  gtin?: string | null
  unit?: string | null
  slug?: string | null
}

export interface CentralHubCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  image_url?: string | null
}

export interface CentralHubBrand {
  id: string
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
}

export interface FetchProductsOptions {
  page?: number
  pageSize?: number
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchCentralHubProducts(
  opts: FetchProductsOptions = {},
): Promise<CentralHubProduct[]> {
  const { page = 1, pageSize = 100 } = opts
  const offset = (page - 1) * pageSize

  const params = new URLSearchParams()
  params.set('select', PRODUCT_SELECT)
  params.set('order', 'id.asc')
  params.set('limit', String(pageSize))
  params.set('offset', String(offset))

  try {
    return await postgrestFetch<CentralHubProduct[]>(`/products?${params}`)
  } catch (err) {
    console.error('[centralhub] fetchProducts error:', err)
    throw err
  }
}

export async function fetchCentralHubProduct(id: string): Promise<CentralHubProduct | null> {
  const params = new URLSearchParams()
  params.set('select', PRODUCT_SELECT)
  params.set('id', `eq.${id}`)
  params.set('limit', '1')

  const rows = await postgrestFetch<CentralHubProduct[]>(`/products?${params}`)
  return rows[0] ?? null
}

export async function fetchCentralHubCategories(): Promise<CentralHubCategory[]> {
  return postgrestFetch<CentralHubCategory[]>(
    '/categories?select=id,name,slug,description,image_url&order=name.asc',
  )
}

export async function fetchCentralHubBrands(): Promise<CentralHubBrand[]> {
  return postgrestFetch<CentralHubBrand[]>(
    '/brands?select=id,name,slug,description,logo_url&order=name.asc',
  )
}

export async function testCentralHubConnection(): Promise<{
  ok: boolean
  message: string
  productCount?: number
}> {
  try {
    const { url, key } = getCentralHubConfig()
    if (!url || !key) throw new Error('CentralHub not configured')

    const res = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'count=exact',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`CentralHub ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 200)}` : ''}`)
    }

    // Content-Range: 0-0/371  — parse total from the slash
    const contentRange = res.headers.get('content-range') ?? ''
    const total = parseInt(contentRange.split('/')[1] ?? '', 10)
    const productCount = isNaN(total) ? undefined : total

    return { ok: true, message: 'Connected to CentralHub', productCount }
  } catch (err) {
    return { ok: false, message: String(err) }
  }
}
