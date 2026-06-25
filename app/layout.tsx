import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CookieConsent from '@/components/CookieConsent'
import PocketNavigation from '@/components/PocketNavigation'
import PocketButton from '@/components/PocketButton'
import FlyToAnimation from '@/components/FlyToAnimation'
import AIChatbot from '@/components/AIChatbot'
import FestivalBanner from '@/components/FestivalBanner'
import { AuthProvider } from '@/lib/auth-context'
import { PocketProvider } from '@/lib/pocket-context'
import { WishlistProvider } from '@/lib/wishlist-context'
import CachePurge from '@/components/CachePurge'
import FirebaseInit from '@/components/FirebaseInit'
import {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateWebSiteSchema,
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  DEFAULT_OG_IMAGE,
} from '@/lib/seo'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Kerala Groceries Online UK | Fast Next Day Delivery`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  keywords: 'Kerala groceries UK, Indian groceries online, Kerala spices UK, buy Kerala groceries, next day delivery, Kerala grocery London, Kerala grocery Manchester',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Kerala Groceries Online UK`,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'PocketGrocery - Authentic Kerala Groceries UK' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pocketgrocery',
    title: `${SITE_NAME} - Kerala Groceries Online UK`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: { canonical: SITE_URL },
}

const orgSchema = generateOrganizationSchema()
const localBizSchema = generateLocalBusinessSchema()
const webSiteSchema = generateWebSiteSchema()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="dns-prefetch" href="//images.pexels.com" />
        <meta name="theme-color" content="#0F2747" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <PocketProvider>
            <WishlistProvider>
              <FirebaseInit />
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
              />
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBizSchema) }}
              />
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
              />
              <CachePurge />
              <FestivalBanner />
              <Header />
              <main className="min-h-screen md:pb-0 pb-24">{children}</main>
              <Footer />
              <CookieConsent />
              <AIChatbot />
              <PocketNavigation />
              <PocketButton />
              <FlyToAnimation />
            </WishlistProvider>
          </PocketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
