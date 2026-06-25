'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { getCart, clearCart, type CartItem } from '@/lib/cart'
import { supabase } from '@/lib/supabase'
import type { CustomerAddress } from '@/app/account/saved-addresses/page'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const FREE_DELIVERY_THRESHOLD = 35
const DELIVERY_FEE = 3.99
const SDK_TIMEOUT_MS = 12_000

// ─── Type declarations ────────────────────────────────────────────────────────

declare global {
  interface Window {
    Worldpay?: {
      checkout: { init: (config: Record<string, unknown>) => Promise<WorldpayCheckout> }
    }
    ApplePaySession?: {
      new(version: number, request: ApplePayRequest): ApplePaySessionInstance
      canMakePayments(): boolean
      readonly STATUS_SUCCESS: number
      readonly STATUS_FAILURE: number
    }
    google?: {
      payments: {
        api: { PaymentsClient: new(config: { environment: string }) => GooglePayClient }
      }
    }
  }
}

interface WorldpayCheckout {
  generateSessionState: () => Promise<{ sessionHref: string }>
}
interface ApplePayRequest {
  countryCode: string; currencyCode: string; supportedNetworks: string[]
  merchantCapabilities: string[]; total: { label: string; amount: string }
}
interface ApplePaySessionInstance {
  onvalidatemerchant: ((e: { validationURL: string }) => void) | null
  onpaymentauthorized: ((e: { payment: { token: unknown } }) => void) | null
  oncancel: (() => void) | null
  begin(): void
  completeMerchantValidation(s: unknown): void
  completePayment(status: number): void
}
interface GooglePayClient {
  isReadyToPay(r: Record<string, unknown>): Promise<{ result: boolean }>
  createButton(opts: Record<string, unknown>): HTMLElement
  loadPaymentData(r: Record<string, unknown>): Promise<{ paymentMethodData: { tokenizationData: { token: string } } }>
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ])
}

// ─── Checkout page ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter()
  const { user, profile } = useAuth()

  const [items, setItems] = useState<CartItem[]>([])
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    company_name: '', delivery_address: '', delivery_city: '',
    delivery_postcode: '', notes: '',
  })

  // Card SDK
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkError, setSdkError] = useState('')
  const checkoutRef = useRef<WorldpayCheckout | null>(null)
  const sdkLoadedRef = useRef(false)

  // Wallet availability
  const [applePayAvailable, setApplePayAvailable] = useState(false)
  const [googlePayAvailable, setGooglePayAvailable] = useState(false)
  const [walletMerchantConfig, setWalletMerchantConfig] = useState<{
    google_pay_merchant_id: string; google_pay_merchant_name: string
  } | null>(null)
  const googlePayClientRef = useRef<GooglePayClient | null>(null)
  const googlePayContainerRef = useRef<HTMLDivElement>(null)

  // Submission
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [saveNewAddress, setSaveNewAddress] = useState(false)

  // 3DS
  const [threeDsUrl, setThreeDsUrl] = useState('')
  const [threeDsPaymentHref, setThreeDsPaymentHref] = useState('')
  const [threeDsOrderData, setThreeDsOrderData] = useState<Record<string, unknown> | null>(null)
  const [verifying3ds, setVerifying3ds] = useState(false)

  // ── Cart ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const cart = getCart()
    if (cart.length === 0) { router.replace('/products'); return }
    setItems(cart)
  }, [router])

  useEffect(() => {
    if (!profile) return
    setForm(f => ({
      ...f,
      customer_name: f.customer_name || profile.name || '',
      customer_email: f.customer_email || profile.email || '',
      customer_phone: f.customer_phone || profile.phone || '',
    }))
  }, [profile])

  // Load saved addresses for logged-in users
  useEffect(() => {
    if (!user) return
    supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        const addresses = (data as unknown as CustomerAddress[]) ?? []
        setSavedAddresses(addresses)
        if (addresses.length > 0) {
          const def = addresses.find(a => a.is_default) ?? addresses[0]
          setSelectedAddressId(def.id)
          applyAddress(def)
        } else {
          setShowAddressForm(true)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // ── Init card SDK (with timeout) ─────────────────────────────────────────────

  const initCardSDK = useCallback(async () => {
    if (sdkLoadedRef.current) return
    sdkLoadedRef.current = true
    setSdkError('')

    try {
      const rpcResult = await withTimeout(
        Promise.resolve(supabase.rpc('get_worldpay_client_key')),
        8_000,
        'Connection timed out. Please refresh the page.',
      )
      const clientKey = (rpcResult as any)?.data as string

      if (!clientKey) {
        setSdkError('Card payment not configured. Please contact support.')
        return
      }

      // Load SDK script with timeout
      await withTimeout(
        new Promise<void>((resolve, reject) => {
          if (window.Worldpay) { resolve(); return }
          const script = document.createElement('script')
          script.src = 'https://access.worldpay.com/access-checkout/v2/checkout.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load payment SDK. Check your connection.'))
          document.head.appendChild(script)
        }),
        SDK_TIMEOUT_MS,
        'Payment SDK timed out. Please refresh and try again.',
      )

      if (!window.Worldpay) throw new Error('Payment SDK unavailable')

      // Init iframes with timeout
      const checkout = await withTimeout(
        window.Worldpay.checkout.init({
          id: 'worldpay-checkout',
          form: '#checkout-form',
          fields: {
            pan: { selector: '#card-pan', placeholder: '4444 3333 2222 1111' },
            expiry: { selector: '#card-expiry', placeholder: 'MM / YY' },
            cvv: { selector: '#card-cvv', placeholder: '123' },
          },
          styles: {
            base: 'font-family: inherit; font-size: 14px; color: #111827;',
            focus: 'color: #0F2747;',
            invalid: 'color: #DC2626;',
            placeholder: 'color: #9CA3AF;',
          },
          enablePanFormatting: true,
          clientKey,
        }),
        SDK_TIMEOUT_MS,
        'Payment form timed out. Please refresh and try again.',
      )

      checkoutRef.current = checkout
      setSdkReady(true)
    } catch (err) {
      sdkLoadedRef.current = false
      setSdkError(err instanceof Error ? err.message : 'Payment system unavailable')
    }
  }, [])

  useEffect(() => { initCardSDK() }, [initCardSDK])

  function retrySDK() {
    sdkLoadedRef.current = false
    setSdkReady(false)
    setSdkError('')
    initCardSDK()
  }

  // ── Wallet detection (non-blocking, after mount) ─────────────────────────────

  useEffect(() => {
    // Apple Pay: synchronous check, Safari only
    if (typeof window !== 'undefined' && window.ApplePaySession?.canMakePayments()) {
      setApplePayAvailable(true)
    }

    // Fetch merchant config for wallets
    Promise.resolve(supabase.rpc('get_worldpay_wallet_config')).then(({ data }) => {
      if (data) {
        const config = data as any
        setWalletMerchantConfig({
          google_pay_merchant_id: config.google_pay_merchant_id ?? '',
          google_pay_merchant_name: config.google_pay_merchant_name ?? 'PocketGrocery',
        })
      }
    }).catch(() => {/* non-critical */})

    // Google Pay: load SDK non-blocking
    const script = document.createElement('script')
    script.src = 'https://pay.google.com/gp/p/js/pay.js'
    script.async = true
    script.onload = async () => {
      try {
        const client = new window.google!.payments.api.PaymentsClient({ environment: 'PRODUCTION' })
        const ready = await withTimeout(
          client.isReadyToPay({
            apiVersion: 2, apiVersionMinor: 0,
            allowedPaymentMethods: [{
              type: 'CARD',
              parameters: { allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'], allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX'] },
              tokenizationSpecification: { type: 'PAYMENT_GATEWAY', parameters: { gateway: 'worldpay', gatewayMerchantId: 'default' } },
            }],
          }),
          5_000, 'timeout',
        )
        if (ready.result) {
          googlePayClientRef.current = client
          setGooglePayAvailable(true)
        }
      } catch { /* Google Pay not available */ }
    }
    document.head.appendChild(script)
  }, [])

  // Mount Google Pay button when section becomes visible
  useEffect(() => {
    if (!googlePayAvailable || !googlePayClientRef.current || !googlePayContainerRef.current) return
    googlePayContainerRef.current.innerHTML = ''
    const btn = googlePayClientRef.current.createButton({
      onClick: handleGooglePay,
      buttonType: 'buy', buttonColor: 'default', buttonSizeMode: 'fill',
    })
    googlePayContainerRef.current.appendChild(btn)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googlePayAvailable])

  // ── 3DS postMessage listener ──────────────────────────────────────────────────

  useEffect(() => {
    if (!threeDsUrl) return
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '3ds_complete' || e.data?.event === '3ds_complete') handle3dsComplete()
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threeDsUrl, threeDsPaymentHref, threeDsOrderData])

  // ── Totals ───────────────────────────────────────────────────────────────────

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  const total = subtotal + deliveryFee

  // ── Shared helpers ────────────────────────────────────────────────────────────

  function applyAddress(addr: CustomerAddress) {
    setForm(f => ({
      ...f,
      customer_name: addr.full_name || f.customer_name,
      customer_phone: addr.phone || f.customer_phone,
      delivery_address: [addr.address_line_1, addr.address_line_2].filter(Boolean).join(', '),
      delivery_city: addr.city,
      delivery_postcode: addr.postcode,
      notes: addr.delivery_notes || f.notes,
    }))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function validateForm(): boolean {
    const required = ['customer_name', 'customer_email', 'customer_phone',
      'delivery_address', 'delivery_city', 'delivery_postcode'] as const
    for (const field of required) {
      if (!form[field].trim()) { setError('Please fill in all required delivery fields.'); return false }
    }
    return true
  }

  async function getBearerToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ANON_KEY
  }

  async function callPayment(payload: Record<string, unknown>) {
    const token = await getBearerToken()
    const res = await fetch(`${SUPABASE_URL}/functions/v1/worldpay-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    return res.json()
  }

  function buildOrderData() {
    return {
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      company_name: form.company_name || undefined,
      delivery_address: form.delivery_address,
      delivery_city: form.delivery_city,
      delivery_postcode: form.delivery_postcode.toUpperCase(),
      notes: form.notes || undefined,
      items, subtotal, delivery_fee: deliveryFee, total,
      user_id: user?.id,
    }
  }

  function onSuccess(orderNumber: string) {
    // Fire push notifications (non-blocking)
    if (user?.id) {
      getBearerToken().then((token) => {
        fetch(`${SUPABASE_URL}/functions/v1/onesignal-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            action: 'send_to_user',
            user_id: user.id,
            title: 'Order Received',
            message: `Your order #${orderNumber} has been placed successfully.`,
            url: `${window.location.origin}/account/orders`,
          }),
        }).catch(() => {/* non-fatal */})
      })
    }

    // Save address to address book if guest opted in
    if (saveNewAddress && user && !selectedAddressId) {
      supabase
        .from('customer_addresses')
        .insert({
          customer_id: user.id,
          full_name: form.customer_name,
          phone: form.customer_phone,
          address_line_1: form.delivery_address,
          city: form.delivery_city,
          postcode: form.delivery_postcode.toUpperCase(),
          country: 'United Kingdom',
          address_type: 'home',
          is_default: savedAddresses.length === 0,
        })
        .then(() => {/* non-fatal */})
    }

    clearCart()
    router.push(`/order-success?order=${orderNumber}`)
  }

  // ── Card submit ───────────────────────────────────────────────────────────────

  async function handleCardSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!validateForm()) return
    if (!checkoutRef.current) { setError('Payment form not ready. Please wait a moment.'); return }

    setLoading(true)
    try {
      const { sessionHref } = await withTimeout(
        checkoutRef.current.generateSessionState(),
        15_000, 'Session generation timed out. Please try again.',
      )

      const data = await callPayment({
        action: 'authorize', sessionHref,
        cardholderName: form.customer_name,
        orderData: buildOrderData(),
      })

      if (data.requires3ds && data.challengeUrl) {
        setThreeDsUrl(data.challengeUrl)
        setThreeDsPaymentHref(data.paymentHref)
        setThreeDsOrderData(data.orderData)
        setLoading(false); return
      }
      if (data.success) { onSuccess(data.orderNumber); return }
      setError(data.error || 'Payment declined. Please check your card details.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── 3DS verify ────────────────────────────────────────────────────────────────

  async function handle3dsComplete() {
    if (!threeDsPaymentHref || verifying3ds) return
    setVerifying3ds(true)
    try {
      const data = await callPayment({ action: 'verify_3ds', paymentHref: threeDsPaymentHref, orderData: threeDsOrderData })
      setThreeDsUrl(''); setThreeDsPaymentHref(''); setThreeDsOrderData(null)
      if (data.success) { onSuccess(data.orderNumber) }
      else setError(data.error || 'Authentication failed. Please try again.')
    } catch (err) {
      setError(err instanceof Error ? err.message : '3D Secure verification failed.')
      setThreeDsUrl('')
    } finally { setVerifying3ds(false) }
  }

  // ── Apple Pay ─────────────────────────────────────────────────────────────────

  async function handleApplePay() {
    setError('')
    if (!validateForm()) return
    if (!window.ApplePaySession) return

    const session = new window.ApplePaySession!(3, {
      countryCode: 'GB', currencyCode: 'GBP',
      supportedNetworks: ['visa', 'masterCard', 'amex', 'maestro'],
      merchantCapabilities: ['supports3DS'],
      total: { label: 'PocketGrocery', amount: total.toFixed(2) },
    })
    setLoading(true)

    session.onvalidatemerchant = async (e: { validationURL: string }) => {
      try {
        const token = await getBearerToken()
        const res = await fetch(`${SUPABASE_URL}/functions/v1/worldpay-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'applepay_validate_merchant', validationUrl: e.validationURL, domainName: window.location.hostname }),
        })
        const data = await res.json()
        if (data.merchantSession) session.completeMerchantValidation(data.merchantSession)
        else throw new Error(data.error || 'Merchant validation failed')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Apple Pay setup failed.')
        setLoading(false)
        session.completePayment(window.ApplePaySession!.STATUS_FAILURE)
      }
    }

    session.onpaymentauthorized = async (e: { payment: { token: unknown } }) => {
      try {
        const data = await callPayment({ action: 'authorize', walletType: 'applepay', walletToken: e.payment.token, cardholderName: form.customer_name, orderData: buildOrderData() })
        if (data.success) {
          session.completePayment(window.ApplePaySession!.STATUS_SUCCESS)
          onSuccess(data.orderNumber)
        } else {
          session.completePayment(window.ApplePaySession!.STATUS_FAILURE)
          setError(data.error || 'Apple Pay payment failed.')
          setLoading(false)
        }
      } catch (err) {
        session.completePayment(window.ApplePaySession!.STATUS_FAILURE)
        setError(err instanceof Error ? err.message : 'Apple Pay payment failed.')
        setLoading(false)
      }
    }

    session.oncancel = () => setLoading(false)
    session.begin()
  }

  // ── Google Pay ────────────────────────────────────────────────────────────────

  async function handleGooglePay() {
    setError('')
    if (!validateForm()) return
    if (!googlePayClientRef.current) return

    setLoading(true)
    try {
      const merchantId = walletMerchantConfig?.google_pay_merchant_id || ''
      const merchantName = walletMerchantConfig?.google_pay_merchant_name || 'PocketGrocery'
      const paymentData = await googlePayClientRef.current.loadPaymentData({
        apiVersion: 2, apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: { allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'], allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX'] },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: { gateway: 'worldpay', gatewayMerchantId: merchantId || 'default' },
          },
        }],
        merchantInfo: { merchantId, merchantName },
        transactionInfo: { totalPriceStatus: 'FINAL', totalPrice: total.toFixed(2), currencyCode: 'GBP', countryCode: 'GB' },
      })

      const googlePayToken = paymentData.paymentMethodData.tokenizationData.token
      const data = await callPayment({ action: 'authorize', walletType: 'googlepay', walletToken: googlePayToken, cardholderName: form.customer_name, orderData: buildOrderData() })

      if (data.success) { onSuccess(data.orderNumber) }
      else { setError(data.error || 'Google Pay payment failed.'); setLoading(false) }
    } catch (err: unknown) {
      const code = (err as Record<string, unknown>)?.statusCode
      if (code !== 'CANCELED') setError(err instanceof Error ? err.message : 'Google Pay payment failed.')
      setLoading(false)
    }
  }

  if (items.length === 0) return null

  const anyWalletAvailable = applePayAvailable || googlePayAvailable

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F8' }}>

      {/* 3DS Overlay */}
      {threeDsUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col" style={{ height: 560 }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-semibold text-gray-800">3D Secure Authentication</span>
              </div>
              <span className="text-xs text-gray-400">Powered by your bank</span>
            </div>
            <div className="flex-1">
              <iframe src={threeDsUrl} className="w-full h-full border-0" title="3D Secure"
                sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation" />
            </div>
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2 text-center">Complete your bank authentication, then click below.</p>
              <button onClick={handle3dsComplete} disabled={verifying3ds}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#0F2747' }}>
                {verifying3ds ? 'Verifying...' : 'I have completed authentication'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Continue Shopping
          </Link>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F2747' }}>Secure Checkout</h1>
        </div>

        <form id="checkout-form" onSubmit={handleCardSubmit}>
          <div id="worldpay-checkout" />
          <div className="grid lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 space-y-5">

              {/* Saved Addresses (logged-in only) */}
              {user && savedAddresses.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold" style={{ color: '#0F2747' }}>Delivery Address</h2>
                    <Link href="/account/saved-addresses"
                      className="text-xs font-medium transition-colors hover:opacity-80"
                      style={{ color: '#5FAE9B' }}>
                      Manage addresses
                    </Link>
                  </div>

                  <div className="space-y-2 mb-4">
                    {savedAddresses.map(addr => {
                      const isSelected = selectedAddressId === addr.id
                      const typeIcon = addr.address_type === 'work'
                        ? 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                        : addr.address_type === 'other'
                        ? 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                        : 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'

                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(addr.id)
                            setShowAddressForm(false)
                            applyAddress(addr)
                          }}
                          className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                            isSelected
                              ? 'border-[#5FAE9B] bg-[#EBF4F1]'
                              : 'border-gray-100 hover:border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex-none mt-0.5 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-[#5FAE9B]' : 'border-gray-300'
                            }`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#5FAE9B' }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d={typeIcon} />
                                </svg>
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 capitalize">{addr.address_type}</span>
                                {addr.is_default && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: '#5FAE9B' }}>Default</span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-gray-900">{addr.full_name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {addr.address_line_1}{addr.address_line_2 ? `, ${addr.address_line_2}` : ''}, {addr.city}, {addr.postcode.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}

                    {/* Add new address option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(null)
                        setShowAddressForm(true)
                      }}
                      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                        showAddressForm && !selectedAddressId
                          ? 'border-[#5FAE9B] bg-[#EBF4F1]'
                          : 'border-dashed border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex-none flex items-center justify-center ${
                          showAddressForm && !selectedAddressId ? 'border-[#5FAE9B]' : 'border-gray-300'
                        }`}>
                          {showAddressForm && !selectedAddressId && (
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#5FAE9B' }} />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-sm font-medium text-gray-500">Use a different address</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Delivery Details — shown always for guests, or when "use different address" selected */}
              {(!user || !savedAddresses.length || showAddressForm) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold" style={{ color: '#0F2747' }}>Delivery Details</h2>
                  {user && savedAddresses.length > 0 && (
                    <button type="button" onClick={() => { setShowAddressForm(false); const d = savedAddresses.find(a => a.is_default) ?? savedAddresses[0]; setSelectedAddressId(d.id); applyAddress(d) }}
                      className="text-xs font-medium transition-colors" style={{ color: '#5FAE9B' }}>
                      Use saved address
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'customer_name', label: 'Full Name *', placeholder: 'Jane Smith', type: 'text' },
                    { name: 'customer_email', label: 'Email Address *', placeholder: 'jane@example.com', type: 'email' },
                    { name: 'customer_phone', label: 'Phone Number *', placeholder: '+44 7700 000000', type: 'tel' },
                    { name: 'company_name', label: 'Company (optional)', placeholder: 'Company Ltd', type: 'text' },
                  ].map(({ name, label, placeholder, type }) => (
                    <div key={name}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                      <input name={name} type={type} value={form[name as keyof typeof form]} onChange={handleChange}
                        placeholder={placeholder} required={label.endsWith('*')}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Street Address *</label>
                    <input name="delivery_address" value={form.delivery_address} onChange={handleChange} required
                      placeholder="123 High Street, Flat 4"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">City *</label>
                    <input name="delivery_city" value={form.delivery_city} onChange={handleChange} required placeholder="London"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Postcode *</label>
                    <input name="delivery_postcode" value={form.delivery_postcode} onChange={handleChange} required placeholder="SW1A 1AA"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors uppercase" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Order Notes (optional)</label>
                    <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                      placeholder="Leave at door, ring bell, etc."
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
                  </div>
                </div>

                {/* Save address checkbox — shown to logged-in users entering a new address */}
                {user && (
                  <label className="flex items-center gap-3 mt-4 cursor-pointer select-none">
                    <div className="relative flex-none">
                      <input type="checkbox" checked={saveNewAddress} onChange={e => setSaveNewAddress(e.target.checked)} className="sr-only" />
                      <div className={`w-9 h-5 rounded-full transition-colors ${saveNewAddress ? 'bg-[#5FAE9B]' : 'bg-gray-200'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${saveNewAddress ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Save this address for future orders</span>
                  </label>
                )}
              </div>
              )}

              {/* Payment */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-base font-bold mb-5" style={{ color: '#0F2747' }}>Payment</h2>

                {/* Wallet express buttons — only on supported devices */}
                {anyWalletAvailable && (
                  <div className="mb-5 space-y-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Express checkout</p>
                    <div className="flex flex-col sm:flex-row gap-3">

                      {applePayAvailable && (
                        <button type="button" onClick={handleApplePay} disabled={loading}
                          className="flex-1 h-11 flex items-center justify-center rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                          style={{ backgroundColor: '#000', color: '#fff' }}>
                          {/* Apple Pay logo text SVG */}
                          <svg viewBox="0 0 65 30" className="h-6" fill="white" aria-label="Apple Pay">
                            <path d="M12.5 4.4c-.7.8-1.8 1.5-2.9 1.4-.1-1.1.4-2.3 1.1-3 .7-.8 1.9-1.4 2.9-1.5.1 1.2-.3 2.3-1.1 3.1zm1 1.6c-1.6-.1-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3.9-4.2 2.5-1.8 3.1-.5 7.6 1.3 10.1 1.1 1.5 2.4 3.2 4.1 3.1 1.6-.1 2.2-1 4.1-1 1.9 0 2.5 1 4.2 1 1.7 0 2.9-1.5 4-3 1.3-1.7 1.8-3.4 1.8-3.5-.1 0-3.4-1.3-3.4-5 0-3.1 2.5-4.6 2.6-4.7-1.4-2-3.6-2.2-4.3-2.3l-.1-.2zm11.5-5.1v19.7h3V11.5h4.3c4 0 6.8-2.7 6.8-6.8s-2.7-6.8-6.6-6.8h-7.5zm3 2.7h3.5c2.7 0 4.3 1.5 4.3 4s-1.6 4-4.3 4h-3.5V3.6zm17.4 17.3c1.9 0 3.7-1 4.5-2.6h.1v2.5h2.8V11c0-3-2.3-4.9-5.8-4.9-3.3 0-5.6 1.9-5.7 4.5h2.7c.2-1.3 1.5-2.2 3-2.2 1.9 0 3 1 3 2.6v1.1l-3.8.2c-3.6.2-5.6 1.8-5.6 4.4 0 2.7 2.1 4.4 5 4.4l-.2-.2zm.8-2.4c-1.7 0-2.7-.8-2.7-2.1 0-1.4.9-2.1 2.9-2.2l3.4-.2v1c0 2-1.6 3.5-3.6 3.5zm12.2 7.5c3.1 0 4.5-1.4 5.8-5l5.3-15.3h-3l-3.5 11.8h-.1l-3.5-11.8H54l5 14.2-.3.8c-.5 1.5-1.2 2.1-2.5 2.1-.2 0-.7 0-1-.1v2.4c.3.1 1 .1 1.3.1l-.1-.2z"/>
                          </svg>
                        </button>
                      )}

                      {googlePayAvailable && (
                        <div className="flex-1">
                          <div ref={googlePayContainerRef} className="h-11 overflow-hidden rounded-xl" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-400 font-medium">or pay by card</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  </div>
                )}

                {/* Card fields */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-700">Debit / Credit Card</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">VISA</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">MC</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white">MAESTRO</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-900 text-white">AMEX</span>
                    </div>
                  </div>

                  {sdkError ? (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                      <p className="text-sm text-red-600 mb-2">{sdkError}</p>
                      <button type="button" onClick={retrySDK}
                        className="text-xs font-semibold text-red-700 underline hover:text-red-800">
                        Retry loading payment form
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Card Number *</label>
                        <div id="card-pan" className="w-full px-3 rounded-xl border border-gray-200 bg-white transition-colors" style={{ minHeight: 42 }} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expiry Date *</label>
                          <div id="card-expiry" className="w-full px-3 rounded-xl border border-gray-200 bg-white" style={{ minHeight: 42 }} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">CVV *</label>
                          <div id="card-cvv" className="w-full px-3 rounded-xl border border-gray-200 bg-white" style={{ minHeight: 42 }} />
                        </div>
                      </div>

                      {!sdkReady && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <svg className="w-3.5 h-3.5 animate-spin flex-none" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Loading secure payment form...
                        </div>
                      )}

                      <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-[11px] text-gray-500">
                          Card details are encrypted by Worldpay. PocketGrocery never stores your card number.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-4">
                <h2 className="text-base font-bold mb-4" style={{ color: '#0F2747' }}>Order Summary</h2>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-none border border-gray-100">
                        {item.product_image ? (
                          <Image src={item.product_image} alt={item.product_name} fill className="object-contain p-1" sizes="48px" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-800 flex-none">
                        £{(item.unit_price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span><span>£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Delivery</span>
                    {deliveryFee === 0
                      ? <span className="text-green-600 font-medium">Free</span>
                      : <span>£{deliveryFee.toFixed(2)}</span>}
                  </div>
                  {subtotal < FREE_DELIVERY_THRESHOLD && (
                    <p className="text-[10px] text-gray-400">
                      Add £{(FREE_DELIVERY_THRESHOLD - subtotal).toFixed(2)} more for free delivery
                    </p>
                  )}
                  <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base" style={{ color: '#0F2747' }}>
                    <span>Total</span><span>£{total.toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !sdkReady || !!sdkError}
                  className="mt-4 w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : sdkError ? (
                    'Payment form unavailable'
                  ) : !sdkReady ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading payment form...
                    </span>
                  ) : (
                    `Pay £${total.toFixed(2)} by card`
                  )}
                </button>

                <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    SSL encrypted
                  </span>
                  <span>·</span><span>3DS secured</span><span>·</span><span>SCA compliant</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
