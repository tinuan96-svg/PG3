'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type MediaItem = {
  id: string
  file_name: string
  storage_path: string
  public_url: string
  mime_type: string
  size_bytes: number
  created_at: string
}

type SingleProps = {
  multiSelect?: false
  onSelect: (url: string) => void
  onSelectMultiple?: never
  onClose: () => void
  title?: string
}

type MultiProps = {
  multiSelect: true
  onSelect?: never
  onSelectMultiple: (urls: string[]) => void
  onClose: () => void
  title?: string
}

type Props = SingleProps | MultiProps

export default function MediaPicker({ onSelect, onSelectMultiple, onClose, multiSelect = false, title = 'Select Image' }: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('media_library')
      .select('id, file_name, storage_path, public_url, mime_type, size_bytes, created_at')
      .order('created_at', { ascending: false })
    if (error) console.error('[MediaPicker] load error:', error)
    setItems((data as MediaItem[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        setUploadError(`Upload failed: ${uploadError.message}`)
        continue
      }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabase as any).from('media_library').insert({
        file_name: file.name,
        storage_path: path,
        public_url: urlData.publicUrl,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      })

      if (dbError) {
        setUploadError(`Saved to storage but failed to record in library: ${dbError.message}`)
      }
    }

    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
    load()
  }

  async function handleDelete(item: MediaItem, e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(item.id)
    await supabase.storage.from('product-images').remove([item.storage_path])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('media_library').delete().eq('id', item.id)
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    setSelected((prev) => { const s = new Set(prev); s.delete(item.public_url); return s })
    setDeleting(null)
  }

  function toggleItem(url: string) {
    if (multiSelect) {
      setSelected((prev) => {
        const s = new Set(prev)
        if (s.has(url)) s.delete(url)
        else s.add(url)
        return s
      })
    } else {
      setSelected((prev) => {
        const already = prev.has(url)
        return already ? new Set() : new Set([url])
      })
    }
  }

  function handleConfirm() {
    if (multiSelect) {
      const urls = Array.from(selected)
      if (urls.length > 0) { onSelectMultiple!(urls); onClose() }
    } else {
      const url = Array.from(selected)[0]
      if (url) { onSelect!(url); onClose() }
    }
  }

  function selectAll() {
    setSelected(new Set(items.map((i) => i.public_url)))
  }

  function clearAll() {
    setSelected(new Set())
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / 1048576).toFixed(1)}MB`
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {multiSelect && (
              <p className="text-xs text-gray-400 mt-0.5">Click to select multiple images</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {multiSelect && items.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2"
                >
                  Select All
                </button>
                {selected.size > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
            <label className={`flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl cursor-pointer transition-opacity hover:opacity-90 ${uploading ? 'opacity-60 pointer-events-none' : ''}`} style={{ backgroundColor: '#0F2747' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploading ? 'Uploading…' : 'Upload'}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {uploadError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="flex-1">{uploadError}</span>
              <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">No images yet</p>
              <p className="text-xs text-gray-400 mt-1">Upload images using the button above</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {items.map((item) => {
                const isSelected = selected.has(item.public_url)
                const selectionIndex = multiSelect ? Array.from(selected).indexOf(item.public_url) : -1
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.public_url)}
                    className={`relative group aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? 'border-[#5FAE9B] ring-2 ring-[#5FAE9B]/30' : 'border-transparent hover:border-gray-300'}`}
                  >
                    <img
                      src={item.public_url}
                      alt={item.file_name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#5FAE9B]/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-[#5FAE9B] flex items-center justify-center shadow">
                          {multiSelect && selectionIndex >= 0 ? (
                            <span className="text-white text-[10px] font-bold">{selectionIndex + 1}</span>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(item, e)}
                      disabled={deleting === item.id}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow"
                    >
                      {deleting === item.id ? (
                        <svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      ) : (
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                    {/* File name tooltip */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] text-white truncate">{item.file_name}</p>
                      <p className="text-[9px] text-white/70">{formatSize(item.size_bytes)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-gray-400">
            {items.length} image{items.length !== 1 ? 's' : ''} in library
            {selected.size > 0 && (
              <span className="ml-2 font-semibold text-[#5FAE9B]">
                · {selected.size} selected
              </span>
            )}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="text-sm font-medium text-gray-600 border border-gray-200 px-5 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="text-sm font-bold text-white px-5 py-2 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: '#5FAE9B' }}
            >
              {multiSelect
                ? selected.size > 0 ? `Add ${selected.size} Image${selected.size !== 1 ? 's' : ''}` : 'Select Images'
                : 'Use Selected'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
