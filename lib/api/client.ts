// Centralized API client.
// When NEXT_PUBLIC_API_BASE_URL points at Supabase, requests go to PostgREST
// with the anon key automatically included. When pointed at CentralHub, the
// same fetch wrapper is used without the Supabase headers.

const DEFAULT_TIMEOUT_MS = 10_000
const MAX_RETRIES = 2
const CACHE_VERSION = 'v2'

// Prefer NEXT_PUBLIC_SUPABASE_URL so products always come from the right project.
// Fall back to NEXT_PUBLIC_API_BASE_URL for backwards compatibility.
const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ''
).replace(/\/$/, '')

const SUPABASE_ANON_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''
)

// API_BASE_URL always resolves to the PocketGrocery Supabase project.
// NEXT_PUBLIC_API_BASE_URL is accepted as an override but must equal SUPABASE_URL
// for PostgREST auth headers to work — use SUPABASE_URL as the canonical value.
export const API_BASE_URL = SUPABASE_URL ||
  (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

// Always true when we have a Supabase URL — products always live in Supabase.
export function isSupabaseBackend(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface FetchOptions extends RequestInit {
  timeoutMs?: number
  retries?: number
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = MAX_RETRIES, ...init } = options

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

  const extraHeaders: Record<string, string> = {}
  if (isSupabaseBackend()) {
    extraHeaders['apikey'] = SUPABASE_ANON_KEY
    extraHeaders['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`
    // Ask PostgREST to return the total row count in the header
    extraHeaders['Prefer'] = 'count=exact'
  }

  let lastError: Error = new ApiError(0, 'Unknown error')

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...extraHeaders,
          ...(init.headers ?? {}),
        },
      })

      if (!res.ok) {
        throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`)
      }

      const text = await res.text()
      if (!text) return [] as unknown as T

      try {
        return JSON.parse(text) as T
      } catch {
        throw new ApiError(0, 'Invalid JSON response from API')
      }
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err // 4xx — do not retry
      }
      if ((err as Error).name === 'AbortError') {
        lastError = new ApiError(0, `Request timed out after ${timeoutMs}ms`)
      } else {
        lastError = err as Error
      }
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
      }
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError
}

// ─── localStorage cache helpers ───────────────────────────────────────────────

function cacheKey(key: string): string {
  return `pg_api_cache_${CACHE_VERSION}_${key}`
}

export function writeCache<T>(key: string, data: T, ttlMs: number): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      cacheKey(key),
      JSON.stringify({ data, expiresAt: Date.now() + ttlMs }),
    )
  } catch {
    // Storage full or unavailable — silent
  }
}

export function readCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(cacheKey(key))
    if (!raw) return null
    const { data, expiresAt } = JSON.parse(raw)
    if (Date.now() > expiresAt) {
      window.localStorage.removeItem(cacheKey(key))
      return null
    }
    return data as T
  } catch {
    return null
  }
}

// Purge stale PocketGrocery API cache entries (old version keys + Supabase-era leftovers)
export function purgeStaleCache(): void {
  if (typeof window === 'undefined') return
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (!k) continue
      if (k.startsWith('pg_api_cache_') && !k.startsWith(`pg_api_cache_${CACHE_VERSION}_`)) {
        keysToRemove.push(k)
      }
      if (k.startsWith('pg_products_') || k.startsWith('supabase.')) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k))
  } catch {
    // Silent
  }
}
