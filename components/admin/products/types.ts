// ProductRow maps the flat columns returned by the get_admin_products RPC.
// All fields use the actual products table column names.
// brand is plain text synced from CentralHub — no brand_id or brands FK exists.

export type StockStatus = 'in_stock' | 'out_of_stock' | 'backorder'
export type ProductStatus = 'active' | 'inactive'

export type SortField = 'name' | 'price' | 'stock_qty' | 'created_at' | 'approval_status'
export type SortDir = 'asc' | 'desc'

export type ProductRow = {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  ingredients: string | null
  nutritional_info: string | null
  storage_instructions: string | null
  how_to_use: string | null
  price: number
  compare_price: number | null
  cost_price: number | null
  selling_price: number | null
  markup_percentage: number | null
  profit_amount: number | null
  stock_qty: number
  // image field name in the DB
  image: string | null
  gallery: string[] | null
  seo_title: string | null
  seo_description: string | null
  sku: string | null
  source_product_id: string | null
  approval_status: 'draft' | 'approved' | 'rejected'
  approved_at: string | null
  created_at: string
  synced_at: string | null
  centralhub_status: string | null
  category_id: string | null
  // brand is plain text from CentralHub — never a brand_id FK
  brand: string | null
  featured: boolean
  visibility_status: 'visible' | 'hidden'
  weight_grams: number | null
  barcode: string | null
  needs_admin_review: boolean
  // flat from RPC join
  category_name?: string | null
  total_count?: number
}

export type Category = { id: string; name: string }
export type SupplierConnection = { id: string; name: string }

export type Variation = {
  id: string
  product_id: string
  variation_label: string
  weight: number | null
  price: number
  stock_quantity: number
}

export type Filters = {
  search: string
  status: 'active' | 'inactive' | 'all'
  stockStatus: 'in_stock' | 'out_of_stock' | 'all'
  approvalStatus: 'approved' | 'draft' | 'rejected' | 'all'
  brand: string
  categoryId: string
  supplierId: string
  priceMin: string
  priceMax: string
}

export type BulkAction =
  | 'publish'
  | 'draft'
  | 'delete'
  | 'markup'
  | 'assign_category'
  | 'add_tags'

export const ITEMS_PER_PAGE = 50
