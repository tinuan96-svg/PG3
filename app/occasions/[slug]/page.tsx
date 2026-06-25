import { getOccasionsWithCounts, getOccasionProducts } from '@/lib/occasions'
import { getRecipesWithAvailability } from '@/lib/recipes'
import type { Metadata } from 'next'
import OccasionClient from './OccasionClient'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const occasions = await getOccasionsWithCounts()
  const occ = occasions.find((o) => o.slug === params.slug)
  if (!occ) return { title: 'Occasion Not Found' }
  return {
    title: `${occ.name} ${occ.emoji} | PocketGrocery Kerala Groceries`,
    description: occ.description || `Shop ${occ.name} Kerala grocery products online.`,
  }
}

export default async function OccasionPage({ params }: Props) {
  const [allOccasions, products, recipes] = await Promise.all([
    getOccasionsWithCounts(),
    getOccasionProducts(params.slug, 24, 0),
    getRecipesWithAvailability({ limit: 4 }),
  ])

  const occ = allOccasions.find((o) => o.slug === params.slug)

  return (
    <OccasionClient
      occasion={occ ?? null}
      slug={params.slug}
      initialProducts={products}
      relatedRecipes={recipes}
      allOccasions={allOccasions.filter((o) => o.is_active)}
    />
  )
}
