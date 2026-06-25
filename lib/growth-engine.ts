import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

export interface Product {
  id: string
  name: string
  slug: string
  images: string[]
  price: number
  sale_price: number | null
  stock_status: string
  coin_reward: number
  brand: string | null
  category_id: string | null
  tags: string[]
}

export interface Bundle {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  product_ids: string[]
  original_price: number
  bundle_price: number
  savings_amount: number
  coin_reward: number
  is_active: boolean
  display_locations: string[]
}

export interface CrossSellRecommendation {
  id: string
  product_id: string
  recommended_product_id: string
  rule_type: string
  priority: number
}

export class GrowthEngine {
  private mapDbProduct(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      images: row.processed_image_url ? [row.processed_image_url] : (row.image ? [row.image] : []),
      price: Number(row.compare_price || row.price || 0),
      sale_price: row.compare_price ? Number(row.price) : null,
      stock_status: row.visibility_status === 'visible' ? 'in_stock' : 'out_of_stock',
      coin_reward: Number(row.coin_reward || 0),
      brand: row.brand,
      category_id: row.category_id,
      tags: Array.isArray(row.tags) ? row.tags : [],
    }
  }

  async getActiveBundles(location?: string): Promise<Bundle[]> {
    let query = supabase
      .from('product_bundles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (location) {
      query = query.contains('display_locations', [location])
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching bundles:', error)
      return []
    }

    return data || []
  }

  async getBundleWithProducts(bundleId: string): Promise<Bundle & { products: Product[] } | null> {
    const { data: bundle, error: bundleError } = await supabase
      .from('product_bundles')
      .select('*')
      .eq('id', bundleId)
      .maybeSingle()

    if (bundleError || !bundle) return null

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', bundle.product_ids)

    if (productsError) return null

    return {
      ...bundle,
      products: (products || []).map(this.mapDbProduct),
    }
  }

  async getCrossSellProducts(productId: string, limit = 3): Promise<Product[]> {
    const { data: rules, error: rulesError } = await supabase
      .from('cross_sell_rules')
      .select('recommended_product_id')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(limit)

    if (rulesError || !rules || rules.length === 0) {
      return this.getSmartRecommendations(productId, limit)
    }

    const productIds = rules.map(r => r.recommended_product_id)

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('visibility_status', 'visible')
      .eq('approval_status', 'approved')

    if (productsError) return []

    return (products || []).map(this.mapDbProduct)
  }

  async getSmartRecommendations(productId: string, limit = 3): Promise<Product[]> {
    const { data: sourceProduct } = await supabase
      .from('products')
      .select('category_id, tags')
      .eq('id', productId)
      .maybeSingle()

    if (!sourceProduct) return []

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .neq('id', productId)
      .eq('visibility_status', 'visible')
      .eq('approval_status', 'approved')
      .limit(limit * 5)

    if (!products) return []

    const scored = products.map(product => {
      let score = 0

      if (product.category_id === sourceProduct.category_id) {
        score += 20
      }

      const sourceTags = Array.isArray(sourceProduct.tags) ? sourceProduct.tags : []
      const productTags = Array.isArray(product.tags) ? product.tags : []

      const tagOverlap = productTags.filter(
        (tag: string) => sourceTags.includes(tag)
      ).length || 0
      score += tagOverlap * 5

      return { product, score }
    })

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => this.mapDbProduct(item.product))
  }

  async getFrequentlyBoughtTogether(productId: string, limit = 3): Promise<Product[]> {
    return this.getCrossSellProducts(productId, limit)
  }

  async trackAnalytics(event: {
    event_type: string
    product_id?: string
    bundle_id?: string
    user_id?: string
    session_id?: string
    revenue_impact?: number
    metadata?: Record<string, any>
  }) {
    // Only track if table exists and we are not in a limited environment
    try {
      const { error } = await supabase.from('growth_analytics').insert({
        event_type: event.event_type,
        product_id: event.product_id || null,
        bundle_id: event.bundle_id || null,
        user_id: event.user_id || null,
        session_id: event.session_id || null,
        revenue_impact: event.revenue_impact || 0,
        metadata: event.metadata || {},
      })

      if (error) {
        console.warn('Error tracking analytics:', error.message)
      }
    } catch (e) {
      console.warn('Analytics tracking failed silently')
    }
  }

  async getAnalyticsSummary(days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: analytics, error } = await supabase
      .from('growth_analytics')
      .select('*')
      .gte('created_at', startDate.toISOString())

    if (error) return null

    const summary = {
      bundleSales: 0,
      bundleRevenue: 0,
      crossSellConversions: 0,
      crossSellRevenue: 0,
      upsellConversions: 0,
      upsellRevenue: 0,
      totalRevenue: 0,
    }

    analytics?.forEach(event => {
      const revenue = parseFloat(String(event.revenue_impact)) || 0

      if (event.event_type === 'bundle_purchase') {
        summary.bundleSales++
        summary.bundleRevenue += revenue
      } else if (event.event_type === 'cross_sell_purchase') {
        summary.crossSellConversions++
        summary.crossSellRevenue += revenue
      } else if (event.event_type === 'upsell_purchase') {
        summary.upsellConversions++
        summary.upsellRevenue += revenue
      }

      summary.totalRevenue += revenue
    })

    return summary
  }

  calculateDeliveryProgress(cartTotal: number): {
    isFree: boolean
    remaining: number
    percentage: number
  } {
    const freeDeliveryThreshold = 40

    if (cartTotal >= freeDeliveryThreshold) {
      return {
        isFree: true,
        remaining: 0,
        percentage: 100,
      }
    }

    return {
      isFree: false,
      remaining: freeDeliveryThreshold - cartTotal,
      percentage: (cartTotal / freeDeliveryThreshold) * 100,
    }
  }
}

export const growthEngine = new GrowthEngine()
