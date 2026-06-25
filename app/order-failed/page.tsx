'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function OrderFailedContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')

  return (
    <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h1 className="text-xl font-extrabold mb-2" style={{ color: '#0F2747' }}>Order Could Not Be Completed</h1>
      <p className="text-sm text-gray-500 mb-6">
        Something went wrong while processing your order. No payment has been taken. Please try again or contact us if the problem persists.
      </p>

      {orderNumber && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-400 mb-0.5">Reference</p>
          <p className="text-sm font-semibold text-gray-700">{orderNumber}</p>
        </div>
      )}

      <div className="space-y-2">
        <Link
          href="/checkout"
          className="block w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#0F2747' }}
        >
          Try Again
        </Link>
        <Link
          href="/products"
          className="block w-full py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Back to Shopping
        </Link>
      </div>

      <p className="mt-5 text-xs text-gray-400">
        Need help?{' '}
        <a href="mailto:support@pocketgrocery.co.uk" className="underline hover:text-gray-600">
          Contact us
        </a>
      </p>
    </div>
  )
}

export default function OrderFailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F4F6F8' }}>
      <Suspense fallback={<div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />}>
        <OrderFailedContent />
      </Suspense>
    </div>
  )
}
