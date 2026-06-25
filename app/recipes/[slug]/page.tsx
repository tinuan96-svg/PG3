import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import RecipeDetailClient from './RecipeDetailClient'

// Force dynamic for availability data (stock changes)
export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

async function fetchRecipeSSR(slug: string) {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (sb as any).rpc('get_recipe_detail_with_availability', { p_slug: slug })
    const row = Array.isArray(data) ? data[0] : data
    return row ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = await fetchRecipeSSR(params.slug)
  if (!recipe) return { title: 'Recipe Not Found' }
  return {
    title: recipe.seo_title || `${recipe.title} | PocketGrocery Kerala Recipes`,
    description: recipe.seo_description || recipe.excerpt || `How to make ${recipe.title} – authentic Kerala recipe`,
    keywords: recipe.seo_keywords || undefined,
    openGraph: {
      title: recipe.title,
      description: recipe.excerpt || '',
      images: recipe.featured_image ? [{ url: recipe.featured_image }] : [],
    },
  }
}

export default async function RecipeSlugPage({ params }: Props) {
  const recipe = await fetchRecipeSSR(params.slug)
  return <RecipeDetailClient initialRecipe={recipe} slug={params.slug} />
}
