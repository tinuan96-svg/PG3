import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

interface WooCommerceConfig {
  url: string
  consumerKey: string
  consumerSecret: string
}

interface WooCommerceProduct {
  id: number
  name: string
  slug: string
  description: string
  short_description: string
  images: Array<{ src: string }>
  categories: Array<{ id: number; name: string }>
  price: string
  sale_price: string
  stock_quantity: number
  stock_status: 'instock' | 'outofstock' | 'onbackorder'
  weight: string
  tags: Array<{ id: number; name: string }>
  meta_data: Array<{ key: string; value: any }>
}

export class WooCommerceSync {
  private config: WooCommerceConfig

  constructor() {
    this.config = {
      url: process.env.NEXT_PUBLIC_WC_STORE_URL || '',
      consumerKey: process.env.WC_CONSUMER_KEY || '',
      consumerSecret: process.env.WC_CONSUMER_SECRET || '',
    }
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(
      `${this.config.consumerKey}:${this.config.consumerSecret}`
    ).toString('base64')
    return `Basic ${credentials}`
  }

  async fetchProducts(page = 1, perPage = 100): Promise<WooCommerceProduct[]> {
    try {
      const url = `${this.config.url}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`

      const response = await fetch(url, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })

      if (!response.ok) {
        throw new Error(`WooCommerce API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching WooCommerce products:', error)
      return []
    }
  }

  async syncProducts(syncType: 'manual' | 'automatic' = 'automatic') {
    const logId = await this.createSyncLog(syncType)

    let totalSynced = 0
    let totalAdded = 0
    let totalUpdated = 0
    let totalFailed = 0
    const errors: string[] = []

    try {
      let page = 1
      let hasMore = true

      while (hasMore) {
        const products = await this.fetchProducts(page)

        if (products.length === 0) {
          hasMore = false
          break
        }

        for (const wcProduct of products) {
          try {
            const result = await this.syncSingleProduct(wcProduct)
            totalSynced++
            if (result === 'added') totalAdded++
            if (result === 'updated') totalUpdated++
          } catch (error) {
            totalFailed++
            errors.push(`Product ${wcProduct.id}: ${error}`)
          }
        }

        page++
        if (products.length < 100) hasMore = false
      }

      await this.completeSyncLog(logId, {
        products_synced: totalSynced,
        products_added: totalAdded,
        products_updated: totalUpdated,
        products_failed: totalFailed,
        error_log: errors.length > 0 ? errors.join('\n') : null,
      })

      return {
        success: true,
        totalSynced,
        totalAdded,
        totalUpdated,
        totalFailed,
      }
    } catch (error) {
      await this.completeSyncLog(logId, {
        products_synced: totalSynced,
        products_added: totalAdded,
        products_updated: totalUpdated,
        products_failed: totalFailed,
        error_log: `Fatal error: ${error}\n${errors.join('\n')}`,
      })

      return {
        success: false,
        error: String(error),
      }
    }
  }

  private async syncSingleProduct(wcProduct: WooCommerceProduct): Promise<'added' | 'updated'> {
    const brandMeta = wcProduct.meta_data?.find(m => m.key === '_brand' || m.key === 'brand')
    const coinRewardMeta = wcProduct.meta_data?.find(m => m.key === 'coin_reward')

    const productData = {
      wc_product_id: wcProduct.id,
      name: wcProduct.name,
      slug: wcProduct.slug,
      description: wcProduct.description,
      short_description: wcProduct.short_description,
      images: wcProduct.images.map(img => img.src),
      category_ids: wcProduct.categories?.map(cat => cat.id) || [],
      brand: brandMeta?.value || wcProduct.categories?.[0]?.name || null,
      price: parseFloat(wcProduct.price) || 0,
      sale_price: wcProduct.sale_price ? parseFloat(wcProduct.sale_price) : null,
      stock_quantity: wcProduct.stock_quantity || 0,
      stock_status: this.mapStockStatus(wcProduct.stock_status),
      weight: wcProduct.weight || null,
      tags: wcProduct.tags?.map(tag => tag.name) || [],
      coin_reward: coinRewardMeta?.value ? parseInt(coinRewardMeta.value) : Math.floor(parseFloat(wcProduct.price) * 2),
      last_synced_at: new Date().toISOString(),
    }

    const { data: existing } = await supabase
      .from('woocommerce_products')
      .select('id')
      .eq('wc_product_id', wcProduct.id)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('woocommerce_products')
        .update(productData)
        .eq('wc_product_id', wcProduct.id)

      if (error) throw error
      return 'updated'
    } else {
      const { error } = await supabase
        .from('woocommerce_products')
        .insert(productData)

      if (error) throw error
      return 'added'
    }
  }

  private mapStockStatus(status: string): string {
    const map: Record<string, string> = {
      instock: 'in_stock',
      outofstock: 'out_of_stock',
      onbackorder: 'on_backorder',
    }
    return map[status] || 'in_stock'
  }

  private async createSyncLog(syncType: string): Promise<string> {
    const { data, error } = await supabase
      .from('sync_logs')
      .insert({
        sync_type: syncType,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  private async completeSyncLog(
    logId: string,
    updates: {
      products_synced: number
      products_added: number
      products_updated: number
      products_failed: number
      error_log: string | null
    }
  ) {
    await supabase
      .from('sync_logs')
      .update({
        ...updates,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logId)
  }
}

export const wooCommerceSync = new WooCommerceSync()
