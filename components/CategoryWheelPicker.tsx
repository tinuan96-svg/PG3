'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import type { StoreCategory } from '@/lib/categories'

// ─── Category icon map ────────────────────────────────────────────────────────

const ICONS: Record<string, string> = {
  'Rice':          '🍚',
  'Dals':          '🫘',
  'Flours':        '🌾',
  'Spices':        '🌶️',
  'Masalas':       '🫕',
  'Oils':          '🫒',
  'Pickles':       '🫙',
  'Essentials':    '🛒',
  'Snacks':        '🍪',
  'Sweets':        '🍮',
  'Tea & Coffee':  '☕',
  'Fryums':        '🥨',
  'Instant Foods': '🍜',
  'Vegetables':    '🥦',
  'Fruits':        '🍋',
  'Household':     '🧹',
  'Personal Care': '💊',
}

function catIcon(name: string) {
  return ICONS[name] ?? '🛒'
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface WheelCategory {
  id: string          // category_id (for filtering) or '' for All
  name: string
  slug: string
}

interface Props {
  categories: StoreCategory[]
  activeCategoryId: string | null
  onSelect: (id: string | null) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_H = 56        // px height of each wheel row
const VISIBLE = 7        // visible items (odd so center is clear)
const HALF = Math.floor(VISIBLE / 2)

// ─── Wheel item ───────────────────────────────────────────────────────────────

function WheelItem({
  cat,
  offsetFromCenter,
  isActive,
  onTap,
}: {
  cat: WheelCategory
  offsetFromCenter: number
  isActive: boolean
  onTap: () => void
}) {
  const abs = Math.abs(offsetFromCenter)
  // opacity: center=1, ±1=0.65, ±2=0.35, ±3=0.12
  const opacity = abs === 0 ? 1 : abs === 1 ? 0.65 : abs === 2 ? 0.35 : 0.12
  // scale: center=1, ±1=0.9, ±2=0.78
  const scale = abs === 0 ? 1 : abs === 1 ? 0.92 : 0.82

  return (
    <motion.button
      onTap={onTap}
      animate={{ opacity, scale }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="w-full flex items-center gap-3 px-6 select-none cursor-pointer focus:outline-none"
      style={{ height: ITEM_H }}
    >
      {/* Icon */}
      <motion.span
        animate={{ scale: isActive ? 1.2 : 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        className="text-2xl leading-none flex-shrink-0 w-9 text-center"
      >
        {catIcon(cat.name)}
      </motion.span>

      {/* Label */}
      <span
        className="text-base font-bold text-left leading-tight truncate"
        style={{ color: isActive ? '#0F2747' : '#6B7280' }}
      >
        {cat.name}
      </span>

      {/* Active dot */}
      {isActive && (
        <motion.span
          layoutId="active-dot"
          className="ml-auto w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: '#5FAE9B' }}
        />
      )}
    </motion.button>
  )
}

// ─── The wheel itself ─────────────────────────────────────────────────────────

function CategoryWheel({
  items,
  activeId,
  onSelect,
}: {
  items: WheelCategory[]
  activeId: string | null
  onSelect: (id: string | null) => void
}) {
  // Centred index (which item sits in the middle slot)
  const activeIdx = Math.max(0, items.findIndex((c) => c.id === (activeId ?? '')))
  const [centreIdx, setCentreIdx] = useState(activeIdx)

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollY = useMotionValue(centreIdx * ITEM_H)
  const isDragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartScroll = useRef(0)

  const totalH = items.length * ITEM_H
  const viewH = VISIBLE * ITEM_H

  // Clamp scroll offset to valid range
  const clamp = (v: number) => Math.max(0, Math.min(v, totalH - ITEM_H))

  // Snap to nearest index
  const snapTo = useCallback((rawY: number) => {
    const idx = Math.round(clamp(rawY) / ITEM_H)
    const clamped = Math.max(0, Math.min(idx, items.length - 1))
    setCentreIdx(clamped)
    animate(scrollY, clamped * ITEM_H, { type: 'spring', stiffness: 320, damping: 30 })
  }, [items.length, scrollY])

  // ── Touch handling ──────────────────────────────────────────────────────────

  function onTouchStart(e: React.TouchEvent) {
    isDragging.current = true
    dragStartY.current = e.touches[0].clientY
    dragStartScroll.current = scrollY.get()
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return
    const delta = dragStartY.current - e.touches[0].clientY
    scrollY.set(clamp(dragStartScroll.current + delta))
    // Live highlight nearest item while dragging
    const idx = Math.round(clamp(dragStartScroll.current + delta) / ITEM_H)
    setCentreIdx(Math.max(0, Math.min(idx, items.length - 1)))
  }

  function onTouchEnd() {
    isDragging.current = false
    snapTo(scrollY.get())
  }

  // ── Mouse wheel support ─────────────────────────────────────────────────────

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const next = clamp(scrollY.get() + e.deltaY)
    snapTo(next)
  }

  // ── Keyboard ────────────────────────────────────────────────────────────────

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      snapTo(Math.min((centreIdx + 1) * ITEM_H, (items.length - 1) * ITEM_H))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      snapTo(Math.max((centreIdx - 1) * ITEM_H, 0))
    } else if (e.key === 'Enter' || e.key === ' ') {
      onSelect(items[centreIdx].id || null)
    }
  }

  // ── Derive visible window ───────────────────────────────────────────────────

  // Items to render: centreIdx ± HALF, clamped
  const firstIdx = Math.max(0, centreIdx - HALF)
  const lastIdx  = Math.min(items.length - 1, centreIdx + HALF)
  const visible  = items.slice(firstIdx, lastIdx + 1)

  return (
    <div
      ref={containerRef}
      role="listbox"
      tabIndex={0}
      aria-label="Category selector"
      className="relative outline-none"
      style={{ height: viewH, userSelect: 'none', WebkitUserSelect: 'none' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
      onKeyDown={onKeyDown}
    >
      {/* Top fade */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{
          height: ITEM_H * 2,
          background: 'linear-gradient(to bottom, white 0%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* Highlight band for selected row */}
      <div
        className="absolute inset-x-0 z-0 pointer-events-none"
        style={{
          top: ITEM_H * HALF,
          height: ITEM_H,
          background: 'linear-gradient(135deg, rgba(95,174,155,0.08) 0%, rgba(15,39,71,0.06) 100%)',
          borderTop: '1px solid rgba(95,174,155,0.2)',
          borderBottom: '1px solid rgba(95,174,155,0.2)',
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{
          height: ITEM_H * 2,
          background: 'linear-gradient(to top, white 0%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* Items */}
      <div className="relative z-[5] flex flex-col" style={{ paddingTop: ITEM_H * HALF }}>
        {visible.map((cat, i) => {
          const absoluteIdx = firstIdx + i
          const offset = absoluteIdx - centreIdx
          return (
            <WheelItem
              key={cat.id || 'all'}
              cat={cat}
              offsetFromCenter={offset}
              isActive={absoluteIdx === centreIdx}
              onTap={() => {
                // Single tap: snap to item AND immediately select it
                if (absoluteIdx !== centreIdx) {
                  snapTo(absoluteIdx * ITEM_H)
                }
                onSelect(cat.id || null)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Main exported component ──────────────────────────────────────────────────

export default function CategoryWheelPicker({ categories, activeCategoryId, onSelect }: Props) {
  const [open, setOpen] = useState(false)

  const allCategory: WheelCategory = { id: '', name: 'All Products', slug: '' }
  const items: WheelCategory[] = [
    allCategory,
    ...categories.map((c) => ({
      id: c.category_id ?? c.store_category_id,
      name: c.store_category_name,
      slug: c.store_category_slug,
    })),
  ]

  const activeItem = activeCategoryId
    ? items.find((c) => c.id === activeCategoryId)
    : allCategory

  function handleSelect(id: string | null) {
    onSelect(id)
    // slight delay so user sees the selection flash before close
    setTimeout(() => setOpen(false), 180)
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-2.5 w-full sm:w-auto px-4 py-3 rounded-2xl border text-sm font-semibold transition-colors"
        style={{
          backgroundColor: activeCategoryId ? '#0F2747' : 'white',
          borderColor: activeCategoryId ? '#0F2747' : '#e5e7eb',
          color: activeCategoryId ? 'white' : '#374151',
        }}
      >
        {/* Grid icon */}
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.span>

        <span className="flex items-center gap-1.5 flex-1 min-w-0">
          {activeItem && activeItem.id !== '' && (
            <span className="text-base leading-none">{catIcon(activeItem.name)}</span>
          )}
          <span className="truncate">
            {activeItem?.id ? activeItem.name : 'Browse Categories'}
          </span>
        </span>

        <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>

      {/* Overlay + Sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Blurred backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15,39,71,0.45)' }}
              onClick={() => setOpen(false)}
            />

            {/* Sheet — animates down from top */}
            <motion.div
              key="sheet"
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed inset-x-0 top-0 z-50 mx-auto"
              style={{ maxWidth: 520 }}
            >
              <div className="bg-white rounded-b-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ background: 'linear-gradient(135deg, #0F2747 0%, #1a3a6b 100%)' }}
                >
                  <div>
                    <p className="text-white font-bold text-base">Browse Categories</p>
                    <p className="text-white/60 text-xs mt-0.5">
                      {categories.length} categories available
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Wheel */}
                <div className="py-2">
                  <CategoryWheel
                    items={items}
                    activeId={activeCategoryId}
                    onSelect={handleSelect}
                  />
                </div>

                {/* Footer hint */}
                <div className="px-5 pb-5 pt-2 flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">
                    Scroll to browse · Tap to select
                  </p>
                  {activeCategoryId && (
                    <button
                      onClick={() => handleSelect(null)}
                      className="text-xs font-semibold underline underline-offset-2"
                      style={{ color: '#5FAE9B' }}
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
