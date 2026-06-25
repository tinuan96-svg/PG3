// Category fetching — API-based, no direct Supabase dependency.
import { fetchCategories } from './api/products'

export interface StoreCategory {
  store_category_id: string
  store_category_name: string
  store_category_slug: string
  main_category_id: string | null
  main_category_name: string | null
  category_id: string | null
}

export async function getStoreCategories(storeSlug: string): Promise<StoreCategory[]> {
  return fetchCategories(storeSlug)
}

export function invalidateCategoryCache(_storeSlug?: string): void {
  // Cache invalidation is handled by lib/api/client.ts TTL
}
