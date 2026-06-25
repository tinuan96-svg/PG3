'use client'

import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react'

export interface WishlistItem {
  id: string
  name: string
  price: number
  image_url?: string
  slug: string
}

type WishlistAction =
  | { type: 'HYDRATE'; items: WishlistItem[] }
  | { type: 'ADD'; item: WishlistItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'TOGGLE'; item: WishlistItem }

interface WishlistState {
  items: WishlistItem[]
  isHydrated: boolean
}

interface WishlistContextType {
  wishlist: WishlistItem[]
  wishlistCount: number
  isHydrated: boolean
  addToWishlist: (item: WishlistItem) => void
  removeFromWishlist: (id: string) => void
  toggleWishlist: (item: WishlistItem) => void
  isInWishlist: (id: string) => boolean
}

const WishlistContext = createContext<WishlistContextType | null>(null)

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items, isHydrated: true }
    case 'ADD':
      if (state.items.find((i) => i.id === action.item.id)) return state
      return { ...state, items: [...state.items, action.item] }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'TOGGLE': {
      const exists = state.items.find((i) => i.id === action.item.id)
      return {
        ...state,
        items: exists
          ? state.items.filter((i) => i.id !== action.item.id)
          : [...state.items, action.item],
      }
    }
    default:
      return state
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, { items: [], isHydrated: false })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pocket-grocery-wishlist')
      dispatch({ type: 'HYDRATE', items: raw ? JSON.parse(raw) : [] })
    } catch {
      dispatch({ type: 'HYDRATE', items: [] })
    }
  }, [])

  useEffect(() => {
    if (!state.isHydrated) return
    localStorage.setItem('pocket-grocery-wishlist', JSON.stringify(state.items))
  }, [state.items, state.isHydrated])

  const value = useMemo(() => ({
    wishlist: state.items,
    wishlistCount: state.items.length,
    isHydrated: state.isHydrated,
    addToWishlist: (item: WishlistItem) => dispatch({ type: 'ADD', item }),
    removeFromWishlist: (id: string) => dispatch({ type: 'REMOVE', id }),
    toggleWishlist: (item: WishlistItem) => dispatch({ type: 'TOGGLE', item }),
    isInWishlist: (id: string) => state.items.some((i) => i.id === id),
  }), [state.items, state.isHydrated])

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
