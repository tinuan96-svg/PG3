'use client'

import { useState } from 'react'
import AccountLayout from '@/components/AccountLayout'
import { useAuth } from '@/lib/auth-context'

export default function ReferralsPage() {
  const { profile } = useAuth()
  const [copied, setCopied] = useState(false)
  const referralCode = profile?.referral_code ?? '—'

  function copyCode() {
    if (referralCode === '—') return
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AccountLayout>
      <div className="space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Refer &amp; Earn</h2>
          <p className="text-sm text-gray-500">
            Share your referral code and earn 100 Pocket Coins for every friend who makes their first purchase.
            Your friend also gets 50 bonus coins!
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl px-5 py-4 text-center"
            >
              <span className="text-2xl font-bold tracking-widest" style={{ color: '#0F2747' }}>
                {referralCode}
              </span>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ backgroundColor: copied ? '#5FAE9B' : '#0F2747' }}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share your code', desc: 'Give your referral code to friends and family' },
            { step: '2', title: 'Friend signs up', desc: 'They create an account and make their first purchase' },
            { step: '3', title: 'Both earn coins', desc: 'You get 100 coins, they get 50 — instantly!' },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3"
                style={{ backgroundColor: '#5FAE9B' }}
              >
                {item.step}
              </div>
              <p className="font-semibold text-sm text-gray-900 mb-1">{item.title}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Share via</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                const text = `Use my PocketGrocery referral code ${referralCode} for 50 bonus coins on your first order! 🛒`
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              WhatsApp
            </button>
            <button
              onClick={() => {
                const text = `Use my referral code ${referralCode} on PocketGrocery for 50 bonus Pocket Coins!`
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
            >
              Twitter / X
            </button>
            <button
              onClick={() => {
                const subject = 'Get 50 free Pocket Coins!'
                const body = `Hi! I shop at PocketGrocery for authentic Kerala groceries. Use my referral code ${referralCode} when you sign up and you'll get 50 bonus Pocket Coins on your first order. I'll earn 100 coins too! Check it out at pocketgrocery.co.uk`
                window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Email
            </button>
          </div>
        </div>
      </div>
    </AccountLayout>
  )
}
