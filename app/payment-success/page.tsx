'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const [order, setOrder] = useState<{ order_number: string; total: number; customer_name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return }
    async function fetchOrder() {
      const { data } = await (supabase as any)
        .from('orders')
        .select('order_number, total, customer_name')
        .eq('order_number', orderNumber)
        .maybeSingle()
      setOrder(data)
      setLoading(false)
    }
    fetchOrder()
  }, [orderNumber])

  return (
    <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-xl font-extrabold mb-2" style={{ color: '#0F2747' }}>Payment Successful!</h1>
      <p className="text-sm text-gray-500 mb-6">
        Your order has been placed and payment confirmed. We&apos;ll have it on the way soon.
      </p>

      {loading ? (
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse mb-6" />
      ) : order ? (
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Order number</span>
            <span className="font-bold text-gray-800">{order.order_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total paid</span>
            <span className="font-bold text-gray-800">£{Number(order.total).toFixed(2)}</span>
          </div>
          {order.customer_name && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-800">{order.customer_name}</span>
            </div>
          )}
        </div>
      ) : orderNumber ? (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-gray-700">Order: {orderNumber}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Link
          href="/account/orders"
          className="block w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#0F2747' }}
        >
          View My Orders
        </Link>
        <Link
          href="/products"
          className="block w-full py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F4F6F8' }}>
      <Suspense fallback={<div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />}>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  )
}
