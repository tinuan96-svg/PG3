// CentralHub → PocketGrocery Product Sync Engine
//
// ┌──────────────────────────────────────────────────────────────┐
// │  FIELD OWNERSHIP — The fundamental rule of this sync engine  │
// ├─────────────────────────────┬────────────────────────────────┤
// │  CentralHub owns (synced)   │  PocketGrocery owns (never     │
// │                             │  overwritten after first sync) │
// ├─────────────────────────────┼────────────────────────────────┤
// │  name                       │  image / gallery               │
// │  cost_price (from price)    │  description / short_desc      │
// │  stock_qty                  │  category_id                   │
// │  centralhub_status          │  slug                          │
// │  sku / barcode / gtin       │  seo_title / seo_description   │
// │  weight_grams               │  seo_keywords / tags           │
// │  brand (text)               │  featured                      │
// │  unit                       │  approval_status               │
// │  warehouse_location         │  visibility_status             │
// │  product_type               │  selling_price / markup_%      │
// │  centralhub_product_id      │                                │
// │  source_product_id          │                                │
// │  synced_at                  │                                │
// └─────────────────────────────┴────────────────────────────────┘
//
// PRICING RULE:
//   CentralHub `price` = our cost price (what we pay the supplier)
//   selling_price = cost_price × 1.03  (3% markup, applied at insert only)
//   Admin can later override markup_percentage; sync never overwrites selling_price.
//
// Flow:
//   CentralHub API → fetchCentralHubProducts()
//       ↓
//   syncCentralProducts() — upserts only CentralHub-owned fields
//       ↓
//   New products: approval_status='draft', needs_admin_review=true
//       ↓
//   Admin enriches: fills image / desc / category / SEO
//       ↓
//   Admin approves: approval_status='approved', visible on storefront

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  fetchCentralHubProducts,
  fetchCentralHubProduct,
  type CentralHubProduct,
} from './centralhub-client'
import { generateSlug } from '../supplier-classify'

const BATCH_SIZE = 50
const DEFAULT_MARKUP_PCT = 3

// ─── Sync result ──────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean
  logId: string | null
  productsFetched: number
  productsInserted: number
  productsUpdated: number
  productsSkipped: number
  productsFailed: number
  errors: string[]
  durationMs: number
}

// ─── Local Supabase client ────────────────────────────────────────────────────

function getLocalClient(accessToken?: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key, {
    auth: { persistSession: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
  })
}

// ─── Category resolution ──────────────────────────────────────────────────────
// NOTE: CentralHub does not expose a category FK join — categories are assigned
// by PocketGrocery admins after sync. New products arrive with category_id = null
// and needs_admin_review = true.

// ─── CentralHub-owned fields (update path) ────────────────────────────────────
//
// Only these fields are overwritten on existing products. Admin-enriched fields
// (image, description, seo_*, slug, selling_price, etc.) are NEVER touched.

function centralhubUpdateFields(chProduct: CentralHubProduct, now: string) {
  const costPrice = Number(chProduct.price ?? 0)

  return {
    name:                    chProduct.name || 'Unnamed Product',
    cost_price:              costPrice,
    compare_price:           0,
    stock_qty:               Number(chProduct.stock ?? 0),
    centralhub_status:       Number(chProduct.stock ?? 0) > 0 ? 'active' : 'inactive',
    sku:                     '',
    weight_grams:            chProduct.weight != null ? Number(chProduct.weight) : null,
    barcode:                 chProduct.gtin || '',
    brand:                   chProduct.brand || '',
    unit:                    chProduct.unit || '',
    warehouse_location:      chProduct.warehouse_location || '',
    product_type:            chProduct.product_type || 'simple',
    centralhub_product_id:   chProduct.id,
    source_product_id:       chProduct.id,
    source_type:             'centralhub' as const,
    synced_at:               now,
    updated_at:              now,
  }
}

// ─── Single product upsert ────────────────────────────────────────────────────

async function upsertProduct(
  supabase: SupabaseClient,
  chProduct: CentralHubProduct,
  existingSlugSet: Set<string>,
): Promise<'inserted' | 'updated' | 'failed'> {
  const now = new Date().toISOString()
  const updateFields = centralhubUpdateFields(chProduct, now)

  try {
    // Primary match: by source_product_id (already-synced products)
    let existing: { id: string; slug: string; approval_status: string; image: string; description: string; category_id: string | null } | null = null

    const { data: bySourceId } = await supabase
      .from('products')
      .select('id, slug, approval_status, image, description, category_id')
      .eq('source_product_id', chProduct.id)
      .maybeSingle()

    existing = bySourceId as typeof existing

    // Fallback match: by product name for seeded/manually-added products not yet linked to CentralHub.
    // Only matches products that are NOT already sourced from CentralHub (source_type IS NULL or different).
    if (!existing && chProduct.name) {
      const { data: byName } = await supabase
        .from('products')
        .select('id, slug, approval_status, image, description, category_id')
        .ilike('name', chProduct.name.trim())
        .not('source_type', 'eq', 'centralhub')
        .maybeSingle()
      existing = byName as typeof existing
    }

    if (existing) {
      // UPDATE: only touch CentralHub-owned fields — admin fields are preserved
      await (supabase as any).from('products').update(updateFields).eq('id', (existing as any).id)
      return 'updated'
    }

    // INSERT: brand-new product from CentralHub
    // Category cannot be resolved from CentralHub (no FK join available) — admin assigns it
    const localCategoryId = null

    // CentralHub does not expose image columns — admin uploads images after sync
    const primaryImage = ''
    const galleryImages: string[] = []

    // Use CentralHub slug if available, otherwise generate from name
    let slug = chProduct.slug ? chProduct.slug.trim() : generateSlug(chProduct.name ?? 'product')
    if (!slug) slug = generateSlug(chProduct.name ?? 'product')
    if (existingSlugSet.has(slug)) {
      slug = `${slug}-${chProduct.id.slice(0, 8)}`
    }
    existingSlugSet.add(slug)

    const costPrice = updateFields.cost_price
    // Selling price = cost × 1.03 (3% markup). Admin can override this later.
    const sellingPrice = costPrice > 0
      ? Math.round(costPrice * (1 + DEFAULT_MARKUP_PCT / 100) * 100) / 100
      : 0
    const profitAmount = Math.round((sellingPrice - costPrice) * 100) / 100

    await (supabase as any).from('products').insert({
      ...updateFields,
      slug,
      // price kept in sync with selling_price for storefront compat
      price:              sellingPrice,
      selling_price:      sellingPrice,
      markup_percentage:  DEFAULT_MARKUP_PCT,
      profit_amount:      profitAmount,
      // Initial media from CentralHub — admin can replace
      image:              primaryImage,
      gallery:            galleryImages.length > 0 ? galleryImages : [],
      category_id:        localCategoryId,
      // Admin-owned content — start empty, must be filled before approval
      short_description:  '',
      description:        '',
      seo_title:          '',
      seo_description:    '',
      seo_keywords:       '',
      tags:               [],
      featured:           false,
      // Workflow — new products are always drafts pending admin review
      approval_status:    'draft',
      visibility_status:  'hidden',
      needs_admin_review: !primaryImage || !localCategoryId,
      created_at:         now,
    })

    return 'inserted'
  } catch (err) {
    console.error('[sync] upsertProduct error for', chProduct.id, ':', err)
    throw err
  }
}

// ─── Sync log helpers ─────────────────────────────────────────────────────────

async function createSyncLog(supabase: SupabaseClient, triggeredBy: string): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('centralhub_sync_logs')
    .insert({ triggered_by: triggeredBy, started_at: new Date().toISOString() })
    .select('id')
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

async function updateSyncLog(
  supabase: SupabaseClient,
  logId: string,
  stats: Omit<SyncResult, 'success' | 'logId' | 'durationMs'>,
): Promise<void> {
  await (supabase as any)
    .from('centralhub_sync_logs')
    .update({
      completed_at:      new Date().toISOString(),
      products_fetched:  stats.productsFetched,
      products_inserted: stats.productsInserted,
      products_updated:  stats.productsUpdated,
      products_skipped:  stats.productsSkipped,
      products_failed:   stats.productsFailed,
      error_messages:    stats.errors.length > 0 ? stats.errors.slice(0, 50) : null,
    })
    .eq('id', logId)
}

// ─── Main sync function ───────────────────────────────────────────────────────

export interface SyncOptions {
  triggeredBy?: string
  accessToken?: string
  force?: boolean
}

export async function syncCentralProducts(opts: SyncOptions = {}): Promise<SyncResult> {
  const { triggeredBy = 'manual', accessToken } = opts
  const startMs = Date.now()

  const supabase = getLocalClient(accessToken)
  const logId = await createSyncLog(supabase, triggeredBy)

  let fetched = 0, inserted = 0, updated = 0, skipped = 0, failed = 0
  const errors: string[] = []

  const { data: slugRows } = await supabase.from('products').select('slug')
  const existingSlugSet = new Set<string>((slugRows ?? []).map((r: { slug: string }) => r.slug))

  try {
    let page = 1
    let hasMore = true

    while (hasMore) {
      let batch: CentralHubProduct[]
      try {
        batch = await fetchCentralHubProducts({
          page,
          pageSize: BATCH_SIZE,
        })
      } catch (err) {
        const msg = `Page ${page} fetch failed: ${String(err)}`
        errors.push(msg)
        console.error('[sync]', msg)
        break
      }

      if (batch.length === 0) { hasMore = false; break }
      fetched += batch.length

      const results = await Promise.allSettled(
        batch.map((p) => upsertProduct(supabase, p, existingSlugSet)),
      )

      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value === 'inserted') inserted++
          else if (r.value === 'updated') updated++
          else skipped++
        } else {
          failed++
          if (errors.length < 50) errors.push(String(r.reason))
        }
      }

      page++
      if (batch.length < BATCH_SIZE) hasMore = false
    }
  } catch (err) {
    errors.push(`Fatal sync error: ${String(err)}`)
  }

  const stats = {
    productsFetched:  fetched,
    productsInserted: inserted,
    productsUpdated:  updated,
    productsSkipped:  skipped,
    productsFailed:   failed,
    errors,
  }

  if (logId) await updateSyncLog(supabase, logId, stats)

  return {
    success: fetched > 0 && failed === 0,
    logId,
    ...stats,
    durationMs: Date.now() - startMs,
  }
}

export async function syncSingleProduct(
  centralHubProductId: string,
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const { triggeredBy = 'manual', accessToken } = opts
  const startMs = Date.now()

  const supabase = getLocalClient(accessToken)
  const logId = await createSyncLog(supabase, triggeredBy)

  let inserted = 0, updated = 0, failed = 0
  const errors: string[] = []

  const { data: slugRows } = await supabase.from('products').select('slug')
  const existingSlugSet = new Set<string>((slugRows ?? []).map((r: { slug: string }) => r.slug))

  try {
    const product = await fetchCentralHubProduct(centralHubProductId)

    if (!product) {
      errors.push(`Product ${centralHubProductId} not found on CentralHub`)
    } else {
      const outcome = await upsertProduct(supabase, product, existingSlugSet)
      if (outcome === 'inserted') inserted++
      else if (outcome === 'updated') updated++
    }
  } catch (err) {
    failed++
    errors.push(String(err))
  }

  const stats = {
    productsFetched:  1,
    productsInserted: inserted,
    productsUpdated:  updated,
    productsSkipped:  0,
    productsFailed:   failed,
    errors,
  }

  if (logId) await updateSyncLog(supabase, logId, stats)

  return {
    success: errors.length === 0,
    logId,
    ...stats,
    durationMs: Date.now() - startMs,
  }
}

export async function getSyncLogs(limit = 50, accessToken?: string) {
  const supabase = getLocalClient(accessToken)
  const { data } = await (supabase as any)
    .from('centralhub_sync_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
