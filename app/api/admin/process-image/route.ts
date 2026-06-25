// Server-side only. Requires Node.js runtime for Sharp native binaries.
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { downloadAndProcess, processProductImage, type PipelineOptions } from '@/lib/image-processing'

const STORAGE_BUCKET = 'product-images'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = adminClient as any

type ProcessRequest = {
  product_id: string
  product_image_id?: string
  image_url: string
  job_id?: string
  settings?: {
    keep_original?: boolean
    replace_storefront_image?: boolean
    quality?: number
    bg_threshold?: number
    shadow_strength?: number
    main_px?: number
    medium_px?: number
    thumb_px?: number
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user } } = await adminClient.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await db
      .from('user_profiles')
      .select('role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!['admin', 'super_admin'].includes((profile as { role?: string } | null)?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Parse request ───────────────────────────────────────────────────────
    const body: ProcessRequest = await req.json()
    const { product_id, product_image_id, image_url } = body
    const settings = {
      keep_original: true,
      replace_storefront_image: true,
      quality: 85,
      bg_threshold: 30,
      shadow_strength: 0.15,
      main_px: 1200,
      medium_px: 600,
      thumb_px: 300,
      ...body.settings,
    }

    if (!product_id || !image_url) {
      return NextResponse.json({ error: 'product_id and image_url are required' }, { status: 400 })
    }

    // ── Create or claim job ─────────────────────────────────────────────────
    let jobId = body.job_id ?? null

    if (jobId) {
      // Claim an existing pending job
      await db.from('image_processing_jobs').update({
        status: 'processing',
        pipeline_stage: 'validate',
        processing_started_at: new Date().toISOString(),
        retry_count: db.rpc ? undefined : undefined, // updated separately
        updated_at: new Date().toISOString(),
      }).eq('id', jobId).eq('status', 'pending')
    } else {
      const { data: job } = await db
        .from('image_processing_jobs')
        .insert({
          product_id,
          product_image_id: product_image_id ?? null,
          original_url: image_url,
          status: 'processing',
          pipeline_stage: 'validate',
          processing_engine: 'sharp',
          processing_started_at: new Date().toISOString(),
        })
        .select('id')
        .maybeSingle()
      jobId = (job as { id: string } | null)?.id ?? crypto.randomUUID()
    }

    if (product_image_id) {
      await db.from('product_images')
        .update({ processing_status: 'processing' })
        .eq('id', product_image_id)
    }

    // ── Download & process ──────────────────────────────────────────────────
    await updateStage(jobId!, 'download')

    let processed: Awaited<ReturnType<typeof processProductImage>>
    try {
      const pipelineOpts: PipelineOptions = {
        quality:         settings.quality,
        bgThreshold:     settings.bg_threshold,
        shadowStrength:  settings.shadow_strength,
        mainPx:          settings.main_px,
        mediumPx:        settings.medium_px,
        thumbPx:         settings.thumb_px,
      }
      await updateStage(jobId!, 'processing')
      processed = await downloadAndProcess(image_url, pipelineOpts)
    } catch (err) {
      await failJob(jobId!, product_image_id, 'processing', String(err))
      return NextResponse.json({ success: false, error: String(err) }, { status: 422 })
    }

    // ── Upload all 3 sizes ──────────────────────────────────────────────────
    const ts = Date.now()
    const base = `processed/${product_id}/${ts}`

    await updateStage(jobId!, 'upload_main')
    const mainPath = `${base}_1200.webp`
    const { error: mainErr } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .upload(mainPath, processed.main, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true,
      })
    if (mainErr) {
      await failJob(jobId!, product_image_id, 'upload_main', mainErr.message)
      return NextResponse.json({ success: false, error: mainErr.message }, { status: 500 })
    }
    const processedUrl = adminClient.storage.from(STORAGE_BUCKET).getPublicUrl(mainPath).data.publicUrl

    await updateStage(jobId!, 'upload_medium')
    let mediumUrl = processedUrl
    const medPath = `${base}_600.webp`
    const { error: medErr } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .upload(medPath, processed.medium, { contentType: 'image/webp', cacheControl: '31536000', upsert: true })
    if (!medErr) {
      mediumUrl = adminClient.storage.from(STORAGE_BUCKET).getPublicUrl(medPath).data.publicUrl
    }

    await updateStage(jobId!, 'upload_thumbnail')
    let thumbnailUrl = processedUrl
    const thumbPath = `${base}_300.webp`
    const { error: thumbErr } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .upload(thumbPath, processed.thumb, { contentType: 'image/webp', cacheControl: '31536000', upsert: true })
    if (!thumbErr) {
      thumbnailUrl = adminClient.storage.from(STORAGE_BUCKET).getPublicUrl(thumbPath).data.publicUrl
    }

    // ── Update DB records ───────────────────────────────────────────────────
    await updateStage(jobId!, 'update_records')
    const duration = Date.now() - startTime

    if (product_image_id) {
      const imgUpdate: Record<string, unknown> = {
        processing_status: 'completed',
        processing_error:  null,
        processed_url:     processedUrl,
        thumbnail_url:     thumbnailUrl,
        processed_at:      new Date().toISOString(),
        url:               processedUrl,
      }
      if (settings.keep_original) imgUpdate.original_url = image_url
      await db.from('product_images').update(imgUpdate).eq('id', product_image_id)
    }

    const { data: imgRow } = product_image_id
      ? await db.from('product_images').select('is_primary').eq('id', product_image_id).maybeSingle()
      : { data: null }

    const isPrimary = !product_image_id || (imgRow as { is_primary?: boolean } | null)?.is_primary

    const productUpdate: Record<string, unknown> = {
      processed_image_url: processedUrl,
      thumbnail_url:       thumbnailUrl,
      updated_at:          new Date().toISOString(),
    }
    if (settings.keep_original) productUpdate.original_image_url = image_url
    if (isPrimary && settings.replace_storefront_image) productUpdate.image = processedUrl

    await db.from('products').update(productUpdate).eq('id', product_id)

    // ── Complete job ────────────────────────────────────────────────────────
    await db.from('image_processing_jobs').update({
      pipeline_stage:           'completed',
      status:                   'completed',
      processed_url:            processedUrl,
      medium_url:               mediumUrl,
      thumbnail_url:            thumbnailUrl,
      processing_completed_at:  new Date().toISOString(),
      duration_ms:              duration,
      updated_at:               new Date().toISOString(),
    }).eq('id', jobId)

    return NextResponse.json({
      success:       true,
      job_id:        jobId,
      processed_url: processedUrl,
      medium_url:    mediumUrl,
      thumbnail_url: thumbnailUrl,
      original_url:  image_url,
      stage:         'completed',
      duration_ms:   duration,
      engine:        'sharp',
    })
  } catch (err) {
    console.error('[process-image] Unhandled error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

async function updateStage(jobId: string, stage: string) {
  await db.from('image_processing_jobs')
    .update({ pipeline_stage: stage, updated_at: new Date().toISOString() })
    .eq('id', jobId)
}

async function failJob(
  jobId: string,
  imageId: string | undefined,
  stage: string,
  error: string,
) {
  await db.from('image_processing_jobs').update({
    status:                   'failed',
    pipeline_stage:           stage,
    error_message:            error,
    processing_completed_at:  new Date().toISOString(),
    updated_at:               new Date().toISOString(),
  }).eq('id', jobId)

  if (imageId) {
    await db.from('product_images').update({
      processing_status: 'failed',
      processing_error:  error,
    }).eq('id', imageId)
  }
}
