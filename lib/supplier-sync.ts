import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { classifyCategory, detectAndCleanBrand, generateSlug, mapStockStatus } from './supplier-classify'
import { generateProductSEO } from './supplier-seo'
import {
  normalizeProductTitle,
  normalizeVariationLabel,
  buildVariationTitle,
  normalizeWeight,
} from './supplier-normalize'

function createSupabaseClient(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  )
}

interface WCProduct {
  id: number
  name: string
  slug: string
  type: string
  description: string
  short_description: string
  price: string
  regular_price: string
  sale_price: string
  stock_quantity: number | null
  stock_status: string
  backorders: string
  weight: string
  images: Array<{ src: string }>
  categories: Array<{ id: number; name: string; slug: string }>
  tags: Array<{ id: number; name: string }>
  attributes: Array<{ name: string; options: string[] }>
  variations: number[]
  meta_data: Array<{ key: string; value: unknown }>
}

interface WCVariation {
  id: number
  price: string
  regular_price: string
  sale_price: string
  stock_quantity: number | null
  stock_status: string
  attributes: Array<{ name: string; option: string }>
  images: Array<{ src: string }>
}

export interface SyncResult {
  success: boolean
  logId: string | null
  productsFetched: number
  productsInserted: number
  productsUpdated: number
  productsCategorized: number
  productsCleaned: number
  duplicatesDetected: number
  productsFailed: number
  errors: string[]
}

async function fetchWCProducts(
  apiUrl: string,
  consumerKey: string,
  consumerSecret: string,
  page: number
): Promise<WCProduct[]> {
  const base64 = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
  const url = `${apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/products?page=${page}&per_page=100&status=publish`
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${base64}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`WooCommerce API ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 200)}` : ''}`)
  }
  const data = await res.json()
  if (!Array.isArray(data)) {
    throw new Error(`WooCommerce API returned non-array: ${JSON.stringify(data).slice(0, 200)}`)
  }
  return data
}

async function fetchWCVariations(
  apiUrl: string,
  consumerKey: string,
  consumerSecret: string,
  productId: number
): Promise<WCVariation[]> {
  const base64 = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
  const url = `${apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/products/${productId}/variations?per_page=100`
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${base64}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function getExistingBrandNames(supabase: SupabaseClient<Database>): Promise<string[]> {
  const { data } = await supabase.from('brands').select('name')
  return (data ?? []).map((b) => b.name)
}

async function findOrCreateBrand(supabase: SupabaseClient<Database>, brandName: string): Promise<string | null> {
  if (!brandName) return null
  const { data: existing } = await supabase
    .from('brands')
    .select('id')
    .ilike('name', brandName)
    .maybeSingle()
  if (existing) return existing.id

  const slug = generateSlug(brandName)
  const logoPlaceholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(brandName)}&background=5FAE9B&color=fff&size=200&bold=true`
  const { data: created, error } = await supabase
    .from('brands')
    .insert({ name: brandName, slug, logo_url: logoPlaceholder })
    .select('id')
    .single()
  if (error) throw new Error(`Brand insert failed: ${error.message}`)
  return created?.id ?? null
}

async function findOrCreateCategory(supabase: SupabaseClient<Database>, categoryName: string): Promise<string | null> {
  if (!categoryName) return null
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', categoryName)
    .maybeSingle()
  if (existing) return existing.id

  const slug = generateSlug(categoryName)
  const { data: created, error } = await supabase
    .from('categories')
    .insert({ name: categoryName, slug })
    .select('id')
    .single()
  if (error) throw new Error(`Category insert failed: ${error.message}`)
  return created?.id ?? null
}

function ensureUniqueSlug(base: string, existingSlugs: Set<string>): string {
  let slug = base
  let counter = 1
  while (existingSlugs.has(slug)) {
    slug = `${base}-${counter}`
    counter++
  }
  existingSlugs.add(slug)
  return slug
}

type ProcessStats = { inserted: number; updated: number; categorized: number; cleaned: number; duplicates: number }

async function processProduct(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  markupPct: number,
  wcProduct: WCProduct,
  variations: WCVariation[],
  existingBrands: string[],
  existingSlugs: Set<string>
): Promise<ProcessStats> {
  const stats: ProcessStats = { inserted: 0, updated: 0, categorized: 1, cleaned: 0, duplicates: 0 }

  const productsToProcess: Array<{
    supplierId: string
    rawTitle: string
    price: number
    stockQty: number
    stockStatus: string
    rawWeight: string | null
    images: string[]
    variationAttrs: Array<{ name: string; option: string }>
  }> = []

  if (wcProduct.type === 'variable' && variations.length > 0) {
    for (const v of variations) {
      productsToProcess.push({
        supplierId: `${wcProduct.id}-${v.id}`,
        rawTitle: wcProduct.name,
        price: parseFloat(v.price || v.regular_price) || 0,
        stockQty: v.stock_quantity ?? 0,
        stockStatus: v.stock_status,
        rawWeight: null,
        images: v.images.length > 0 ? v.images.map((i) => i.src) : wcProduct.images.map((i) => i.src),
        variationAttrs: v.attributes,
      })
    }
  } else if (wcProduct.type === 'simple' || wcProduct.type === 'variable') {
    productsToProcess.push({
      supplierId: String(wcProduct.id),
      rawTitle: wcProduct.name,
      price: parseFloat(wcProduct.price || wcProduct.regular_price) || 0,
      stockQty: wcProduct.stock_quantity ?? 0,
      stockStatus: wcProduct.stock_status,
      rawWeight: wcProduct.weight || null,
      images: wcProduct.images.map((i) => i.src),
      variationAttrs: [],
    })
  }

  for (const item of productsToProcess) {
    const { brand, cleanTitle: brandCleaned } = detectAndCleanBrand(item.rawTitle, existingBrands)
    const { cleanTitle, weightNormalized, wasCleaned } = normalizeProductTitle(brandCleaned)

    let displayTitle: string
    let weightForDisplay: string | null = null

    if (item.variationAttrs.length > 0) {
      const varLabel = normalizeVariationLabel(item.variationAttrs)
      displayTitle = buildVariationTitle(cleanTitle, varLabel)
      weightForDisplay = varLabel
    } else {
      displayTitle = cleanTitle
      weightForDisplay = weightNormalized?.normalized ?? item.rawWeight ?? null
    }

    const rawWeightForField = item.rawWeight
    const weightResult = weightNormalized ?? (rawWeightForField ? normalizeWeight(rawWeightForField) : null)

    const { category, tags } = classifyCategory(displayTitle)
    const storePrice = item.price > 0 ? Math.ceil(item.price * (1 + markupPct / 100) * 100) / 100 : 0
    const seo = generateProductSEO(displayTitle, brand, category, weightForDisplay)

    const needsAiImage = item.images.length === 0
    const categoryImages: Record<string, string> = {
      'Rice & Grains': '/rice-grains.webp',
      'Rice & Flour': '/rice-flour.webp',
      'Spices & Masalas': '/spices.webp',
      'Snacks & Sweets': '/snacks.webp',
      'Pickles & Chutneys': '/pickles.webp',
      'Oils & Ghee': '/oils.webp',
      'Pulses & Lentils': '/pulses.webp',
      'Ready Meals': '/ready-meals.webp',
      'Tea & Coffee': '/tea.webp',
      'Coconut Products': '/coconut.webp',
      'Breakfast Items': '/breakfast.webp',
      'Frozen Foods': '/frozen.webp',
      'Condiments & Sauces': '/condiments.webp',
      'Papads & Wafers': '/papads.webp',
      'General Grocery': '/grocery.webp',
    }
    const images = needsAiImage
      ? [categoryImages[category] ?? '/grocery.webp']
      : item.images

    const brandId = brand ? await findOrCreateBrand(supabase, brand) : null
    const categoryId = await findOrCreateCategory(supabase, category)

    if (wasCleaned || item.variationAttrs.length > 0) stats.cleaned++

    const { data: existingBySupplier } = await supabase
      .from('products')
      .select('id')
      .eq('supplier_id', item.supplierId)
      .eq('supplier_connection_id', connectionId)
      .maybeSingle()

    if (existingBySupplier) {
      const { error: updateErr } = await supabase
        .from('products')
        .update({
          stock_quantity: item.stockQty,
          stock_status: mapStockStatus(item.stockStatus),
          supplier_price: item.price,
          price: storePrice,
          weight: weightResult?.normalized ?? item.rawWeight,
          weight_value: weightResult?.value ?? null,
          weight_unit: weightResult?.unit ?? null,
          needs_ai_image: needsAiImage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBySupplier.id)
      if (updateErr) throw new Error(`Product update failed: ${updateErr.message}`)
      stats.updated++
      continue
    }

    const { data: existingByName } = await supabase
      .from('products')
      .select('id')
      .ilike('name', displayTitle)
      .maybeSingle()

    if (existingByName) {
      const { error: updateErr } = await supabase
        .from('products')
        .update({
          stock_quantity: item.stockQty,
          stock_status: mapStockStatus(item.stockStatus),
          supplier_price: item.price,
          price: storePrice,
          supplier_id: item.supplierId,
          supplier_connection_id: connectionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingByName.id)
      if (updateErr) throw new Error(`Product update (by name) failed: ${updateErr.message}`)
      stats.duplicates++
      stats.updated++
      continue
    }

    const baseSlug = generateSlug(displayTitle)
    const slug = ensureUniqueSlug(baseSlug, existingSlugs)

    const { error: insertErr } = await supabase.from('products').insert({
      name: displayTitle,
      slug,
      raw_title: item.rawTitle,
      description: seo.description,
      short_description: seo.description.slice(0, 160),
      seo_title: seo.seoTitle,
      seo_description: seo.seoDescription,
      price: storePrice,
      supplier_price: item.price,
      offer_price: null,
      stock_quantity: item.stockQty,
      stock_status: mapStockStatus(item.stockStatus),
      weight: weightResult?.normalized ?? item.rawWeight,
      weight_value: weightResult?.value ?? null,
      weight_unit: weightResult?.unit ?? null,
      images,
      needs_ai_image: needsAiImage,
      tags,
      category_id: categoryId,
      brand_id: brandId,
      status: 'draft',
      supplier_id: item.supplierId,
      supplier_connection_id: connectionId,
      coin_reward: Math.max(1, Math.floor(storePrice * 2)),
      profit_margin: markupPct,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    if (insertErr) throw new Error(`Product insert failed: ${insertErr.message}`)
    stats.inserted++
  }

  return stats
}

type SupplierConnection = {
  id: string
  name: string
  api_url: string
  consumer_key: string
  consumer_secret: string
  markup_percentage: number
  is_active: boolean
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export async function syncConnection(
  connectionId: string,
  triggeredBy: 'manual' | 'auto' = 'manual',
  accessToken: string
): Promise<SyncResult> {
  const supabase = createSupabaseClient(accessToken)

  const { data: rawConnection, error: connErr } = await supabase
    .from('supplier_connections')
    .select('*')
    .eq('id', connectionId)
    .maybeSingle()

  if (connErr) {
    return {
      success: false,
      logId: null,
      productsFetched: 0,
      productsInserted: 0,
      productsUpdated: 0,
      productsCategorized: 0,
      productsCleaned: 0,
      duplicatesDetected: 0,
      productsFailed: 0,
      errors: [`Connection fetch error: ${connErr.message}`],
    }
  }

  const connection = rawConnection as SupplierConnection | null

  if (!connection) {
    return {
      success: false,
      logId: null,
      productsFetched: 0,
      productsInserted: 0,
      productsUpdated: 0,
      productsCategorized: 0,
      productsCleaned: 0,
      duplicatesDetected: 0,
      productsFailed: 0,
      errors: ['Connection not found'],
    }
  }

  const { data: logRow } = await supabase
    .from('import_logs')
    .insert({ connection_id: connectionId, triggered_by: triggeredBy })
    .select('id')
    .single()
  const logId = logRow?.id ?? null

  let fetched = 0, inserted = 0, updated = 0, categorized = 0, cleaned = 0, duplicates = 0, failed = 0
  const errors: string[] = []

  const existingBrands = await getExistingBrandNames(supabase)

  const { data: slugRows } = await supabase.from('products').select('slug')
  const existingSlugs = new Set<string>((slugRows ?? []).map((r) => r.slug))

  try {
    let page = 1
    let hasMore = true

    while (hasMore) {
      const products = await fetchWCProducts(
        connection.api_url,
        connection.consumer_key,
        connection.consumer_secret,
        page
      )
      if (products.length === 0) { hasMore = false; break }

      fetched += products.length

      for (const wcp of products) {
        try {
          let variations: WCVariation[] = []
          if (wcp.type === 'variable' && wcp.variations.length > 0) {
            variations = await fetchWCVariations(
              connection.api_url,
              connection.consumer_key,
              connection.consumer_secret,
              wcp.id
            )
          }
          const stats = await processProduct(
            supabase,
            connectionId,
            connection.markup_percentage,
            wcp,
            variations,
            existingBrands,
            existingSlugs
          )
          inserted += stats.inserted
          updated += stats.updated
          categorized += stats.categorized
          cleaned += stats.cleaned
          duplicates += stats.duplicates
        } catch (err) {
          failed++
          if (errors.length < 20) errors.push(`Product ${wcp.id} (${wcp.name}): ${String(err)}`)
        }
      }

      page++
      if (products.length < 100) hasMore = false
    }
  } catch (err) {
    errors.push(`Fatal: ${String(err)}`)
  }

  if (logId) {
    await supabase
      .from('import_logs')
      .update({
        products_fetched: fetched,
        products_inserted: inserted,
        products_updated: updated,
        products_categorized: categorized,
        products_cleaned: cleaned,
        duplicates_detected: duplicates,
        products_failed: failed,
        error_details: errors.length > 0 ? errors.join('\n') : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logId)
  }

  await supabase
    .from('supplier_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', connectionId)

  return {
    success: errors.length === 0 || inserted + updated > 0,
    logId,
    productsFetched: fetched,
    productsInserted: inserted,
    productsUpdated: updated,
    productsCategorized: categorized,
    productsCleaned: cleaned,
    duplicatesDetected: duplicates,
    productsFailed: failed,
    errors,
  }
}

export async function syncAllActiveConnections(accessToken: string): Promise<void> {
  const supabase = createSupabaseClient(accessToken)
  const { data: connections } = await supabase
    .from('supplier_connections')
    .select('id')
    .eq('is_active', true)
  for (const conn of connections ?? []) {
    await syncConnection(conn.id, 'auto', accessToken).catch(() => null)
  }
}
