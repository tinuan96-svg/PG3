/**
 * PocketGrocery Image Processing Pipeline
 *
 * Pure Sharp-based pipeline. Never modifies, regenerates, or repaints pixels
 * on product packaging. The only operations applied are:
 *   1. Background removal (replace uniform/transparent background with white)
 *   2. Trim excess white border
 *   3. Center on white canvas with configurable padding
 *   4. Subtle drop shadow beneath the product
 *   5. Mild unsharp mask (sharpness only — no colour/contrast change)
 *   6. Resize to 1200×1200, 600×600, 300×300
 *   7. Convert to WebP
 *
 * Packaging pixels (labels, text, logos, nutrition panels) are NEVER altered.
 * AI / generative processing is NEVER called here.
 */

import sharp from 'sharp'

export interface ProcessedImages {
  main: Buffer   // 1200×1200
  medium: Buffer // 600×600
  thumb: Buffer  // 300×300
}

export interface PipelineOptions {
  /** WebP output quality 1–100. Default 85. */
  quality?: number
  /** Canvas size for main output in px. Default 1200. */
  mainPx?: number
  /** Canvas size for medium output. Default 600. */
  mediumPx?: number
  /** Canvas size for thumbnail. Default 300. */
  thumbPx?: number
  /** Inner content area as fraction of canvas (rest is padding). Default 0.80. */
  contentFraction?: number
  /** Background colour detection tolerance 0–255. Default 30. */
  bgThreshold?: number
  /** Shadow opacity 0–1. Default 0.15. */
  shadowStrength?: number
}

const DEFAULTS: Required<PipelineOptions> = {
  quality:         85,
  mainPx:          1200,
  mediumPx:        600,
  thumbPx:         300,
  contentFraction: 0.80,
  bgThreshold:     30,
  shadowStrength:  0.15,
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function processProductImage(
  input: Buffer,
  options: PipelineOptions = {}
): Promise<ProcessedImages> {
  const opts = { ...DEFAULTS, ...options }

  // 1. Remove background → PNG with transparency where background was
  const nobg = await removeBackground(input, opts.bgThreshold)

  // 2. Trim transparent/white edges
  const trimmed = await sharp(nobg).trim({ threshold: 1 }).toBuffer()

  // 3. Produce three sizes in parallel
  const [main, medium, thumb] = await Promise.all([
    renderOnCanvas(trimmed, opts.mainPx, opts),
    renderOnCanvas(trimmed, opts.mediumPx, opts),
    renderOnCanvas(trimmed, opts.thumbPx, opts),
  ])

  return { main, medium, thumb }
}

// ─── Background removal ───────────────────────────────────────────────────────

/**
 * Replaces the background with transparency using a flood-fill from the image
 * corners. Only replaces pixels that are within `threshold` of the corner colour.
 * Never touches the product area — all packaging pixels are preserved as-is.
 */
async function removeBackground(input: Buffer, threshold: number): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  if (channels !== 4) throw new Error('Expected RGBA after ensureAlpha')

  const pixels = new Uint8Array(data)
  const stride = width * 4

  // Sample background colour from the 4 corners (average)
  const corners = [
    getPixel(pixels, 0, 0, stride),
    getPixel(pixels, width - 1, 0, stride),
    getPixel(pixels, 0, height - 1, stride),
    getPixel(pixels, width - 1, height - 1, stride),
  ]
  const bg = averageColour(corners)

  // If background is mostly transparent already, skip flood fill
  if (bg.a < 128) {
    return sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } }).png().toBuffer()
  }

  // Flood-fill from all 4 corners simultaneously
  const visited = new Uint8Array(width * height)
  const queue: number[] = []

  function seed(x: number, y: number) {
    const idx = y * width + x
    if (!visited[idx] && colourMatch(getPixel(pixels, x, y, stride), bg, threshold)) {
      visited[idx] = 1
      queue.push(x, y)
    }
  }
  seed(0, 0)
  seed(width - 1, 0)
  seed(0, height - 1)
  seed(width - 1, height - 1)

  while (queue.length > 0) {
    const y = queue.pop()!
    const x = queue.pop()!
    // Erase this pixel (set alpha to 0)
    const p = (y * stride) + (x * 4)
    pixels[p + 3] = 0

    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      const ni = ny * width + nx
      if (!visited[ni] && colourMatch(getPixel(pixels, nx, ny, stride), bg, threshold)) {
        visited[ni] = 1
        queue.push(nx, ny)
      }
    }
  }

  return sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } }).png().toBuffer()
}

// ─── Canvas rendering ─────────────────────────────────────────────────────────

async function renderOnCanvas(
  productPng: Buffer,
  canvasSize: number,
  opts: Required<PipelineOptions>
): Promise<Buffer> {
  const contentSize = Math.round(canvasSize * opts.contentFraction)

  // Resize product to fit within contentSize × contentSize (preserve aspect ratio)
  const resized = await sharp(productPng)
    .resize(contentSize, contentSize, { fit: 'inside', withoutEnlargement: false })
    .toBuffer()

  const meta = await sharp(resized).metadata()
  const pw = meta.width ?? contentSize
  const ph = meta.height ?? contentSize

  // Centre offset on white canvas
  const left = Math.round((canvasSize - pw) / 2)
  const top  = Math.round((canvasSize - ph) / 2)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const composites: any[] = []

  if (opts.shadowStrength > 0 && canvasSize >= 300) {
    const shadowBuf = await buildShadow(pw, ph, canvasSize, left, top, opts.shadowStrength)
    composites.push({ input: shadowBuf, blend: 'over' })
  }

  // Composite product on top of shadow
  composites.push({ input: resized, left, top })

  // Subtle unsharp mask — amount is deliberately low to avoid text ringing artefacts
  const sharpenSigma  = canvasSize >= 600 ? 0.6 : 0.4
  const sharpenAmount = 0.4

  const result = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .sharpen({ sigma: sharpenSigma, m1: sharpenAmount, m2: 0.1 })
    .webp({ quality: opts.quality, effort: 4 })
    .toBuffer()

  return result
}

// ─── Drop shadow ──────────────────────────────────────────────────────────────

async function buildShadow(
  pw: number,
  ph: number,
  canvasSize: number,
  left: number,
  top: number,
  strength: number
): Promise<Buffer> {
  const offsetY = Math.round(canvasSize * 0.015)
  const blur    = Math.max(2, Math.round(canvasSize * 0.02))
  const alpha   = Math.round(strength * 255)

  const shadowRect = await sharp({
    create: {
      width:    pw,
      height:   ph,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha },
    },
  }).png().toBuffer()

  const shadowCanvas = await sharp({
    create: {
      width:    canvasSize,
      height:   canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: shadowRect, left, top: top + offsetY }])
    .blur(blur)
    .png()
    .toBuffer()

  return shadowCanvas
}

// ─── Pixel utilities ──────────────────────────────────────────────────────────

interface RGBA { r: number; g: number; b: number; a: number }

function getPixel(pixels: Uint8Array, x: number, y: number, stride: number): RGBA {
  const p = y * stride + x * 4
  return { r: pixels[p], g: pixels[p + 1], b: pixels[p + 2], a: pixels[p + 3] }
}

function colourMatch(a: RGBA, b: RGBA, threshold: number): boolean {
  return (
    Math.abs(a.r - b.r) <= threshold &&
    Math.abs(a.g - b.g) <= threshold &&
    Math.abs(a.b - b.b) <= threshold &&
    a.a > 128
  )
}

function averageColour(pixels: RGBA[]): RGBA {
  const n = pixels.length
  return {
    r: Math.round(pixels.reduce((s, p) => s + p.r, 0) / n),
    g: Math.round(pixels.reduce((s, p) => s + p.g, 0) / n),
    b: Math.round(pixels.reduce((s, p) => s + p.b, 0) / n),
    a: Math.round(pixels.reduce((s, p) => s + p.a, 0) / n),
  }
}

// ─── Convenience: process from URL ───────────────────────────────────────────

export async function downloadAndProcess(
  imageUrl: string,
  options: PipelineOptions = {}
): Promise<ProcessedImages> {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to download image: ${res.status} ${res.statusText}`)
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) {
    throw new Error(`URL does not point to an image (content-type: ${contentType})`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length < 5 * 1024) throw new Error('Image too small (< 5 KB)')
  if (buffer.length > 25 * 1024 * 1024) throw new Error('Image too large (> 25 MB)')
  return processProductImage(buffer, options)
}
