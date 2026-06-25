'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePocket } from '@/lib/pocket-context'

// Renders a single flying product image from source → pocket button.
// Uses a cubic bezier curved path via keyframes (left/top + rotate + scale).
export default function FlyToAnimation() {
  const { flyPayload, clearFly, pocketButtonRef, openPocket } = usePocket()
  const animatingRef = useRef(false)

  useEffect(() => {
    if (!flyPayload || animatingRef.current) return
    animatingRef.current = true

    // The animation component will run; clear after it completes
    const t = setTimeout(() => {
      clearFly()
      animatingRef.current = false
    }, 950)
    return () => clearTimeout(t)
  }, [flyPayload, clearFly])

  if (!flyPayload) return null

  const src = flyPayload.originRect
  const pocket = pocketButtonRef.current?.getBoundingClientRect()

  const startX = src.left + src.width / 2 - 28
  const startY = src.top + src.height / 2 - 28

  const endX = pocket ? pocket.left + pocket.width / 2 - 28 : window.innerWidth / 2 - 28
  const endY = pocket ? pocket.top + pocket.height / 2 - 28 : window.innerHeight - 80

  // Bezier control point: arc up and to the center
  const cpX = (startX + endX) / 2
  const cpY = Math.min(startY, endY) - 120

  return (
    <AnimatePresence>
      {flyPayload && (
        <FlyingDot
          imageUrl={flyPayload.imageUrl}
          startX={startX}
          startY={startY}
          endX={endX}
          endY={endY}
          cpX={cpX}
          cpY={cpY}
          onComplete={() => {
            clearFly()
            openPocket()
          }}
        />
      )}
    </AnimatePresence>
  )
}

interface FlyingDotProps {
  imageUrl: string
  startX: number
  startY: number
  endX: number
  endY: number
  cpX: number
  cpY: number
  onComplete: () => void
}

// Animates a 56×56 image clone along a quadratic bezier path using keyframes.
function FlyingDot({ imageUrl, startX, startY, endX, endY, cpX, cpY, onComplete }: FlyingDotProps) {
  // Compute intermediate point on the quadratic bezier curve at t=0.5
  const midX = 0.25 * startX + 0.5 * cpX + 0.25 * endX
  const midY = 0.25 * startY + 0.5 * cpY + 0.25 * endY

  return (
    <motion.div
      className="fixed z-[9999] pointer-events-none"
      style={{ width: 56, height: 56 }}
      initial={{ x: startX, y: startY, scale: 1, opacity: 1, rotate: 0 }}
      animate={{
        x: [startX, midX, endX],
        y: [startY, midY, endY],
        scale: [1, 0.85, 0.45],
        opacity: [1, 1, 0],
        rotate: [0, -12, 0],
      }}
      transition={{
        duration: 0.72,
        ease: [0.25, 0.46, 0.45, 0.94],
        times: [0, 0.5, 1],
      }}
      onAnimationComplete={onComplete}
    >
      {/* Circular image clone */}
      <div
        className="w-full h-full rounded-full overflow-hidden border-2 border-white shadow-lg"
        style={{ background: '#f3f4f6' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      </div>
    </motion.div>
  )
}
