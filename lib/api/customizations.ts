// Local customization layer.
// PocketGrocery can override any field from the API product without modifying
// master data. Customizations are stored in localStorage and merged on top of
// the raw API response before rendering.
//
// Priority: local customization > API value

import type { ApiProduct } from './products'

export interface ProductCustomization {
  product_id: string
  custom_title?: string
  custom_price?: number
  hidden?: boolean
  local_category?: string
  updated_at: number
}

const STORAGE_KEY = 'pg_product_customizations_v1'

function loadAll(): Record<string, ProductCustomization> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAll(map: Record<string, ProductCustomization>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Storage full — silent
  }
}

export function getCustomization(productId: string): ProductCustomization | null {
  if (!productId) return null
  const all = loadAll()
  return all[productId] ?? null
}

export function setCustomization(
  productId: string,
  fields: Omit<ProductCustomization, 'product_id' | 'updated_at'>,
): void {
  const all = loadAll()
  all[productId] = { ...all[productId], ...fields, product_id: productId, updated_at: Date.now() }
  saveAll(all)
}

export function removeCustomization(productId: string): void {
  const all = loadAll()
  delete all[productId]
  saveAll(all)
}

export function getAllCustomizations(): ProductCustomization[] {
  return Object.values(loadAll())
}

// Merges local customization fields on top of the API product.
// Returns the product unchanged if no customization exists.
// NEVER returns null — hidden check is separate (isProductHidden).
export function applyCustomizations(product: ApiProduct): ApiProduct {
  const id = product.id ?? product.product_id ?? ''
  if (!id) return product

  const custom = getCustomization(id)
  if (!custom) return product

  return {
    ...product,
    // Title: prefer custom_title, then original name, safe fallback
    name: custom.custom_title ?? product.name ?? 'Unnamed Product',
    // Price: prefer custom_price, then original
    price: custom.custom_price != null ? Number(custom.custom_price) : product.price,
    // Category: prefer local_category, then original
    category: custom.local_category ?? product.category ?? 'Uncategorized',
  }
}

// Returns true if a product should be hidden from listings.
// Only called at the listing layer — never inside applyCustomizations.
export function isProductHidden(productId: string): boolean {
  if (!productId) return false
  const custom = getCustomization(productId)
  return custom?.hidden === true
}
