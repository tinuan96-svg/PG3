'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCart, saveCart, type CartItem, onCartUpdate } from '@/lib/cart'
import BasketProgressBar from '@/components/BasketProgressBar'

const PLACEHOLDER = 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400'
const FREE_DELIVERY_THRESHOLD = 40
const DELIVERY_FEE = 3.99

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setItems(getCart())
    return onCartUpdate(() => setItems(getCart()))
  }, [])

  function updateQty(productId: string, delta: number) {
    const cart = getCart()
    const idx = cart.findIndex((i) => i.product_id === productId)
    if (idx < 0) return
    const newQty = cart[idx].quantity + delta
    if (newQty <= 0) {
      cart.splice(idx, 1)
    } else {
      cart[idx].quantity = newQty
    }
    saveCart(cart)
  }

  function removeItem(productId: string) {
    const cart = getCart().filter((i) => i.product_id !== productId)
    saveCart(cart)
  }

  if (!mounted) return null

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  const total = subtotal + deliveryFee
  const toFreeDelivery = FREE_DELIVERY_THRESHOLD - subtotal

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F2747' }}>
            Your Cart {items.length > 0 && <span className="text-base font-medium text-gray-400 ml-1">({items.length} item{items.length !== 1 ? 's' : ''})</span>}
          </h1>
          <Link href="/products" className="text-sm font-medium hover:opacity-75 transition-opacity" style={{ color: '#5FAE9B' }}>
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F4F6F8' }}>
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-1">Your cart is empty</p>
            <p className="text-sm text-gray-400 mb-6">Add some authentic Kerala groceries to get started</p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0F2747' }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Cart items */}
            <div className="lg:col-span-2 space-y-3">
              <BasketProgressBar cartTotal={subtotal} threshold={FREE_DELIVERY_THRESHOLD} />

              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {items.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-4 p-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-none border border-gray-100">
                      <Image
                        src={item.product_image ?? PLACEHOLDER}
                        alt={item.product_name}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                        unoptimized
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">£{item.unit_price.toFixed(2)} each</p>
                    </div>

                    <div className="flex items-center gap-2 flex-none">
                      <button
                        onClick={() => updateQty(item.product_id, -1)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all text-lg leading-none"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-bold" style={{ color: '#0F2747' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product_id, 1)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all text-lg leading-none"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-3 flex-none">
                      <p className="text-sm font-bold w-14 text-right" style={{ color: '#0F2747' }}>
                        £{(item.unit_price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                        aria-label="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-4">
                <h2 className="text-base font-bold mb-4" style={{ color: '#0F2747' }}>Order Summary</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span>£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    {deliveryFee === 0 ? (
                      <span className="text-green-600 font-medium">Free</span>
                    ) : (
                      <span>£{deliveryFee.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between font-extrabold text-base" style={{ color: '#0F2747' }}>
                    <span>Total</span>
                    <span>£{total.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="mt-5 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  Proceed to Checkout
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secure checkout · SSL encrypted
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
