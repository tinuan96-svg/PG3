import type { Metadata } from 'next'
import { ALL_PRODUCTS, CATEGORIES, type Product } from './products-data'

export const SITE_URL = 'https://pocketgrocery.com'
export const SITE_NAME = 'PocketGrocery'
export const SITE_DESCRIPTION = 'Buy authentic Kerala groceries online with fast next day delivery across the UK. Premium spices, rice, pickles, snacks and more from trusted Kerala brands.'
export const DEFAULT_OG_IMAGE = 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=1200'

export const COMPANY = {
  name: 'Matha Grocers Ltd',
  tradingAs: 'PocketGrocery',
  address: {
    street: '52 Oldfields Road',
    city: 'Sutton',
    postcode: 'SM1 2NU',
    country: 'United Kingdom',
    countryCode: 'GB',
  },
  email: 'info@pocketgrocery.com',
  phone: '079826003',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  foundingYear: 2024,
  areaServed: 'GB',
  priceRange: '££',
  sameAs: [
    'https://www.facebook.com/pocketgrocery',
    'https://www.instagram.com/pocketgrocery',
    'https://twitter.com/pocketgrocery',
  ],
}

export const UK_CITIES = [
  { name: 'London', slug: 'london', population: 9000000 },
  { name: 'Birmingham', slug: 'birmingham', population: 1150000 },
  { name: 'Manchester', slug: 'manchester', population: 560000 },
  { name: 'Leeds', slug: 'leeds', population: 800000 },
  { name: 'Glasgow', slug: 'glasgow', population: 635000 },
  { name: 'Leicester', slug: 'leicester', population: 368000 },
  { name: 'Bristol', slug: 'bristol', population: 470000 },
  { name: 'Sheffield', slug: 'sheffield', population: 584000 },
  { name: 'Liverpool', slug: 'liverpool', population: 498000 },
  { name: 'Coventry', slug: 'coventry', population: 371000 },
]

export function generateProductSeoTitle(product: { name: string; weight?: string }): string {
  const weight = product.weight ? ` ${product.weight}` : ''
  return `Buy ${product.name}${weight} Online UK | Authentic Kerala Groceries Delivery`
}

export function generateProductSeoDescription(product: { name: string; weight?: string; brand?: string }): string {
  const weight = product.weight ? ` ${product.weight}` : ''
  const brand = product.brand ? ` by ${product.brand}` : ''
  return `Order ${product.name}${weight}${brand} online in the UK. Authentic Kerala groceries delivered across the UK with fast next-day delivery. Free delivery over £40.`
}

export function generateProductMetadata(product: Product, slug: string): Metadata {
  const title = generateProductSeoTitle(product)
  const description = generateProductSeoDescription(product)
  const canonical = `${SITE_URL}/products/${slug}`
  const image = product.images[0] || DEFAULT_OG_IMAGE

  return {
    title,
    description,
    keywords: `${product.name}, ${product.brand}, Kerala groceries UK, buy ${product.name} online, Indian groceries UK, next day delivery`,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'en_GB',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: image, width: 800, height: 800, alt: `${product.name} - ${product.brand}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateProductSchema(product: Product, slug: string) {
  const price = product.offer_price || product.price
  const discount = product.offer_price && product.offer_price < product.price
  const image = product.images[0] || DEFAULT_OG_IMAGE

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: generateProductSeoDescription(product),
    image,
    sku: slug,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${slug}`,
      priceCurrency: 'GBP',
      price: price.toFixed(2),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.stock_status === 'outofstock'
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: COMPANY.tradingAs,
      },
      ...(discount && {
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: product.offer_price!.toFixed(2),
          priceCurrency: 'GBP',
          referenceQuantity: { '@type': 'QuantitativeValue', value: 1 },
        },
      }),
    },
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating.toFixed(1),
        reviewCount: product.reviewCount || 1,
        bestRating: '5',
        worstRating: '1',
      },
    }),
    category: product.category,
    additionalProperty: product.weight
      ? [{ '@type': 'PropertyValue', name: 'Weight', value: product.weight }]
      : [],
  }
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: COMPANY.tradingAs,
    legalName: COMPANY.name,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: COMPANY.logo,
    },
    description: SITE_DESCRIPTION,
    foundingDate: String(COMPANY.foundingYear),
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.city,
      postalCode: COMPANY.address.postcode,
      addressCountry: COMPANY.address.countryCode,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: COMPANY.phone,
      contactType: 'customer service',
      email: COMPANY.email,
      areaServed: COMPANY.areaServed,
      availableLanguage: 'English',
    },
    sameAs: COMPANY.sameAs,
  }
}

export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    '@id': `${SITE_URL}/#localbusiness`,
    name: COMPANY.tradingAs,
    legalName: COMPANY.name,
    url: SITE_URL,
    telephone: COMPANY.phone,
    email: COMPANY.email,
    image: DEFAULT_OG_IMAGE,
    priceRange: COMPANY.priceRange,
    description: 'Online Kerala grocery store delivering authentic South Indian products across the UK with next day delivery.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.city,
      postalCode: COMPANY.address.postcode,
      addressCountry: COMPANY.address.countryCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 51.3618,
      longitude: -0.1945,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
      },
    ],
    areaServed: {
      '@type': 'Country',
      name: COMPANY.address.country,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Kerala Groceries',
      itemListElement: CATEGORIES.slice(0, 8).map((cat) => ({
        '@type': 'OfferCatalog',
        name: cat.name,
      })),
    },
    sameAs: COMPANY.sameAs,
  }
}

export function generateFAQSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateRecipeSchema(recipe: {
  name: string
  description: string
  image: string
  cookTime: string
  prepTime: string
  servings: number
  ingredients: string[]
  instructions: string[]
  keywords?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    description: recipe.description,
    image: recipe.image,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    recipeYield: `${recipe.servings} servings`,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.instructions.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: step,
    })),
    keywords: recipe.keywords || 'Kerala recipe, South Indian cooking, authentic Kerala food',
    recipeCategory: 'Kerala Cuisine',
    recipeCuisine: 'Kerala, South Indian',
    suitableForDiet: 'https://schema.org/HinduDiet',
  }
}

export function generateArticleSchema(article: {
  title: string
  description: string
  image: string
  datePublished: string
  dateModified?: string
  url: string
  author?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    url: article.url,
    author: {
      '@type': article.author ? 'Person' : 'Organization',
      name: article.author || SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: COMPANY.logo,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  }
}

export function generateProductPageFAQs(product: Product): { q: string; a: string }[] {
  return [
    {
      q: `Where can I buy ${product.name} online in the UK?`,
      a: `You can buy ${product.name} online at PocketGrocery.com with next day delivery across the UK. We stock authentic Kerala products from trusted brands including ${product.brand}.`,
    },
    {
      q: `Does ${product.name} come with next day delivery?`,
      a: `Yes, ${product.name} qualifies for next day delivery when ordered before 4 PM on working days. Free delivery is available on orders over £40.`,
    },
    {
      q: `Is ${product.name} authentic Kerala brand?`,
      a: `Yes, ${product.name} is made by ${product.brand}, a trusted Kerala brand. PocketGrocery sources directly to ensure authenticity and freshness.`,
    },
    {
      q: `What is the price of ${product.name} in the UK?`,
      a: `${product.name} is available at PocketGrocery for £${product.offer_price?.toFixed(2) || product.price.toFixed(2)} with free delivery on orders over £40.`,
    },
  ]
}

export function generateProgrammaticPageMetadata(
  productName: string,
  location: string,
  slug: string
): Metadata {
  const title = `Buy ${productName} in ${location} | Kerala Groceries | Next Day Delivery`
  const description = `Order ${productName} online in ${location}. Authentic Kerala groceries delivered to ${location} with next day delivery. Free delivery on orders over £40.`
  const canonical = `${SITE_URL}/buy/${slug}`

  return {
    title,
    description,
    keywords: `${productName} ${location}, buy ${productName} ${location}, Kerala groceries ${location}, Indian groceries ${location} delivery`,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'en_GB',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${productName} delivery ${location}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export function getAllProductSlugs(): string[] {
  return ALL_PRODUCTS.map((p) => p.slug)
}

export function getAllSitemapEntries() {
  const now = new Date()

  const staticPages = [
    { url: `${SITE_URL}/`, priority: 1.0, changeFreq: 'daily' },
    { url: `${SITE_URL}/products`, priority: 0.9, changeFreq: 'daily' },
    { url: `${SITE_URL}/blog`, priority: 0.8, changeFreq: 'weekly' },
    { url: `${SITE_URL}/recipes`, priority: 0.8, changeFreq: 'weekly' },
    { url: `${SITE_URL}/brands`, priority: 0.7, changeFreq: 'weekly' },
    { url: `${SITE_URL}/wallet`, priority: 0.5, changeFreq: 'monthly' },
  ]

  const categoryPages = CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/products?category=${encodeURIComponent(cat.slug)}`,
    priority: 0.85,
    changeFreq: 'weekly',
  }))

  const productPages = ALL_PRODUCTS.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    priority: 0.8,
    changeFreq: 'weekly',
  }))

  const seoLandingPages = [
    { url: `${SITE_URL}/kerala-groceries-uk`, priority: 0.9 },
    { url: `${SITE_URL}/kerala-groceries-london`, priority: 0.9 },
    { url: `${SITE_URL}/kerala-groceries-manchester`, priority: 0.85 },
    { url: `${SITE_URL}/kerala-groceries-birmingham`, priority: 0.85 },
    { url: `${SITE_URL}/kerala-groceries-leeds`, priority: 0.8 },
    { url: `${SITE_URL}/kerala-groceries-glasgow`, priority: 0.8 },
    { url: `${SITE_URL}/kerala-groceries-leicester`, priority: 0.8 },
    { url: `${SITE_URL}/kerala-rice-uk`, priority: 0.9 },
    { url: `${SITE_URL}/kerala-snacks-online-uk`, priority: 0.9 },
    { url: `${SITE_URL}/kerala-spices-uk`, priority: 0.9 },
  ].map((p) => ({ ...p, changeFreq: 'weekly' }))

  const blogPages = [
    '/blog/how-to-make-perfect-kerala-sadya',
    '/blog/essential-kerala-spices-every-kitchen',
    '/blog/authentic-kerala-fish-curry-recipe',
    '/blog/guide-to-kerala-rice-varieties',
    '/blog/kerala-breakfast-recipes-puttu-appam',
    '/blog/health-benefits-coconut-oil',
  ].map((path) => ({ url: `${SITE_URL}${path}`, priority: 0.7, changeFreq: 'monthly' }))

  const programmaticPages = ALL_PRODUCTS.slice(0, 20).flatMap((product) =>
    UK_CITIES.slice(0, 5).map((city) => ({
      url: `${SITE_URL}/buy/${product.slug}/${city.slug}`,
      priority: 0.6,
      changeFreq: 'monthly',
    }))
  )

  const legalPages = [
    '/legal/privacy-policy',
    '/legal/terms-conditions',
    '/legal/shipping-policy',
    '/legal/refund-policy',
    '/legal/cookie-policy',
  ].map((path) => ({ url: `${SITE_URL}${path}`, priority: 0.3, changeFreq: 'yearly' }))

  return {
    now,
    staticPages,
    categoryPages,
    productPages,
    seoLandingPages,
    blogPages,
    programmaticPages,
    legalPages,
  }
}
