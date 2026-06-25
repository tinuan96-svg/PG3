'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MediaPicker from '@/components/admin/MediaPicker'

type ProcessingStatus = 'none' | 'processing' | 'completed' | 'failed'

type ProductImage = {
  id: string
  product_id: string
  url: string
  storage_path: string | null
  alt_text: string | null
  sort_order: number
  is_primary: boolean
  original_url: string | null
  processed_url: string | null
  thumbnail_url: string | null
  processing_status: ProcessingStatus
  processing_error: string | null
}

type ImageProcessingSettings = {
  auto_process_on_upload: boolean
  generate_white_background: boolean
  generate_thumbnail: boolean
  keep_original: boolean
  replace_storefront_image: boolean
  output_size_px: number
  thumbnail_size_px: number
}

type Props = {
  productId: string
  productName: string
}

const STATUS_META: Record<ProcessingStatus, { label: string; color: string; bg: string }> = {
  none: { label: '', color: '', bg: '' },
  processing: { label: 'Processing…', color: 'text-amber-700', bg: 'bg-amber-100' },
  completed: { label: 'Enhanced', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  failed: { label: 'Failed', color: 'text-red-700', bg: 'bg-red-100' },
}

export default function ProductImagesManager({ productId, productName }: Props) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const hasProcessingRef = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState<ImageProcessingSettings | null>(null)
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({})
  const [lightbox, setLightbox] = useState<ProductImage | null>(null)
  const [showLibraryPicker, setShowLibraryPicker] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const dragSrcId = useRef<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
    setImages((data ?? []) as ProductImage[])
    setLoading(false)
  }, [productId])

  const loadSettings = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('image_processing_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
    if (data) setSettings(data as ImageProcessingSettings)
  }, [])

  useEffect(() => {
    load()
    loadSettings()
  }, [load, loadSettings])

  useEffect(() => {
    hasProcessingRef.current = images.some((i) => i.processing_status === 'processing')
  }, [images])

  async function triggerProcessing(img: ProductImage) {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) return

    // Optimistic: mark as processing immediately
    setImages((prev) =>
      prev.map((i) => i.id === img.id ? { ...i, processing_status: 'processing' } : i)
    )

    try {
      const res = await fetch('/api/admin/process-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          product_image_id: img.id,
          image_url: img.original_url ?? img.url,
          settings: settings
            ? { keep_original: settings.keep_original, replace_storefront_image: settings.replace_storefront_image }
            : undefined,
        }),
      })
      const result = await res.json()
      if (result.success) {
        await load()
      } else {
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id
              ? { ...i, processing_status: 'failed', processing_error: result.error ?? 'Processing failed' }
              : i
          )
        )
      }
    } catch (err) {
      setImages((prev) =>
        prev.map((i) =>
          i.id === img.id ? { ...i, processing_status: 'failed', processing_error: String(err) } : i
        )
      )
    }
  }

  function displayUrl(img: ProductImage): string {
    if (showOriginal[img.id]) return img.original_url ?? img.url
    return img.processed_url ?? img.url
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return
    setUploading(true)
    setError('')
    const currentMax = images.reduce((max, img) => Math.max(max, img.sort_order), -1)
    let order = currentMax + 1
    const isFirst = images.length === 0

    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadErr) {
        setError(`Upload failed: ${uploadErr.message}`)
        continue
      }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newImg } = await (supabase as any).from('product_images').insert({
        product_id: productId,
        url: urlData.publicUrl,
        original_url: urlData.publicUrl,
        storage_path: path,
        alt_text: productName,
        sort_order: order,
        is_primary: isFirst && order === 0,
        processing_status: 'none',
      }).select().single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('media_library').insert({
        file_name: file.name,
        storage_path: path,
        public_url: urlData.publicUrl,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      })

      if (newImg && settings?.auto_process_on_upload) {
        setTimeout(() => triggerProcessing(newImg as ProductImage), 500)
      }

      // Sync the first-ever image to products.image so approval diagnostics pass
      if (isFirst && order === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('products').update({ image: urlData.publicUrl }).eq('id', productId)
      }

      order++
    }

    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
    load()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    await uploadFiles(files)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (files.length > 0) uploadFiles(files)
  }

  async function addFromLibrary(urls: string[]) {
    if (urls.length === 0) return
    setError('')
    const currentMax = images.reduce((max, img) => Math.max(max, img.sort_order), -1)
    let order = currentMax + 1
    const isFirst = images.length === 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const inserts = urls.map((url, i) => ({
      product_id: productId,
      url,
      original_url: url,
      storage_path: null,
      alt_text: productName,
      sort_order: order + i,
      is_primary: isFirst && i === 0,
      processing_status: 'none',
    }))

    const { error: dbErr } = await db.from('product_images').insert(inserts)
    if (dbErr) { setError(`Failed to add images: ${dbErr.message}`); return }

    // If this is the first image, sync it to products.image
    if (isFirst && urls[0]) {
      await db.from('products').update({ image: urls[0] }).eq('id', productId)
    }

    order += urls.length
    load()
  }

  async function setPrimary(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await Promise.all([
      db.from('product_images').update({ is_primary: false }).eq('product_id', productId),
      db.from('product_images').update({ is_primary: true }).eq('id', id),
    ])
    setImages((prev) => prev.map((img) => ({ ...img, is_primary: img.id === id })))

    // Sync the chosen primary image URL to products.image
    const primaryImg = images.find((img) => img.id === id)
    if (primaryImg) {
      const syncUrl = primaryImg.processed_url ?? primaryImg.url
      await db.from('products').update({ image: syncUrl }).eq('id', productId)
    }
  }

  async function deleteImage(img: ProductImage) {
    if (!confirm('Delete this image?')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('product_images').delete().eq('id', img.id)
    if (img.storage_path) {
      await supabase.storage.from('product-images').remove([img.storage_path])
    }
    setImages((prev) => {
      const next = prev.filter((i) => i.id !== img.id)
      if (img.is_primary && next.length > 0) {
        setPrimary(next[0].id)
        return next.map((i, idx) => ({ ...i, is_primary: idx === 0 }))
      }
      return next
    })
  }

  async function updateAlt(id: string, alt: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('product_images').update({ alt_text: alt }).eq('id', id)
    setImages((prev) => prev.map((img) => img.id === id ? { ...img, alt_text: alt } : img))
  }

  function onDragStart(id: string) { dragSrcId.current = id }
  function onDragEnter(id: string) { setDragOverId(id) }
  function onDragEnd() { setDragOverId(null) }

  async function onDropReorder(targetId: string) {
    setDragOverId(null)
    if (!dragSrcId.current || dragSrcId.current === targetId) return

    const srcIdx = images.findIndex((i) => i.id === dragSrcId.current)
    const tgtIdx = images.findIndex((i) => i.id === targetId)
    if (srcIdx === -1 || tgtIdx === -1) return

    const reordered = [...images]
    const [moved] = reordered.splice(srcIdx, 1)
    reordered.splice(tgtIdx, 0, moved)

    const updated = reordered.map((img, idx) => ({ ...img, sort_order: idx }))
    setImages(updated)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await Promise.all(updated.map((img) => db.from('product_images').update({ sort_order: img.sort_order }).eq('id', img.id)))
    dragSrcId.current = null
  }

  const autoProcessOn = settings?.auto_process_on_upload === true
  const processingCount = images.filter((i) => i.processing_status === 'processing').length

  return (
    <div className="space-y-4">
      {/* Settings banner */}
      {settings !== null && (
        <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm ${autoProcessOn ? 'bg-[#5FAE9B]/10 border border-[#5FAE9B]/20' : 'bg-amber-50 border border-amber-100'}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${autoProcessOn ? 'bg-[#5FAE9B]' : 'bg-amber-400'}`} />
            <span className={autoProcessOn ? 'text-[#3d8a77] font-medium' : 'text-amber-700'}>
              {autoProcessOn
                ? 'Auto processing is on — images will be standardised automatically after upload'
                : 'Auto processing is off — use the wand icon to process images manually'}
            </span>
          </div>
          <a
            href="/admin/settings/image-processing"
            className={`text-xs font-medium underline underline-offset-2 ${autoProcessOn ? 'text-[#3d8a77]' : 'text-amber-600'}`}
          >
            Settings
          </a>
        </div>
      )}

      {processingCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-sm text-amber-700">
          <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Processing {processingCount} image{processingCount !== 1 ? 's' : ''}…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${dragging ? 'border-[#5FAE9B] bg-[#5FAE9B]/5' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <svg className={`w-8 h-8 mx-auto mb-3 ${dragging ? 'text-[#5FAE9B]' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <p className="text-sm font-medium text-gray-600 mb-1">
          {uploading ? 'Uploading…' : 'Drag & drop images here'}
        </p>
        <p className="text-xs text-gray-400 mb-3">or</p>
        <div className="flex items-center gap-2 justify-center">
          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 ${uploading ? 'opacity-50 pointer-events-none' : ''}`} style={{ backgroundColor: '#0F2747' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Choose Files
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} disabled={uploading} />
          </label>
          <button
            type="button"
            onClick={() => setShowLibraryPicker(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Media Library
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">JPG, PNG, WebP supported · Max 20 MB each</p>
      </div>

      {/* Images grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : images.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">No images yet. Upload images above.</p>
          <p className="text-xs text-gray-400 mt-1">At least one primary image is required for approval.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">
            {images.length} image{images.length !== 1 ? 's' : ''} &middot; Drag to reorder &middot; Click star to set primary
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => {
              const status = img.processing_status ?? 'none'
              const meta = STATUS_META[status]
              const hasProcessed = !!img.processed_url
              const isShowingOriginal = showOriginal[img.id]

              return (
                <div
                  key={img.id}
                  draggable
                  onDragStart={() => onDragStart(img.id)}
                  onDragEnter={() => onDragEnter(img.id)}
                  onDragEnd={onDragEnd}
                  onDrop={(e) => { e.preventDefault(); onDropReorder(img.id) }}
                  onDragOver={(e) => e.preventDefault()}
                  className={`group relative rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all ${
                    img.is_primary
                      ? 'border-[#5FAE9B] ring-2 ring-[#5FAE9B]/20'
                      : dragOverId === img.id
                      ? 'border-[#0F2747] ring-2 ring-[#0F2747]/20'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <div
                    className="aspect-square bg-gray-50 relative cursor-pointer"
                    onClick={() => setLightbox(img)}
                  >
                    <img
                      src={displayUrl(img)}
                      alt={img.alt_text ?? ''}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />

                    {/* Processing overlay */}
                    {status === 'processing' && (
                      <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-1">
                        <svg className="w-6 h-6 animate-spin text-[#5FAE9B]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span className="text-[9px] font-semibold text-[#3d8a77]">Processing</span>
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  {status !== 'none' && (
                    <div className={`absolute top-1.5 left-1.5 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow ${meta.bg} ${meta.color}`}>
                      {status === 'completed' && (
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.983 0a12.206 12.206 0 00-8.51 3.515 12.206 12.206 0 000 16.97 12.206 12.206 0 0016.97 0 12.206 12.206 0 000-16.97A12.206 12.206 0 0011.983 0zm6.35 9.956l-7.737 7.737-3.872-3.872 1.414-1.414 2.458 2.458 6.323-6.323 1.414 1.414z" />
                        </svg>
                      )}
                      {meta.label}
                    </div>
                  )}

                  {img.is_primary && status === 'none' && (
                    <div className="absolute top-1.5 left-1.5 bg-[#5FAE9B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                      Primary
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

                  {/* Action buttons */}
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Re-process / process button */}
                    {status !== 'processing' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); triggerProcessing(img) }}
                        title={hasProcessed ? 'Reprocess image' : 'Process image'}
                        className="w-6 h-6 rounded-full bg-white shadow flex items-center justify-center hover:bg-[#5FAE9B]/10 transition-colors"
                      >
                        <svg className="w-3 h-3 text-[#5FAE9B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </button>
                    )}

                    {/* Before/after toggle */}
                    {hasProcessed && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowOriginal((prev) => ({ ...prev, [img.id]: !prev[img.id] })) }}
                        title={isShowingOriginal ? 'Show processed' : 'Show original'}
                        className="w-6 h-6 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <svg className={`w-3 h-3 ${isShowingOriginal ? 'text-amber-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </button>
                    )}

                    {!img.is_primary && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPrimary(img.id) }}
                        title="Set as primary image"
                        className="w-6 h-6 rounded-full bg-white shadow flex items-center justify-center hover:bg-yellow-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); deleteImage(img) }}
                      title="Delete image"
                      className="w-6 h-6 rounded-full bg-white shadow flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                    {/* Before/after label */}
                  {hasProcessed && (
                    <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${isShowingOriginal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isShowingOriginal ? 'ORIGINAL' : 'ENHANCED'}
                      </span>
                    </div>
                  )}

                  {/* Alt text input */}
                  <div className="p-1.5">
                    <input
                      value={img.alt_text ?? ''}
                      onChange={(e) => updateAlt(img.id, e.target.value)}
                      placeholder="Alt text"
                      className="w-full text-[10px] border border-gray-100 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-gray-300"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">{lightbox.alt_text || 'Image Preview'}</h3>
              <button onClick={() => setLightbox(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {lightbox.processed_url && lightbox.original_url ? (
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                <div className="p-4 space-y-2">
                  <p className="text-xs font-semibold text-center text-gray-500 uppercase tracking-wider">Original</p>
                  <img src={lightbox.original_url} alt="Original" className="w-full aspect-square object-contain bg-gray-50 rounded-xl" />
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs font-semibold text-center text-[#5FAE9B] uppercase tracking-wider">Enhanced</p>
                  <img src={lightbox.processed_url} alt="Processed" className="w-full aspect-square object-contain bg-white rounded-xl border border-gray-100" />
                </div>
              </div>
            ) : (
              <div className="p-6">
                <img src={displayUrl(lightbox)} alt={lightbox.alt_text ?? ''} className="w-full max-h-[60vh] object-contain rounded-xl bg-gray-50" />
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {lightbox.processing_status !== 'none' && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_META[lightbox.processing_status ?? 'none'].bg} ${STATUS_META[lightbox.processing_status ?? 'none'].color}`}>
                    {STATUS_META[lightbox.processing_status ?? 'none'].label}
                  </span>
                )}
              </div>
              {lightbox.processing_status !== 'processing' && (
                <button
                  onClick={() => { triggerProcessing(lightbox); setLightbox(null) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {lightbox.processed_url ? 'Reprocess Image' : 'Process Image'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media Library multi-picker */}
      {showLibraryPicker && (
        <MediaPicker
          multiSelect
          onSelectMultiple={addFromLibrary}
          onClose={() => setShowLibraryPicker(false)}
          title="Select Images from Library"
        />
      )}
    </div>
  )
}
