/**
 * CentralHub API client.
 *
 * CentralHub is the source of truth for: name, SKU, barcode, brand, cost price,
 * selling price, stock, weight, unit, and product status.
 *
 * PocketGrocery owns: categories, images, descriptions, SEO, slug, featured,
 * homepage visibility, tags, and badges.
 *
 * This service NEVER overwrites PocketGrocery-owned fields.
 */

const BASE_URL = process.env.CENTRALHUB_API_URL ?? process.env.NEXT_PUBLIC_CENTRALHUB_API_URL ?? ''
const API_KEY  = process.env.CENTRALHUB_API_KEY  ?? process.env.NEXT_PUBLIC_CENTRALHUB_API_KEY  ?? ''

export type CentralHubProduct = {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  brand: string | null
  cost_price: number
  selling_price: number
  stock_qty: number
  weight_grams: number | null
  unit: string | null
  status: 'active' | 'inactive' | 'discontinued'
  category: string | null
  updated_at: string
}

export type CentralHubBrand = {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

export type SyncResult = {
  success: boolean
  synced: number
  created: number
  updated: number
  errors: string[]
  duration_ms: number
}

function isConfigured(): boolean {
  return Boolean(BASE_URL && API_KEY)
}

async function get<T>(path: string): Promise<T> {
  if (!isConfigured()) {
    throw new Error('CentralHub API is not configured. Set CENTRALHUB_API_URL and CENTRALHUB_API_KEY.')
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    next: { revalidate: 60 },
  })
  if (!res.ok) {
    throw new Error(`CentralHub API error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

/** Fetch all products from CentralHub with pagination. */
export async function fetchProducts(page = 1, pageSize = 100): Promise<CentralHubProduct[]> {
  return get<CentralHubProduct[]>(`/products?page=${page}&per_page=${pageSize}`)
}

/** Fetch all brands from CentralHub. */
export async function fetchBrands(): Promise<CentralHubBrand[]> {
  return get<CentralHubBrand[]>('/brands')
}

/** Fetch a single product by its CentralHub ID. */
export async function fetchProduct(id: string): Promise<CentralHubProduct> {
  return get<CentralHubProduct>(`/products/${id}`)
}

/** Check connectivity — returns true if API responds. */
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isConfigured()) {
    return { ok: false, message: 'CENTRALHUB_API_URL or CENTRALHUB_API_KEY not set' }
  }
  try {
    await get('/health')
    return { ok: true, message: 'Connected' }
  } catch (e) {
    return { ok: false, message: String(e) }
  }
}

export const centralHubService = {
  isConfigured,
  fetchProducts,
  fetchBrands,
  fetchProduct,
  testConnection,
}

export default centralHubService
