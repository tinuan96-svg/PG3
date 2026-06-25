'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AccountLayout from '@/components/AccountLayout'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import ReorderReminders from '@/components/ReorderReminders'

export default function AccountPage() {
  const { user, profile } = useAuth()
  const [coins, setCoins] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!user) return
    async function loadDashboardData() {
      const walletRes = await supabase.from('wallets').select('balance').eq('user_id', user!.id).maybeSingle()
      const ordersRes = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user!.id)
      const walletData = walletRes.data as { balance: number } | null
      setCoins(walletData?.balance ?? 0)
      setOrderCount(ordersRes.count ?? 0)
      setLoadingData(false)
    }
    loadDashboardData()
  }, [user])

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Welcome back, {profile?.name || 'there'}!
          </h1>
          <p className="text-gray-500 text-sm">Here&apos;s a summary of your account.</p>
        </div>

        <ReorderReminders />

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">Pocket Coins</p>
            {loadingData ? (
              <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-3xl font-bold" style={{ color: '#5FAE9B' }}>{coins}</p>
                <p className="text-xs text-gray-400 mt-1">Worth £{(coins * 0.01).toFixed(2)}</p>
              </>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">Total Orders</p>
            {loadingData ? (
              <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{orderCount}</p>
                <p className="text-xs text-gray-400 mt-1">Lifetime orders</p>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/account/orders"
            className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                <svg className="w-5 h-5" style={{ color: '#5FAE9B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">My Orders</p>
                <p className="text-xs text-gray-500">Track shipments and view history</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/account/wallet"
            className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                <svg className="w-5 h-5" style={{ color: '#5FAE9B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Pocket Wallet</p>
                <p className="text-xs text-gray-500">View coins balance and transactions</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/account/referrals"
            className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                <svg className="w-5 h-5" style={{ color: '#5FAE9B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Refer &amp; Earn</p>
                <p className="text-xs text-gray-500">Earn 100 coins per friend referred</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/account/profile"
            className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                <svg className="w-5 h-5" style={{ color: '#5FAE9B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Profile Settings</p>
                <p className="text-xs text-gray-500">Update your personal details</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center justify-between rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all group"
              style={{ backgroundColor: '#0F2747', borderColor: '#0F2747' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Admin Panel</p>
                  <p className="text-xs text-white/60">Manage products, orders &amp; settings</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </AccountLayout>
  )
}
