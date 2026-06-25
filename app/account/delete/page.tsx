'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AccountLayout from '@/components/AccountLayout'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Trash2, AlertTriangle, ShieldCheck, Mail, Clock, CheckCircle2 } from 'lucide-react'

export default function DeleteAccountPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!user) return
    setSubmitting(true)
    setError('')

    try {
      // Log the request to a dedicated table (assumes table exists from migration or we create it)
      const { error: insertError } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: user.id,
          email: user.email || '',
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      setSubmitted(true)
      setTimeout(async () => {
        await signOut()
        router.push('/')
      }, 5000)
    } catch (err: any) {
      setError('Failed to submit request. Please contact support@pocketgrocery.co.uk')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AccountLayout>
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-red-50/50">
            <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </h2>
            <p className="text-sm text-red-700 mt-0.5">Request permanent deletion of your data</p>
          </div>

          <div className="p-6 space-y-6">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Request Submitted</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Your request has been received. Your account will be disabled and data deleted within 30 days. You will be signed out shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-bold mb-1">This action is permanent</p>
                    <p>Deleting your account will remove your address book, order history from your view, and all earned Pocket Coins. This cannot be undone.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 text-sm">Data Retention Notice</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-bold text-red-700 uppercase mb-2">Deleted within 30 days</p>
                      <ul className="text-[11px] text-gray-600 space-y-1.5 list-disc ml-4">
                        <li>Personal contact details</li>
                        <li>Saved delivery addresses</li>
                        <li>Marketing preferences</li>
                        <li>Active wallet balance</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-bold text-amber-700 uppercase mb-2">Kept for legal compliance</p>
                      <ul className="text-[11px] text-gray-600 space-y-1.5 list-disc ml-4">
                        <li>Financial transaction records (7 years)</li>
                        <li>VAT-related order data</li>
                        <li>Anonymized aggregate stats</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-100 text-red-700 text-xs rounded-lg font-medium">
                    {error}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                  {!confirming ? (
                    <button
                      onClick={() => setConfirming(true)}
                      className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                    >
                      I understand, continue
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-gray-800">To confirm, please click the button below.</p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="px-6 py-2.5 bg-red-700 text-white rounded-xl text-sm font-bold hover:bg-red-800 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {submitting ? 'Processing...' : 'Confirm Permanent Deletion'}
                        </button>
                        <button
                          onClick={() => setConfirming(false)}
                          disabled={submitting}
                          className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-3 shadow-sm">
             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
               <ShieldCheck className="h-5 w-5 text-blue-600" />
             </div>
             <div>
               <p className="text-sm font-bold text-gray-900">Privacy First</p>
               <p className="text-xs text-gray-500 mt-0.5">We strictly follow UK GDPR guidelines for data erasure.</p>
             </div>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-3 shadow-sm">
             <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
               <Clock className="h-5 w-5 text-green-600" />
             </div>
             <div>
               <p className="text-sm font-bold text-gray-900">30-Day Window</p>
               <p className="text-xs text-gray-500 mt-0.5">Erasure is typically completed within 14-30 days.</p>
             </div>
           </div>
        </div>
      </div>
    </AccountLayout>
  )
}
