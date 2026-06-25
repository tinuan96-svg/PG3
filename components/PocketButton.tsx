'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { usePocket } from '@/lib/pocket-context'
import { usePathname } from 'next/navigation'

// ─── Navigation actions inside the open menu ─────────────────────────────────

const NAV_ITEMS = [
  { label: 'Categories', href: '/products',          emoji: '📂' },
  { label: 'Brands',     href: '/brands',             emoji: '🏷️' },
  { label: 'Cart',       href: '/cart',               emoji: '🛒' },
  { label: 'Wallet',     href: '/account/wallet',     emoji: '💷' },
  { label: 'Account',    href: '/account',            emoji: '👤' },
  { label: 'Wishlist',   href: '/account',            emoji: '❤️' },
  { label: 'Offers',     href: '/products?filter=deals', emoji: '🎁' },
]

// Spring config reused across items
const SPRING = { type: 'spring', stiffness: 420, damping: 30 } as const

// ─── Cart mini-preview item ───────────────────────────────────────────────────

const PLACEHOLDER = 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=80'

// ─── Main component ───────────────────────────────────────────────────────────

export default function PocketButton() {
  const pathname = usePathname()
  const {
    cartCount, cartItems, cartTotal,
    pocketOpen, togglePocket, closePocket,
    pocketButtonRef, justAdded,
  } = usePocket()

  // Hide on admin pages
  if (pathname?.startsWith('/admin')) return null

  const hasItems = cartCount > 0

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {pocketOpen && (
          <motion.div
            key="pocket-backdrop"
            className="fixed inset-0 z-40 md:hidden"
            style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(15,39,71,0.5)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closePocket}
          />
        )}
      </AnimatePresence>

      {/* ── Menu panel (opens upward) ──────────────────────────────────────── */}
      <AnimatePresence>
        {pocketOpen && (
          <motion.div
            key="pocket-menu"
            className="fixed inset-x-4 z-50 md:hidden rounded-3xl overflow-hidden shadow-2xl"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom) + 88px)',
              background: 'linear-gradient(160deg, #0F2747 0%, #152f59 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          >
            {/* Cart summary header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-sm tracking-tight">Your Pocket</p>
                  <p className="text-white/55 text-[11px] mt-0.5">
                    {hasItems
                      ? `${cartCount} item${cartCount !== 1 ? 's' : ''} · £${cartTotal.toFixed(2)}`
                      : 'Your pocket is empty'}
                  </p>
                </div>
                <button
                  onClick={closePocket}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Recent cart items */}
              {cartItems.length > 0 && (
                <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {cartItems.slice(0, 5).map((item, i) => (
                    <motion.div
                      key={item.product_id}
                      className="flex-none w-12 h-12 rounded-xl overflow-hidden bg-white/10"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...SPRING, delay: i * 0.04 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.product_image || PLACEHOLDER}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
                      />
                    </motion.div>
                  ))}
                  {cartItems.length > 5 && (
                    <div className="flex-none w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <span className="text-white/60 text-[10px] font-semibold">+{cartItems.length - 5}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation grid */}
            <div className="px-4 py-4 grid grid-cols-4 gap-y-1">
              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ ...SPRING, delay: 0.04 + i * 0.035 }}
                >
                  <Link
                    href={item.href}
                    onClick={closePocket}
                    className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all active:scale-95 hover:bg-white/10 group"
                  >
                    <motion.span
                      className="text-2xl leading-none"
                      whileTap={{ scale: 0.85, rotate: -6 }}
                      transition={SPRING}
                    >
                      {item.emoji}
                    </motion.span>
                    <span className="text-[10px] font-semibold text-white/70 group-hover:text-white transition-colors leading-none">
                      {item.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* View cart CTA */}
            <div className="px-4 pb-4">
              <Link
                href="/cart"
                onClick={closePocket}
                className="block w-full py-3.5 rounded-2xl text-center text-sm font-bold text-white transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #5FAE9B 0%, #4a9484 100%)' }}
              >
                {hasItems ? `View Cart · £${cartTotal.toFixed(2)}` : 'Start Shopping'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="fixed z-50 md:hidden flex items-center gap-3"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 85px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'max-content',
        }}
      >
        <motion.button
          onClick={() => {
            // Find and click the AI Assistant button
            const aiBtn = document.querySelector('.ai-chat-btn') as HTMLButtonElement;
            if (aiBtn) aiBtn.click();
          }}
          className="flex items-center gap-2 px-4 h-[56px] rounded-full text-white shadow-2xl bg-[#0F2747]"
          whileTap={{ scale: 0.94 }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#5FAE9B]">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm font-bold">AI Assistant</span>
        </motion.button>

        <motion.button
          ref={pocketButtonRef}
          onClick={togglePocket}
          className="relative flex items-center gap-2.5 px-5 rounded-full text-white shadow-2xl focus:outline-none"
          style={{
            height: 56,
            background: pocketOpen
              ? 'linear-gradient(135deg, #1a3a6b 0%, #0F2747 100%)'
              : 'linear-gradient(135deg, #0F2747 0%, #1a3a6b 100%)',
            boxShadow: '0 8px 32px rgba(15,39,71,0.45), 0 2px 8px rgba(0,0,0,0.2)',
          }}
          animate={justAdded ? { scale: [1, 1.12, 0.95, 1.05, 1] } : { scale: 1 }}
          transition={justAdded ? { duration: 0.45 } : { duration: 0.15 }}
          whileTap={{ scale: 0.94 }}
        >
          <motion.span
            animate={{ rotate: pocketOpen ? 180 : 0 }}
            transition={SPRING}
            className="flex-shrink-0"
          >
            <PocketIcon open={pocketOpen} />
          </motion.span>

          <span className="text-sm font-bold tracking-tight">
            {pocketOpen ? 'Close' : 'Pocket'}
          </span>

          <AnimatePresence>
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                className="ml-1 min-w-[22px] h-[22px] px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                style={{ background: '#5FAE9B' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 22 }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  )
}

// ─── Pocket icon SVG ──────────────────────────────────────────────────────────

function PocketIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22" height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={open ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white transition-all"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      {open
        ? <path d="M9 12l3 3 3-3" />       /* chevron down = close */
        : <path d="M16 10a4 4 0 01-8 0" /> /* pocket curve = open */
      }
    </svg>
  )
}

// ─── Re-export PocketButtonCore so PocketNavigation still compiles ────────────
// (PocketNavigation is now a no-op but the export must exist)
export function PocketButtonCore() { return null }
