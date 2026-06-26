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
  // ─── Capacitor & Native ─────────────────────────────────────────────────────
  {
    id: 'ios-config',
    category: 'Native Configuration',
    requirement: 'Capacitor iOS Configuration',
    status: 'pass',
    detail: 'appId, appName, and webDir correctly set in capacitor.config.ts. iosScheme set to https.',
  },
  {
    id: 'bundle-id',
    category: 'Native Configuration',
    requirement: 'Bundle Identifier',
    status: 'pass',
    detail: 'com.pocketgrocery.app matches Apple Developer Portal App ID.',
  },
  {
    id: 'min-version',
    category: 'Native Configuration',
    requirement: 'Minimum iOS Version',
    status: 'pass',
    detail: 'Set to iOS 15.0 in Xcode project file for modern API compatibility.',
  },
  {
    id: 'signing',
    category: 'Native Configuration',
    requirement: 'App Signing & Entitlements',
    status: 'warning',
    detail: 'App.entitlements created with Apple Sign In and Associated Domains. Manual: Select your Development Team in Xcode.',
    action: 'Select Team in Xcode',
  },

  // ─── Authentication ─────────────────────────────────────────────────────────
  {
    id: 'apple-sign-in',
    category: 'Authentication',
    requirement: 'Sign In with Apple (Required)',
    status: 'pass',
    detail: 'Implemented via @capacitor/apple-sign-in. Automatically shown on iOS devices. Required because Google login is offered.',
  },
  {
    id: 'google-sign-in-ios',
    category: 'Authentication',
    requirement: 'Google Sign In (iOS)',
    status: 'warning',
    detail: 'Implemented. Manual: Ensure iosClientId is added to capacitor.config.ts and REVERSED_CLIENT_ID added to Info.plist URL Schemes.',
  },

  // ─── Deep Linking ───────────────────────────────────────────────────────────
  {
    id: 'universal-links',
    category: 'Deep Linking',
    requirement: 'Universal Links (AASA)',
    status: 'pass',
    detail: 'apple-app-site-association file generated at /.well-known/apple-app-site-association. App.entitlements updated with applinks:pocketgrocery.com.',
  },
  {
    id: 'custom-url-scheme',
    category: 'Deep Linking',
    requirement: 'Custom URL Scheme',
    status: 'pass',
    detail: 'com.pocketgrocery.app scheme registered in Info.plist for OAuth callbacks and internal routing.',
  },

  // ─── Permissions ────────────────────────────────────────────────────────────
  {
    id: 'info-plist-perms',
    category: 'Permissions',
    requirement: 'Info.plist Privacy Keys',
    status: 'pass',
    detail: 'Minimal permissions requested. Push notifications configured. No Location/Camera descriptions needed as these features are not used in current version.',
  },
  {
    id: 'ats',
    category: 'Permissions',
    requirement: 'App Transport Security (ATS)',
    status: 'pass',
    detail: 'NSAppTransportSecurity configured in Info.plist to disallow arbitrary loads, enforcing HTTPS.',
  },

  // ─── UI & HIG ───────────────────────────────────────────────────────────────
  {
    id: 'safe-area',
    category: 'UI & HIG',
    requirement: 'Safe Area & Viewport',
    status: 'pass',
    detail: 'viewport-fit=cover applied in root layout. CSS .safe-pt and .safe-pb utility classes added and applied to sticky headers and footers.',
  },
  {
    id: 'icons',
    category: 'UI & HIG',
    requirement: 'App Icons',
    status: 'warning',
    detail: 'Manual: Verify AppIcon set in Assets.xcassets contains all required sizes (20pt to 1024pt).',
  },
  {
    id: 'splash',
    category: 'UI & HIG',
    requirement: 'Splash Screen',
    status: 'pass',
    detail: 'LaunchScreen.storyboard configured. SplashScreen plugin duration set to 3000ms with spinner enabled.',
  },

  // ─── App Store Metadata ─────────────────────────────────────────────────────
  {
    id: 'privacy-policy-ios',
    category: 'App Store Connect',
    requirement: 'Privacy Policy URL',
    status: 'pass',
    detail: 'Available at https://pocketgrocery.com/legal/privacy-policy.',
  },
  {
    id: 'account-deletion-ios',
    category: 'App Store Connect',
    requirement: 'Account Deletion (Requirement)',
    status: 'pass',
    detail: 'In-app deletion flow implemented at /account/delete. Complies with App Store Review Guideline 5.1.1.',
  },
]

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  pass:    { label: 'Correct', bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  fail:    { label: 'Must Fix', bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
  warning: { label: 'Attention', bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  info:    { label: 'Info',    bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400' },
}

const CATEGORIES = Array.from(new Set(CHECKS.map((c) => c.category)))

export default function AppStoreAuditPage() {
  const totals = {
    pass:    CHECKS.filter((c) => c.status === 'pass').length,
    warning: CHECKS.filter((c) => c.status === 'warning').length,
    fail:    CHECKS.filter((c) => c.status === 'fail').length,
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">App Store Readiness Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            iOS / App Store submission checklist for PocketGrocery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Already Correct', count: totals.pass, color: '#16A34A', bg: '#F0FDF4' },
            { label: 'Needs Attention', count: totals.warning, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Must Fix', count: totals.fail, color: '#DC2626', bg: '#FEF2F2' },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl p-4 border border-gray-100" style={{ backgroundColor: k.bg }}>
              <p className="text-3xl font-extrabold" style={{ color: k.color }}>{k.count}</p>
              <p className="text-xs font-semibold text-gray-600 mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Categories */}
        {CATEGORIES.map((cat) => (
          <div key={cat} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-900">{cat}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {CHECKS.filter(c => c.category === cat).map((item) => {
                const cfg = STATUS_CONFIG[item.status]
                return (
                  <div key={item.id} className="px-5 py-4 flex items-start gap-4">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-800">{item.requirement}</p>
                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.detail}</p>
                      {item.action && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Task:</span>
                          <span className="text-xs font-semibold text-gray-700">{item.action}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Final Xcode Instructions */}
        <div className="bg-[#0F2747] rounded-2xl p-6 text-white">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Final Xcode & Submission Steps
          </h2>
          <div className="space-y-4 text-sm text-white/80">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">1</span>
              <p>Run <code className="bg-black/20 px-1.5 py-0.5 rounded">npm run build</code> then <code className="bg-black/20 px-1.5 py-0.5 rounded">npx cap sync ios</code>.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">2</span>
              <p>Run <code className="bg-black/20 px-1.5 py-0.5 rounded">npx cap open ios</code> to open the project in Xcode.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">3</span>
              <p>In Xcode, go to the <strong>Signing & Capabilities</strong> tab. Select your <strong>Development Team</strong>. Ensure "Apple Sign In" and "Associated Domains" capabilities are present.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">4</span>
              <p>Select <strong>Any iOS Device (arm64)</strong> as the build target.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">5</span>
              <p>Go to <strong>Product → Archive</strong>. Once finished, click <strong>Distribute App</strong> and follow prompts for App Store Connect.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
