import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BundleDetailClient from './BundleDetailClient'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Bundle Deal | PocketGrocery`,
    description: 'Save on this curated bundle of Indian and South Asian groceries.',
    openGraph: { type: 'website' },
  }
}

export default function BundleDetailPage({ params }: Props) {
  return (
    <>
      <Header />
      <BundleDetailClient slug={params.slug} />
      <Footer />
    </>
  )
}
