const FILLER_WORDS_PHRASES = [
  'best quality',
  'high quality',
  'top quality',
  'extra special',
]

const FILLER_WORDS_SINGLE = [
  'premium',
  'authentic',
  'original',
  'pure',
  'natural',
  'fresh',
  'special',
  'excellent',
  'superior',
  'genuine',
  'traditional',
  'classic',
  'delicious',
  'tasty',
  'organic',
  'new',
  'best',
]

export function cleanProductTitle(rawTitle: string): string {
  let title = rawTitle.trim()

  for (const phrase of FILLER_WORDS_PHRASES) {
    title = title.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), '')
  }

  for (const word of FILLER_WORDS_SINGLE) {
    title = title.replace(new RegExp(`\\b${word}\\b`, 'gi'), '')
  }

  return title.replace(/\s+/g, ' ').trim()
}

export interface WeightResult {
  normalized: string
  value: number
  unit: string
}

export function normalizeWeight(raw: string | null): WeightResult | null {
  if (!raw || !raw.trim()) return null

  const cleaned = raw.trim().replace(/\s+/g, '')
  const match = cleaned.match(
    /^(\d+(?:\.\d+)?)(kg|kgs|g|gm|gms|mg|ml|l|ltr|litres?|liters?|pcs?|pieces?|pack|packets?|nos?|units?)$/i
  )

  if (!match) return null

  let value = parseFloat(match[1])
  const rawUnit = match[2].toLowerCase()
  let unit: string

  if (rawUnit === 'kg' || rawUnit === 'kgs') {
    if (value < 1) {
      value = Math.round(value * 1000)
      unit = 'g'
    } else {
      unit = 'kg'
    }
  } else if (['g', 'gm', 'gms'].includes(rawUnit)) {
    if (value >= 1000 && value % 1000 === 0) {
      value = value / 1000
      unit = 'kg'
    } else {
      unit = 'g'
    }
  } else if (rawUnit === 'mg') {
    unit = 'mg'
  } else if (rawUnit === 'ml') {
    if (value >= 1000 && value % 1000 === 0) {
      value = value / 1000
      unit = 'l'
    } else {
      unit = 'ml'
    }
  } else if (['l', 'ltr', 'litre', 'litres', 'liter', 'liters'].includes(rawUnit)) {
    unit = 'l'
  } else if (rawUnit.startsWith('pc') || rawUnit.startsWith('piece')) {
    unit = 'pcs'
  } else if (rawUnit.startsWith('pack') || rawUnit.startsWith('packet')) {
    unit = 'pack'
  } else if (rawUnit === 'no' || rawUnit === 'nos') {
    unit = 'pcs'
  } else if (rawUnit === 'unit' || rawUnit === 'units') {
    unit = 'pcs'
  } else {
    unit = rawUnit
  }

  const normalized = Number.isInteger(value) ? `${value}${unit}` : `${value}${unit}`
  return { normalized, value, unit }
}

export function extractWeightFromTitle(title: string): {
  weight: WeightResult | null
  titleWithoutWeight: string
} {
  const weightPattern = /\b(\d+(?:\.\d+)?)\s*(kg|kgs|g|gm|gms|mg|ml|l|ltr|litres?|liters?|pcs?|pieces?|pack|packets?)\b/gi
  const match = weightPattern.exec(title)

  if (!match) return { weight: null, titleWithoutWeight: title }

  const rawWeight = match[0].replace(/\s+/g, '')
  const weight = normalizeWeight(rawWeight)
  const titleWithoutWeight = title.replace(match[0], '').replace(/\s+/g, ' ').trim().replace(/[-–—]+$/, '').trim()

  return { weight, titleWithoutWeight }
}

export function normalizeVariationLabel(attributes: Array<{ name: string; option: string }>): string {
  return attributes
    .map((attr) => {
      const raw = attr.option.trim()
      const weight = normalizeWeight(raw)
      return weight ? weight.normalized : raw
    })
    .join(', ')
}

export function buildVariationTitle(baseName: string, variationLabel: string): string {
  return `${baseName} \u2013 ${variationLabel}`
}

export interface NormalizationResult {
  cleanTitle: string
  weightNormalized: WeightResult | null
  wasCleaned: boolean
}

export function normalizeProductTitle(rawTitle: string): NormalizationResult {
  const afterFiller = cleanProductTitle(rawTitle)
  const { weight, titleWithoutWeight } = extractWeightFromTitle(afterFiller)

  let weightNormalized: WeightResult | null = null
  let finalTitle = afterFiller

  if (weight) {
    weightNormalized = weight
    const titleBase = titleWithoutWeight
    finalTitle = `${titleBase} ${weight.normalized}`.trim()
  }

  const wasCleaned = finalTitle.trim() !== rawTitle.trim()

  return {
    cleanTitle: finalTitle,
    weightNormalized,
    wasCleaned,
  }
}
