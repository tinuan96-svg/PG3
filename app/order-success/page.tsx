'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const [order, setOrder] = useState<{
    order_number: string;
    total: number;
    customer_name: string;
    payment_method: string | null;
    payment_status: string;
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return }
    async function fetchOrder() {
      const { data } = await supabase
        .from('orders')
        .select('order_number, total, customer_name, payment_method, payment_status')
        .eq('order_number', orderNumber)
        .maybeSingle()
      setOrder(data as any)
      setLoading(false)
    }
    fetchOrder()
  }, [orderNumber])

  const isCardPayment = order?.payment_method === 'card' || order?.payment_method?.includes('pay')

  return (
    <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-xl font-extrabold mb-2" style={{ color: '#0F2747' }}>Order Placed!</h1>
      <p className="text-sm text-gray-500 mb-6">
        {isCardPayment
          ? "Thank you for your order. We've received your payment and we're starting to prepare your items."
          : "Thank you for your order. We'll be in touch to confirm your delivery slot."}
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
            <span className="text-gray-500">Order total</span>
            <span className="font-bold text-gray-800">£{Number(order.total).toFixed(2)}</span>
          </div>
          {order.customer_name && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-800">{order.customer_name}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment</span>
            <span className="font-medium text-gray-800 capitalize">
              {order.payment_method || 'Online'} ({order.payment_status})
            </span>
          </div>
        </div>
      ) : orderNumber ? (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-gray-700">Order: {orderNumber}</p>
        </div>
      ) : null}

      {!isCardPayment && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-100 text-left">
          <p className="text-xs text-amber-700 font-medium">Cash on Delivery</p>
          <p className="text-xs text-amber-600 mt-0.5">Please have the exact amount ready when your order arrives.</p>
        </div>
      )}

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

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F4F6F8' }}>
      <Suspense fallback={<div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />}>
        <OrderSuccessContent />
      </Suspense>
    </div>
  )
}
