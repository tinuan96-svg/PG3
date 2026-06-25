'use client'

import { useState, useEffect } from 'react'

export default function DeliveryCountdown() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null)
  const [eligible, setEligible] = useState(true)

  useEffect(() => {
    function calculateTimeLeft() {
      const now = new Date()
      const cutoff = new Date()
      cutoff.setHours(16, 0, 0, 0)
      if (now >= cutoff) {
        setEligible(false)
        setTimeLeft(null)
        return
      }
      const diff = cutoff.getTime() - now.getTime()
      setEligible(true)
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!eligible) {
    return (
      <div className="text-white text-sm py-3 text-center font-medium" style={{ backgroundColor: '#0F2747' }}>
        Order now for delivery the day after tomorrow
      </div>
    )
  }

  if (!timeLeft) return null

  return (
    <div className="text-white py-3" style={{ backgroundColor: '#0F2747' }}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
        <span className="font-medium">Order within</span>
        <div className="flex items-center gap-1 font-mono">
          <span className="px-2 py-1 rounded font-bold text-sm" style={{ backgroundColor: '#5FAE9B' }}>
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="font-bold">:</span>
          <span className="px-2 py-1 rounded font-bold text-sm" style={{ backgroundColor: '#5FAE9B' }}>
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="font-bold">:</span>
          <span className="px-2 py-1 rounded font-bold text-sm" style={{ backgroundColor: '#5FAE9B' }}>
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
        <span className="font-medium">for next day delivery across the UK</span>
      </div>
    </div>
  )
}
