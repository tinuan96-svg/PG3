// API-based product fetching — replaces direct Supabase RPC calls.
// All data comes from NEXT_PUBLIC_API_BASE_URL via lib/api/products.ts
import type { Product } from './products-data'
import {
  getTrendingProductsAPI,
  getBestSellersAPI,
  getNewArrivalsAPI,
  getCommunityFavoritesAPI,
  getFlashDealsAPI,
  getProductsByCategoryAPI,
  fetchProducts,
  toProduct,
} from './api/products'

export async function getTrendingProductsDB(limit = 12): Promise<Product[]> {
  return getTrendingProductsAPI(limit)
}

export async function getBestSellersDB(limit = 12): Promise<Product[]> {
  return getBestSellersAPI(limit)
}

export async function getNewArrivalsDB(limit = 12): Promise<Product[]> {
  return getNewArrivalsAPI(limit)
}

export async function getCommunityFavoritesDB(limit = 10): Promise<Product[]> {
  return getCommunityFavoritesAPI(limit)
}

export async function getFlashDealsDB(limit = 10): Promise<Product[]> {
  return getFlashDealsAPI(limit)
}

export async function getProductsByCategoryDB(
  mainCategoryId: string,
  limit = 10,
): Promise<Product[]> {
  return getProductsByCategoryAPI(mainCategoryId, limit)
}

export async function getAllStoreProductsDB(limit = 50, offset = 0): Promise<Product[]> {
  const { products } = await fetchProducts({
    store_slug: 'pocket-grocery',
    sort: 'popular',
    limit,
    offset,
  })
  return products.map(toProduct)
}
