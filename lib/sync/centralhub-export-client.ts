// CentralHub Products Export API Client
//
// Calls the `products-export-api` edge function on the CentralHub Supabase project.
// The x-site-key is a server-side secret — never pass it through client-side code.
// On the server (API routes / server components) use CENTRALHUB_SITE_KEY.
// On the client, call your own /api/admin/centralhub-export proxy instead.

const TIMEOUT_MS = 20_000
const MAX_RETRIES = 3

export interface ExportProduct {
  id?: string
  name: string
  brand: string
  weight: string
  price: number
  stock: number
  gtin: string
  product_type: string
  warehouse_location: string
  // extra fields present in the export but not required by the UI
  [key: string]: unknown
}

export interface FetchExportOptions {
  limit?: number
  page?: number
}

export interface ExportApiResponse {
  products: ExportProduct[]
  total?: number
  page?: number
  limit?: number
}

function getExportConfig() {
  const url = (
    process.env.CENTRALHUB_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ''
  ).replace(/\/$/, '')

  const anonKey =
    process.env.CENTRALHUB_ANON_KEY ||
    process.env.NEXT_PUBLIC_API_BASE_URL
      ? '' // can't read server-only key on client
      : ''

  // Resolved server-side only
  const siteKey = process.env.CENTRALHUB_SITE_KEY || ''

  return { url, anonKey, siteKey }
}

async function exportApiFetch<T>(
  path: string,
  anonKey: string,
  siteKey: string,
  attempt = 0,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(path, {
      signal: controller.signal,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'x-site-key': siteKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(
        `CentralHub export API ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 300)}` : ''}`,
      )
    }

    const text = await res.text()
    if (!text) return { products: [] } as unknown as T
    return JSON.parse(text) as T
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error(`CentralHub export API timed out after ${TIMEOUT_MS}ms`)
    }
    if (
      attempt < MAX_RETRIES - 1 &&
      !(err instanceof Error && /export API 4/.test(err.message))
    ) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
      return exportApiFetch<T>(path, anonKey, siteKey, attempt + 1)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Server-side only: fetches products from the CentralHub export API.
 * Requires CENTRALHUB_API_URL, CENTRALHUB_ANON_KEY, CENTRALHUB_SITE_KEY env vars.
 */
export async function fetchExportProducts(
  opts: FetchExportOptions = {},
): Promise<ExportApiResponse> {
  const { limit = 200, page = 1 } = opts
  const { url, siteKey } = getExportConfig()

  // Resolve the correct anon key for the CentralHub project
  const anonKey =
    process.env.CENTRALHUB_ANON_KEY ||
    process.env.NEXT_PUBLIC_API_BASE_URL === url
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      : ''

  if (!url) {
    throw new Error(
      'CentralHub not configured: set CENTRALHUB_API_URL or NEXT_PUBLIC_API_BASE_URL',
    )
  }

  const params = new URLSearchParams({ limit: String(limit), page: String(page) })
  const endpoint = `${url}/functions/v1/products-export-api?${params}`

  const raw = await exportApiFetch<ExportApiResponse | ExportProduct[]>(
    endpoint,
    anonKey,
    siteKey,
  )

  // Handle both `{ products: [...] }` and bare `[...]` response shapes
  if (Array.isArray(raw)) {
    return { products: raw, total: raw.length, limit, page }
  }
  return raw as ExportApiResponse
}
