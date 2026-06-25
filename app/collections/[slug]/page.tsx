import { getFoodTypesWithCounts, getFoodTypeProducts } from '@/lib/food-types'
import { getRecipesWithAvailability } from '@/lib/recipes'
import type { Metadata } from 'next'
import CollectionClient from './CollectionClient'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const types = await getFoodTypesWithCounts()
  const ft = types.find((t) => t.slug === params.slug)
  if (!ft) return { title: 'Collection Not Found' }
  return {
    title: `${ft.name} ${ft.emoji} | PocketGrocery Kerala Groceries`,
    description: ft.description || `Shop ${ft.name} Kerala grocery products online.`,
  }
}

export default async function CollectionPage({ params }: Props) {
  const [allTypes, products, recipes] = await Promise.all([
    getFoodTypesWithCounts(),
    getFoodTypeProducts(params.slug, 24, 0),
    getRecipesWithAvailability({ limit: 4 }),
  ])

  const ft = allTypes.find((t) => t.slug === params.slug)

  return (
    <CollectionClient
      foodType={ft ?? null}
      slug={params.slug}
      initialProducts={products}
      relatedRecipes={recipes}
      allTypes={allTypes.filter((t) => t.is_active)}
    />
  )
}
