export function generateProductSEO(
  cleanTitle: string,
  brand: string | null,
  category: string,
  weight?: string | null
): { seoTitle: string; seoDescription: string; description: string } {
  const fullName = brand ? `${brand} ${cleanTitle}` : cleanTitle
  const weightSuffix = weight ? ` ${weight}` : ''
  const categoryLower = category.toLowerCase()

  const seoTitle = `Buy ${fullName}${weightSuffix} Online UK | PocketGrocery`

  const categoryPhrase =
    categoryLower.includes('rice') ? 'premium Indian rice'
    : categoryLower.includes('spice') || categoryLower.includes('masala') ? 'authentic South Indian spice'
    : categoryLower.includes('snack') ? 'traditional Kerala snack'
    : categoryLower.includes('pickle') ? 'authentic Indian pickle'
    : categoryLower.includes('oil') ? 'high-quality cooking oil'
    : categoryLower.includes('pulse') || categoryLower.includes('lentil') ? 'nutritious Indian pulse'
    : categoryLower.includes('flour') ? 'authentic Indian flour'
    : categoryLower.includes('coconut') ? 'fresh coconut product'
    : categoryLower.includes('frozen') ? 'convenient frozen food'
    : categoryLower.includes('tea') ? 'aromatic Indian tea'
    : 'authentic Indian grocery product'

  const seoDescription =
    `Buy ${fullName}${weightSuffix} online and get it delivered to your door across the UK. ` +
    `Authentic ${categoryPhrase} from PocketGrocery — the UK's leading Kerala grocery store. ` +
    `Fast delivery, quality guaranteed.`

  const description =
    `${fullName}${weightSuffix} is an ${categoryPhrase} available for home delivery across the UK. ` +
    (brand ? `${brand} is a trusted brand known for quality and authentic flavours. ` : '') +
    `Perfect for preparing traditional South Indian and Kerala meals at home. ` +
    `Order online at PocketGrocery for fast, reliable UK delivery.`

  return { seoTitle, seoDescription, description }
}
