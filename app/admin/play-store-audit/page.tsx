'use client'

import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'

type Status = 'pass' | 'fail' | 'warning' | 'info'

interface CheckItem {
  id: string
  category: string
  requirement: string
  status: Status
  detail: string
  action?: string
  actionHref?: string
}

const CHECKS: CheckItem[] = [
  // ─── Legal Pages ────────────────────────────────────────────────────────────
  {
    id: 'privacy-policy',
    category: 'Legal Pages',
    requirement: 'Privacy Policy page',
    status: 'pass',
    detail: 'Published at /legal/privacy-policy. Required by Play Store Data Safety.',
    actionHref: '/legal/privacy-policy',
    action: 'View',
  },
  {
    id: 'terms',
    category: 'Legal Pages',
    requirement: 'Terms & Conditions page',
    status: 'pass',
    detail: 'Published at /legal/terms-conditions.',
    actionHref: '/legal/terms-conditions',
    action: 'View',
  },
  {
    id: 'refund-policy',
    category: 'Legal Pages',
    requirement: 'Refund Policy page',
    status: 'pass',
    detail: 'Published at /legal/refund-policy. Required for e-commerce apps.',
    actionHref: '/legal/refund-policy',
    action: 'View',
  },
  {
    id: 'shipping-policy',
    category: 'Legal Pages',
    requirement: 'Shipping Policy page',
    status: 'pass',
    detail: 'Published at /legal/shipping-policy.',
    actionHref: '/legal/shipping-policy',
    action: 'View',
  },
  {
    id: 'cookie-policy',
    category: 'Legal Pages',
    requirement: 'Cookie Policy page',
    status: 'pass',
    detail: 'Published at /legal/cookie-policy.',
    actionHref: '/legal/cookie-policy',
    action: 'View',
  },
  {
    id: 'acceptable-use',
    category: 'Legal Pages',
    requirement: 'Acceptable Use Policy page',
    status: 'pass',
    detail: 'Published at /legal/acceptable-use.',
    actionHref: '/legal/acceptable-use',
    action: 'View',
  },

  // ─── Account & GDPR ─────────────────────────────────────────────────────────
  {
    id: 'delete-account',
    category: 'Account & GDPR',
    requirement: 'In-app account deletion (Play Store requirement)',
    status: 'pass',
    detail: 'Delete Account page at /account/delete with 30-day grace period, cancel option, and reason capture. DB migration applied: account_deletion_requests + cancel_account_deletion RPC.',
    actionHref: '/account/delete',
    action: 'View',
  },
  {
    id: 'privacy-settings',
    category: 'Account & GDPR',
    requirement: 'Privacy Settings / Consent Management',
    status: 'pass',
    detail: 'Privacy Settings page at /account/privacy. Granular opt-in/out for analytics, personalisation, and third-party sharing. GDPR right to data portability (export request) and right to erasure links included.',
    actionHref: '/account/privacy',
    action: 'View',
  },
  {
    id: 'gdpr-audit-log',
    category: 'Account & GDPR',
    requirement: 'GDPR audit trail',
    status: 'pass',
    detail: 'data_privacy_logs table records all consent changes, export requests, and deletion events with user_profile_id, event_type, and metadata.',
  },
  {
    id: 'notification-prefs',
    category: 'Account & GDPR',
    requirement: 'Granular notification preferences (GDPR-compliant opt-in)',
    status: 'pass',
    detail: 'Notification Preferences page at /account/notifications. Transactional notifications locked (cannot be disabled per GDPR Art 6), all marketing channels require explicit opt-in. OneSignal tag sync included.',
    actionHref: '/account/notifications',
    action: 'View',
  },
  {
    id: 'uk-gdpr-rights',
    category: 'Account & GDPR',
    requirement: 'UK GDPR rights exposed to user',
    status: 'pass',
    detail: 'Privacy Settings page documents: right to access/portability, right to erasure, right to rectification, right to object. DPO contact linked.',
  },

  // ─── Android Manifest ───────────────────────────────────────────────────────
  {
    id: 'target-sdk',
    category: 'Android Manifest & Build',
    requirement: 'targetSdkVersion >= 34 (Play Store requirement as of Aug 2024)',
    status: 'pass',
    detail: 'targetSdkVersion = 36, compileSdkVersion = 36, minSdkVersion = 24 (Android 7.0+). Defined in android/variables.gradle.',
  },
  {
    id: 'allow-backup',
    category: 'Android Manifest & Build',
    requirement: 'allowBackup set correctly (no sensitive data in ADB backup)',
    status: 'pass',
    detail: 'android:allowBackup="false" — prevents sensitive auth tokens and user data being exposed via ADB backup. Updated in AndroidManifest.xml.',
  },
  {
    id: 'cleartext',
    category: 'Android Manifest & Build',
    requirement: 'Cleartext traffic disabled (HTTPS-only)',
    status: 'pass',
    detail: 'android:usesCleartextTraffic="false" + network_security_config.xml enforces HTTPS for all connections. App uses Supabase HTTPS endpoints only.',
  },
  {
    id: 'post-notifications',
    category: 'Android Manifest & Build',
    requirement: 'POST_NOTIFICATIONS permission declared (Android 13+)',
    status: 'pass',
    detail: 'android.permission.POST_NOTIFICATIONS declared in manifest. Must be requested at runtime on Android 13+ (API 33+). OneSignal handles the runtime request.',
  },
  {
    id: 'exported-activity',
    category: 'Android Manifest & Build',
    requirement: 'MainActivity android:exported="true" with intent-filter',
    status: 'pass',
    detail: 'MainActivity correctly has android:exported="true" (required for Android 12+ when activity has intent-filter).',
  },
  {
    id: 'minify-release',
    category: 'Android Manifest & Build',
    requirement: 'Release build uses minification and R8/ProGuard',
    status: 'pass',
    detail: 'build.gradle release config: minifyEnabled=true, shrinkResources=true, proguard-android-optimize.txt. Reduces APK/AAB size and obfuscates code.',
  },
  {
    id: 'aab-splits',
    category: 'Android Manifest & Build',
    requirement: 'AAB bundle splits configured (language, density, ABI)',
    status: 'pass',
    detail: 'bundle { language.enableSplit=true, density.enableSplit=true, abi.enableSplit=true } configured in build.gradle. Required for Play Store AAB upload.',
  },
  {
    id: 'java17',
    category: 'Android Manifest & Build',
    requirement: 'Java 17 compile target',
    status: 'pass',
    detail: 'compileOptions configured with sourceCompatibility and targetCompatibility JavaVersion.VERSION_17. Matches modern Android build requirements.',
  },

  // ─── Permissions Audit ──────────────────────────────────────────────────────
  {
    id: 'permissions-minimal',
    category: 'Permissions Audit',
    requirement: 'Only necessary permissions declared',
    status: 'pass',
    detail: 'Declared: INTERNET, POST_NOTIFICATIONS, WAKE_LOCK, VIBRATE, ACCESS_NETWORK_STATE, RECEIVE_BOOT_COMPLETED. No LOCATION, CAMERA, CONTACTS, READ_EXTERNAL_STORAGE, or other sensitive permissions. All justified by app function.',
  },
  {
    id: 'no-location',
    category: 'Permissions Audit',
    requirement: 'No undeclared or excessive permissions',
    status: 'pass',
    detail: 'Location permission is NOT declared — delivery address is entered manually. Camera/storage NOT declared — no image upload in customer-facing flows.',
  },
  {
    id: 'runtime-permissions',
    category: 'Permissions Audit',
    requirement: 'Runtime permissions requested with context (Android 6+)',
    status: 'pass',
    detail: 'POST_NOTIFICATIONS is a runtime permission on Android 13+. OneSignal SDK requests it contextually when user enables notifications. No other runtime permissions needed.',
  },

  // ─── Data Safety ────────────────────────────────────────────────────────────
  {
    id: 'data-safety-form',
    category: 'Data Safety (Play Console)',
    requirement: 'Data Safety section completed in Play Console',
    status: 'warning',
    detail: 'Must be completed manually in Google Play Console. Data collected: Name, Email, Phone (optional), Purchase history, Payment info (Worldpay), Approximate location (delivery address). Data NOT sold to third parties.',
    action: 'Complete in Play Console',
  },
  {
    id: 'data-collected-types',
    category: 'Data Safety (Play Console)',
    requirement: 'Data types declared: Personal info, Financial info, App activity',
    status: 'info',
    detail: 'Personal info: name, email, phone. Financial info: purchase history, payment method (processed by Worldpay — not stored in app). App activity: search queries, products viewed, orders. All encrypted in transit (Supabase HTTPS + Worldpay PCI DSS).',
  },
  {
    id: 'privacy-policy-url',
    category: 'Data Safety (Play Console)',
    requirement: 'Privacy Policy URL added to app listing',
    status: 'warning',
    detail: 'Add the Privacy Policy URL to the app listing in Play Console: https://pocketgrocery.co.uk/legal/privacy-policy (update with your live domain).',
    action: 'Add in Play Console',
  },

  // ─── Payment Compliance ─────────────────────────────────────────────────────
  {
    id: 'payment-worldpay',
    category: 'Payment Compliance',
    requirement: 'Payment processing via PCI DSS compliant provider',
    status: 'pass',
    detail: 'Worldpay payment processing. Card data never touches PocketGrocery servers — handled entirely by Worldpay SDK/iframe. Worldpay is PCI DSS Level 1 certified.',
  },
  {
    id: 'google-billing',
    category: 'Payment Compliance',
    requirement: 'Google Play Billing (if selling digital goods/subscriptions in-app)',
    status: 'info',
    detail: 'PocketGrocery sells physical grocery products via the web checkout. Physical goods are exempt from mandatory Google Play Billing. No in-app purchases of digital content. No action required.',
  },
  {
    id: 'billing-api',
    category: 'Payment Compliance',
    requirement: 'Billing API version compatibility',
    status: 'pass',
    detail: 'No Google Play Billing integration required. Physical goods sold via Worldpay web checkout embedded in WebView via Capacitor. Compliant with Play Store physical goods exemption policy.',
  },

  // ─── App Store Listing ──────────────────────────────────────────────────────
  {
    id: 'content-rating',
    category: 'Play Console Listing',
    requirement: 'Content rating questionnaire completed',
    status: 'warning',
    detail: 'Complete the content rating questionnaire in Play Console. App is a grocery shopping app — expected PEGI 3 / Everyone rating. No violence, mature content, or gambling.',
    action: 'Complete in Play Console',
  },
  {
    id: 'screenshots',
    category: 'Play Console Listing',
    requirement: 'At least 2 screenshots per form factor (phone, tablet)',
    status: 'warning',
    detail: 'Minimum 2 screenshots required for phone. Tablet screenshots recommended. Upload to Play Console after building the release AAB.',
    action: 'Add in Play Console',
  },
  {
    id: 'short-description',
    category: 'Play Console Listing',
    requirement: 'App short description (80 chars max)',
    status: 'warning',
    detail: 'Add a short description in Play Console. Suggested: "Shop authentic Kerala groceries online — delivered across the UK."',
    action: 'Add in Play Console',
  },
]

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  pass:    { label: 'Pass',    bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  fail:    { label: 'Fail',    bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
  warning: { label: 'Action',  bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  info:    { label: 'Info',    bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400' },
}

const CATEGORIES = Array.from(new Set(CHECKS.map((c) => c.category)))

function countByStatus(cat: string) {
  const items = CHECKS.filter((c) => c.category === cat)
  return {
    pass:    items.filter((c) => c.status === 'pass').length,
    fail:    items.filter((c) => c.status === 'fail').length,
    warning: items.filter((c) => c.status === 'warning').length,
    info:    items.filter((c) => c.status === 'info').length,
    total:   items.length,
  }
}

const totals = {
  pass:    CHECKS.filter((c) => c.status === 'pass').length,
  fail:    CHECKS.filter((c) => c.status === 'fail').length,
  warning: CHECKS.filter((c) => c.status === 'warning').length,
  info:    CHECKS.filter((c) => c.status === 'info').length,
}

export default function PlayStoreAuditPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Play Store Compliance Audit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Full compliance checklist for PocketGrocery Android app — Google Play Store submission.
          </p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Passed',  count: totals.pass,    color: '#16A34A', bg: '#F0FDF4' },
            { label: 'Action Required', count: totals.warning, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Info',    count: totals.info,    color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Failed',  count: totals.fail,    color: '#DC2626', bg: '#FEF2F2' },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl p-4 border border-gray-100" style={{ backgroundColor: k.bg }}>
              <p className="text-3xl font-extrabold" style={{ color: k.color }}>{k.count}</p>
              <p className="text-xs font-semibold text-gray-600 mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Readiness bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-800">Overall Readiness</p>
            <p className="text-sm font-bold text-gray-700">
              {Math.round((totals.pass / CHECKS.length) * 100)}%
            </p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all"
              style={{
                width: `${Math.round((totals.pass / CHECKS.length) * 100)}%`,
                backgroundColor: totals.fail > 0 ? '#DC2626' : totals.warning > 0 ? '#D97706' : '#16A34A',
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {totals.fail === 0
              ? totals.warning === 0
                ? 'All checks pass. App is ready for Play Store submission.'
                : `${totals.warning} items require action in Play Console before publishing.`
              : `${totals.fail} critical issue(s) must be resolved before submission.`}
          </p>
        </div>

        {/* Checks by category */}
        {CATEGORIES.map((cat) => {
          const items = CHECKS.filter((c) => c.category === cat)
          const counts = countByStatus(cat)
          return (
            <div key={cat} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">{cat}</h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-600 font-semibold">{counts.pass} pass</span>
                  {counts.warning > 0 && <span className="text-amber-600 font-semibold">{counts.warning} action</span>}
                  {counts.fail > 0 && <span className="text-red-600 font-semibold">{counts.fail} fail</span>}
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((item) => {
                  const cfg = STATUS_CONFIG[item.status]
                  return (
                    <div key={item.id} className="px-5 py-4 flex items-start gap-4">
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-800 leading-snug">{item.requirement}</p>
                          <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.detail}</p>
                        {item.action && item.actionHref && (
                          <Link
                            href={item.actionHref}
                            target={item.actionHref.startsWith('/') ? undefined : '_blank'}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 underline"
                          >
                            {item.action}
                          </Link>
                        )}
                        {item.action && !item.actionHref && (
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                            {item.action}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Next steps */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">AAB Build & Submission Checklist</h2>
          <ol className="space-y-2 text-sm text-gray-600 list-decimal ml-5">
            <li>Run <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">npx cap sync android</code> to sync the latest web build to the Android project.</li>
            <li>Open the project in Android Studio: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">npx cap open android</code>.</li>
            <li>In Android Studio, go to <strong>Build → Generate Signed Bundle / APK</strong>, choose <strong>Android App Bundle (AAB)</strong>.</li>
            <li>Create or use an existing keystore. Store the keystore and passwords securely — they cannot be recovered.</li>
            <li>Select the <strong>release</strong> build variant and generate the AAB.</li>
            <li>Upload the AAB to Play Console under <strong>Internal Testing</strong> first, then promote to Production.</li>
            <li>Complete the Data Safety section in Play Console (see warnings above).</li>
            <li>Add the Privacy Policy URL, screenshots, and short description.</li>
            <li>Submit for review. Initial review typically takes 3–7 business days.</li>
          </ol>
        </div>

      </div>
    </AdminLayout>
  )
}
