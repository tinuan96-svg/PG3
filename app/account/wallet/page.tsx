'use client'

import { useEffect, useState } from 'react'
import AccountLayout from '@/components/AccountLayout'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

type Transaction = {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
}

const TYPE_STYLES: Record<string, { label: string; color: string }> = {
  earned: { label: 'Earned', color: 'text-green-600' },
  used: { label: 'Used', color: 'text-red-500' },
  referral: { label: 'Referral', color: 'text-blue-600' },
  bonus: { label: 'Bonus', color: 'text-[#5FAE9B]' },
  expired: { label: 'Expired', color: 'text-gray-400' },
}

export default function AccountWalletPage() {
  const { user } = useAuth()
  const [coins, setCoins] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [walletRes, txRes] = await Promise.all([
        supabase.from('wallets').select('balance').eq('user_id', user!.id).maybeSingle(),
        supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ])
      setCoins((walletRes.data as { balance: number } | null)?.balance ?? 0)
      setTransactions((txRes.data as Transaction[]) ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <AccountLayout>
      <div className="space-y-5">
        <div
          className="rounded-2xl p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #0F2747, #1a3a5c)' }}
        >
          <p className="text-sm opacity-70 mb-1">Your Pocket Coins Balance</p>
          {loading ? (
            <div className="h-12 w-24 bg-white/20 rounded animate-pulse" />
          ) : (
            <>
              <p className="text-5xl font-bold mb-1" style={{ color: '#5FAE9B' }}>{coins}</p>
              <p className="text-lg opacity-80">Worth £{(coins * 0.01).toFixed(2)}</p>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '1 coin = £0.01', desc: 'Redemption rate' },
            { label: '100 coins', desc: 'Per referral' },
            { label: '5 coins/day', desc: 'Daily login bonus' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="font-bold text-sm text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Transaction History</h3>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No transactions yet. Start shopping to earn coins!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => {
                const style = TYPE_STYLES[tx.type] || { label: tx.type, color: 'text-gray-600' }
                const isPositive = tx.type !== 'used' && tx.type !== 'expired'
                return (
                  <div key={tx.id} className="px-6 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        <span className={style.color}>{style.label}</span>
                      </p>
                    </div>
                    <span className={`font-bold text-sm ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                      {isPositive ? '+' : '-'}{Math.abs(tx.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  )
}
