import Link from 'next/link'
import Image from 'next/image'

interface BundleCardProps {
  bundle: {
    id: string
    name: string
    slug: string
    description: string | null
    image_url: string | null
    original_price: number
    bundle_price: number
    savings_amount: number
    coin_reward: number
  }
}

export default function BundleCard({ bundle }: BundleCardProps) {
  const savingsPercentage = Math.round(
    (bundle.savings_amount / bundle.original_price) * 100
  )

  return (
    <Link
      href={`/bundles/${bundle.slug}`}
      className="group bg-white border-2 rounded-xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1"
      style={{ borderColor: '#D6EAE4' }}
    >
      <div className="relative h-48" style={{ background: 'linear-gradient(135deg, #EBF4F1 0%, #D6EAE4 100%)' }}>
        {bundle.image_url ? (
          <Image
            src={bundle.image_url}
            alt={bundle.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-20 h-20" fill="none" stroke="#5FAE9B" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          SAVE {savingsPercentage}%
        </div>
        {bundle.coin_reward > 0 && (
          <div className="absolute bottom-3 left-3 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg" style={{ backgroundColor: '#0F2747' }}>
            {bundle.coin_reward} coins
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 mb-2 transition-colors" style={{ color: undefined }}>
          <span className="group-hover:text-[#5FAE9B] transition-colors">{bundle.name}</span>
        </h3>

        {bundle.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {bundle.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 line-through">
              £{Number(bundle.original_price).toFixed(2)}
            </span>
            <span className="text-2xl font-bold" style={{ color: '#0F2747' }}>
              £{Number(bundle.bundle_price).toFixed(2)}
            </span>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
            <span className="text-green-700 font-semibold text-sm">
              You save £{Number(bundle.savings_amount).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
