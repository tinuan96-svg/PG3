'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getCart, getCartCount, onCartUpdate, type CartItem } from '@/lib/cart'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlyPayload {
  imageUrl: string
  originRect: DOMRect  // bounding box of the source element
}

interface PocketContextValue {
  // Cart state
  cartCount: number
  cartItems: CartItem[]
  cartTotal: number

  // Pocket panel open/close
  pocketOpen: boolean
  openPocket: () => void
  closePocket: () => void
  togglePocket: () => void

  // Ref for the pocket button DOM element (used to compute fly-to target)
  pocketButtonRef: React.RefObject<HTMLButtonElement>

  // Trigger fly animation from a source rect
  triggerFly: (payload: FlyPayload) => void
  flyPayload: FlyPayload | null
  clearFly: () => void

  // Pocket bounce/glow state
  justAdded: boolean
}

const PocketContext = createContext<PocketContextValue | null>(null)

export function PocketProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartTotal, setCartTotal] = useState(0)
  const [pocketOpen, setPocketOpen] = useState(false)
  const [flyPayload, setFlyPayload] = useState<FlyPayload | null>(null)
  const [justAdded, setJustAdded] = useState(false)
  const pocketButtonRef = useRef<HTMLButtonElement>(null)

  function syncCart() {
    const items = getCart()
    setCartItems(items)
    setCartCount(getCartCount())
    setCartTotal(items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0))
  }

  useEffect(() => {
    syncCart()
    return onCartUpdate(() => {
      syncCart()
      setJustAdded(true)
      const t = setTimeout(() => setJustAdded(false), 900)
      return () => clearTimeout(t)
    })
  }, [])

  const openPocket = useCallback(() => setPocketOpen(true), [])
  const closePocket = useCallback(() => setPocketOpen(false), [])
  const togglePocket = useCallback(() => setPocketOpen((v) => !v), [])

  const triggerFly = useCallback((payload: FlyPayload) => {
    setFlyPayload(payload)
  }, [])

  const clearFly = useCallback(() => setFlyPayload(null), [])

  return (
    <PocketContext.Provider value={{
      cartCount, cartItems, cartTotal,
      pocketOpen, openPocket, closePocket, togglePocket,
      pocketButtonRef,
      triggerFly, flyPayload, clearFly,
      justAdded,
    }}>
      {children}
    </PocketContext.Provider>
  )
}

export function usePocket(): PocketContextValue {
  const ctx = useContext(PocketContext)
  if (!ctx) throw new Error('usePocket must be used within PocketProvider')
  return ctx
}
