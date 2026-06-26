'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getCartCount, onCartUpdate } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist-context'
import { getStoreCategories, type StoreCategory } from '@/lib/categories'

const CATEGORY_ICONS: Record<string, string> = {
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
  'Instant Foods': '⚡',
  'Vegetables':    '🥦',
  'Fruits':        '🥭',
  'Household':     '🧹',
  'Personal Care': '🌿',
}

function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? '🛒'
}

const NAV_LINKS = [
  { label: 'Offers', href: '/offers' },
  { label: 'Best Sellers', href: '/best-sellers' },
  { label: 'Brands', href: '/brands' },
  { label: 'Bundles', href: '/bundles' },
  { label: 'Recipes', href: '/recipes' },
]

const SEARCH_SUGGESTIONS = [
  'Banana chips', 'Matta rice', 'Fish curry masala', 'Coconut oil',
  'Sambar powder', 'Puttu podi', 'Cardamom tea', 'Mango pickle',
  'Kerala mixture', 'Idiyappam', 'Appam', 'Tapioca chips',
]

export default function Header() {
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [categories, setCategories] = useState<StoreCategory[]>([])

  useEffect(() => {
    getStoreCategories('pocket-grocery').then(setCategories)
  }, [])

  const megaRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const { wishlistCount } = useWishlist()

  useEffect(() => {
    if (searchOpen && mobileSearchRef.current) {
      mobileSearchRef.current.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    setCartCount(getCartCount())
    return onCartUpdate(() => setCartCount(getCartCount()))
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaMenuOpen(false)
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = searchQuery.length > 0
    ? SEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    : SEARCH_SUGGESTIONS.slice(0, 6)

  async function handleSignOut() {
    setAccountMenuOpen(false)
    await signOut()
    router.replace('/login')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
    }
  }

  return (
    <>
      {/* ── DESKTOP HEADER ── */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100 hidden md:block safe-pt">
        <div className="text-white py-1.5 px-4 text-center text-xs font-medium" style={{ backgroundColor: '#0F2747' }}>
          Free delivery on orders over £40 — Next day delivery across the UK
          <span className="ml-3 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#5FAE9B' }}>
            Order before 4 PM today
          </span>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-3">
            <Link href="/" className="flex items-center gap-2 flex-none">
              <div className="relative w-10 h-10 overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="PocketGrocery Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-extrabold" style={{ color: '#0F2747' }}>PocketGrocery</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 ml-4">
              <div className="relative" ref={megaRef}>
                <button
                  onMouseEnter={() => setMegaMenuOpen(true)}
                  onClick={() => setMegaMenuOpen((v) => !v)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Categories
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {megaMenuOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-[640px] bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50" onMouseLeave={() => setMegaMenuOpen(false)}>
                    <div className="grid grid-cols-3 gap-0 p-4">
                      {categories.map((cat) => (
                        <Link key={cat.store_category_id} href={`/products?category=${encodeURIComponent(cat.store_category_slug)}`} onClick={() => setMegaMenuOpen(false)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                          <span className="text-xl mt-0.5">{getCategoryIcon(cat.store_category_name)}</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 group-hover:text-[#0F2747]">{cat.store_category_name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{cat.main_category_name ?? ''}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50">
                      <span className="text-xs text-gray-400">100+ authentic Kerala products</span>
                      <Link href="/products" onClick={() => setMegaMenuOpen(false)} className="text-xs font-semibold hover:opacity-75 transition-opacity" style={{ color: '#5FAE9B' }}>View All Products →</Link>
                    </div>
                  </div>
                )}
              </div>
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#0F2747] hover:bg-gray-50 transition-colors">{link.label}</Link>
              ))}
            </nav>

            <div className="hidden lg:flex flex-1 max-w-sm mx-auto relative">
              <form onSubmit={handleSearch} className="w-full">
                <div className="flex items-center w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 gap-2 hover:border-gray-300 focus-within:border-[#5FAE9B] focus-within:bg-white transition-all">
                  <svg className="w-4 h-4 text-gray-400 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Search Kerala groceries…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchOpen(true)} onBlur={() => setTimeout(() => setSearchOpen(false), 150)} className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none" />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </form>
              {searchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-50">
                  {filtered.map((s) => (
                    <Link key={s} href={`/products?q=${encodeURIComponent(s)}`} className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors">
                      <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <span className="text-sm text-gray-600">{s}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <div className="relative" ref={accountRef}>
                {user ? (
                  <button onClick={() => setAccountMenuOpen((v) => !v)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" aria-label="Account menu">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#5FAE9B' }}>
                      {profile?.name ? profile.name[0].toUpperCase() : user.email?.[0].toUpperCase() ?? 'U'}
                    </div>
                  </button>
                ) : (
                  <Link href="/login" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </Link>
                )}
                {accountMenuOpen && user && (
                  <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl border border-gray-100 shadow-xl py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900 truncate">{profile?.name || 'My Account'}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    {[
                      { label: 'My Account', href: '/account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                      { label: 'Orders', href: '/account/orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                      { label: 'Pocket Wallet', href: '/account/wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                    ].map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                        {item.label}
                      </Link>
                    ))}
                    {profile?.role === 'admin' && (
                      <Link href="/admin" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <Link href="/account/wishlist" className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full" style={{ backgroundColor: '#EF4444' }}>
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link href="/cart" className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full" style={{ backgroundColor: '#5FAE9B' }}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE HEADER ── */}
      <header className="md:hidden sticky top-0 z-50 shadow-sm safe-pt" style={{ backgroundColor: '#0F2747' }}>
        {/* Row 1: Logo + Location + Icons */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 flex-none">
            <div className="relative w-8 h-8 overflow-hidden rounded-lg">
              <Image
                src="/logo.png"
                alt="PocketGrocery Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-white font-extrabold text-base tracking-tight">PocketGrocery</span>
          </Link>

          {/* Delivery location */}
          <button className="flex-1 flex items-center gap-1 min-w-0 ml-1">
            <svg className="w-3.5 h-3.5 flex-none" style={{ color: '#5FAE9B' }} fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-white opacity-90 truncate">Next Day Delivery UK</span>
            <svg className="w-3 h-3 flex-none text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Right icons */}
          <div className="flex items-center gap-1 flex-none">
            {user ? (
              <Link href="/account" className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: '#5FAE9B' }}>
                  {profile?.name ? profile.name[0].toUpperCase() : user.email?.[0].toUpperCase() ?? 'U'}
                </div>
              </Link>
            ) : (
              <Link href="/login" className="w-8 h-8 flex items-center justify-center rounded-full text-white" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </Link>
            )}
            <Link href="/cart" className="relative w-8 h-8 flex items-center justify-center rounded-full text-white" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full" style={{ backgroundColor: '#5FAE9B' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Row 2: Search bar */}
        <div className="px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center bg-white rounded-2xl px-3 py-2.5 gap-2 shadow-sm">
              <svg className="w-4 h-4 text-gray-400 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={mobileSearchRef}
                type="text"
                placeholder="Search Kerala groceries, rice, spices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              {/* Voice search icon */}
              <button type="button" className="flex-none text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>

            {/* Search suggestions dropdown */}
            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-gray-100 shadow-xl py-2 z-50 overflow-hidden">
                {searchQuery.length === 0 && (
                  <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Recent Searches</p>
                )}
                {filtered.map((s) => (
                  <Link
                    key={s}
                    href={`/products?q=${encodeURIComponent(s)}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    onClick={() => setSearchOpen(false)}
                  >
                    <svg className="w-3.5 h-3.5 text-gray-300 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">{s}</span>
                  </Link>
                ))}
                <div className="px-4 pt-1.5 pb-2 border-t border-gray-50 mt-1">
                  <Link href="/products" className="text-xs font-semibold" style={{ color: '#5FAE9B' }} onClick={() => setSearchOpen(false)}>
                    Browse all products →
                  </Link>
                </div>
              </div>
            )}
          </form>
        </div>
      </header>
    </>
  )
}
