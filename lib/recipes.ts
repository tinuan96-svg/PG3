import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchedProduct {
  id: string
  name: string
  slug: string
  price: number
  image: string | null
  in_stock: boolean
}

export interface RecipeCategory {
  id: string
  name: string
  slug: string
  emoji: string
  sort_order: number
}

export interface RecipeSummary {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  prep_time_mins: number | null
  cook_time_mins: number | null
  servings: number | null
  difficulty: string | null
  tags: string[]
  category_id: string | null
  category_name: string | null
  category_emoji: string | null
  show_on_homepage: boolean
  is_featured: boolean
  total_products: number
  available_products: number
  availability_pct: number
  matched_products: MatchedProduct[]
}

export interface RecipeIngredient {
  id: string
  name: string
  quantity: string
  unit: string
  is_optional: boolean
  sort_order: number
}

export interface RecipeDetail extends RecipeSummary {
  instructions: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  nutrition_info: Record<string, string>
  ingredients: RecipeIngredient[]
}

// ─── Queries ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function getRecipesWithAvailability(opts?: {
  limit?: number
  offset?: number
  categorySlug?: string | null
}): Promise<RecipeSummary[]> {
  const { data, error } = await db.rpc('get_recipes_with_availability', {
    p_limit: opts?.limit ?? 20,
    p_offset: opts?.offset ?? 0,
    p_category_slug: opts?.categorySlug ?? null,
  })
  if (error) { console.error('[recipes]', error); return [] }
  return (data ?? []).map(normaliseRecipe)
}

export async function getRecipeDetail(slug: string): Promise<RecipeDetail | null> {
  const { data, error } = await db.rpc('get_recipe_detail_with_availability', { p_slug: slug })
  if (error) { console.error('[recipe-detail]', error); return null }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return {
    ...normaliseRecipe(row),
    instructions: row.instructions ?? null,
    seo_title: row.seo_title ?? null,
    seo_description: row.seo_description ?? null,
    seo_keywords: row.seo_keywords ?? null,
    nutrition_info: row.nutrition_info ?? {},
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
  }
}

export async function getRecipeCategories(): Promise<RecipeCategory[]> {
  const { data } = await db
    .from('recipe_categories')
    .select('id,name,slug,emoji,sort_order')
    .order('sort_order', { ascending: true })
  return data ?? []
}

export async function trackRecipeEvent(
  recipeId: string,
  event: 'view' | 'basket_click' | 'add_to_pocket',
): Promise<void> {
  await db.rpc('track_recipe_event', { p_recipe_id: recipeId, p_event: event })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseRecipe(row: any): RecipeSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? null,
    featured_image: row.featured_image ?? null,
    prep_time_mins: row.prep_time_mins ?? null,
    cook_time_mins: row.cook_time_mins ?? null,
    servings: row.servings ?? null,
    difficulty: row.difficulty ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    category_id: row.category_id ?? null,
    category_name: row.category_name ?? null,
    category_emoji: row.category_emoji ?? null,
    show_on_homepage: Boolean(row.show_on_homepage),
    is_featured: Boolean(row.is_featured),
    total_products: Number(row.total_products ?? 0),
    available_products: Number(row.available_products ?? 0),
    availability_pct: Number(row.availability_pct ?? 0),
    matched_products: Array.isArray(row.matched_products) ? row.matched_products : [],
  }
}

// ─── Cart helpers ─────────────────────────────────────────────────────────────

export function availableProducts(recipe: RecipeSummary): MatchedProduct[] {
  return recipe.matched_products.filter((p) => p.in_stock)
}

export function missingProducts(recipe: RecipeSummary): MatchedProduct[] {
  return recipe.matched_products.filter((p) => !p.in_stock)
}

export function totalBasketValue(products: MatchedProduct[]): number {
  return products.reduce((sum, p) => sum + Number(p.price ?? 0), 0)
}
