const KNOWN_BRANDS = [
  'Nirapara', 'Eastern', 'Double Horse', 'Brahmins', 'Haldiram', 'Melam',
  'Kitchen Treasures', 'Everest', 'MDH', 'Shan', 'Grand Sweets', 'Priya',
  'MTR', 'Aachi', 'Catch', 'Pushpa', 'Swad', 'TRS', 'Deep', 'Laxmi',
  'Kohinoor', 'Daawat', 'India Gate', 'Tata', 'Lijjat', 'Patanjali',
  'Knorr', 'Naagin', 'Ashoka', 'Maya Kaimal', 'Patak', 'Spice Garden',
  'Vandevi', 'Ahmed', 'National', 'Shan', 'Laziza', 'Sunrise', 'Goldiee',
  'Durra', 'Al Kabeer', 'Bombay Kitchen', 'Gits',
]

const CATEGORY_KEYWORDS: Array<{ keywords: string[]; category: string; tags: string[] }> = [
  {
    keywords: ['rice', 'matta', 'basmati', 'sona masoori', 'ponni', 'biryani rice', 'raw rice', 'parboiled'],
    category: 'Rice & Grains',
    tags: ['rice', 'grains'],
  },
  {
    keywords: ['puttu', 'podi', 'flour', 'atta', 'maida', 'semolina', 'rava', 'appam', 'idiyappam', 'pathiri'],
    category: 'Rice & Flour',
    tags: ['flour', 'breakfast'],
  },
  {
    keywords: ['masala', 'spice', 'chilli', 'chili', 'turmeric', 'coriander', 'cumin', 'pepper', 'cardamom',
               'cloves', 'cinnamon', 'nutmeg', 'fenugreek', 'mustard seed', 'curry powder', 'garam masala',
               'sambar', 'rasam', 'fish curry', 'biryani masala', 'chaat masala'],
    category: 'Spices & Masalas',
    tags: ['spices', 'masala'],
  },
  {
    keywords: ['chips', 'snack', 'mixture', 'murukku', 'chakli', 'namkeen', 'popcorn', 'peanut',
               'cashew', 'halwa', 'ladoo', 'barfi', 'sweet', 'biscuit', 'cookie', 'wafer', 'banana chips'],
    category: 'Snacks & Sweets',
    tags: ['snacks'],
  },
  {
    keywords: ['pickle', 'achar', 'mango pickle', 'lime pickle', 'chutney', 'achaar', 'mixed pickle'],
    category: 'Pickles & Chutneys',
    tags: ['pickles', 'condiments'],
  },
  {
    keywords: ['oil', 'ghee', 'butter', 'coconut oil', 'sesame oil', 'mustard oil', 'sunflower', 'groundnut oil'],
    category: 'Oils & Ghee',
    tags: ['oils'],
  },
  {
    keywords: ['dal', 'lentil', 'pulse', 'moong', 'chana', 'toor', 'urad', 'masoor', 'rajma', 'kidney bean',
               'black eye bean', 'chickpea', 'green pea'],
    category: 'Pulses & Lentils',
    tags: ['pulses', 'lentils'],
  },
  {
    keywords: ['ready meal', 'instant', 'ready to eat', 'ready to cook', 'curry paste', 'curry sauce',
               'canned', 'tinned', 'ready'],
    category: 'Ready Meals',
    tags: ['ready meals', 'convenience'],
  },
  {
    keywords: ['tea', 'coffee', 'chai', 'masala tea', 'green tea', 'black tea', 'herbal tea'],
    category: 'Tea & Coffee',
    tags: ['beverages', 'tea'],
  },
  {
    keywords: ['coconut', 'coconut milk', 'coconut cream', 'desiccated coconut', 'coconut powder'],
    category: 'Coconut Products',
    tags: ['coconut'],
  },
  {
    keywords: ['idli', 'dosa', 'breakfast', 'porridge', 'oats', 'cornflakes', 'muesli', 'upma'],
    category: 'Breakfast Items',
    tags: ['breakfast'],
  },
  {
    keywords: ['frozen', 'freeze', 'ice cream', 'frozen meal', 'frozen veg'],
    category: 'Frozen Foods',
    tags: ['frozen'],
  },
  {
    keywords: ['sauce', 'ketchup', 'vinegar', 'soy sauce', 'tamarind', 'paste', 'spread'],
    category: 'Condiments & Sauces',
    tags: ['condiments'],
  },
  {
    keywords: ['papad', 'pappadam', 'pappads', 'appalam'],
    category: 'Papads & Wafers',
    tags: ['papads'],
  },
]

export function classifyCategory(title: string): { category: string; tags: string[] } {
  const lower = title.toLowerCase()
  for (const { keywords, category, tags } of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return { category, tags }
    }
  }
  return { category: 'General Grocery', tags: ['grocery'] }
}

export function detectAndCleanBrand(
  title: string,
  existingBrands: string[]
): { brand: string | null; cleanTitle: string } {
  const allBrands = [...new Set([...KNOWN_BRANDS, ...existingBrands])]
    .sort((a, b) => b.length - a.length)

  for (const brand of allBrands) {
    const lower = title.toLowerCase()
    const brandLower = brand.toLowerCase()

    const duplicatePattern = new RegExp(`^${brandLower}\\s+${brandLower}\\s+`, 'i')
    if (duplicatePattern.test(title)) {
      const cleaned = title.replace(duplicatePattern, '').trim()
      return { brand, cleanTitle: cleaned }
    }

    if (lower.startsWith(brandLower + ' ')) {
      const cleaned = title.slice(brand.length).trim()
      return { brand, cleanTitle: cleaned }
    }
  }

  return { brand: null, cleanTitle: title }
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function mapStockStatus(wcStatus: string): 'in_stock' | 'out_of_stock' | 'backorder' {
  const map: Record<string, 'in_stock' | 'out_of_stock' | 'backorder'> = {
    instock: 'in_stock',
    outofstock: 'out_of_stock',
    onbackorder: 'backorder',
  }
  return map[wcStatus] ?? 'in_stock'
}
